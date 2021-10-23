const warn = global.console.warn
const warnIgnores = [/createFromJSON/, /placeholder/]

/*global jest*/
jest.spyOn(global.console, 'warn').mockImplementation((...args) => {
	if (warnIgnores.some(p => p.test(args[0]))) {
		return
	}
	warn(...args)
})
