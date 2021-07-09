import {
	parseScoresCsv,
	parseCardsCsv,
	calculateScore,
	ScoreTable,
	CardTable,
} from "../src/cardScores";

const raw = `
Feature,Reaction,Feature_Reaction,Score
agree,good,agree_good,30
agree,bad,agree_bad,-10
agree,,agree,0
,,,
disagree,bad,disagree_bad,-40
disagree,,disagree,-10
,,,
listen,good,listen_good,20
listen,,listen,2
,,,
butt,good,butt_good,1000.1
`;
const exampleTable: ScoreTable = [
	{ feature: "agree", reaction: "good", score: 30 },
	{ feature: "agree", reaction: "bad", score: -10 },
	{ feature: "agree", reaction: "", score: 0 },
	{ feature: "disagree", reaction: "bad", score: -40 },
	{ feature: "disagree", reaction: "", score: -10 },
	{ feature: "listen", reaction: "good", score: 20 },
	{ feature: "listen", reaction: "", score: 2 },
	{ feature: "butt", reaction: "good", score: 1000.1 },
];

describe("calculateScore", () => {
	test("agree is bad, listen is good", () => {
		const cardTagsStr = "agree listen";
		const nodeTagsStr = "agree_bad listen_good";
		const result = calculateScore(cardTagsStr, nodeTagsStr, exampleTable);
		expect(result).toEqual(-10 + 20);
	});

	test("agree is good, butt is good, listen is neutral", () => {
		const cardTagsStr = "agree butt listen";
		const nodeTagsStr = "agree_good butt_good";
		const result = calculateScore(cardTagsStr, nodeTagsStr, exampleTable);
		expect(result).toEqual(30 + 2 + 1000.1);
	});
});

describe("parseScoresCsv", () => {
	test("parseScoresCsv", () => {
		const result = parseScoresCsv(raw);
		expect(result).toEqual(exampleTable);
	});
});

describe("parseCardsCsv", () => {
	const rawCards = `
Id,Type,Text,Extra Features,Features
card-1,type,I condemn,,disagree butt
card-2,type,"A, B, C",,agree listen
`;
	const exampleCards: CardTable = [
		{
			id: "card-1",
			text: "I condemn",
			features: "disagree butt",
		},
		{
			id: "card-2",
			text: "A, B, C",
			features: "agree listen",
		},
	];

	test("parseCardsCsv", () => {
		const result = parseCardsCsv(rawCards);
		expect(result).toEqual(exampleCards);
	});
});
