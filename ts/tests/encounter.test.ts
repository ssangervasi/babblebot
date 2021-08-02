import { Encounter } from "../src/encounter";

import { exampleTable } from "./data";

describe("Encounter", () => {
	it("works", () => {
		expect(new Encounter()).toBeTruthy();
	});

	it("playCard loggingg", () => {
		const enc = new Encounter({
			scoreTable: exampleTable,
		});

		const cardFeatures = "agree listen";
		const nodeFeatureReactions = "agree_bad listen_good";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.log).toEqual([
			{
				type: "PLAY_CARD",
				payload: {
					cardFeatures,
					nodeFeatureReactions,
					score: 10,
				},
			},
		]);
	});
});
