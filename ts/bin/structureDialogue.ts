#!/usr/bin/env node
// import jsonStringify from 'json-stable-stringify'
import { rewrite } from 'gdevelop-refactor'
import { narrow } from 'narrow-minded'

import { absolutePath, listEncounterFiles, EncounterFileInfo } from './config'

const main = () => {
	listEncounterFiles().forEach(dialogueInfo => {
		if (dialogueInfo.basename !== 'dialogue.json') {
			return
		}

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
	info: EncounterFileInfo,
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
		const nextLink = `[[next|${nextTitle}]]`

		const transitionLink = '[[transition|transition]]'

		const lines = node.body.split(/\n/)
		const noLinks = stripLinks(lines)
		const newLines = [...noLinks, nextLink, transitionLink]
		node.body = newLines.join('\n')
	})
}

const stripLinks = (lines: string[]) => {
	return lines.filter(line => {
		return !linkMatches(line)
	})
}

const linkMatches = (
	line: string,
):
	| {
			text: string
			link: string
	  }
	| undefined => {
	const matches = /\[\[(\w+)\|(\w+)\]\]/.exec(line)
	const [text, link] = matches || []
	if (!(text && link)) {
		return undefined
	}
	return {
		text,
		link,
	}
}

// 	console.log(`Node matches: ${node.title} -> ${matches[1]}`)
// 	console.log(jsonStringify(matches, { space: 2 }))
// }

main()
