import { findAvailableEncounters } from '../src/campaign'

import * as Data from './data'

describe('findAvailableEncounters', () => {
	test('workds', () => {
		const result = findAvailableEncounters(
			['amy1', 'lally1'],
			Data.campaignMapping,
		)
		expect(result).toEqual(['castille1', 'lally2'])
	})
})
