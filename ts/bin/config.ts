import path from 'path'

const ROOT = path.resolve(__dirname, '../..')

const GAME = path.resolve(ROOT, 'game.json')
const EXTENSIONS = path.resolve(ROOT, 'eventsFunctionsExtensions')
const BABBLEBOT = path.resolve(EXTENSIONS, 'babblebot.json')

const ASSETS = path.resolve(ROOT, 'assets')
const SCORE_TABLE_CSV = path.resolve(ASSETS, 'scoreTable.csv')
const CARDS_CSV = path.resolve(ASSETS, 'cards.csv')
const CAMPAIGN_CSV = path.resolve(ASSETS, 'campaign.csv')
const ENCOUNTERS = path.resolve(ASSETS, 'encounters')

const TS = path.resolve(ROOT, 'ts')
const SRC = path.resolve(TS, 'src')
const SCORE_TABLE_JSON = path.resolve(SRC, 'scoreTable.json')
const CARDS_JSON = path.resolve(SRC, 'cards.json')
const CAMPAIGN_JSON = path.resolve(SRC, 'campaignMapping.json')

export const PATHS = {
	ROOT,
	GAME,
	EXTENSIONS,
	BABBLEBOT,

	ASSETS,
	SCORE_TABLE_CSV,
	CARDS_CSV,

	CAMPAIGN_CSV,
	CAMPAIGN_JSON,

	ENCOUNTERS,

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
