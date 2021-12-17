import { compact } from 'lodash'

import {
	findEvents,
	GdEvent,
	GdExtension,
	GdResource,
	injectExt,
	isGdExtension,
	isGdProject,
	rewrite,
} from 'gdevelop-refactor'

import {
	PATHS,
	posixPath,
	listDialogueFiles,
	EncounterFileInfo,
	DIALOGUE_ASSET_RE,
	// absolutePath
} from './config'
import { mapDiff } from '../src/utils'

const main = () => {
	const command = process.argv.slice(-1)[0]
	if (command === 'code') {
		injectCode()
	} else if (command === 'assets') {
		injectAssets()
	} else {
		console.error(`Nothing to do for ${command}`)
	}
}

const injectCode = () => {
	injectExt(PATHS.BABBLEBOT)
}

const EVENT_TYPES = {
	STANDARD: 'BuiltinCommonInstructions::Standard',
	DIALOGUE: 'DialogueTree::LoadDialogueFromJsonFile',
} as const
const FUNC_NAMES = {
	DIALOGUE: 'loadEncounterDialogue',
} as const

const injectAssets = () => {
	rewrite(
		gdProject => {
			if (!isGdProject(gdProject)) {
				console.warn('Not a project')
				return
			}

			const resourceMap = new Map<string, GdResource>()
			gdProject.resources.resources.forEach(resource => {
				resourceMap.set(resource.name, resource)
			})

			console.log(`Project has ${resourceMap.size} resources`)

			const dialogueResources = new Map<string, GdResource>()
			rewrite(
				gdExtension => {
					if (!isGdExtension(gdExtension)) {
						console.warn('Not an extension')
						return
					}

					injectDialogue(gdExtension, dialogueResources)
				},
				{
					inPath: PATHS.BABBLEBOT,
					readOnly: false,
					backup: false,
				},
			)

			console.log('Total dialogue resources:', dialogueResources.size)
			const dialogueResourcesNeeded = mapDiff(dialogueResources, resourceMap)
			console.log('Resources needed:', dialogueResourcesNeeded.size)

			dialogueResourcesNeeded.forEach(resource => {
				gdProject.resources.resources.push(resource)
			})
		},
		{
			inPath: PATHS.GAME,
			readOnly: false,
			backup: false,
		},
	)
}

const injectDialogue = (
	gdExtension: GdExtension,
	resourcesNeeded: Map<string, GdResource>,
) => {
	const dialogueFunc = gdExtension.eventsFunctions.find(
		({ name }) => name === FUNC_NAMES.DIALOGUE,
	)
	if (!dialogueFunc) {
		console.warn('No dialogue func')
		return
	}

	const dialogueEvents = [
		...findEvents(dialogueFunc.events, event => {
			return (event.actions || []).some(
				a => a.type.value === EVENT_TYPES.DIALOGUE,
			)
		}),
	]

	console.log(`${dialogueEvents.length} events with dialogue`)
	const dialogueInfos = dialogueEvents.flatMap(event =>
		(event.actions || []).flatMap(action =>
			compact(
				action.parameters.map((name): EncounterFileInfo | undefined => {
					const match = DIALOGUE_ASSET_RE.exec(name)
					if (match == null || !match.groups?.encounterName) {
						if (name.length) {
							console.warn(`Dialogue name does not match: ${name}`)
						}
						return undefined
					}

					return {
						name,
						file: posixPath(name),
						encounterName: match.groups.encounterName,
						basename: 'dialogue.json',
					}
				}),
			),
		),
	)
	console.log(`${dialogueInfos.length} dialogues referenced`)
	dialogueInfos.forEach(info => {
		resourcesNeeded.set(info.name, makeDialogueResource(info))
	})

	const dialogueFiles = listDialogueFiles()
	console.log(`${dialogueFiles.length} dialogue files`)

	const namesAlreadyHandled = new Set(dialogueInfos.map(({ name }) => name))
	const filesNeedingEvents = dialogueFiles.filter(
		({ name }) => !namesAlreadyHandled.has(name),
	)
	console.log(`${filesNeedingEvents.length} dialogue files need an events`)
	filesNeedingEvents.forEach(dialogueInfo => {
		const event = makeDialogueEvent(dialogueInfo)
		dialogueFunc.events.push(event)
	})
	return
}

const makeDialogueResource = (opts: EncounterFileInfo): GdResource => {
	return {
		disablePreload: false,
		kind: 'json',
		metadata: '',
		userAdded: true,
		...opts,
	}
}

const makeDialogueEvent = (opts: EncounterFileInfo): GdEvent => {
	return {
		disabled: false,
		type: EVENT_TYPES.STANDARD,
		conditions: [
			{
				type: {
					inverted: false,
					value: 'StrEqual',
				},
				parameters: [
					'GetArgumentAsString("Name")',
					'=',
					`"${opts.encounterName}"`,
				],
				subInstructions: [],
			},
		],
		actions: [
			{
				type: {
					inverted: false,
					value: EVENT_TYPES.DIALOGUE,
				},
				parameters: ['', opts.name],
				subInstructions: [],
			},
		],
		events: [],
	}
}

main()
