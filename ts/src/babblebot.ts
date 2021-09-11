import Lodash from 'lodash'

import * as CardScores from './cardScores'
import * as UserData from './userData'
import { Encounter } from './encounter'

class Game {
	UserData = UserData
	CardScores = CardScores
	Encounter = Encounter
	Lodash = Lodash

	_manager: UserData.Manager | undefined
	encounter: Encounter | undefined

	get manager(): UserData.Manager {
		if (!this._manager) {
			this._manager = new UserData.Manager()
		}
		return this._manager
	}

	load(userDataJSON: string) {
		this._manager = new UserData.Manager(UserData.createFromJSON(userDataJSON))
	}

	startEncounter() {
		let encounterSession = this.manager.peekEncounter()
		if (!encounterSession) {
			encounterSession = this.manager.pushEncounter({
				sceneName: 'Amy1',
			})
		}
		this.encounter = new Encounter({
			session: encounterSession,
		})
		return this.encounter
	}

	save(): string {
		this.manager.saveGame()
		return JSON.stringify(this.manager.userData)
	}
}

const BabblebotC = new Game()

Object.assign(globalThis, {
	Babblebot: BabblebotC,
})

declare global {
	const Babblebot: typeof BabblebotC
}
