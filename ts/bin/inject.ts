import {
	injectExt,
	GdProject,
	refactor,
	rewrite,
	isGdProject,
	GdResource,
	isGdExtension,
	GdExtension,
	findEvents,
	GdEvent,
} from 'gdevelop-refactor'

import { PATHS } from './config'

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

			rewrite(
				gdExtension => {
					if (!isGdExtension(gdExtension)) {
						console.warn('Not an extension')
						return
					}

					gdExtension.eventsFunctions.forEach(eventsFunc => {
						const finder = findEvents(eventsFunc.events, event => {
							const dialogueType = 'DialogueTree::LoadDialogueFromJsonFile'
							type EActions = {
								actions?: Array<{
									type: {
										inverted: boolean
										value: string
									}
									// parameters: ['', 'assets\\encounters\\Amy1\\dialogue.json'],
									parameters: string[]
									subInstructions: unknown[]
								}>
							}
							const eventWithActions = event as GdEvent & EActions
							return (eventWithActions.actions || []).some(
								a => a.type.value === dialogueType,
							)
						})
						const found = [...finder]
						if (found.length > 0) {
							console.log(
								`${eventsFunc.name}: ${found.length} events with dialogue`,
							)
						}
					})
				},
				{
					inPath: PATHS.BABBLEBOT,
					readOnly: true,
				},
			)
		},
		{
			inPath: PATHS.GAME,
			readOnly: true,
		},
	)
}

main()
