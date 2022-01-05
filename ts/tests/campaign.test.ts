import {
	listAvailableEncounters,
	parseCampaign,
	makeNodeMapping,
	CAMPAIGN_MAPPING,
} from '../src/campaign'

import * as Data from './data'

describe('parseCampaign', () => {
	const parsed = parseCampaign(Data.campaignCsv)

	test('includes empty prereqs', () => {
		expect(parsed['Amy1']).toEqual([])
	})
})

describe('listAvailableEncounters', () => {
	test('works', () => {
		const result = listAvailableEncounters(
			['Amy1', 'Amy2', 'Lally1'],
			Data.campaignMapping,
		)
		expect(result).toEqual(['Castille1', 'Lally2'])
	})
})

describe('makeNodeMapping', () => {
	it('works', () => {
		const result = makeNodeMapping({
			Intro0: [],
			Amy1: [],
			Amy2: ['Amy1'],
			Lally1: ['Amy1'],
			Castille1: ['Amy1', 'Lally1'],
		})
		expect(result).toEqual({
			Intro0: {
				sceneName: 'Intro0',
				prereqs: [],
				depth: 0,
				breadth: 0,
			},
			Amy1: {
				sceneName: 'Amy1',
				prereqs: [],
				depth: 0,
				breadth: 1,
			},
			Amy2: {
				sceneName: 'Amy2',
				prereqs: ['Amy1'],
				depth: 1,
				breadth: 1,
			},
			Lally1: {
				sceneName: 'Lally1',
				prereqs: ['Amy1'],
				depth: 1,
				breadth: 2,
			},
			Castille1: {
				sceneName: 'Castille1',
				prereqs: ['Amy1', 'Lally1'],
				depth: 2,
				breadth: 2,
			},
		})
	})

	it('works with the actual mapping', () => {
		const result = makeNodeMapping(CAMPAIGN_MAPPING)
		expect(Object.keys(result).length).toEqual(
			Object.keys(CAMPAIGN_MAPPING).length,
		)
	})

	it('catches cycles', () => {
		expect(() => {
			makeNodeMapping({
				Intro0: ['Intro0'],
				Amy1: [],
				Amy2: ['Amy1'],
			})
		}).toThrow('Cycle detected: Intro0 <-> Intro0')
		expect(() => {
			makeNodeMapping({
				Intro0: [],
				Amy1: ['Amy2'],
				Amy2: ['Amy1'],
			})
		}).toThrow('Cycle detected: Amy1 <-> Amy2')
		expect(() => {
			makeNodeMapping({
				Intro0: [],
				Amy1: ['Lally1'],
				Amy2: ['Amy1'],
				Lally1: ['Amy2'],
			})
		}).toThrow('Cycle detected: Amy1 <-> Lally1')
		expect(() => {
			makeNodeMapping({
				Lally2: ['Lally1'],
				Lally3: ['Castille2'], // Depends on a cycle.
				Castille1: ['Lally1'],
				Castille2: ['Castille2'], // Is a cycle
				Amy3: ['Amy2'],
				Amy2: ['Amy1'],
				Amy1: ['Amy3'], // Is also a cycle, but not first detected.
				Lally1: [],
			})
		}).toThrow('Cycle detected: Castille2 <-> Castille2')
	})
})
