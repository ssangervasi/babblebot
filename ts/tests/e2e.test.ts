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
			Babblebot.loadEncounter(Babblebot.nextEncounter())
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
				savedGames: [expect.objectContaining(firstSave), secondSave],
			})
		})

		it('Loads an in-progress game', () => {
			Babblebot.load(JSON.stringify(Data.mockUserData()))
			Babblebot.loadEncounter(Babblebot.nextEncounter())
			expect(Babblebot.encounter?.session.sceneName).toEqual('Amy1')
		})
	})

	describe('Playing an encounter', () => {
		it('works', () => {
			Babblebot.load(JSON.stringify(Data.mockUserData()))
			Babblebot.loadEncounter(Babblebot.nextEncounter())

			const encounter = Babblebot.encounter!
			const dealer = encounter.dealer!

			Babblebot.Lodash.range(1, 10 + 1).forEach(i => {
				const card = dealer.peek('hand')[0]!

				const fr = encounter.scoreTable[0]!
				const featureReactions = Babblebot.CardScores.reactionJoin(fr)

				expect(encounter.state).toBe('waiting')

				const moodBefore = encounter.mood

				const promptedMs = 100 * i
				encounter.prompt({
					title: `neutral_${i}`,
					featureReactions,
					promptedMs,
				})

				expect(encounter.state).toBe('prompting')

				Babblebot.Lodash.range(promptedMs, promptedMs + 10).forEach(t => {
					encounter.tick(t)
				})
				encounter.playCard(card.uuid)
				expect(encounter.mood).not.toEqual(moodBefore)

				encounter.resolve()
				encounter.draw(1)
			})

			expect(encounter.peekNode()).toMatchObject({
				quality: 'neutral',
				step: 10,
			})

			encounter.complete(10_000)
			expect(encounter.state).toBe('complete')
			expect(Babblebot.encounter?.toUserData()?.completedAt).toEqual(10_000)
		})
	})
})
