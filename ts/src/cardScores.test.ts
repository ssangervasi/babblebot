import {
	parseCsv,
	calculateScore,
} from './cardScores'
const raw = `
Card Tag,Tag,Result
agree,agree_good,30
agree,agree_bad,-10
agree,,0
,,
disagree,disagree_bad,-40
disagree,,-10
,,
listen,listen_good,20
,,
butt,butt_good,1000.1
`
const exampleTable = [
	{ cardTag: 'agree', scoreTag: 'agree_good', score: 30 },
	{ cardTag: 'agree', scoreTag: 'agree_bad', score: -10 },
	{ cardTag: 'agree', scoreTag: '', score: 0 },
	{ cardTag: 'disagree', scoreTag: 'disagree_bad', score: -40 },
	{ cardTag: 'disagree', scoreTag: '', score: -10 },
	{ cardTag: 'listen', scoreTag: 'listen_good', score: 20 },
	{ cardTag: 'butt', scoreTag: 'butt_good', score: 1000.1 },
]


describe('calculateScore', () => {
	test('simple example', () => {
		const cardTagsStr = 'agree listen'
		const characterTagsStr = 'listen_good'
		const nodeTagsStr = 'agree_bad'
		const result = calculateScore(
			cardTagsStr,
			characterTagsStr,
			nodeTagsStr,
			exampleTable,
		)
		expect(result).toEqual(-10 + 20)
	})

	test('simple example', () => {
		const cardTagsStr = 'agree butt'
		const characterTagsStr = 'agree_good'
		const nodeTagsStr = 'agree_bad butt_good'
		const result = calculateScore(
			cardTagsStr,
			characterTagsStr,
			nodeTagsStr,
			exampleTable,
		)
		expect(result).toEqual(-10 + 1000.1)
	})
})

describe('parseCsv', () => {
	test('parseCsv', () => {
		const result = parseCsv(raw)
		expect(result).toEqual(exampleTable)
	})
})

describe('parseCsv', () => {
	test('parseCsv', () => {
		const result = parseCsv(raw)
		expect(result).toEqual(exampleTable)
	})

})
