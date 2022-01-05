import {
	listAvailableEncounters,
	parseCampaign,
	makeNodeMapping,
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
				depth: 1,
				breadth: 1,
			},
			Amy1: {
				sceneName: 'Amy1',
				prereqs: [],
				depth: 1,
				breadth: 2,
			},
			Amy2: {
				sceneName: 'Amy2',
				prereqs: ['Amy1'],
				depth: 2,
				breadth: 2,
			},
			Lally1: {
				sceneName: 'Lally1',
				prereqs: ['Amy1'],
				depth: 2,
				breadth: 3,
			},
			Castille1: {
				sceneName: 'Castille1',
				prereqs: ['Amy1', 'Lally1'],
				depth: 3,
				breadth: 3,
			},
		})
	})

	test('catches cycles', () => {
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
	})
})
