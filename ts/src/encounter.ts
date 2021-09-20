import Lodash from 'lodash'

import { narrow, Guard, Payload } from 'narrow-minded'

import { ScoreTable, calculateScore, CardTable } from './cardScores'
import {
	Dealer,
	HAND,
	DECK,
	PLAY,
	DISCARD,
	makeCollection,
	makeCardInstance,
	CardInstance,
} from './dealer'
import { EncounterSession } from './userData'
import { UUID } from './utils'

const PlayCard = Guard.narrow({
	payload: {
		cardFeatures: 'string',
		featureReactions: 'string',
		score: 'number',
		moodBefore: 'number',
		moodAfter: 'number',
	},
}).and(
	(u): u is { type: 'PLAY_CARD' } =>
		narrow({ type: 'string' }, u) && u.type === 'PLAY_CARD',
)

type LogEntry = Payload<typeof PlayCard>

type Quality = 'good' | 'bad' | 'neutral'

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

interface Node {
	featureReactions: string
	promptedMs: number
	tickedMs: number
}
const CONFIDENCE_DURATION_MS = 2_000

/**
 * Scores are magnified by responding quickly, up to this factor of the play's score.
 */
const CONFIDENCE_FACTOR = 0.25
export class Encounter {
	session: EncounterSession
	scoreTable: ScoreTable = []
	cardTable: CardTable = []
	log: LogEntry[] = []
	dealer = new Dealer()
	mood = 1
	currentNode?: Node

	constructor(options: {
		session: EncounterSession
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
		if (!lastPlay) {
			return 'neutral'
		}

		const lastScore = lastPlay.payload.score
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

	private initDealer() {
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

	draw(n: number): number {
		const drawn = this.dealer.peek(DECK, n)
		drawn.forEach(({ uuid }) => {
			this.dealer.move({ uuid, from: DECK, to: HAND })
		})
		return drawn.length
	}

	prompt(node: { featureReactions: string; promptedMs: number }) {
		this.currentNode = {
			...node,
			tickedMs: node.promptedMs,
		}
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
				payload: {
					cardFeatures: card.features,
					featureReactions: this.currentNode.featureReactions,
					score,
					moodBefore,
					moodAfter,
				},
			}),
		)
	}

	resolve() {
		this.dealer.peek(PLAY, 'all').forEach(({ uuid }) => {
			this.dealer.move({
				uuid,
				from: PLAY,
				to: DISCARD,
			})
		})
		this.currentNode = undefined
	}

	calculateScore(cardFeatures: string, node: Node) {
		const baseScore = calculateScore(
			cardFeatures,
			node.featureReactions,
			this.scoreTable,
		)
		const confidence = this.calculateConfidence(node)
		const confidenceBoost = CONFIDENCE_FACTOR * confidence * baseScore
		return baseScore + confidenceBoost
	}

	calculateConfidence({ promptedMs, tickedMs }: Node) {
		return (
			Lodash.clamp(tickedMs - promptedMs, 0, CONFIDENCE_DURATION_MS) /
			CONFIDENCE_DURATION_MS
		)
	}

	complete() {
		this.session.completedAt = Date.now()
	}
}
