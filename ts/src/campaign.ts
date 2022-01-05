import csvParse from 'csv-parse/lib/sync'

import _CAMPAIGN_MAPPING from './campaignMapping.json'
import _ENCOUNTER_SPEC_MAPPING from './encounterSpecMapping.json'

export type SceneName = keyof typeof _CAMPAIGN_MAPPING
export type Mapping = {
	[sceneName: string]: string[]
}
export type MappingStrict = Partial<Record<SceneName, SceneName[]>>

export const CAMPAIGN_MAPPING = _CAMPAIGN_MAPPING as MappingStrict
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

export interface CampaignNode {
	sceneName: SceneName
	prereqs: SceneName[]
	/**
	 * The number of nodes that preceed this one in the prereq tree. With no prereqs, this is zero.
	 */
	depth: number
	/**
	 * The node's alignment at its level in the tree. This will be unique among nodes at the same
	 * depth so that they cannot overlap with each other (visually).
	 */
	breadth: number
}
export type NodeMapping = Record<SceneName, CampaignNode>

export const makeNodeMapping = (
	campaignMapping: MappingStrict,
): NodeMapping => {
	const nodes: Partial<NodeMapping> = {}

	const q = Object.keys(campaignMapping) as SceneName[]
	const nameToPreviousLength = new Map<SceneName, number>()
	const depthToBreadth = new Map<number, number>()

	let limit = 10 ** 10
	while (q.length) {
		if (limit-- < 0) {
			throw new Error('Limit reached.')
		}

		const sceneName = q.shift()!
		if (sceneName in nodes) {
			continue
		}

		const prereqs = campaignMapping[sceneName]
		if (!prereqs) {
			continue
		}

		let maxDepth = -1
		let maxBreadth = -1
		let unsatisfied: SceneName | undefined
		prereqs.forEach(prereq => {
			const pNode = nodes[prereq]
			if (pNode === undefined) {
				unsatisfied = prereq
			} else {
				maxDepth = Math.max(maxDepth, pNode.depth)
				maxBreadth = Math.max(maxBreadth, pNode.breadth)
			}
		})

		if (unsatisfied) {
			// Final cycle detection method: store the length the queue when the node was
			// found to have an unmet dependency. We won't encounter the node again until
			// we've checked every other node. If the queue didn't get shorter, then there
			// is no way the dependency will ever get resolved.
			if (nameToPreviousLength.get(sceneName) === q.length) {
				throw new Error(`Cycle detected: ${sceneName} <-> ${unsatisfied}`)
			}

			nameToPreviousLength.set(sceneName, q.length)
			q.push(sceneName)
			continue
		}

		const depth = maxDepth + 1
		let breadth = maxBreadth
		const usedBreadth = depthToBreadth.has(depth)
			? depthToBreadth.get(depth)!
			: -1
		if (breadth <= usedBreadth) {
			breadth = usedBreadth + 1
		}
		if (usedBreadth < breadth) {
			depthToBreadth.set(depth, breadth)
		}

		nodes[sceneName] = {
			sceneName: sceneName,
			prereqs,
			depth,
			breadth,
		}
	}

	return nodes as NodeMapping
}

// const isSceneName = (s: string): s is SceneName => s in CAMPAIGN_MAPPING

/**
 * This should probably just be generated and stored as json instead of memoized.
 */
let _nodeMapping: NodeMapping | undefined
export const getNodeMapping = (): NodeMapping => {
	if (_nodeMapping) {
		return _nodeMapping
	}

	_nodeMapping = makeNodeMapping(CAMPAIGN_MAPPING)
	return _nodeMapping
}
