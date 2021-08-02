import Lodash from "lodash";

import { ScoreTable, calculateScore } from "./cardScores";
import { Message, guard } from "./utils/guards";

interface Options {
	scoreTable: ScoreTable;
}

const PlayCard = guard.type("PLAY_CARD").payload<{
	cardFeatures: string;
	nodeFeatureReactions: string;
	score: number;
	moodBefore: number;
	moodAfter: number;
}>();

type LogEntry = typeof PlayCard["M"];

type Quality = "good" | "bad" | "neutral";

const MOOD_RANGES = {
	bad: [-Infinity, -33],
	neutral: [-33, 33],
	good: [33, Infinity],
} as const;

const PLAY_RANGES = {
	bad: [-Infinity, -20],
	neutral: [-20, 20],
	good: [20, Infinity],
} as const;

/**s
 * Scores are magnified by responding quickly, up to this factor of the play's score.
 */
const CONFIDENCE_FACTOR = 0.25;

export class Encounter {
	options: Options = {
		scoreTable: [],
	};

	log: LogEntry[] = [];

	mood = 1;

	// TODO: Ranges from 0.0 to 1.0
	confidence = 1;

	constructor(options: Partial<Options> = {}) {
		Object.assign(this.options, options);
	}

	get moodQuality(): Quality {
		if (Lodash.inRange(this.mood, ...MOOD_RANGES.bad)) {
			return "bad";
		} else if (Lodash.inRange(this.mood, ...MOOD_RANGES.good)) {
			return "good";
		}

		return "neutral";
	}

	get lastPlayQuality(): Quality {
		const lastPlay = Lodash.findLast(
			this.log,
			(entry) => entry.type === "PLAY_CARD"
		);
		if (!lastPlay) {
			return "neutral";
		}

		const lastScore = lastPlay.payload.score;
		if (Lodash.inRange(lastScore, ...PLAY_RANGES.bad)) {
			return "bad";
		} else if (Lodash.inRange(lastScore, ...PLAY_RANGES.good)) {
			return "good";
		}

		return "neutral";
	}

	playCard(cardFeatures: string, nodeFeatureReactions: string) {
		const score = this.calculateScore(cardFeatures, nodeFeatureReactions);

		const moodBefore = this.mood;
		const moodAfter = moodBefore + score;
		this.mood = moodAfter;

		this.log.push(
			PlayCard.build({
				payload: {
					cardFeatures,
					nodeFeatureReactions,
					score,
					moodBefore,
					moodAfter,
				},
			})
		);
	}

	calculateScore(cardFeatures: string, nodeFeatureReactions: string) {
		const baseScore = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			this.options.scoreTable
		);
		const confidenceBoost = CONFIDENCE_FACTOR * this.confidence * baseScore;
		return baseScore + confidenceBoost;
	}
}
