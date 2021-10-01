// import fs from 'fs'
// import jsonStringify from 'json-stable-stringify'

import { injectExt, GdProject, refactor } from 'gdevelop-refactor'

import { PATHS } from './config'

const main = () => {
	// injectExt(PATHS.BABBLEBOT)

	const res = refactor(
		gdProject => {
			gdProject.resources.resources.forEach(resource => {
				console.log(resource.name, resource.file)
			})
		},
		{
			inPath: PATHS.GAME,
			readOnly: true,
		},
	)
	console.log(res)
}

main()
