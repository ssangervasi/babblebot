import Lodash from "lodash";

import * as CardScores from "./cardScores";
import * as UserData from "./userData";
import { Encounter } from "./encounter";

class Game {
	UserData = UserData;
	CardScores = CardScores;
	Encounter = Encounter;
	Lodash = Lodash;

	_manager: UserData.Manager | undefined;

	load(userDataJSON: string) {
		this._manager = new UserData.Manager(UserData.createFromJSON(userDataJSON));
	}

	getManager() {
		if (!this._manager) {
			this._manager = new UserData.Manager();
		}
		return this._manager;
	}

	getEncounter() {
		const manager = this.getManager();
		let encounterSession = manager.peekEncounter();
		if (!encounterSession) {
			encounterSession = manager.pushEncounter({
				sceneName: "Amy1",
			});
		}
		return new Encounter({
			session: encounterSession,
		});
	}
}

const BabblebotC = new Game();

Object.assign(globalThis, {
	Babblebot: BabblebotC,
});

declare global {
	const Babblebot: typeof BabblebotC;
}
