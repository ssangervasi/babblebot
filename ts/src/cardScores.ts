import csvParse from "csv-parse/lib/sync";

import SCORE_TABLE from "./scoreTable.json";

const HEADINGS = {
	// Card
	ID: "Id",
	TEXT: "Text",
	TAGS: "Tags",
	// Scores
	TAG: "Tag",
	SCORE: "Score",
} as const;

type ScoreTable = ScoreRow[];
interface ScoreRow {
	tag: string;
	score: number;
}

interface CardScoresCsvRow {
	[HEADINGS.TAG]?: string;
	[HEADINGS.SCORE]?: number;
}

export const parseCsv = (raw: string): ScoreTable => {
	const parsed: CardScoresCsvRow[] = csvParse(raw, {
		cast: true,
		columns: true,
	});

	const rows: ScoreRow[] = [];
	parsed.forEach((csvRow) => {
		const { [HEADINGS.TAG]: tag, [HEADINGS.SCORE]: score } = csvRow;

		if (
			!(typeof tag === "string" && tag.length > 0 && typeof score === "number")
		) {
			return;
		}

		rows.push({ tag, score });
	});

	return rows;
};

export const calculateScore = (
	cardTagsStr: string,
	characterTagsStr: string,
	nodeTagsStr: string,
	scoreTable: ScoreTable = SCORE_TABLE
): number => {
	const cardTags = spaceSplit(cardTagsStr);
	const characterTags = spaceSplit(characterTagsStr);
	const nodeTags = spaceSplit(nodeTagsStr);
	const effectTags = new Set([...characterTags, ...nodeTags]);

	let scoreSum = 0;
	scoreTable.forEach(({ tag, score }) => {
		if (effectTags.has(tag)) {
			scoreSum += score;
		}
	});
	return scoreSum;
};

const spaceSplit = (str: string): string[] => str.split(/\s+/);
