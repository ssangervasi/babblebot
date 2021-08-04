import {
	parseScoresCsv,
	parseCardsCsv,
	calculateScore,
	CardTable,
} from "../src/cardScores";

import * as Data from "./data";

describe("calculateScore", () => {
	test("agree is bad, listen is good", () => {
		const cardFeatures = "agree listen";
		const nodeFeatureReactions = "agree_bad listen_good";
		const result = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			Data.scoreTable
		);
		expect(result).toEqual(-10 + 20);
	});

	test("agree is good, butt is good, listen is neutral", () => {
		const cardFeatures = "agree butt listen";
		const nodeFeatureReactions = "agree_good butt_good";
		const result = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			Data.scoreTable
		);
		expect(result).toEqual(30 + 2 + 1000.1);
	});

	test("with messsy string lists", () => {
		const cardFeatures = "agree    butt,listen";
		const nodeFeatureReactions = "agree_good,,   butt_good,,  ,  ";
		const result = calculateScore(
			cardFeatures,
			nodeFeatureReactions,
			Data.scoreTable
		);
		expect(result).toEqual(30 + 2 + 1000.1);
	});
});

describe("parseScoresCsv", () => {
	test("parseScoresCsv", () => {
		const result = parseScoresCsv(Data.scoreTableCsv);
		expect(result).toEqual(Data.scoreTable);
	});
});

describe("parseCardsCsv", () => {
	test("parseCardsCsv", () => {
		const result = parseCardsCsv(Data.cardTableCsv);
		expect(result).toEqual(Data.cardTable);
	});
});
