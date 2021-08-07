import Lodash from "lodash";

export interface UserData {
	savedGames: SavedGame[];
	session: Session;
	options: Options;
}

export interface Options {
	fullscreen: "off" | "on";
	bindHints: "off" | "on";
	musicVolume: number;
	effectsVolume: number;
}

export type StoredUserData = Pick<UserData, "savedGames" | "options">;

export interface Session {
	savedGame?: SavedGame;
	levels: LevelSession[];
	level?: LevelSession;
	disabledKeys?: number[];
}

export interface SavedGame {
	levels: LevelSession[];
	createdAt: number;
	updatedAt: number;
}

export interface LevelSession {
	sceneName: string;
	startedAt: number;
	completedAt?: number;
}


export const createFromJSON = (userDataJSON: string): UserData => {
	const userData = createDefault();
	let parsed: any;
	try {
		parsed = JSON.parse(userDataJSON);
	} catch (e) {
		console.warn("createFromJSON parse error:", { userDataJSON });
	}
	if (isStoredData(parsed)) {
		userData.savedGames = parsed.savedGames;
		if ("options" in parsed && typeof parsed.options === "object") {
			userData.options = {
				...userData.options,
				...parsed.options,
			};
		}
	}
	return userData;
};

export const isStoredData = (maybeData: any): maybeData is StoredUserData =>
	maybeData != null &&
	typeof maybeData === "object" &&
	"savedGames" in maybeData &&
	Array.isArray(maybeData.savedGames) &&
	maybeData.savedGames.every((savedGame: any) =>
		["levels", "createdAt", "updatedAt", "keyCounts", "disabledKeys"].every(
			(key) => typeof savedGame === "object" && key in savedGame
		)
	);

export const createDefault = (): UserData => ({
	savedGames: [],
	session: {
		levels: [],
		level: undefined,
		savedGame: undefined,
	},
	options: {
		fullscreen: "on",
		bindHints: "off",
		musicVolume: 100,
		effectsVolume: 100,
	},
});
export class Manager {
	userData: UserData;

	constructor() {
		this.userData = createDefault();
	}

	newGame(): SavedGame {
		const now = Date.now();
		const savedGame = {
			levels: [],
			keyCounts: {},
			disabledKeys: [],
			createdAt: now,
			updatedAt: now,
		};

		this.saveGame();
		this.writeSession(savedGame);
		return savedGame;
	}

	resumeGame(createdAt?: number): SavedGame | null {
		this.saveGame();
		const previousSave = createdAt
			? this.userData.savedGames.find((s) => s.createdAt === createdAt)
			: Lodash.maxBy(this.userData.savedGames, (s) => s.updatedAt);
		if (!previousSave) {
			return null;
		}

		this.writeSession(previousSave);
		return previousSave;
	}

	writeSession(previousSave: SavedGame): Session {
		this.userData.session = {
			savedGame: previousSave,
			levels: [...previousSave.levels],
		};
		return this.userData.session;
	}

	saveGame(): SavedGame | null {
		const savedGame = this.userData.session.savedGame;
		if (!savedGame) {
			return null;
		}

		savedGame.updatedAt = Date.now();
		savedGame.levels = [...this.userData.session.levels];

		const index = this.userData.savedGames.findIndex(
			(s) => s.createdAt === savedGame.createdAt
		);
		if (index === -1) {
			this.userData.savedGames.push(savedGame);
		} else {
			this.userData.savedGames[index] = savedGame;
		}
		return savedGame;
	}

	pushLevel({ session }: UserData, sceneName: string): LevelSession {
		session.level = {
			sceneName,
			startedAt: Date.now(),
		};
		session.levels.push(session.level);
		return session.level;
	}

	peekLevelName = (
		{ session: { levels } }: UserData,
		defaultName = "",
		depth = 0
	): string => {
		const index = levels.length - 1 - depth;
		if (index < 0) {
			return defaultName;
		}
		return levels[index].sceneName;
	};

	completeLevel({ session }: UserData): LevelSession | null {
		const { level } = session;
		if (!level) {
			return null;
		}
		level.completedAt = Date.now();
		session.level = undefined;
		return level;
	}

	isLevel(sceneName: string): boolean {
		return sceneName.startsWith("L_");
	}
}
