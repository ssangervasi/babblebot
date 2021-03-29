import Lodash from 'lodash'

import * as CardScores from './cardScores'

export const Babblebot = {
	CardScores,
	Lodash
}

Object.assign(global, {
	Babblebot,
})
