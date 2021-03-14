import csvParse from 'csv-parse/lib/sync'

type ScoreTable = ScoreRow[]
interface ScoreRow {
	cardTag: string
	scoreTag: string
	score: number
}

export const parseCsv = (raw: string): ScoreTable => {
	if (csvParse) {
		return csvParse(raw)
	}
	console.warn('no csv-parse')

	const lines = raw.split(/\n+/)
	const cleanLines = lines
		.map(line => line.trim())
		.filter(line => line.length > 0)
		.filter(line => !line.startsWith('Card'))

	const rows: ScoreRow[] = []

	cleanLines.forEach(line => {
		const splitted = line.split(',')
		if (splitted.length !== 3) {
			throw new Error(`Invalid score row: "${line}"`)
		}
		const [cardTag, scoreTag, scoreStr] = splitted
		if (cardTag === '') {
			return
		}
		const score = Number(scoreStr) || 0
		rows.push({ cardTag, scoreTag, score })
	})

	return rows
}

export const calculateScore = (
	cardTagsStr: string,
	characterTagsStr: string,
	nodeTagsStr: string,
	scoreTable: ScoreTable,
): number => {
	const cardTags = spaceSplit(cardTagsStr)
	console.log(cardTags)

	const characterTags = spaceSplit(characterTagsStr)
	const nodeTags = spaceSplit(nodeTagsStr)
	const effectTags = [...characterTags, ...nodeTags]

	// Build the default map for all card tags
	const cardTagToEffectTag = new Map<string, string>(
		cardTags.map(cardTag => [cardTag, '']),
	)
	effectTags.forEach(effectTag => {
		const effectTagPrefix = effectTag.split('_')[0]
		if (!effectTagPrefix) {
			console.warn(`ignoring tag "${effectTag}" because it has no prefix`)
			return
		}
		if (cardTagToEffectTag.has(effectTagPrefix)) {
			cardTagToEffectTag.set(effectTagPrefix, effectTag)
		}
	})
	let scoreSum = 0
	scoreTable.forEach(({ cardTag, scoreTag, score }) => {
		if (!cardTagToEffectTag.has(cardTag)) {
			return
		}
		if (cardTagToEffectTag.get(cardTag) === scoreTag) {
			scoreSum += score
		}
	})
	return scoreSum
}

const spaceSplit = (str: string): string[] => str.split(/\s+/)

declare var global: {
	exports: {}
	ssangervasi?: {
		cardScores?: {}
	}
}
global.ssangervasi = global.ssangervasi || {}
global.ssangervasi.cardScores = global.ssangervasi.cardScores || exports
