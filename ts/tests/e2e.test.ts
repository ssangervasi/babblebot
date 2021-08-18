import "../src/babblebot";

// import * as Data from "./data";

describe("End-to-End", () => {
	it("works", () => {
		const UD = Babblebot.UserData;

		UD.load("");
		const manager = UD.getManager();
		expect(manager.userData).toMatchObject(UD.createDefault());

		// manager.
	});
});
