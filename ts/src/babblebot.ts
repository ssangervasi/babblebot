import Lodash from 'lodash'

import * as CardScores from './cardScores'

const BabblebotC = {
	CardScores,
	Lodash
}


Object.assign(globalThis, {
	Babblebot: BabblebotC,
})

declare global {
	const Babblebot: typeof BabblebotC
}
