import {
	parseScoresCsv,
	parseCardsCsv,
	calculateScore,
	ScoreTable,
	CardTable,
} from "../src/cardScores";

import { raw, exampleTable } from "./data";

describe("calculateScore", () => {
	test("agree is bad, listen is good", () => {
		const cardFeatures = "agree listen";
		const nodeFeatureReactions = "agree_bad listen_good";
		const result = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			exampleTable
		);
		expect(result).toEqual(-10 + 20);
	});

	test("agree is good, butt is good, listen is neutral", () => {
		const cardFeatures = "agree butt listen";
		const nodeFeatureReactions = "agree_good butt_good";
		const result = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			exampleTable
		);
		expect(result).toEqual(30 + 2 + 1000.1);
	});

	test("with messsy string lists", () => {
		const cardFeatures = "agree    butt,listen";
		const nodeFeatureReactions = "agree_good,,   butt_good,,  ,  ";
		const result = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			exampleTable
		);
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
