export type Primitive =
	| "string"
	| "number"
	| "bigint"
	| "boolean"
	| "symbol"
	| "undefined"
	| "object"
	| "function";
export type NarrowableArr = (Primitive | NarrowableObj | NarrowableArr)[];
export interface NarrowableObj {
	[k: string]: Primitive | NarrowableArr | NarrowableObj;
}
export type Narrowable = Primitive | NarrowableArr | NarrowableObj;

export const SOME = Symbol("SOME");
export const some = (...opts: NarrowableArr) => {
	Object.assign(opts, {
		[SOME]: true,
	});
	return opts;
};

export const narrow = <N extends Narrowable>(
	n: N,
	u: unknown,
	level = 0
): u is N => {
	if (typeof n === "string") {
		if (n === typeof u) {
			return true;
		} else {
			console.debug(level, `Expected string, received ${typeof u}.`);
			return false;
		}
	}

	if (Array.isArray(n)) {
		if (SOME in n) {
			console.debug(level, "narrowing", { n, u });
			return n.some((t) => narrow(t, u), level + 1);
		} else {
			if (Array.isArray(u)) {
				return u.every((v) => n.some((t) => narrow(t, v, level + 1)));
			} else {
				console.debug(level, `Expected array, received non-array object.`);
				return false;
			}
		}
	}

	if (typeof u !== "object" || u === null) {
		console.debug(level, `Expected object, received ${typeof u}.`);
		return false;
	}

	const o = u as NarrowableObj;

	return Object.entries(n).every(([k, t]) => {
		if (k in o) {
			return narrow(t, o[k], level + 1);
		} else {
			console.debug(level, `Expected key "${k}", missing in object.`);
			return false;
		}
	});
};
