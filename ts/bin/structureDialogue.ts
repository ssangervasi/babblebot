#!/usr/bin/env node
// import jsonStringify from 'json-stable-stringify'
import { rewrite } from 'gdevelop-refactor'
import { narrow } from 'narrow-minded'

import {
	listDialogueFiles,
	DialogueInfo,
	DIALOGUE_ASSET_RE,
} from './dialogueUtils'
import { absolutePath } from './config'

const main = () => {
	listDialogueFiles().forEach(dialogueInfo => {
		if (dialogueInfo.encounterName !== 'Amy1') {
			console.log(`Skipping ${dialogueInfo.name}`)
			return
		}
		rewrite(
			dialogueJson => {
				if (narrow([{ title: 'string', body: 'string' }], dialogueJson)) {
					structureDialogue(dialogueInfo, dialogueJson)
				}
			},
			{
				inPath: absolutePath(dialogueInfo.file),
				// readOnly: true,
				readOnly: false,
			},
		)
	})
}

const structureDialogue = (
	info: DialogueInfo,
	nodes: Array<{ title: string; body: string }>,
) => {
	console.log(`Encounter: ${info.encounterName} - Nodes: ${nodes.length}`)
	nodes.forEach(node => {
		const [branch, indexStr] = node.title.split('_')
		if (!(branch && indexStr)) {
			console.warn(`Invalid node: ${node.title}`)
			return
		}
		const index = parseInt(indexStr)
		const nextTitle = `${branch}_${index + 1}`
		const link = `[[next|${nextTitle}]]`
		if (!node.body.endsWith(nextTitle)) {
			const newBody = [node.body, '\n', link].join('\n')
			node.body = newBody
			// console.info('New body:', newBody)
		}
	})
}

// const matchLink = () => {
// 	const matches = /(?:\n)*(\[\[\w+\|\w+\]\])\s*(?:\n)*\s*$/.exec(node.body)
// 	if (!matches) {
// 		return
// 	}

// 	console.log(`Node matches: ${node.title} -> ${matches[1]}`)
// 	console.log(jsonStringify(matches, { space: 2 }))
// }

main()
