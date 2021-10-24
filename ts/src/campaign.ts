import csvParse from 'csv-parse/lib/sync'

import _CAMPAIGN_MAPPING from './campaignMapping.json'
import _ENCOUNTER_SPEC_MAPPING from './encounterSpecMapping.json'

export const CAMPAIGN_MAPPING = _CAMPAIGN_MAPPING
export const ENCOUNTER_SPEC_MAPPING: EncounterSpecMapping =
	_ENCOUNTER_SPEC_MAPPING

export const HEADINGS = {
	SCENE_NAME: 'Scene Name',
	PREREQ: 'Prereq',
} as const

export type CsvRow = {
	[HEADINGS.SCENE_NAME]?: string
	[HEADINGS.PREREQ]?: string
}

export type Mapping = {
	[sceneName: string]: string[]
}

const PARSE_OPTIONS = {
	cast: true,
	columns: true,
	skip_empty_lines: true,
}

export const parseCampaign = (raw: string): Mapping => {
	const parsed: CsvRow[] = csvParse(raw, PARSE_OPTIONS)

	const mapping: Mapping = {}
	parsed.forEach(csvRow => {
		const { [HEADINGS.SCENE_NAME]: sceneName, [HEADINGS.PREREQ]: prereq } =
			csvRow

		if (!sceneName) {
			return
		}

		const prereqs = mapping[sceneName] || []
		mapping[sceneName] = prereqs
		if (prereq) {
			prereqs.push(prereq)
		}
	})

	return mapping
}

/**
 * Picks out the encounters in the campaign that are available because their
 * prereqs have been completed.
 *
 * Criteria that could be added:
 *  - Completion requiring good/neutral/bad ending
 *  - Including already completed encounters without the good ending
 */
export const listAvailableEncounters = (
	completed: string[],
	campaignMapping: Mapping = CAMPAIGN_MAPPING,
): string[] => {
	const completedSet = new Set(completed)
	return Object.keys(campaignMapping).filter(sceneName => {
		return (
			!completedSet.has(sceneName) &&
			campaignMapping[sceneName] &&
			campaignMapping[sceneName]!.every(prereq => completed.includes(prereq))
		)
	})
}

export const DECK_HEADINGS = {
	ID: 'Id',
} as const

export type DeckCsvRow = {
	[DECK_HEADINGS.ID]?: string
}

export type EncounterSpecMapping = {
	[sceneName: string]: EncounterSpec
}

export type EncounterSpec = {
	deck: string[]
}

export const parseDeck = (raw: string): string[] => {
	const parsed: DeckCsvRow[] = csvParse(raw, PARSE_OPTIONS)

	const deck: string[] = []
	parsed.forEach(csvRow => {
		const { [DECK_HEADINGS.ID]: id } = csvRow

		if (!id) {
			return
		}

		deck.push(id)
	})

	return deck
}
