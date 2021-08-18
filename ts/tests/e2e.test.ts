import "../src/babblebot";

// import * as Data from "./data";

describe("End-to-End", () => {
	it("works", () => {
		Babblebot.load("");

		const manager = Babblebot.getManager();
		expect(manager.userData).toMatchObject(Babblebot.UserData.createDefault());

		const encounter = Babblebot.getEncounter();

		expect(encounter.moodQuality).toEqual("neutral");
	});
});
