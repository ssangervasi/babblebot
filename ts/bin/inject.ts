import path from 'path'
import fs from 'fs'
import jsonStringify from 'json-stable-stringify'

import { PATHS } from './config'

const main = () => {
	const extPath = PATHS.DECKING
	const extJson = fs.readFileSync(extPath)
	const extData: {
		eventsFunctions: Array<{
			name: string
			events: Array<Rec<GdEvent>>
		}>
	} | null = JSON.parse(extJson.toString())

	if (!extData) {
		console.warn('No ext data')
		return
	}

	console.info(`Searching ${extData.eventsFunctions.length} functions`)
	extData.eventsFunctions.forEach(eventsFunc => {
		const events = findEvents(eventsFunc.events, event => {
			return (
				event.type === 'BuiltinCommonInstructions::JsCode' &&
				event.inlineCode !== undefined
			)
		})

		for (const event of events) {
			injectEvent(event)
		}
	})

	console.info(`Writing file ${extPath}`)
	fs.writeFileSync(extPath, jsonStringify(extData, { space: 2 }))
}

type GdEvent = {
	type: string
	inlineCode?: string
}

type Rec<E> = E & {
	events?: Array<Rec<E>>
}

function* findEvents<E>(
	parents: Iterable<Rec<E>>,
	matcher: (event: Rec<E>) => boolean,
): Generator<Rec<E>> {
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

const injectEvent = (event: GdEvent) => {
	const { inlineCode } = event
	if (!inlineCode) {
		return
	}

	const matches = inlineCode.match(/^\/\/\s*inject (["'])([^"']*)\1\s*$/m)
	if (!matches) {
		return
	}

	const pathMatch = matches[2]
	const jsPath = path.resolve(PATHS.ROOT, pathMatch)

	if (!fs.existsSync(jsPath)) {
		console.warn(
			`Cannot inject "${pathMatch}" - path does not exist: ${jsPath}`,
		)
		return
	}

	const jsCode = fs.readFileSync(jsPath).toString()
	console.info(
		`Injecting "${pathMatch}" - found: ${jsPath} (${jsCode.length} characters)`,
	)

	event.inlineCode = `// inject "${pathMatch}"\n\n` + jsCode
}

main()
