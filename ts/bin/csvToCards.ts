import fs from 'fs'
import jsonStringify from 'json-stable-stringify'

import { PATHS } from './config'
import { parseCardsCsv } from '../src/cardScores'

const main = () => {
	const csv = fs.readFileSync(PATHS.SCORE_TABLE_CSV).toString()
	const table = parseCardsCsv(csv)
	if (table.length === 0) {
		throw new Error('Empty CSV')
	}

	const tableStr = jsonStringify(table)
	fs.writeFileSync(PATHS.SCORE_TABLE_JSON, tableStr)
}

main()
