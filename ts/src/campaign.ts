import csvParse from 'csv-parse/lib/sync'

import _CAMPAIGN_MAPPING from './campaignMapping.json'

export const CAMPAIGN_MAPPING = _CAMPAIGN_MAPPING

export const HEADINGS = {
	SCENE_NAME: 'Scene Name',
	PREREQ: 'Prereq',
} as const

export type Mapping = {
	[sceneName: string]: string[]
}

export type CsvRow = {
	[HEADINGS.SCENE_NAME]?: string
	[HEADINGS.PREREQ]?: string
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

		if (!(sceneName && prereq)) {
			return
		}

		const prereqs = mapping[sceneName] || []
		mapping[sceneName] = prereqs
		prereqs.push(prereq)
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
export const findAvailableEncounters = (
	completed: string[],
	campaignMapping: Mapping = CAMPAIGN_MAPPING,
): string[] => {
	const completedSet = new Set(completed)
	return Object.keys(campaignMapping).filter(sceneName => {
		return (
			!completed.includes(sceneName) &&
			campaignMapping[sceneName].every(prereq => completed.includes(prereq))
		)
	})
}
