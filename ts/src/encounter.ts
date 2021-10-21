import Lodash from 'lodash'

import { Guard, Payload } from 'narrow-minded'

import { ScoreTable, calculateScore, CardTable, CardRow } from './cardScores'
import {
	Dealer,
	HAND,
	DECK,
	PLAY,
	DISCARD,
	makeCollection,
	makeCardInstance,
} from './dealer'
import * as UserData from './userData'
import { UUID, isType } from './utils'
import {
	Quality,
	DialogueNode,
	DialogueNodePayload,
	PromptNode,
	parseDialogueNode,
} from './dialogue'

const Prompt = new Guard(isType('PROMPT'))
	.and({
		at: 'number',
	})
	.and(DialogueNode)

const PlayCard = new Guard(isType('PLAY_CARD')).and({
	at: 'number',
	cardFeatures: 'string',
	featureReactions: 'string',
	score: 'number',
	moodBefore: 'number',
	moodAfter: 'number',
})

const Complete = new Guard(isType('COMPLETE')).and({
	at: 'number',
	mood: 'number',
})

type LogEntry = Payload<typeof Prompt | typeof PlayCard | typeof Complete>

const MOOD_RANGES = {
	bad: [-Infinity, -33],
	neutral: [-33, 33],
	good: [33, Infinity],
} as const

const PLAY_RANGES = {
	bad: [-Infinity, -20],
	neutral: [-20, 20],
	good: [20, Infinity],
} as const

const CONFIDENCE_DURATION_MS = 2_000

export type State = 'waiting' | 'prompting' | 'complete'

/**
 * Scores are magnified by responding quickly, up to this factor of the play's score.
 */
const CONFIDENCE_FACTOR = 0.25
export class Encounter {
	session: UserData.EncounterSession
	scoreTable: ScoreTable = []
	cardTable: CardTable = []
	log: LogEntry[] = []
	dealer = new Dealer()
	mood = 1
	currentNode?: DialogueNodePayload

	private _idToCard?: Map<string, CardRow>

	constructor(options: {
		session: UserData.EncounterSession
		cardTable: CardTable
		scoreTable: ScoreTable
	}) {
		this.session = options.session
		this.scoreTable = options.scoreTable
		this.cardTable = options.cardTable

		this.initDealer()
	}

	get moodQuality(): Quality {
		if (Lodash.inRange(this.mood, ...MOOD_RANGES.bad)) {
			return 'bad'
		} else if (Lodash.inRange(this.mood, ...MOOD_RANGES.good)) {
			return 'good'
		}

		return 'neutral'
	}

	get lastPlayQuality(): Quality {
		const lastPlay = Lodash.findLast(
			this.log,
			entry => entry.type === 'PLAY_CARD',
		)
		if (!(lastPlay && lastPlay.type === 'PLAY_CARD')) {
			return 'neutral'
		}

		const lastScore = lastPlay.score
		if (Lodash.inRange(lastScore, ...PLAY_RANGES.bad)) {
			return 'bad'
		} else if (Lodash.inRange(lastScore, ...PLAY_RANGES.good)) {
			return 'good'
		}

		return 'neutral'
	}

	get confidence(): number {
		if (!this.currentNode) {
			return 1
		}
		return this.calculateConfidence(this.currentNode)
	}

	get completedAt() {
		return Lodash.findLast(this.log, entry => entry.type === 'COMPLETE')?.at
	}

	get state(): State {
		if (this.completedAt) {
			return 'complete'
		}
		if (this.currentNode) {
			return 'prompting'
		}
		return 'waiting'
	}

	peekNode(): DialogueNodePayload {
		if (this.currentNode) {
			return this.currentNode
		}
		const logEntry = Lodash.findLast(this.log, ({ type }) => type === 'PROMPT')
		return logEntryToDialogueNode(logEntry, this.moodQuality)
	}

	private get idToCard(): Map<string, CardRow> {
		if (!this._idToCard) {
			this._idToCard = new Map(this.cardTable.map(row => [row.id, row]))
		}
		return this._idToCard
	}

	private initDealer() {
		if (this.session.dealer) {
			this.dealer = Dealer.fromUserData(this.session.dealer, this.idToCard)
			return
		}

		this.dealer = new Dealer()
		this.dealer.addCollection(HAND)
		this.dealer.addCollection(PLAY)
		this.dealer.addCollection(DISCARD)

		const deckCollection = makeCollection(
			this.cardTable.map(cardRow => {
				return makeCardInstance(cardRow)
			}),
		)
		this.dealer.addCollection(DECK, deckCollection)

		this.draw(3)
	}

