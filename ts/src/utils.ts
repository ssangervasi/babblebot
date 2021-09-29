import { v4 as uuidv4 } from 'uuid'

export type UUID = `${string}-${string}-${string}-${string}-${string}`
export const makeUuid = (): UUID => uuidv4() as UUID

const DTF = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'medium',
})

export const formatDate = (ms: number): string => {
	return DTF.format(new Date(ms))
}
