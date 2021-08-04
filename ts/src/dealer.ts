import Lodash from "lodash";
import { v4 as uuidv4 } from "uuid";

import { ScoreTable, calculateScore, CardRow } from "./cardScores";
import { Message, guard } from "./utils/guards";

export interface CardCollection {
	uuid: string;
	cards: CardInstance[];
}

export interface CardInstance {
	uuid: string;
	card: CardRow;
}

export const makeCollection = (cards = []): CardCollection => ({
	uuid: uuidv4(),
	cards: [],
});

export type NamedToCollection = Map<string, CardCollection>;

export class Dealer {
	nameToCollection: NamedToCollection = new Map();

	addCollection(name: string, collection?: CardCollection) {
		this.ensureNo(name);

		const collectionToAdd = collection ? collection : makeCollection();
		this.nameToCollection.set(name, collectionToAdd);
	}

	shuffle(name: string) {
		const collection = this.ensure(name);
		collection.cards = Lodash.shuffle(collection.cards);
	}

	move(options: { uuid: string; from: string; to: string }): number {
		const collectionFrom = this.ensure(options.from);
		const collectionTo = this.ensure(options.to);

		const i = Lodash.findIndex(
			collectionFrom.cards,
			(c) => c.uuid === options.uuid
		);
		if (i === -1) {
			throw new Error(
				`Card "${options.uuid}" does not exist in collection "${options.from}"`
			);
		}

		const [card] = collectionFrom.cards.splice(i, 1);
		return collectionTo.cards.push(card);
	}

	private ensure(name: string): CardCollection {
		if (!this.nameToCollection.has(name)) {
			throw new Error(`Cannot operate on missing collection "${name}"`);
		}

		return this.nameToCollection.get(name)!;
	}

	private ensureNo(name: string) {
		if (this.nameToCollection.has(name)) {
			throw new Error(`Already have collection named "${name}"`);
		}
	}
}
