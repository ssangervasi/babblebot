import Lodash from 'lodash'

import * as CardScores from './cardScores'
import * as UserData from './userData'
import * as Campaign from './campaign'
import * as Utils from './utils'
import { Encounter } from './encounter'

class Game {
	Game = Game
	UserData = UserData
	CardScores = CardScores
	Encounter = Encounter
	Lodash = Lodash
	Utils = Utils

	_manager: UserData.Manager | undefined
	_encounter: Encounter | undefined

	get manager(): UserData.Manager {
		if (!this._manager) {
			this._manager = new UserData.Manager()
		}
		return this._manager
	}

	get encounter(): Encounter {
		if (this._encounter) {
			return this._encounter
		}
		return Utils.Placeholder({} as Encounter, 'Babblebot.encounter')
	}

	load(userDataJSON: string) {
		this._manager = new UserData.Manager(UserData.createFromJSON(userDataJSON))
		this._manager.resumeGame()
		this._encounter = undefined
	}

	save(): string {
		if (this.encounter) {
			this.manager.pushEncounter(this.encounter.toUserData())
		}
		this.manager.saveGame()
		return JSON.stringify(this.manager.userData)
	}

	loadEncounter(sceneName: string): Encounter {
		const incompletes = this.manager.listIncompleteEncounters()
		const resumableSession = incompletes.find(e => e.sceneName === sceneName)
		if (resumableSession) {
			this._encounter = this.makeEncounter(resumableSession)
			return this.encounter
		}

		const newSession = this.manager.pushEncounter({
			sceneName: sceneName,
			startedAt: Date.now(),
		})
		this._encounter = this.makeEncounter(newSession)
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
			spec: Campaign.ENCOUNTER_SPEC_MAPPING[session.sceneName],
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
