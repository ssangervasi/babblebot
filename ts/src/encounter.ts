import { ScoreTable, calculateScore } from "./cardScores";
import { Message, guard } from "./utils/guards";

interface Options {
	scoreTable: ScoreTable;
}

const PlayCard = guard.type("PLAY_CARD").payload<{
	cardFeatures: string;
	nodeFeatureReactions: string;
	score: number;
}>();

type LogEntry = typeof PlayCard["M"];

export class Encounter {
	options: Options = {
		scoreTable: [],
	};

	log: LogEntry[] = [];

	mood = 0;

	constructor(options: Partial<Options> = {}) {
		Object.assign(this.options, options);
	}

	playCard(cardFeatures: string, nodeFeatureReactions: string) {
		const score = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			this.options.scoreTable
		);

		this.log.push(
			PlayCard.build({
				payload: {
					cardFeatures,
					nodeFeatureReactions,
					score,
				},
			})
		);
	}
}
