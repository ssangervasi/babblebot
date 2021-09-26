import Lodash, { Collection } from 'lodash'

import { makeUuid, UUID } from './utils'
import { CardRow } from './cardScores'
import * as UserData from './userData'

export interface CardCollection {
	uuid: UUID
	cards: CardInstance[]
}

export interface CardInstance {
	uuid: UUID
	card: CardRow
}

export const makeCardInstance = (card: CardRow): CardInstance => ({
	uuid: makeUuid(),
	card,
})

export const makeCollection = (cards: CardInstance[] = []): CardCollection => ({
	uuid: makeUuid(),
	cards,
})

export const HAND = 'hand'
export const DECK = 'deck'
export const PLAY = 'play'
export const DISCARD = 'discard'
export type CollectionName =
	| typeof HAND
	| typeof DECK
	| typeof PLAY
	| typeof DISCARD

export type NameToCollection = Map<CollectionName, CardCollection>

export class Dealer {
	nameToCollection: NameToCollection = new Map()

	static fromUserData(
		userDataDealer: UserData.Dealer,
		idToCard: Map<string, CardRow>,
	): Dealer {
		const dealer = new Dealer()
		;([DECK, HAND, PLAY, DISCARD] as const).forEach(name => {
			const { uuid, cards } = userDataDealer[name]
			const collection = cards.map(card => ({
				uuid: card.uuid,
				card: idToCard.get(card.id)!,
			}))
			dealer.addCollection(name, { uuid, cards: collection })
		})
		return dealer
	}

	toUserData(): UserData.Dealer {
		const userDataDealer: Partial<UserData.Dealer> = {}
		;([DECK, HAND, PLAY, DISCARD] as const).forEach(name => {
			const { uuid, cards } = this.nameToCollection.get(name)!
			const collection = cards.map(card => ({
				uuid: card.uuid,
				id: card.card.id,
			}))
			userDataDealer[name] = { uuid, cards: collection }
		})
		return userDataDealer as UserData.Dealer
	}

	addCollection(name: CollectionName, collection?: CardCollection) {
		this.ensureNo(name)

		const collectionToAdd = collection ? collection : makeCollection()
		this.nameToCollection.set(name, collectionToAdd)
	}

	shuffle(name: CollectionName) {
		const collection = this.ensure(name)
		collection.cards = Lodash.shuffle(collection.cards)
	}

	move(options: {
		uuid: UUID
		from: CollectionName
		to: CollectionName
	}): number {
		const collectionFrom = this.ensure(options.from)
		const collectionTo = this.ensure(options.to)
		const [card, i] = this._find(collectionFrom, options.uuid)
		collectionFrom.cards.splice(i, 1)
		return collectionTo.cards.push(card!)
	}

	peek(name: CollectionName, n: number | 'all' = 1) {
		const { cards } = this.ensure(name)
		let start = 0
		let end = 1
		if (n === 'all') {
			end = cards.length + 1
		} else if (n < 0) {
			start = n
			end = cards.length + 1
		} else {
			end = n
		}
		return cards.slice(start, end)
	}

	find(
		options:
			| { uuid: UUID; from: CollectionName }
			| {
					features: string
					from: CollectionName
			  },
	): CardInstance | undefined {
		const collection = this.ensure(options.from)
		if ('uuid' in options) {
			return collection.cards.find(c => c.uuid === options.uuid)
		}
		if ('features' in options) {
			return collection.cards.find(c => c.card.features === options.features)
		}
		return undefined
	}

	private _find(
		collection: CardCollection,
		uuid: UUID,
	): [CardInstance, number] {
		const i = Lodash.findIndex(collection.cards, c => c.uuid === uuid)
		if (i === -1) {
			throw new Error(
				`Card "${uuid}" does not exist in collection "${collection.uuid}"`,
			)
		}
		return [collection.cards[i]!, i]
	}

	private ensure(name: CollectionName): CardCollection {
		if (!this.nameToCollection.has(name)) {
			throw new Error(`Cannot operate on missing collection "${name}"`)
		}

		return this.nameToCollection.get(name)!
	}

	private ensureNo(name: CollectionName) {
		if (this.nameToCollection.has(name)) {
			throw new Error(`Already have collection named "${name}"`)
		}
	}
}
