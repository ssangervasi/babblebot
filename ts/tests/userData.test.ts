import * as Lodash from "lodash";
import * as UD from "../src/userData";

const mockLevels = (): UD.LevelSession[] => [
	{
		sceneName: "L_some_level",
		startedAt: 100,
		completedAt: 110,
	},
	{
		sceneName: "L_another_level",
		startedAt: 110,
		completedAt: undefined,
	},
];
const mockSavedGames = (): UD.SavedGame[] => [
	{
		createdAt: 2,
		updatedAt: 20,
		levels: [mockLevels()[0]],
	},
	{
		createdAt: 100,
		updatedAt: 200,
		levels: mockLevels(),
	},
];

const blankSaveMatcher = (resultSave?: UD.SavedGame) => ({
	levels: [],
	createdAt: expect.any(Number),
	updatedAt: resultSave?.createdAt,
});

const mockSession = (): UD.Session => ({
	savedGame: mockSavedGames()[1],
	levels: [],
});

const mockOptions = (): UD.Options => ({
	fullscreen: "off",
	bindHints: "on",
	musicVolume: 69,
	effectsVolume: 1,
});


type DeepTypePrimitive = 'string' | 'number'
type DeepTypePrimitive = 'string' | 'number'


const typeofDeep = (obj: Object | unknown[]): DeepType<unknown> => {
	return Lodash.transform(obj, (acc, val: any, key, cur) => {
		let valType = typeof val
		let newValType = valType
		if (valType === "object") {
			newValType = typeofDeep(val)
		}

		if (Array.isArray(acc)) {
			acc.push(newValType)
		} else if(typeof acc === 'object') {
			acc[key] = newValType
		}
	});
};

test("lodash", () => {
	expect(
		typeofDeep({
			a: { aa: "a a", ab: "a b" },
			b: { ba: 1, bb: ["b", "b"] },
		})
	).toEqual({
		a: {
			aa: "string",
			ab: "string",
		},
		b: {
			ba: "number",
			bb: ["string"],
		},
	});
});

describe("createDefault", () => {
	const result = UD.createDefault();

	it("has no saved games", () => {
		expect(result.savedGames).toEqual([]);
	});

	it("has a blank session", () => {
		expect(result.session).toMatchObject<UD.Session>({
			levels: [],
			level: undefined,
			savedGame: undefined,
		});
	});

	it("has the default options", () => {
		expect(result.options).toMatchObject<UD.Options>({
			fullscreen: "on",
			bindHints: "off",
			musicVolume: 100,
			effectsVolume: 100,
		});
	});
});

describe("createFromJSON", () => {
	it("handles invalid JSON", () => {
		const result = UD.createFromJSON("horx;ma-dorks");
		expect(result).toEqual(UD.createDefault());
	});

	it("handles valid JSON with invalid structure", () => {
		const result = UD.createFromJSON("0");
		expect(result).toEqual(UD.createDefault());
	});

	it("loads the saved games from valid JSON", () => {
		const validStored: UD.StoredUserData = {
			savedGames: mockSavedGames(),
			options: mockOptions(),
		};
		const result = UD.createFromJSON(JSON.stringify(validStored));
		expect(result).not.toEqual(UD.createDefault());
		expect(result.savedGames).toEqual(validStored.savedGames);
		expect(result.session.levels).toEqual([]);
		expect(result.options).toEqual(mockOptions());
	});
});

describe("newGame", () => {
	it("with default data populates the session", () => {
		const manager = new UD.Manager();
		const resultSave = manager.newGame();
		expect(manager.userData.session.savedGame).toBe(resultSave);
		expect(resultSave).toMatchObject(blankSaveMatcher(resultSave));
		expect(manager.userData.savedGames).toEqual([]);
	});

	it("with existing data pushes the existing save", () => {
		const originalGames = mockSavedGames();
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [originalGames[0]],
			session: {
				savedGame: originalGames[1],
				levels: [],
			},
		});
		const resultSave = manager.newGame();
		expect(manager.userData.session.savedGame).toBe(resultSave);
		expect(resultSave).toMatchObject(blankSaveMatcher(resultSave));
		expect(manager.userData.savedGames).toEqual(originalGames);
	});
});

