import { DialogueNode, parseDialogueNode } from '../src/dialogue'
import { Encounter } from '../src/encounter'

import * as Data from './data'

const title = 'neutral_1'
const featureReactions = 'agree_bad listen_good'

const mockEncounter = () => {
	const e = new Encounter({
		session: {
			sceneName: 'L_some_encounter',
			startedAt: 100,
			completedAt: undefined,
			dealer: Data.mockDealer(),
		},
		scoreTable: Data.scoreTable,
		cardTable: Data.cardTable,
	})
	return e
}
let enc = mockEncounter()

const getCard = () =>
	enc.dealer.find({
		features: 'agree listen',
		from: 'hand',
	})!
let card = getCard()

beforeEach(() => {
	enc = mockEncounter()
	card = getCard()
})

describe('Action logging', () => {
	it('inserts the prompt log', () => {
		enc.prompt({ title, featureReactions, promptedMs: 1 })

		expect(enc.log.slice(-1)).toEqual([
			{
				type: 'PROMPT',
				at: 1,
				title,
				quality: 'neutral',
				step: 1,
				featureReactions,
				promptedMs: 1,
				tickedMs: 1,
			},
		])
	})

	it('inserts first card play log', () => {
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.tick(5_000)
		enc.playCard(card.uuid)

		expect(enc.log.slice(-1)).toEqual([
			{
				type: 'PLAY_CARD',
				at: 5_000,
				cardFeatures: card.card.features,
				featureReactions,
				moodBefore: 1,
				moodAfter: 11,
				score: 10,
			},
		])
	})
})

describe('confidence', () => {
	it('starts at 1', () => {
		expect(enc.confidence).toEqual(1)
	})

	it('decreases with ticks', () => {
		enc.prompt({ title, featureReactions, promptedMs: 0 })

		enc.tick(500)
		expect(enc.confidence).toEqual(0.75)

		enc.tick(1_000)
		expect(enc.confidence).toEqual(0.5)

		enc.tick(1_500)
		expect(enc.confidence).toEqual(0.25)

		enc.tick(2_000)
		expect(enc.confidence).toEqual(0)
	})

	it('bottoms out at 0', () => {
		enc.prompt({ title, featureReactions, promptedMs: 0 })

		enc.tick(10_000)
		expect(enc.confidence).toEqual(0)
	})
})

describe('playCard', () => {
	it('moves a card from hand to play', () => {
		const sizesBefore = {
			hand: enc.dealer.peek('hand', 'all').length,
			play: enc.dealer.peek('play', 'all').length,
		}

		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		const sizesAfter = {
			hand: enc.dealer.peek('hand', 'all').length,
			play: enc.dealer.peek('play', 'all').length,
		}

		expect(sizesBefore).toEqual({
			hand: 3,
			play: 0,
		})
		expect(sizesAfter).toEqual({
			hand: 2,
			play: 1,
		})
	})
})

describe('resolve', () => {
	it('moves cards from play to discard', () => {
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		const sizesBefore = {
			play: enc.dealer.peek('play', 'all').length,
			discard: enc.dealer.peek('discard', 'all').length,
		}

		enc.resolve()

		const sizesAfter = {
			play: enc.dealer.peek('play', 'all').length,
			discard: enc.dealer.peek('discard', 'all').length,
		}

		expect(sizesBefore).toEqual({
			play: 1,
			discard: 0,
		})
		expect(sizesAfter).toEqual({
			play: 0,
			discard: 1,
		})
	})
})

describe('transition', () => {
	const precusors = [
		'neutral_1',
		'neutral_2',
		'neutral_3',
		'good_1',
		'good_2',
		'neutral_4',
		'bad_1',
		'bad_2',
	]
	beforeEach(() => {
		// Disregarding the fact there are no card or transition entries.
		precusors.forEach((title, i) => {
			enc.log.push({
				type: 'PROMPT',
				at: i * 1000,
				...parseDialogueNode({ title, featureReactions, promptedMs: i * 1000 }),
			})
		})
	})

	it('reloads the last node matching the current quality', () => {
		enc.prompt({
			title: 'transition',
			featureReactions,
			promptedMs: precusors.length * 1000,
		})
		enc.transition()
		expect(enc.currentNode).toMatchObject({
			title: precusors.slice(-1)[0],
		})
	})
})

describe('moodQuality', () => {
	it('starts neutral', () => {
		expect(enc.moodQuality).toEqual('neutral')
	})

	it('playing a card can increase it', () => {
		const featureReactions = 'agree_good listen'
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.moodQuality).toEqual('good')
	})

	it('playing a card can decrease it', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const featureReactions = 'disagree_bad'
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.moodQuality).toEqual('bad')
	})
})

describe('lastPlayQuality', () => {
	it('starts neutral', () => {
		expect(enc.lastPlayQuality).toEqual('neutral')
	})

	it('high score play is good', () => {
		const featureReactions = 'agree_good listen'
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.lastPlayQuality).toEqual('good')
	})

	it('low score play is neutral', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const featureReactions = 'disagree_good'
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.lastPlayQuality).toEqual('neutral')
	})

	it('very negative score play is bad', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const featureReactions = 'disagree_bad'
		enc.prompt({ title, featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.lastPlayQuality).toEqual('bad')
	})
})

describe('peekNode', () => {
	it('returns neutral_0 if the log is empty', () => {
		const expected = DialogueNode.build({
			title: 'neutral_0',
			quality: 'neutral',
			step: 0,
			featureReactions: '',
			promptedMs: 0,
			tickedMs: 0,
		})
		expect(enc.peekNode()).toEqual(expected)
	})

	it('returns the current node if prompting is in progress', () => {
		enc.prompt({ title: 'good_1', featureReactions, promptedMs: 1 })

		const expected = DialogueNode.build({
			title: 'good_1',
			quality: 'good',
			step: 1,
			featureReactions,
			promptedMs: 1,
			tickedMs: 1,
		})
		expect(enc.peekNode()).toEqual(expected)
	})

	it('returns the most recent node after several plays', () => {
		enc.prompt({ title: 'good_1', featureReactions, promptedMs: 100 })
		// This highlihgts that it's fine to resolve without playing a card.
		// This might be a feature, or need to change.
		enc.resolve()
		enc.prompt({ title: 'good_2', featureReactions, promptedMs: 200 })
		enc.resolve()
		enc.prompt({ title: 'bad_1', featureReactions, promptedMs: 300 })
		enc.resolve()

		const expected = DialogueNode.build({
			title: 'bad_1',
			quality: 'bad',
			step: 1,
			featureReactions,
			promptedMs: 300,
			tickedMs: 300,
		})
		expect(enc.peekNode()).toEqual(expected)
	})
})
