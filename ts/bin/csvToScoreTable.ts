import fs from "fs";
import jsonStringify from "json-stable-stringify";

import { PATHS } from "./config";
import { parseScoresCsv } from "../src/cardScores";

const main = () => {
	const csv = fs.readFileSync(PATHS.SCORE_TABLE_CSV).toString();
	const scoreTable = parseScoresCsv(csv);
	if (scoreTable.length === 0) {
		throw new Error("Empty CSV");
	}

	const scoreTableStr = jsonStringify(scoreTable);
	fs.writeFileSync(PATHS.SCORE_TABLE_JSON, scoreTableStr);
};

main();
