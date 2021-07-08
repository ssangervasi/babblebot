import { parseCsv, calculateScore, ScoreTable } from "../src/cardScores";

const raw = `
Feature,Modifier,Tag,Score
agree,good,agree_good,30
agree,bad,agree_bad,-10
agree,,agree,0
,,,
disagree,bad,disagree_bad,-40
disagree,,disagree,-10
,,,
listen,good,listen_good,20
,,,
butt,good,butt_good,1000.1
`;
const exampleTable: ScoreTable = [
	{ tag: "agree_good", score: 30 },
	{ tag: "agree_bad", score: -10 },
	{ tag: "agree", score: 0 },
	{ tag: "disagree_bad", score: -40 },
	{ tag: "disagree", score: -10 },
	{ tag: "listen_good", score: 20 },
	{ tag: "butt_good", score: 1000.1 },
];

describe("calculateScore", () => {
	test("agree is bad, listen is good", () => {
		const cardTagsStr = "agree listen";
		const characterTagsStr = "listen_good";
		const nodeTagsStr = "agree_bad";
		const result = calculateScore(
			cardTagsStr,
			characterTagsStr,
			nodeTagsStr,
			exampleTable
		);
		expect(result).toEqual(-10 + 20);
	});

	test("agree is bad, butt is good", () => {
		const cardTagsStr = "agree butt";
		const characterTagsStr = "agree_good";
		const nodeTagsStr = "agree_bad butt_good";
		const result = calculateScore(
			cardTagsStr,
			characterTagsStr,
			nodeTagsStr,
			exampleTable
		);
		expect(result).toEqual(-10 + 1000.1);
	});
});

describe("parseCsv", () => {
	test("parseCsv", () => {
		const result = parseCsv(raw);
		expect(result).toEqual(exampleTable);
	});
});

describe("parseCsv", () => {
	test("parseCsv", () => {
		const result = parseCsv(raw);
		expect(result).toEqual(exampleTable);
	});
});
