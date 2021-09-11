import Lodash from 'lodash'
import { Dealer } from '../src/dealer'

import * as Data from './data'

let dealer = new Dealer()
beforeEach(() => {
	dealer = new Dealer()
})

describe('setup', () => {
	it('works', () => {
		expect(dealer).toBeInstanceOf(Dealer)
	})

	describe('addCollection', () => {
		it('adds an empty', () => {
			dealer.addCollection('hand')
			expect(dealer.nameToCollection.get('hand')).toMatchObject({
				uuid: expect.stringMatching(/\w+/),
				cards: [],
			})
		})

		it('associates an existing collection', () => {
			dealer.addCollection('deck', Data.deck)
			expect(dealer.nameToCollection.get('deck')).toMatchObject(Data.deck)
		})
	})
})

describe('operations', () => {
	beforeEach(() => {
		dealer.addCollection('deck', Data.deck)
		dealer.addCollection('hand')
		dealer.addCollection('play')
		dealer.addCollection('discard')
	})

	describe('shuffle', () => {
		it('works', () => {
			const uuidsBefore = dealer.nameToCollection
				.get('deck')!
				.cards.map((c) => c.uuid)
			dealer.shuffle('deck')
			const uuidsAfter = dealer.nameToCollection
				.get('deck')!
				.cards.map((c) => c.uuid)
			expect(uuidsAfter).not.toEqual(uuidsBefore)
			expect(Lodash.sortBy(uuidsAfter)).toEqual(Lodash.sortBy(uuidsBefore))
		})
	})

	describe('move', () => {
		it('works', () => {
			const deck = dealer.nameToCollection.get('deck')!
			const hand = dealer.nameToCollection.get('hand')!
			const uuid = deck.cards[0].uuid

			const lengthsBefore = [deck.cards.length, hand.cards.length]
			dealer.move({
				uuid,
				from: 'deck',
				to: 'hand',
			})
			expect([deck.cards.length, hand.cards.length]).not.toEqual(lengthsBefore)
			expect(deck.cards[0].uuid).not.toEqual(uuid)
			expect(hand.cards[0].uuid).toEqual(uuid)
		})

		it("throws for a card not in the 'from' collection", () => {
			const deck = dealer.nameToCollection.get('deck')!
			const hand = dealer.nameToCollection.get('hand')!
			const uuid = deck.cards[0].uuid

			// Move it successfully first.
			dealer.move({
				uuid,
				from: 'deck',
				to: 'hand',
			})

			const lengthsBefore = [deck.cards.length, hand.cards.length]
			expect(() => {
				dealer.move({
					uuid,
					from: 'deck',
					to: 'hand',
				})
			}).toThrowError()
			expect([deck.cards.length, hand.cards.length]).toEqual(lengthsBefore)
		})
	})
})
