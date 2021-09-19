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
	// TODO: calculate using confidence
	e.confidence = 0
	// TODO: have a way of loading the dealer state from the start.
	e.dealer.nameToCollection.set('deck', Data.mockDeck())
	e.dealer.nameToCollection.set('hand', Data.mockHand())
	return e
}

let enc = mockEncounter()
const nodeFeatureReactions = 'agree_bad listen_good'
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
		enc.playCard(card.uuid, nodeFeatureReactions)

		expect(enc.log).toEqual([
			{
				type: 'PLAY_CARD',
				payload: {
					cardFeatures: card.card.features,
					nodeFeatureReactions,
					moodBefore: 1,
					moodAfter: 11,
					score: 10,
				},
			},
		])
	})
})

describe('playCard', () => {
	it('moves a card from hand to play', () => {
		const sizesBefore = {
			hand: enc.dealer.peek('hand', 'all').length,
			play: enc.dealer.peek('play', 'all').length,
		}

		enc.playCard(card.uuid, nodeFeatureReactions)

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
		enc.playCard(card.uuid, nodeFeatureReactions)

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
		const nodeFeatureReactions = 'agree_good listen'
		enc.playCard(card.uuid, nodeFeatureReactions)

		expect(enc.moodQuality).toEqual('good')
	})

	it('playing a card can decrese it', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const nodeFeatureReactions = 'disagree_bad'
		enc.playCard(card.uuid, nodeFeatureReactions)

		expect(enc.moodQuality).toEqual('bad')
	})
})

describe('lastPlayQuality', () => {
	it('starts neutral', () => {
		expect(enc.lastPlayQuality).toEqual('neutral')
	})

	it('high score play is good', () => {
		const nodeFeatureReactions = 'agree_good listen'
		enc.playCard(card.uuid, nodeFeatureReactions)

		expect(enc.lastPlayQuality).toEqual('good')
	})

	it('low score play is neutral', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const nodeFeatureReactions = 'disagree_good'
		enc.playCard(card.uuid, nodeFeatureReactions)

		expect(enc.lastPlayQuality).toEqual('neutral')
	})

	it('very negative score play is bad', () => {
		const card = enc.dealer.find({ features: 'disagree butt', from: 'hand' })!
		const nodeFeatureReactions = 'disagree_bad'
		enc.playCard(card.uuid, nodeFeatureReactions)

		expect(enc.lastPlayQuality).toEqual('bad')
	})
})
