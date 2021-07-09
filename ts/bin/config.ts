import path from "path";

const ROOT = path.resolve(__dirname, "../..");

const EXTENSIONS = path.resolve(ROOT, "eventsFunctionsExtensions");
const DECKING = path.resolve(EXTENSIONS, "decking.json");

const ASSETS = path.resolve(ROOT, "assets");
const SCORE_TABLE_CSV = path.resolve(ASSETS, "scoreTable.csv");
const CARDS_CSV = path.resolve(ASSETS, "cards.csv");

const TS = path.resolve(ROOT, "ts");
const SRC = path.resolve(TS, "src");
const SCORE_TABLE_JSON = path.resolve(SRC, "scoreTable.json");
const CARDS_JSON = path.resolve(SRC, "cards.json");

export const PATHS = {
	ROOT,
	EXTENSIONS,
	DECKING,

	ASSETS,
	SCORE_TABLE_CSV,
	CARDS_CSV,

	TS,
	SRC,
	SCORE_TABLE_JSON,
	CARDS_JSON,
} as const;
