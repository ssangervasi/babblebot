import { parseDialogueNode, DialogueNode } from '../src/dialogue'

import * as Data from './data'

const featureReactions = 'agree_bad listen_good'
const promptedMs = 1
const promptNode = {
	featureReactions,
	promptedMs,
} as const

describe('parseDialogueNode', () => {
	it('if there is no step retruns 0', () => {
		let result = parseDialogueNode({
			...promptNode,
			title: 'good',
		})
		result = parseDialogueNode({
			...promptNode,
			title: 'good_shit',
		})
		expect(result.step).toEqual(0)
	})

	it('parses int steps', () => {
		let result = parseDialogueNode({
			...promptNode,
			title: 'good_1',
		})
		expect(result.step).toEqual(1)
		result = parseDialogueNode({
			...promptNode,
			title: 'good_9',
		})
		expect(result.step).toEqual(9)
		result = parseDialogueNode({
			...promptNode,
			title: 'good_117',
		})
		expect(result.step).toEqual(117)
	})

	it('parses string steps', () => {
		let result = parseDialogueNode({
			...promptNode,
			title: 'good_end',
		})
		expect(result.step).toEqual('end')
		result = parseDialogueNode({
			...promptNode,
			title: 'good_start',
		})
		expect(result.step).toEqual('start')
		result = parseDialogueNode({
			...promptNode,
			title: 'transition',
		})
		expect(result.step).toEqual('transition')
		result = parseDialogueNode({
			...promptNode,
			title: 'good_transition',
		})
		expect(result.step).toEqual('transition')
	})

	it('returns neutral if there is no quality', () => {
		let result = parseDialogueNode({
			...promptNode,
			title: 'shuggoo',
		})
		expect(result.quality).toEqual('neutral')
		result = parseDialogueNode({
			...promptNode,
			title: 'daphne_1',
		})
		expect(result.quality).toEqual('neutral')
	})

	it('parses qualities', () => {
		const result = parseDialogueNode({
			...promptNode,
			title: 'good_1',
		})
		expect(result.quality).toEqual('good')
	})
})
