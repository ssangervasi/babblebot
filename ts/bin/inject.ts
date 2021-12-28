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
	EncounterFileInfo,
	listEncounterFiles,
	matchEncounterAsset,
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

const FUNC_BASENAMES = [
	['loadEncounterDialogue', 'dialogue.json'] as const,
	['loadEncounterCutsceneDialogue', 'cutscene.json'] as const,
] as const

const injectAssets = () => {
	rewrite(
		gdProject => {
			if (!isGdProject(gdProject)) {
				console.warn('Not a project')
				return
			}

			rewrite(
				gdExtension => {
					if (!isGdExtension(gdExtension)) {
						console.warn('Not an extension')
						return
					}

					injectDialogue(gdExtension)
				},
				{
					inPath: PATHS.BABBLEBOT,
					// readOnly: true,
					readOnly: false,
					backup: false,
				},
			)

			console.log('-- Resources --')

			const resourceMap = new Map<string, GdResource>()
			gdProject.resources.resources.forEach(resource => {
				resourceMap.set(resource.name, resource)
			})
			console.log(`Project resources: ${resourceMap.size}`)

			const dialogueResources = new Map<string, GdResource>()
			listEncounterFiles().forEach(info => {
				if (!['dialogue.json', 'cutscene.json'].includes(info.basename)) {
					return
				}
				dialogueResources.set(info.name, makeDialogueResource(info))
			})
			console.log('Total dialogue resources:', dialogueResources.size)

			const dialogueResourcesNeeded = mapDiff(dialogueResources, resourceMap)
			console.log('Resources needed:', dialogueResourcesNeeded.size)

			dialogueResourcesNeeded.forEach(resource => {
				gdProject.resources.resources.push(resource)
			})
		},
		{
			inPath: PATHS.GAME,
			// readOnly: true,
			readOnly: false,
			backup: false,
		},
	)
}

const injectDialogue = (gdExtension: GdExtension) => {
	FUNC_BASENAMES.forEach(([funcName, basename]) => {
		console.log(`-- ${funcName} => ${basename} --`)

		const dialogueFunc = gdExtension.eventsFunctions.find(
			({ name }) => name === funcName,
		)
		if (!dialogueFunc) {
			console.warn(`No dialogue func for '${funcName}'`)
			return
		}

		const dialogueEvents = [
			...findEvents(dialogueFunc.events, event => {
				return (event.actions || []).some(
					a => a.type.value === EVENT_TYPES.DIALOGUE,
				)
			}),
		]

		console.log(`Events with dialogue: ${dialogueEvents.length} `)
		const dialogueInfos: EncounterFileInfo[] = []
		dialogueEvents.forEach(event =>
			(event.actions || []).forEach(action =>
				action.parameters.forEach(assetName => {
					const matchedInfo = matchEncounterAsset(assetName)
					if (!matchedInfo) {
						return
					}

					console.warn(`Matched asset: ${JSON.stringify(assetName)}`)
					if (matchedInfo.basename !== basename) {
						console.warn(
							`Wrong basename: '${matchedInfo.basename}' != '${basename}'`,
						)
						return
					}

					dialogueInfos.push(matchedInfo)
				}),
			),
		)
		console.log(`Dialogues already referenced: ${dialogueInfos.length} `)

		const basenameFiles = listEncounterFiles().filter(
			efi => efi.basename === basename,
		)
		console.log(`Files with basename: ${basenameFiles.length}`)

		const namesAlreadyHandled = new Set(dialogueInfos.map(({ name }) => name))
		const filesNeedingEvents = basenameFiles.filter(
			({ name }) => !namesAlreadyHandled.has(name),
		)
		console.log(`Files needing an event: ${filesNeedingEvents.length}`)
		filesNeedingEvents.forEach(dialogueInfo => {
			const event = makeDialogueEvent(dialogueInfo)
			dialogueFunc.events.push(event)
		})
	})
}

const makeDialogueResource = (opts: EncounterFileInfo): GdResource => {
	return {
		disablePreload: false,
		kind: 'json',
		metadata: '',
		userAdded: true,
		file: opts.file,
		name: opts.name,
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
