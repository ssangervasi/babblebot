const warn = global.console.warn
jest.spyOn(global.console, 'warn').mockImplementation((...args) => {
	if (/createFromJSON/.test(args[0])) {
		return
	}
	warn(...args)
})
