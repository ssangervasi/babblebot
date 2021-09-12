import { listAvailableEncounters, parseCampaign } from '../src/campaign'

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
