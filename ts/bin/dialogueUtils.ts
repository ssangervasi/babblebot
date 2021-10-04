import * as fs from 'fs'
import * as path from 'path'

import { compact } from 'lodash'

import { PATHS, windowsPath, posixPath } from './config'

export const DIALOGUE_ASSET_RE =
	/assets\\+encounters\\+(?<encounterName>\w+)\\+dialogue.json/

export interface DialogueInfo {
	name: string
	file: string
	encounterName: string
}

export const listDialogueFiles = (): DialogueInfo[] => {
	return compact(
		fs
			.readdirSync(PATHS.ENCOUNTERS)
			.map((encounterName): DialogueInfo | undefined => {
				const dialoguePath = path.join(
					PATHS.ENCOUNTERS,
					encounterName,
					'dialogue.json',
				)
				if (!fs.existsSync(dialoguePath)) {
					return undefined
				}
				return {
					name: windowsPath(dialoguePath),
					file: posixPath(dialoguePath),
					encounterName,
				}
			}),
	)
}
