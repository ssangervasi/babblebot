import { narrow, some, Narrowable } from "../src/utils/narrow";

describe("narrow", () => {
	it("works on primitives", () => {
		expect(narrow("function", () => {})).toBe(true);
		expect(narrow("number", 1)).toBe(true);
		expect(narrow("string", 1)).toBe(false);
	});

	it("works on object schemas", () => {
		const schema: Narrowable = {
			horse: "number",
			nest: {
				bird: "string",
				cool: "boolean",
			},
		};
		expect(narrow(schema, {})).toBe(false);
		expect(
			narrow(schema, {
				horse: 2,
				nest: {
					bird: null,
					cool: null,
				},
			})
		).toBe(false);
		expect(
			narrow(schema, {
				horse: 2,
				nest: {
					bird: "caw",
					cool: false,
				},
			})
		).toBe(true);
	});

	it("works on arrays", () => {
		expect(
			narrow(
				{
					0: "number",
				},
				[1, 2]
			)
		).toBe(true);
		expect(narrow(["number"], [1, 2])).toBe(true);
		expect(narrow(["string"], [1, 2])).toBe(false);
		expect(
			narrow(
				[
					"number",
					{
						bird: "string",
					},
				],
				[
					1,
					2,
					{
						bird: "caw",
					},
				]
			)
		).toBe(true);
	});

	it("works with some", () => {
		const numOrStr = some("number", "string");
		expect(narrow(numOrStr, 1)).toBe(true);
		expect(narrow(numOrStr, "meow")).toBe(true);

		expect(narrow(numOrStr, [])).toBe(false);
		expect(narrow(numOrStr, {})).toBe(false);

		const numOrSchema = some("number", {
			horse: "number",
			cows: ["string"],
			derps1: some("number", "string"),
			derps2: some("number", "string"),
		});
		expect(
			narrow(numOrSchema, {
				horse: 2,
				cows: ["moo", "oink"],
				derps1: 1,
				derps2: "two",
			})
		).toBe(true);
		expect(narrow(numOrSchema, 1)).toBe(true);

		expect(narrow(numOrSchema, "zang")).toBe(false);
		expect(narrow(numOrSchema, [])).toBe(false);
		expect(narrow(numOrSchema, {})).toBe(false);

		expect(narrow(some(some("number", "undefined")), 1)).toBe(true);
		expect(narrow(some(some("number", "undefined")), undefined)).toBe(true);
		expect(narrow(some(some("number"), "undefined"), undefined)).toBe(true);

		expect(narrow(some(some("number", "undefined")), "nope")).toBe(false);
		expect(narrow(some(some("number"), "undefined"), "nope")).toBe(false);
	});
});
