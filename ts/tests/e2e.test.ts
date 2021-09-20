import { CardInstance } from '@babblebot/dealer'
import { jest } from '@jest/globals'

import '../src/babblebot'

import * as Data from './data'

describe('E2E', () => {
	beforeEach(() => {})
	describe('Loading and saving', () => {
		it('Starts and saves new games', () => {
			Babblebot.load('')

			expect(Babblebot.manager.userData).toMatchObject(
				Babblebot.UserData.createDefault(),
			)

			const firstSave = Babblebot.manager.newGame()
			Babblebot.startEncounter()
			expect(Babblebot.encounter?.moodQuality).toEqual('neutral')

			let userDataJSON = Babblebot.save()
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
			expect(JSON.parse(userDataJSON)).toMatchObject({
				savedGames: [firstSave, secondSave],
			})
		})

		it('Loads an in-progress game', () => {
			Babblebot.load(JSON.stringify(Data.mockUserData()))
			Babblebot.startEncounter()
			expect(Babblebot.encounter?.session.sceneName).toEqual('Amy1')
		})
	})

	describe('Playing an encounter', () => {
		it('works', () => {
			Babblebot.load(JSON.stringify(Data.mockUserData()))
			Babblebot.startEncounter()

			const encounter = Babblebot.encounter!
			const dealer = encounter.dealer!

			Babblebot.Lodash.range(10).forEach(() => {
				const card = dealer.peek('hand')[0]!

				const fr = encounter.scoreTable[0]!
				const featureReactions = Babblebot.CardScores.reactionJoin(fr)

				const moodBefore = encounter.mood
				encounter.prompt({ featureReactions, promptedMs: 1 })
				encounter.playCard(card.uuid)
				expect(encounter.mood).not.toEqual(moodBefore)

				encounter.resolve()
				encounter.draw(1)
			})

			Babblebot.encounter!.complete()
			expect(Babblebot.encounter?.session.completedAt).toBeTruthy()
		})
	})
})
