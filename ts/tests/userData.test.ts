import * as Lodash from 'lodash'
import * as UD from '../src/userData'

const mockEncounters = (): UD.EncounterSession[] => [
	{
		sceneName: 'L_some_encounter',
		startedAt: 100,
		completedAt: 110,
	},
	{
		sceneName: 'L_another_encounter',
		startedAt: 110,
		completedAt: undefined,
	},
]
const mockSavedGames = (): UD.SavedGame[] => [
	{
		createdAt: 2,
		updatedAt: 20,
		encounters: [mockEncounters()[0]],
	},
	{
		createdAt: 100,
		updatedAt: 200,
		encounters: mockEncounters(),
	},
]

const blankSaveMatcher = (resultSave?: UD.SavedGame) => ({
	encounters: [],
	createdAt: expect.any(Number),
	updatedAt: resultSave?.createdAt,
})

const mockSession = (): UD.Session => ({
	savedGame: mockSavedGames()[1],
	encounters: [],
})

const mockOptions = (): UD.Options => ({
	fullscreen: 'off',
	bindHints: 'on',
	musicVolume: 69,
	effectsVolume: 1,
})

describe('createDefault', () => {
	const result = UD.createDefault()

	it('has no saved games', () => {
		expect(result.savedGames).toEqual([])
	})

	it('has a blank session', () => {
		expect(result.session).toMatchObject<UD.Session>({
			encounters: [],
			encounter: undefined,
			savedGame: undefined,
		})
	})

	it('has the default options', () => {
		expect(result.options).toMatchObject<UD.Options>({
			fullscreen: 'on',
			bindHints: 'off',
			musicVolume: 100,
			effectsVolume: 100,
		})
	})
})

describe('createFromJSON', () => {
	it('handles invalid JSON', () => {
		const result = UD.createFromJSON('horx;ma-dorks')
		expect(result).toEqual(UD.createDefault())
	})

	it('handles valid JSON with invalid structure', () => {
		const result = UD.createFromJSON('0')
		expect(result).toEqual(UD.createDefault())
	})

	it('loads the saved games from valid JSON', () => {
		const validStored: UD.StoredUserData = {
			savedGames: mockSavedGames(),
			options: mockOptions(),
		}
		const result = UD.createFromJSON(JSON.stringify(validStored))
		expect(result).not.toEqual(UD.createDefault())
		expect(result.savedGames).toEqual(validStored.savedGames)
		expect(result.session.encounters).toEqual([])
		expect(result.options).toEqual(mockOptions())
	})
})

describe('newGame', () => {
	it('with default data populates the session', () => {
		const manager = new UD.Manager()
		const resultSave = manager.newGame()
		expect(manager.userData.session.savedGame).toBe(resultSave)
		expect(resultSave).toMatchObject(blankSaveMatcher(resultSave))
		expect(manager.userData.savedGames).toEqual([])
	})

	it('with existing data pushes the existing save', () => {
		const originalGames = mockSavedGames()
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [originalGames[0]],
			session: {
				savedGame: originalGames[1],
				encounters: [],
			},
		})
		const resultSave = manager.newGame()
		expect(manager.userData.session.savedGame).toBe(resultSave)
		expect(resultSave).toMatchObject(blankSaveMatcher(resultSave))
		expect(manager.userData.savedGames).toEqual(originalGames)
	})
})

describe('resumeGame', () => {
	it('finds the most recent save', () => {
		const mostRecentSave = {
			createdAt: 1,
			updatedAt: 30,
			encounters: mockEncounters(),
		}
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [
				{
					createdAt: 1,
					updatedAt: 20,
					encounters: mockEncounters(),
				},
				mostRecentSave,
				{
					createdAt: 1,
					updatedAt: 10,
					encounters: mockEncounters(),
				},
				{
					createdAt: 1,
					updatedAt: 1,
					encounters: mockEncounters(),
				},
			],
			session: {
				encounters: [],
			},
		})
		const resultSave = manager.resumeGame()
		expect(manager.userData.session.savedGame).toBe(resultSave)
		expect(resultSave).toBe(mostRecentSave)
	})

	it('populates the session with save data', () => {
		const savedGame = {
			encounters: mockEncounters(),
			createdAt: 1,
			updatedAt: 30,
		}
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [savedGame],
			session: {
				encounters: [],
			},
		})

		manager.resumeGame()

		expect(manager.userData.session).toEqual({
			savedGame,
			encounters: savedGame.encounters,
		})
	})
})

