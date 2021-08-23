import Lodash from "lodash";
import { narrow } from "./utils/narrow";

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
	encounters: EncounterSession[];
	encounter?: EncounterSession;
}

export interface SavedGame {
	encounters: EncounterSession[];
	createdAt: number;
	updatedAt: number;
}

export interface EncounterSession {
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
	narrow(
		{
			savedGames: [
				{
					encounters: [],
					createdAt: "number",
					updatedAt: "number",
				},
			],
		},
		maybeData
	);

// export const isStoredData = (maybeData: any): maybeData is StoredUserData =>
// 	maybeData != null &&
// 	typeof maybeData === "object" &&
// 	"savedGames" in maybeData &&
// 	Array.isArray(maybeData.savedGames) &&
// 	maybeData.savedGames.every((savedGame: any) =>
// 		["encounters", "createdAt", "updatedAt"].every(
// 			(key) => typeof savedGame === "object" && key in savedGame
// 		)
// 	);

export const createDefault = (): UserData => ({
	savedGames: [],
	session: {
		encounters: [],
		encounter: undefined,
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

	constructor(userData?: UserData) {
		this.userData = userData || createDefault();
	}

	newGame(): SavedGame {
		const now = Date.now();
		const savedGame = {
			encounters: [],
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
			encounters: [...previousSave.encounters],
		};
		return this.userData.session;
	}

	saveGame(): SavedGame | null {
		const savedGame = this.userData.session.savedGame;
		if (!savedGame) {
			return null;
		}

		savedGame.updatedAt = Date.now();
		savedGame.encounters = [...this.userData.session.encounters];

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

	pushEncounter(
		encounter: Omit<EncounterSession, "startedAt">
	): EncounterSession {
		this.userData.session.encounter = {
			startedAt: Date.now(),
			...encounter,
		};
		this.userData.session.encounters.push(this.userData.session.encounter);
		return this.userData.session.encounter;
	}

	peekEncounter = (depth = 0): EncounterSession | null => {
		const { encounters } = this.userData.session;
		const index = encounters.length - 1 - depth;
		if (index < 0) {
			return null;
		}
		return encounters[index];
	};

	completeEncounter(): EncounterSession | null {
		const { encounter } = this.userData.session;
		if (!encounter) {
			return null;
		}
		encounter.completedAt = Date.now();
		this.userData.session.encounter = undefined;
		return encounter;
	}
}
