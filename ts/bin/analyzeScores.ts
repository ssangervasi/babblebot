#!/usr/bin/env node
import fs from 'fs'

import csvStringify from 'csv-stringify/lib/sync'

import {
	listDialogueFiles,
	EncounterFileInfo,
	DialogueGuard,
	DialogueArray,
	PATHS,
	absolutePath,
} from './config'
import {
	calculateScore,
	SCORE_TABLE,
	CARD_TABLE,
	//
	ScoreTable,
	CardTable,
	CardRow,
} from '../src/cardScores'

const main = () => {
	const results: Calc[] = []

	listDialogueFiles().forEach(dialogueInfo => {
		const dialogueJson = JSON.parse(
			fs.readFileSync(absolutePath(dialogueInfo.file)).toString(),
		)
		if (!DialogueGuard.satisfied(dialogueJson)) {
			console.warn(`Invalid dialogue: ${dialogueInfo.name}`)
		}

		const result = scoreEncounter(dialogueInfo, dialogueJson)
		results.push(result)
	})

	fs.writeFileSync(PATHS.ANALYSIS_CSV, csvStringify(results, { header: true }))
}

type Calc = {
	name: string
	min: number
	max: number
	average: number
	minCard: string
	maxCard: string
	minNode: string
	maxNode: string
}

const scoreEncounter = (
	info: EncounterFileInfo,
	nodes: DialogueArray,
): Calc => {
	console.log(`Encounter: ${info.encounterName} - Nodes: ${nodes.length}`)

	const result = {
		name: info.encounterName,
		min: 1000,
		max: -1000,
		count: 0,
		sum: 0,
		average: 0,
		minCard: '',
		maxCard: '',
		minNode: '',
		maxNode: '',
	}

	nodes.forEach(node => {
		CARD_TABLE.forEach(card => {
			const score = calculateScore(card.features, node.tags, SCORE_TABLE)

			if (score < result.min) {
				result.min = score
				result.minCard = card.id
				result.minNode = node.title
			}

			if (result.max < score) {
				result.max = score
				result.maxCard = card.id
				result.maxNode = node.title
			}

			result.count += 1
			result.sum += score
		})
	})

	result.average = Math.round(result.sum / result.count)

	return result
}

main()
