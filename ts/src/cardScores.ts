import csvParse from "csv-parse/lib/sync";

import SCORE_TABLE from "./scoreTable.json";

export const HEADINGS = {
	// Cards
	ID: "Id",
	TEXT: "Text",
	FEATURES: "Features",
	// Scores
	FEATURE: "Feature",
	REACTION: "Reaction",
	SCORE: "Score",
} as const;

export type ScoreTable = ScoreRow[];
export interface FeatureReaction {
	feature: string;
	reaction: string;
}
export interface ScoreRow extends FeatureReaction {
	score: number;
}

export interface CardScoresCsvRow {
	[HEADINGS.FEATURE]?: string;
	[HEADINGS.REACTION]?: string;
	[HEADINGS.SCORE]?: number;
}

export const parseScoresCsv = (raw: string): ScoreTable => {
	const parsed: CardScoresCsvRow[] = csvParse(raw, {
		cast: true,
		columns: true,
	});

	const rows: ScoreRow[] = [];
	parsed.forEach((csvRow) => {
		const {
			[HEADINGS.FEATURE]: feature,
			[HEADINGS.REACTION]: reaction,
			[HEADINGS.SCORE]: score,
		} = csvRow;

		if (
			!(
				typeof feature === "string" &&
				feature.length > 0 &&
				typeof reaction === "string" &&
				typeof score === "number"
			)
		) {
			return;
		}

		rows.push({ feature, reaction, score });
	});

	return rows;
};

export const calculateScore = (
	cardFeaturesStr: string,
	nodeFeatureReactionsStr: string,
	scoreTable: ScoreTable = SCORE_TABLE
): number => {
	const cardFeatures = spaceSplit(cardFeaturesStr);

	const nodeFeatureReactions = spaceSplit(nodeFeatureReactionsStr).map(
		reactionSplit
	);

	const effectiveFeatureToReaction = new Map<string, string>();
	cardFeatures.forEach((feature) => {
		// Assign an empty reaction for each card as a default
		effectiveFeatureToReaction.set(feature, "");
	});

	nodeFeatureReactions.forEach(({ feature, reaction }) => {
		// Override any node reactions for features that were on the cards.
		if (effectiveFeatureToReaction.has(feature)) {
			effectiveFeatureToReaction.set(feature, reaction);
		}
	});

	let scoreSum = 0;
	scoreTable.forEach(({ feature, reaction, score }) => {
		if (effectiveFeatureToReaction.get(feature) === reaction) {
			scoreSum += score;
		}
	});
	return scoreSum;
};

export const spaceSplit = (str: string): string[] => str.split(/\s+/);

export const reactionSplit = (joined: string): FeatureReaction => {
	const pair = joined.split("_");
	const feature = pair[0] || "";
	const reaction = pair[1] || "";
	return {
		feature,
		reaction,
	};
};
