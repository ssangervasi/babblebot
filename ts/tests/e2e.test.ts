import { jest } from '@jest/globals'

import '../src/babblebot'

import * as Data from './data'

describe('End-to-End', () => {
	it('Starts and saves new games', () => {
		Babblebot.load('')

		expect(Babblebot.manager.userData).toMatchObject(
			Babblebot.UserData.createDefault(),
		)

		const firstSave = Babblebot.manager.newGame()
		Babblebot.startEncounter()
		expect(Babblebot.encounter?.moodQuality).toEqual('neutral')

		let userDataJSON = Babblebot.save()
		console.debug('DEBUG(ssangervasi)', userDataJSON)

		expect(JSON.parse(userDataJSON)).toMatchObject({
			savedGames: [
				{
					encounters: [
						{
							sceneName: 'Amy1',
						},
					],
				},
			],
		})

		jest.setSystemTime(firstSave.createdAt + 1000)
		const secondSave = Babblebot.manager.newGame()

		Babblebot.manager.resumeGame(firstSave.createdAt)
		Babblebot.loadEncounter('Amy1')

		userDataJSON = Babblebot.save()
		console.debug('DEBUG(ssangervasi)', userDataJSON)

		expect(JSON.parse(userDataJSON)).toMatchObject({
			savedGames: [firstSave, secondSave],
		})
	})

	it('Loads an in-progress game', () => {
		Babblebot.load(JSON.stringify(Data.mockUserData()))
		Babblebot.startEncounter()
		expect(Babblebot.encounter?.moodQuality).toEqual('neutral')

		Babblebot.encounter!.complete()
		expect(Babblebot.encounter?.session.completedAt).toBeTruthy()
		console.log('yes  ss')
	})
})
