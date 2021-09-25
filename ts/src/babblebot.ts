import Lodash from 'lodash'

import * as CardScores from './cardScores'
import * as UserData from './userData'
import * as Campaign from './campaign'
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
		this._manager.resumeGame()
		this.encounter = undefined
	}

	save(): string {
		this.manager.saveGame()
		return JSON.stringify(this.manager.userData)
	}

	loadEncounter(sceneName: string): Encounter {
		const incompletes = this.manager.listIncompleteEncounters()
		const resumeableSession = incompletes.find(e => e.sceneName === sceneName)
		if (resumeableSession) {
			this.encounter = this.makeEncounter(resumeableSession)
			return this.encounter
		}

		const newSession = this.manager.pushEncounter({
			sceneName: sceneName,
		})
		this.encounter = this.makeEncounter(newSession)
		return this.encounter
	}

	nextEncounter(): string {
		const incompletes = this.manager.listIncompleteEncounters()
		const session = incompletes[0]
		if (session) {
			return session.sceneName
		}
		const availables = this.listAvailableEncounters()
		if (availables[0]) {
			return availables[0]
		}
		throw new Error('No encounters available')
	}

	private makeEncounter(session: UserData.EncounterSession) {
		return new Encounter({
			session,
			scoreTable: CardScores.SCORE_TABLE,
			cardTable: CardScores.CARD_TABLE,
		})
	}

	listCompletedNames() {
		return this.manager.listCompletedEncounters().map(e => e.sceneName)
	}

	listAvailableEncounters() {
		return Campaign.listAvailableEncounters(this.listCompletedNames())
	}
}

const BabblebotC = new Game()

Object.assign(globalThis, {
	Babblebot: BabblebotC,
})

declare global {
	const Babblebot: typeof BabblebotC
}
