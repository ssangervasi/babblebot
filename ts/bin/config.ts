import path from "path";

const ROOT = path.resolve(__dirname, "../..");

const EXTENSIONS = path.resolve(ROOT, "eventsFunctionsExtensions");
const DECKING = path.resolve(EXTENSIONS, "babblebot.json");

const ASSETS = path.resolve(ROOT, "assets");
const SCORE_TABLE_CSV = path.resolve(ASSETS, "scoreTable.csv");
const CARDS_CSV = path.resolve(ASSETS, "cards.csv");
const CAMPAIGN_CSV = path.resolve(ASSETS, "campaign.csv");

const TS = path.resolve(ROOT, "ts");
const SRC = path.resolve(TS, "src");
const SCORE_TABLE_JSON = path.resolve(SRC, "scoreTable.json");
const CARDS_JSON = path.resolve(SRC, "cards.json");
const CAMPAIGN_JSON = path.resolve(SRC, "campaignMapping.json");

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

	CAMPAIGN_CSV,
	CAMPAIGN_JSON,
} as const;
