import fs from 'fs'
import path from 'path'

import { compact } from 'lodash'
import { Payload, Guard } from 'narrow-minded'

const ROOT = path.resolve(__dirname, '../..')

const GAME = path.resolve(ROOT, 'game.json')
const EXTENSIONS = path.resolve(ROOT, 'eventsFunctionsExtensions')
const BABBLEBOT = path.resolve(EXTENSIONS, 'babblebot.json')

const ASSETS = path.resolve(ROOT, 'assets')
const SCORE_TABLE_CSV = path.resolve(ASSETS, 'scoreTable.csv')
const CARDS_CSV = path.resolve(ASSETS, 'cards.csv')
const CAMPAIGN_CSV = path.resolve(ASSETS, 'campaign.csv')
const ENCOUNTERS = path.resolve(ASSETS, 'encounters')
const ANALYSIS_CSV = path.resolve(ASSETS, 'analysis.csv')

const TS = path.resolve(ROOT, 'ts')
const SRC = path.resolve(TS, 'src')
const SCORE_TABLE_JSON = path.resolve(SRC, 'scoreTable.json')
const CARDS_JSON = path.resolve(SRC, 'cards.json')
const CAMPAIGN_JSON = path.resolve(SRC, 'campaignMapping.json')
const ENCOUNTERS_JSON = path.resolve(SRC, 'encounterSpecMapping.json')

export const PATHS = {
	ROOT,
	GAME,
	EXTENSIONS,
	BABBLEBOT,

	ASSETS,
	SCORE_TABLE_CSV,
	CARDS_CSV,
	ANALYSIS_CSV,

	CAMPAIGN_CSV,
	CAMPAIGN_JSON,

	ENCOUNTERS,
	ENCOUNTERS_JSON,

	TS,
	SRC,
	SCORE_TABLE_JSON,
	CARDS_JSON,
} as const

export const absolutePath = (original: string) => {
	return path.isAbsolute(original) ? original : path.join(PATHS.ROOT, original)
}

export const windowsPath = (original: string) => {
	return path.win32.join(
		...path.relative(PATHS.ROOT, absolutePath(original)).split(path.sep),
	)
}

export const posixPath = (original: string) => {
	return path.posix.join(
		...path.relative(PATHS.ROOT, absolutePath(original)).split(path.sep),
	)
}

export const ENCOUNTER_BASE_NAMES = [
	//
	'dialogue.json',
	'deck.csv',
] as const

export interface EncounterFileInfo {
	name: string
	file: string
	basename: typeof ENCOUNTER_BASE_NAMES[number]
	encounterName: string
}

let _encounterFiles: EncounterFileInfo[] | null = null
export const listEncounterFiles = (): EncounterFileInfo[] => {
	if (_encounterFiles) {
		return _encounterFiles
	}

	_encounterFiles = fs
		.readdirSync(PATHS.ENCOUNTERS)
		.flatMap((encounterName): EncounterFileInfo[] => {
			return compact(
				ENCOUNTER_BASE_NAMES.map(basename => {
					const filePath = path.join(PATHS.ENCOUNTERS, encounterName, basename)
					if (!fs.existsSync(filePath)) {
						return undefined
					}
					return {
						name: windowsPath(filePath),
						file: posixPath(filePath),
						encounterName,
						basename: basename,
					}
				}),
			)
		})
	return _encounterFiles
}

export const DIALOGUE_ASSET_RE =
	/assets\\+encounters\\+(?<encounterName>\w+)\\+dialogue.json/

export const listDialogueFiles = () =>
	listEncounterFiles().filter(efi => efi.basename === 'dialogue.json')

export const DialogueGuard = Guard.narrow([
	{ title: 'string', body: 'string', tags: 'string' },
])
export type DialogueArray = Payload<typeof DialogueGuard>