describe('newGame', () => {
	it('populates the session with save data', () => {
		const previousSave = {
			encounters: mockEncounters(),
			createdAt: 1,
			updatedAt: 30,
		}
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [],
			session: {
				savedGame: previousSave,
				encounters: mockEncounters(),
				encounter: mockEncounters()[0],
			},
		})

		manager.newGame()

		expect(manager.userData.session).toMatchObject({
			savedGame: blankSaveMatcher(manager.userData.session.savedGame),
			encounters: [],
		})
	})
})

describe('saveGame', () => {
	it('adds the session encounters to the save', () => {
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [],
			session: {
				savedGame: {
					createdAt: 1,
					updatedAt: 5,
					encounters: [
						{
							sceneName: 'L_1',
							startedAt: 1,
							completedAt: 2,
						},
					],
				},
				encounters: [
					{
						sceneName: 'L_1',
						startedAt: 1,
						completedAt: 2,
					},
					{
						sceneName: 'L_2',
						startedAt: 3,
						completedAt: 4,
					},
					{
						sceneName: 'L_3',
						startedAt: 5,
					},
				],
			},
		})
		const savedGame = manager.saveGame()
		expect(savedGame).toBeTruthy()
		expect(manager.userData.savedGames[0]).toEqual({
			createdAt: 1,
			updatedAt: expect.any(Number),
			encounters: [
				{
					sceneName: 'L_1',
					startedAt: 1,
					completedAt: 2,
				},
				{
					sceneName: 'L_2',
					startedAt: 3,
					completedAt: 4,
				},
				{
					sceneName: 'L_3',
					startedAt: 5,
				},
			],
		})
		expect(manager.userData.session).toEqual({
			encounter: undefined,
			encounters: savedGame?.encounters,
			savedGame,
		})
	})
})

describe('pushEncounter', () => {
	it('handles no active encounter', () => {
		const dataNoEncounter = {
			options: mockOptions(),
			savedGames: mockSavedGames(),
			session: mockSession(),
		}
		const manager = new UD.Manager(dataNoEncounter)
		const newEncounter = manager.pushEncounter({ sceneName: 'some-scene' })
		expect(dataNoEncounter.session.encounter).toBe(newEncounter)
		expect(dataNoEncounter.session.encounters[0]).toBe(newEncounter)
		expect(newEncounter).toMatchObject<UD.EncounterSession>({
			sceneName: 'some-scene',
			startedAt: expect.any(Number),
		})
	})

	it('stores the active scene and creates the new one', () => {
		const startingEncounter: UD.EncounterSession = {
			sceneName: 'starting-scene',
			startedAt: 314,
		}
		const dataWithEncounter = {
			options: mockOptions(),
			savedGames: mockSavedGames(),
			session: {
				encounters: [startingEncounter],
				encounter: startingEncounter,
			},
		}
		const manager = new UD.Manager(dataWithEncounter)
		const newEncounter = manager.pushEncounter({ sceneName: 'some-scene' })
		expect(dataWithEncounter.session.encounter).toBe(newEncounter)
		expect(newEncounter).toMatchObject<UD.EncounterSession>({
			sceneName: 'some-scene',
			startedAt: expect.any(Number),
		})
		expect(dataWithEncounter.session.encounters[0]).toBe(startingEncounter)
		expect(dataWithEncounter.session.encounters[1]).toBe(newEncounter)
	})
})
