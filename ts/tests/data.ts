import { CardCollection } from '../src/dealer'
import { ScoreTable, CardTable } from '../src/cardScores'
import { StoredUserData } from '../src/userData'

export const scoreTableCsv = `
Feature,Reaction,Feature_Reaction,Score
agree,good,agree_good,30
agree,bad,agree_bad,-10
agree,,agree,0
,,,
disagree,bad,disagree_bad,-40
disagree,,disagree,-10
,,,
listen,good,listen_good,20
listen,,listen,2
,,,
butt,good,butt_good,1000.1
`

export const scoreTable: ScoreTable = [
	{ feature: 'agree', reaction: 'good', score: 30 },
	{ feature: 'agree', reaction: 'bad', score: -10 },
	{ feature: 'agree', reaction: '', score: 0 },
	{ feature: 'disagree', reaction: 'bad', score: -40 },
	{ feature: 'disagree', reaction: '', score: -10 },
	{ feature: 'listen', reaction: 'good', score: 20 },
	{ feature: 'listen', reaction: '', score: 2 },
	{ feature: 'butt', reaction: 'good', score: 1000.1 },
]

export const cardTableCsv = `
Id,Type,Text,Extra Features,Features
card-1,type,I condemn,,disagree butt
card-2,type,"A, B, C",,agree listen
card-3,type,What's that?,,listen
`

export const cardTable: CardTable = [
	{
		id: 'card-1',
		text: 'I condemn',
		features: 'disagree butt',
	},
	{
		id: 'card-2',
		text: 'A, B, C',
		features: 'agree listen',
	},
	{
		id: 'card-3',
		text: "What's that?",
		features: 'listen',
	},
]

export const deck: CardCollection = {
	uuid: 'deck-0-0-0-01',
	cards: [
		{ uuid: 'card-0-0-0-00', card: cardTable[0]! },

		{ uuid: 'card-0-0-0-10', card: cardTable[1]! },
		{ uuid: 'card-0-0-0-11', card: cardTable[1]! },

		{ uuid: 'card-0-0-0-20', card: cardTable[2]! },
		{ uuid: 'card-0-0-0-21', card: cardTable[2]! },
		{ uuid: 'card-0-0-0-23', card: cardTable[2]! },
	],
}

export const hand: CardCollection = {
	uuid: 'hand-0-0-0-01',
	cards: [
		{ uuid: 'card-1-0-0-00', card: cardTable[0]! },
		{ uuid: 'card-2-0-0-10', card: cardTable[1]! },
		{ uuid: 'card-3-0-0-20', card: cardTable[2]! },
	],
}

export const campaignCsv = `
Scene Name,Prereq
Amy1,
Amy2,Amy1
Lally1,Amy1
Lally2,Lally1
Castille1,Amy1
Castille1,Lally1
`

export const campaignMapping = {
	Amy1: [],
	Amy2: ['Amy1'],
	Castille1: ['Amy1', 'Lally1'],
	Lally1: ['Amy1'],
	Lally2: ['Lally1'],
}

export const mockUserData = (): StoredUserData => ({
	options: {
		bindHints: 'off',
		effectsVolume: 100,
		fullscreen: 'on',
		musicVolume: 100,
	},
	savedGames: [
		{
			createdAt: 1631485277612,
			encounters: [
				{
					sceneName: 'Amy1',
					startedAt: 1631485277612,
				},
			],
			updatedAt: 1631485277612,
		},
	],
})
