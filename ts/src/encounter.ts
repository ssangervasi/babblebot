import Lodash from 'lodash'

import { narrow, Guard, Payload } from 'narrow-minded'

import { ScoreTable, calculateScore } from './cardScores'
import { EncounterSession } from './userData'

const PlayCard = Guard.narrow({
	payload: {
		cardFeatures: 'string',
		nodeFeatureReactions: 'string',
		score: 'number',
		moodBefore: 'number',
		moodAfter: 'number',
	},
}).and(
	new Guard(
		(u): u is { type: 'PLAY_CARD' } =>
			narrow({ type: 'string' }, u) && u.type == 'PLAY_CARD',
	),
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
	log: LogEntry[] = []
	mood = 1
	// TODO: Ranges from 0.0 to 1.0
	confidence = 1

	constructor(options: { session: EncounterSession; scoreTable?: ScoreTable }) {
		this.session = options.session
		if (options.scoreTable) {
			this.scoreTable = options.scoreTable
		}
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

	playCard(cardFeatures: string, nodeFeatureReactions: string) {
		const score = this.calculateScore(cardFeatures, nodeFeatureReactions)

		const moodBefore = this.mood
		const moodAfter = moodBefore + score
		this.mood = moodAfter

		this.log.push(
			PlayCard.build({
				type: 'PLAY_CARD',
				payload: {
					cardFeatures,
					nodeFeatureReactions,
					score,
					moodBefore,
					moodAfter,
				},
			}),
		)
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
