import Lodash, { Collection } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { CardRow } from './cardScores'

export interface CardCollection {
	uuid: string
	cards: CardInstance[]
}

export interface CardInstance {
	uuid: string
	card: CardRow
}

export const makeCardInstance = (card: CardRow): CardInstance => ({
	uuid: uuidv4(),
	card,
})

export const makeCollection = (cards: CardInstance[] = []): CardCollection => ({
	uuid: uuidv4(),
	cards,
})

export const HAND = 'hand'
export const DECK = 'deck'
export const PLAY = 'play'
export const DISCARD = 'discard'

export type NamedToCollection = Map<string, CardCollection>

export class Dealer {
	nameToCollection: NamedToCollection = new Map()

	addCollection(name: string, collection?: CardCollection) {
		this.ensureNo(name)

		const collectionToAdd = collection ? collection : makeCollection()
		this.nameToCollection.set(name, collectionToAdd)
	}

	shuffle(name: string) {
		const collection = this.ensure(name)
		collection.cards = Lodash.shuffle(collection.cards)
	}

	move(options: { uuid: string; from: string; to: string }): number {
		const collectionFrom = this.ensure(options.from)
		const collectionTo = this.ensure(options.to)
		const [card, i] = this._find(collectionFrom, options.uuid)
		collectionFrom.cards.splice(i, 1)
		return collectionTo.cards.push(card!)
	}

	peek(name: string, n = 1) {
		const collection = this.ensure(name)
		return collection.cards.slice(n)
	}

	find(options: { uuid: string; from: string }): CardInstance {
		const [card, _] = this._find(this.ensure(options.from), options.uuid)
		return card
	}

	private _find(
		collection: CardCollection,
		uuid: string,
	): [CardInstance, number] {
		const i = Lodash.findIndex(collection.cards, c => c.uuid === uuid)
		if (i === -1) {
			throw new Error(
				`Card "${uuid}" does not exist in collection "${collection.uuid}"`,
			)
		}
		return [collection.cards[i]!, i]
	}

	private ensure(name: string): CardCollection {
		if (!this.nameToCollection.has(name)) {
			throw new Error(`Cannot operate on missing collection "${name}"`)
		}

		return this.nameToCollection.get(name)!
	}

	private ensureNo(name: string) {
		if (this.nameToCollection.has(name)) {
			throw new Error(`Already have collection named "${name}"`)
		}
	}
}
