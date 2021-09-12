import { findAvailableEncounters } from '../src/campaign'

import * as Data from './data'

describe('findAvailableEncounters', () => {
	test('works', () => {
		const result = findAvailableEncounters(
			['Amy1', 'Amy2', 'Lally1'],
			Data.campaignMapping,
		)
		expect(result).toEqual(['Castille1', 'Lally2'])
	})
})
