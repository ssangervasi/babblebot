import '../src/babblebot'

// import * as Data from "./data";

describe('End-to-End', () => {
	it('works', () => {
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

		const secondSave = Babblebot.manager.newGame()

		Babblebot.manager.resumeGame(firstSave.createdAt)

		userDataJSON = Babblebot.save()
		expect(JSON.parse(userDataJSON)).toMatchObject({
			savedGames: [firstSave, secondSave],
		})
	})
})
