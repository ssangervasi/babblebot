#!/usr/bin/env ts-node
import path from 'path'
import fs from 'fs'
import jsonStringify from 'json-stable-stringify'


type Rec<E> = E & {
	events?: Array<Rec<E>>
}

function* findEvents<E>(parents: Iterable<Rec<E>>, matcher: (event: Rec<E>) => boolean): Generator<Rec<E>> {
	for (const parent of parents) {
		if (matcher(parent)) {
			yield parent
		}
		if (parent.events) {
			for (const child of findEvents(parent.events, matcher)) {
				yield child
			}
		}
	}
}


const tsPath = path.resolve(__dirname, '..')
const deckingPath = path.resolve(tsPath, '../eventsFunctionsExtensions/decking.json')
const babblebotJsPath = path.resolve(tsPath, 'dist/babblebot.js')

const deckingJson = fs.readFileSync(deckingPath)
const deckingData: {
	eventsFunctions: Array<{
		name: string,
		events: Array<Rec<{
			type: string
			inlineCode?: string
		}>>
	}>
} = JSON.parse(deckingJson.toString())

const f = deckingData?.eventsFunctions.find((eFunc) =>
	eFunc.name === 'importCardScoresJs'
)

if (f?.events) {
	console.log('Events')
	const events = findEvents(f.events, (event) => {
		return event.type === 'BuiltinCommonInstructions::JsCode' &&
			event.inlineCode !== undefined &&
			event.inlineCode.startsWith(`// inject`)
	})
	const [event] = events
	if (event) {
		event.inlineCode = `// inject\nvar exports = exports || {};\n` + fs.readFileSync(babblebotJsPath).toString()
	}
} else {
	console.log('No Events', {
		fcount: deckingData.eventsFunctions.length
	})
}

fs.writeFileSync(deckingPath, jsonStringify(deckingData, {space: 2}))