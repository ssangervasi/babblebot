import { v4 as uuidv4 } from 'uuid'

import { narrow } from 'narrow-minded'

export type UUID = `${string}-${string}-${string}-${string}-${string}`
export const makeUuid = (): UUID => uuidv4() as UUID

const DTF = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'medium',
})

export const formatDate = (ms: number): string => {
	return DTF.format(new Date(ms))
}

export const mapDiff = <K, VL, VR>(left: Map<K, VL>, right: Map<K, VR>) => {
	const result = new Map<K, VL>()
	left.forEach((v, k) => {
		if (!right.has(k)) {
			result.set(k, v)
		}
	})
	return result
}

export const isType = <T extends string>(t: T) => {
	return (u: unknown): u is { type: T } =>
		narrow({ type: 'string' }, u) && u.type === t
}

export const splitList = (str: string): string[] =>
	str.split(/(\s+|\s*,\s*)/).filter(s => s.length > 0)

export const Placeholder = <T extends object>(
	defaults: T,
	nickname = 'object',
): T => {
	return new Proxy(defaults, {
		get: function (_target: T, property, _receiver: T) {
			if (property in defaults) {
				// console.warn(
				// 	`Returning default value for property "${property.toString()}" in ${nickname} placeholder.`,
				// )
				return defaults[property as keyof T]
			}

			console.warn(
				`Property "${property.toString()}" does not exist in ${nickname} placeholder.`,
			)
			return undefined
		},
	})
}