	toUserData(): UserData.EncounterSession {
		return {
			...this.session,
			completedAt: this.completedAt,
			dealer: this.dealer.toUserData(),
		}
	}

	draw(n: number): number {
		const drawn = this.dealer.peek(DECK, n)
		drawn.forEach(({ uuid }) => {
			this.dealer.move({ uuid, from: DECK, to: HAND })
		})
		return drawn.length
	}

	prompt(node: Payload<typeof PromptNode>) {
		if (this.currentNode) {
			console.warn(
				`Cannot prompt when already in node "${this.currentNode.title}"`,
			)
			return
		}

		if (!PromptNode.satisfied(node)) {
			throw Object.assign(new Error('Invalid node'), { node })
		}

		this.currentNode = parseDialogueNode(node)

		this.log.push({
			type: 'PROMPT',
			at: this.currentNode.promptedMs,
			...this.currentNode,
		})
	}

	tick(tickedMs: number) {
		if (!this.currentNode) {
			console.error(`Cannot tick at ${tickedMs} with no current node.`)
			return
		}
		this.currentNode.tickedMs = tickedMs
	}

	playCard(uuid: UUID) {
		if (!this.currentNode) {
			console.error(`Cannot play card "${uuid}" with no current node.`)
			return
		}

		const instance = this.dealer.find({ uuid, from: HAND })
		if (!instance) {
			console.error(`Card "${uuid}" is not in hand.`)
			return
		}

		const { card } = instance
		const score = this.calculateScore(card.features, this.currentNode)

		const moodBefore = this.mood
		const moodAfter = moodBefore + score

		this.dealer.move({
			uuid,
			from: HAND,
			to: PLAY,
		})
		this.mood = moodAfter
		this.log.push(
			PlayCard.build({
				type: 'PLAY_CARD',
				at: this.currentNode.tickedMs,
				cardFeatures: card.features,
				featureReactions: this.currentNode.featureReactions,
				score,
				moodBefore,
				moodAfter,
			}),
		)
	}

	resolve() {
		if (!this.currentNode) {
			console.warn('Cannot resolve when there is no current node.')
			return
		}

		this.dealer.peek(PLAY, 'all').forEach(({ uuid }) => {
			this.dealer.move({
				uuid,
				from: PLAY,
				to: DISCARD,
			})
		})
		this.currentNode = undefined
	}

	transition() {
		if (this.currentNode?.step !== 'transition') {
			console.warn(
				`Cannot transition while in non-transition node ${this.currentNode?.title}.`,
			)
			return
		}

		const logEntry = Lodash.findLast(
			this.log,
			entry => entry.type === 'PROMPT' && entry.quality === this.moodQuality,
		)
		this.currentNode = logEntryToDialogueNode(logEntry, this.moodQuality)
	}

	calculateScore(cardFeatures: string, node: DialogueNodePayload) {
		const baseScore = calculateScore(
			cardFeatures,
			node.featureReactions,
			this.scoreTable,
		)
		const confidence = this.calculateConfidence(node)
		const confidenceBoost = CONFIDENCE_FACTOR * confidence * baseScore
		return baseScore + confidenceBoost
	}

	calculateConfidence({ promptedMs, tickedMs }: DialogueNodePayload) {
		return (
			(CONFIDENCE_DURATION_MS -
				Lodash.clamp(tickedMs - promptedMs, 0, CONFIDENCE_DURATION_MS)) /
			CONFIDENCE_DURATION_MS
		)
	}

	complete(completeMs: number) {
		this.log.push({
			type: 'COMPLETE',
			at: completeMs,
			mood: this.mood,
		})
	}
}

const logEntryToDialogueNode = (
	logEntry: LogEntry | undefined,
	quality: Quality,
): DialogueNodePayload => {
	if (logEntry && logEntry.type === 'PROMPT') {
		return {
			title: logEntry.title,
			quality: logEntry.quality,
			step: logEntry.step,
			featureReactions: logEntry.featureReactions,
			promptedMs: logEntry.promptedMs,
			tickedMs: logEntry.tickedMs,
		}
	}

	const step = 1
	return {
		title: `${quality}_${step}`,
		quality,
		step,
		featureReactions: '',
		promptedMs: 0,
		tickedMs: 0,
	}
}
