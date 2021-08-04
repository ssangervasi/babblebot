import { Encounter } from "../src/encounter";

import { scoreTable } from "./data";

let enc = new Encounter();
beforeEach(() => {
	enc = new Encounter({
		scoreTable,
	});
	// TODO: calculate using confidence
	enc.confidence = 0;
});

describe("Action logging", () => {
	it("creates the first card play log", () => {
		const cardFeatures = "agree listen";
		const nodeFeatureReactions = "agree_bad listen_good";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.log).toEqual([
			{
				type: "PLAY_CARD",
				payload: {
					cardFeatures,
					nodeFeatureReactions,
					moodBefore: 1,
					moodAfter: 11,
					score: 10,
				},
			},
		]);
	});
});

describe("moodQuality", () => {
	it("starts neutral", () => {
		expect(enc.moodQuality).toEqual("neutral");
	});

	it("playing a card can increase it", () => {
		const cardFeatures = "agree listen";
		const nodeFeatureReactions = "agree_good listen";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.moodQuality).toEqual("good");
	});

	it("playing a card can decrese it", () => {
		const cardFeatures = "disagree";
		const nodeFeatureReactions = "disagree_bad";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.moodQuality).toEqual("bad");
	});
});

describe("lastPlayQuality", () => {
	it("starts neutral", () => {
		expect(enc.lastPlayQuality).toEqual("neutral");
	});

	it("high score play is good", () => {
		const cardFeatures = "agree listen";
		const nodeFeatureReactions = "agree_good listen";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.lastPlayQuality).toEqual("good");
	});

	it("low score play is neutral", () => {
		const cardFeatures = "disagree";
		const nodeFeatureReactions = "disagree_good";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.lastPlayQuality).toEqual("neutral");
	});

	it("very negative score play is bad", () => {
		const cardFeatures = "disagree";
		const nodeFeatureReactions = "disagree_bad";
		enc.playCard(cardFeatures, nodeFeatureReactions);

		expect(enc.lastPlayQuality).toEqual("bad");
	});
});