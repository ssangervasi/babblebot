import csvParse from "csv-parse/lib/sync";

import _SCORE_TABLE from "./scoreTable.json";
import _CARD_TABLE from "./cards.json";

export const SCORE_TABLE = _SCORE_TABLE;
export const CARD_TABLE = _CARD_TABLE;

export const HEADINGS = {
	// Scores
	FEATURE: "Feature",
	REACTION: "Reaction",
	SCORE: "Score",
	// Cards
	ID: "Id",
	TEXT: "Text",
	FEATURES: "Features",
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

	const rows: ScoreTable = [];
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

export type CardTable = CardRow[];
export interface CardRow {
	id: string;
	text: string;
	features: string;
}
export interface CardCsvRow {
	[HEADINGS.ID]?: string;
	[HEADINGS.TEXT]?: string;
	[HEADINGS.FEATURES]?: number;
}

export const parseCardsCsv = (raw: string): CardTable => {
	const parsed: CardCsvRow[] = csvParse(raw, {
		cast: true,
		columns: true,
	});

	const rows: CardTable = [];
	parsed.forEach((csvRow) => {
		const {
			[HEADINGS.ID]: id,
			[HEADINGS.TEXT]: text,
			[HEADINGS.FEATURES]: features,
		} = csvRow;

		if (
			!(
				typeof id === "string" &&
				typeof text === "string" &&
				typeof features === "string"
			)
		) {
			return;
		}

		rows.push({ id, text, features });
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
		// Override any node reactions fo	r features that were on the cards.
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

export const spaceSplit = (str: string): string[] =>
	str.split(/\s+/).filter((s) => s.length > 0);

export const reactionSplit = (joined: string): FeatureReaction => {
	const pair = joined.split("_");
	const feature = pair[0] || "";
	const reaction = pair[1] || "";

	return {
		feature,
		reaction,
	};
};
