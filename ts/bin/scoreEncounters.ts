#!/usr/bin/env node
// import jsonStringify from 'json-stable-stringify'
import { rewrite } from 'gdevelop-refactor'
import { narrow } from 'narrow-minded'

import { absolutePath, listEncounterFiles, EncounterFileInfo } from './config'

import { parseTitle } from '../src/dialogue'

/**
 * Format each encountes dialogue.json so that it has exactly two links:
 * 	"next" = The same quality with step + 1
 * 	"transition" = To the transition node
 */
const main = () => {
	listEncounterFiles().forEach(dialogueInfo => {
		if (dialogueInfo.basename !== 'dialogue.json') {
			return
		}

		// if (dialogueInfo.encounterName !== 'Amy1') {
		// 	console.log(`Skipping ${dialogueInfo.name}`)
		// 	return
		// }

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
		const { step, quality } = parseTitle(node.title)

		if (typeof step !== 'number') {
			console.log(`  Node "${node.title}" is not a numbered step`)
			return
		}

		const nextTitle = `${quality}_${step + 1}`
		const nextLink = `[[next|${nextTitle}]]`

		const transitionLink = '[[transition|transition]]'

		const body = node.body
		const lines = body.split(/\n/)
		const noLinks = stripLinks(lines)

		const newLines = [...noLinks, nextLink, transitionLink]
		node.body = newLines.join('\n')

		if (node.body !== body) {
			console.log(
				`  Node "${node.title}" changed. (${lines.length} -> ${newLines.length} lines)`,
				// '\n--\n',
				// body,
				// '\n--\n',
				// node.body,
				// '\n--\n',
			)
		}
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

main()
