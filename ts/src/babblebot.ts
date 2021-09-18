import Lodash from 'lodash'

import * as CardScores from './cardScores'
import * as UserData from './userData'
import * as Campaign from './campaign'
import { Encounter } from './encounter'
import { Session } from 'inspector'

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

	startEncounter() {
		const incompletes = this.manager.listIncompleteEncounters()
		let session = incompletes[0]
		if (!session) {
			const available = Campaign.listAvailableEncounters(
				this.listCompletedNames(),
			)
			const sceneName = available[0]
			if (!sceneName) {
				throw new Error('Cannot start encounter when none are available.')
			}
			session = this.manager.pushEncounter({
				sceneName,
			})
		}

		this.encounter = this.makeEncounter(session)
		return this.encounter
	}

	private makeEncounter(session: UserData.EncounterSession) {
		return new Encounter({
			session,
			scoreTable: CardScores.SCORE_TABLE,
			cardTable: CardScores.CARD_TABLE,
		})
	}

	save(): string {
		this.manager.saveGame()
		return JSON.stringify(this.manager.userData)
	}

	listCompletedNames() {
		return this.manager.listCompletedEncounters().map(e => e.sceneName)
	}
}

const BabblebotC = new Game()

Object.assign(globalThis, {
	Babblebot: BabblebotC,
})

declare global {
	const Babblebot: typeof BabblebotC
}
