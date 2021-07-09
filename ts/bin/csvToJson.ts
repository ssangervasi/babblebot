import fs from "fs";
import jsonStringify from "json-stable-stringify";

import { PATHS } from "./config";
import { parseScoresCsv, parseCardsCsv } from "../src/cardScores";

const main = () => {
	csvToJson(PATHS.SCORE_TABLE_CSV, PATHS.SCORE_TABLE_JSON, parseScoresCsv);
	csvToJson(PATHS.CARDS_CSV, PATHS.CARDS_JSON, parseCardsCsv);
};

const csvToJson = <P extends (s: string) => unknown[]>(
	inPath: string,
	outPath: string,
	parser: P
) => {
	const csv = fs.readFileSync(inPath).toString();
	const table = parser(csv);
	if (table.length === 0) {
		throw new Error("Empty CSV");
	}

	const tableStr = jsonStringify(table, { space: "\t" });
	fs.writeFileSync(outPath, tableStr);
};

main();
