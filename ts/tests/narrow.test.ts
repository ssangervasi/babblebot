type Primitive =
	| "string"
	| "number"
	| "bigint"
	| "boolean"
	| "symbol"
	| "undefined"
	| "object"
	| "function";

type Arr = (Primitive | Obj)[];
interface Obj {
	[k: string]: Primitive | Arr | Obj;
}

type Narrowable = Primitive | Arr | Obj;

const narrow = <N extends Narrowable>(n: N, u: unknown): u is N => {
	if (typeof n === "string") {
		if (n === typeof u) {
			return true;
		} else {
			return false;
		}
	}

	if (typeof u !== "object" || u === null) {
		return false;
	}

	if (Array.isArray(n)) {
		if (Array.isArray(u)) {
			return u.every((v) => n.some((t) => narrow(t, v)));
		} else {
			return false;
		}
	}

	const o = u as Obj;

	return Object.entries(n).every(([k, t]) => {
		if (k in o) {
			return narrow(t, o[k]);
		} else {
			return false;
		}
	});
};

it("works deeply", () => {
	expect(narrow("function", () => {})).toBe(true);
	expect(narrow("number", 1)).toBe(true);
	expect(narrow("string", 1)).toBe(false);

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

// if (typeof o === n) {
// 	return true
// }

// if (typeof n !== "object") {
// 	return false;
// }

// n

// if ("a" in o && typeof o.a === "number") {
// 	const a = o.a;
// 	const j: { a: 1 } = o;
// }
// const s: Record<string, unknown> = {
// 	...o,
// };
// if ("a" in s) {
// 	const a2 = s.a;
// }
// return s;

// let a: any;
// let t: LiteralType = typeof a;
// let t = typeof a;
