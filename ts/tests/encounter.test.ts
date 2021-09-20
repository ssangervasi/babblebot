import { Encounter } from '../src/encounter'

import * as Data from './data'

const mockEncounter = () => {
	const e = new Encounter({
		session: {
			sceneName: 'L_some_encounter',
			startedAt: 100,
			completedAt: 110,
		},
		scoreTable: Data.scoreTable,
		cardTable: Data.cardTable,
	})
	// TODO: have a way of loading the dealer state from the start.
	e.dealer.nameToCollection.set('deck', Data.mockDeck())
	e.dealer.nameToCollection.set('hand', Data.mockHand())
	return e
}

let enc = mockEncounter()
const featureReactions = 'agree_bad listen_good'
enc.prompt({ featureReactions, promptedMs: 1 })
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
	it('creates the first card play log', () => {
		enc.prompt({ featureReactions, promptedMs: 1 })
		enc.tick(5_000)
		enc.playCard(card.uuid)

		expect(enc.log).toEqual([
			{
				type: 'PLAY_CARD',
				payload: {
					cardFeatures: card.card.features,
					featureReactions,
					moodBefore: 1,
					moodAfter: 11,
					score: 10,
				},
			},
		])
	})
})

describe('confidence', () => {
	it('starts at 1', () => {
		expect(enc.confidence).toEqual(1)
	})

	it('decreases with ticks', () => {
		enc.prompt({ featureReactions, promptedMs: 0 })

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
		enc.prompt({ featureReactions, promptedMs: 0 })

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

		enc.prompt({ featureReactions, promptedMs: 1 })
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
		enc.prompt({ featureReactions, promptedMs: 1 })
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

describe('moodQuality', () => {
	it('starts neutral', () => {
		expect(enc.moodQuality).toEqual('neutral')
	})

	it('playing a card can increase it', () => {
		const featureReactions = 'agree_good listen'
		enc.prompt({ featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.moodQuality).toEqual('good')
	})

	it('playing a card can decrease it', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const featureReactions = 'disagree_bad'
		enc.prompt({ featureReactions, promptedMs: 1 })
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
		enc.prompt({ featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.lastPlayQuality).toEqual('good')
	})

	it('low score play is neutral', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const featureReactions = 'disagree_good'
		enc.prompt({ featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.lastPlayQuality).toEqual('neutral')
	})

	it('very negative score play is bad', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const featureReactions = 'disagree_bad'
		enc.prompt({ featureReactions, promptedMs: 1 })
		enc.playCard(card.uuid)

		expect(enc.lastPlayQuality).toEqual('bad')
	})
})
