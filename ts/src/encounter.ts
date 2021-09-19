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
		nodeFeatureReactions: 'string',
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

/**s
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
	// TODO: Ranges from 0.0 to 1.0
	confidence = 1

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

	playCard(uuid: UUID, nodeFeatureReactions: string) {
		const instance = this.dealer.find({ uuid, from: HAND })
		if (!instance) {
			console.error(`Card "${uuid}" is not in hand.`)
			return
		}

		const { card } = instance
		const score = this.calculateScore(card.features, nodeFeatureReactions)

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
					nodeFeatureReactions,
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
	}

	calculateScore(cardFeatures: string, nodeFeatureReactions: string) {
		const baseScore = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			this.scoreTable,
		)
		const confidenceBoost = CONFIDENCE_FACTOR * this.confidence * baseScore
		return baseScore + confidenceBoost
	}

	complete() {
		this.session.completedAt = Date.now()
	}
}