describe("resumeGame", () => {
	it("finds the most recent save", () => {
		const mostRecentSave = {
			createdAt: 1,
			updatedAt: 30,
			levels: mockLevels(),
		};
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [
				{
					createdAt: 1,
					updatedAt: 20,
					levels: mockLevels(),
				},
				mostRecentSave,
				{
					createdAt: 1,
					updatedAt: 10,
					levels: mockLevels(),
				},
				{
					createdAt: 1,
					updatedAt: 1,
					levels: mockLevels(),
				},
			],
			session: {
				levels: [],
			},
		});
		const resultSave = manager.resumeGame();
		expect(manager.userData.session.savedGame).toBe(resultSave);
		expect(resultSave).toBe(mostRecentSave);
	});

	it("populates the session with save data", () => {
		const savedGame = {
			levels: mockLevels(),
			createdAt: 1,
			updatedAt: 30,
		};
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [savedGame],
			session: {
				levels: [],
			},
		});

		manager.resumeGame();

		expect(manager.userData.session).toEqual({
			savedGame,
			levels: savedGame.levels,
		});
	});
});

describe("newGame", () => {
	it("populates the session with save data", () => {
		const previousSave = {
			levels: mockLevels(),
			createdAt: 1,
			updatedAt: 30,
		};
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [],
			session: {
				savedGame: previousSave,
				levels: mockLevels(),
				level: mockLevels()[0],
			},
		});

		manager.newGame();

		expect(manager.userData.session).toMatchObject({
			savedGame: blankSaveMatcher(manager.userData.session.savedGame),
			levels: [],
		});
	});
});

describe("saveGame", () => {
	it("adds the session levels to the save", () => {
		const manager = new UD.Manager({
			options: mockOptions(),
			savedGames: [],
			session: {
				savedGame: {
					createdAt: 1,
					updatedAt: 5,
					levels: [
						{
							sceneName: "L_1",
							startedAt: 1,
							completedAt: 2,
						},
					],
				},
				levels: [
					{
						sceneName: "L_1",
						startedAt: 1,
						completedAt: 2,
					},
					{
						sceneName: "L_2",
						startedAt: 3,
						completedAt: 4,
					},
					{
						sceneName: "L_3",
						startedAt: 5,
					},
				],
			},
		});
		const savedGame = manager.saveGame();
		expect(savedGame).toBeTruthy();
		expect(manager.userData.savedGames[0]).toEqual({
			createdAt: 1,
			updatedAt: expect.any(Number),
			levels: [
				{
					sceneName: "L_1",
					startedAt: 1,
					completedAt: 2,
				},
				{
					sceneName: "L_2",
					startedAt: 3,
					completedAt: 4,
				},
				{
					sceneName: "L_3",
					startedAt: 5,
				},
			],
		});
		expect(manager.userData.session).toEqual({
			level: undefined,
			levels: savedGame?.levels,
			savedGame,
		});
	});
});

describe("pushLevel", () => {
	it("handles no active level", () => {
		const dataNoLevel = {
			options: mockOptions(),
			savedGames: mockSavedGames(),
			session: mockSession(),
		};
		const manager = new UD.Manager(dataNoLevel);
		const newLevel = manager.pushLevel(dataNoLevel, "some-scene");
		expect(dataNoLevel.session.level).toBe(newLevel);
		expect(dataNoLevel.session.levels[0]).toBe(newLevel);
		expect(newLevel).toMatchObject<UD.LevelSession>({
			sceneName: "some-scene",
			startedAt: expect.any(Number),
		});
	});

	it("stores the active scene and creates the new one", () => {
		const startingLevel: UD.LevelSession = {
			sceneName: "starting-scene",
			startedAt: 314,
		};
		const dataWithLevel = {
			options: mockOptions(),
			savedGames: mockSavedGames(),
			session: {
				levels: [startingLevel],
				level: startingLevel,
			},
		};
		const manager = new UD.Manager(dataWithLevel);
		const newLevel = manager.pushLevel(dataWithLevel, "some-scene");
		expect(dataWithLevel.session.level).toBe(newLevel);
		expect(newLevel).toMatchObject<UD.LevelSession>({
			sceneName: "some-scene",
			startedAt: expect.any(Number),
		});
		expect(dataWithLevel.session.levels[0]).toBe(startingLevel);
		expect(dataWithLevel.session.levels[1]).toBe(newLevel);
	});
});
