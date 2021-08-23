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

export const narrow = <N extends Narrowable>(n: N, u: unknown): u is N => {
	if (typeof n === "string") {
		if (n === typeof u) {
			return true;
		} else {
			return false;
		}
	}

	if (Array.isArray(n)) {
		if (SOME in n) {
			return n.some((t) => narrow(t, u));
		} else {
			if (Array.isArray(u)) {
				return u.every((v) => n.some((t) => narrow(t, v)));
			} else {
				return false;
			}
		}
	}

	if (typeof u !== "object" || u === null) {
		return false;
	}

	const o = u as NarrowableObj;

	return Object.entries(n).every(([k, t]) => {
		if (k in o) {
			return narrow(t, o[k]);
		} else {
			return false;
		}
	});
};
