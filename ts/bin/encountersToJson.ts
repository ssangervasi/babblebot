#!/usr/bin/env node
import fs from 'fs'
import jsonStringify from 'json-stable-stringify'

import {
	PATHS,
	listEncounterFiles,
	EncounterFileInfo,
	absolutePath,
} from './config'
import { parseDeck, EncounterSpecMapping } from '../src/campaign'

const main = () => {
	const encounters: EncounterSpecMapping = {}

	listEncounterFiles().forEach(fileInfo => {
		if (fileInfo.basename !== 'deck.csv') {
			return
		}
		if (fileInfo.encounterName !== 'Amy1') {
			console.log(`Skipping ${fileInfo.name}`)
			return
		}

		const raw = fs.readFileSync(absolutePath(fileInfo.file)).toString()
		const deck = parseDeck(raw)
		encounters[fileInfo.encounterName] = {
			deck,
		}
	})

	const encountersStr = jsonStringify(encounters, { space: '\t' })
	fs.writeFileSync(PATHS.ENCOUNTERS_JSON, encountersStr)
}

main()
