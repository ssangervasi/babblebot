import csvParse from 'csv-parse/lib/sync'

type ScoreTable = ScoreRow[]
interface ScoreRow {
	cardTag: string
	scoreTag: string
	score: number
}
interface CsvRow {
	"Card Tag"?: string
	"Tag"?: string
	"Result"?: number
}

export const parseCsv = (raw: string): ScoreTable => {
	const parsed: CsvRow[] = csvParse(raw, { cast: true, columns: true });

	const rows: ScoreRow[] = []
	parsed.forEach(csvRow => {
		const {
			"Card Tag": cardTag,
			"Tag": scoreTag,
			"Result": score,
		} = csvRow

		if (!(
			typeof cardTag === 'string' &&
			cardTag.length > 0 &&
			typeof scoreTag === 'string' &&
			typeof score === 'number'
		)) {
			return
		}

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
