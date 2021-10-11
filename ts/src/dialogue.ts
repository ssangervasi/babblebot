import { Guard, Payload, some } from 'narrow-minded'

export const QUALITIES = ['good', 'neutral', 'bad'] as const
export type Quality = typeof QUALITIES[number]
export type Step = number | 'start' | 'end' | 'transition'

export const DialogueNode = Guard.narrow({
	title: 'string',
	quality: 'string',
	step: some('number', 'string'),
	featureReactions: 'string',
	promptedMs: 'number',
	tickedMs: 'number',
}).and(
	(u: any): u is { quality: Quality; step: Step } =>
		u.quality === parseQuality(u.quality) && u.step === parseStep(u.step),
)
export type DialogueNodePayload = Payload<typeof DialogueNode>

export const PromptNode = Guard.narrow({
	title: 'string',
	featureReactions: 'string',
	promptedMs: 'number',
})
export type PromptNodePayload = Payload<typeof PromptNode>

export const parseDialogueNode = (
	promptNode: PromptNodePayload,
): DialogueNodePayload => {
	const { title, promptedMs } = promptNode

	const parts = title.split('_')

	const quality = parseQuality(parts[0])
	const step = parseStep(parts[1] || parts[0])

	return {
		...promptNode,
		title,
		quality,
		step,
		tickedMs: promptedMs,
	}
}

const parseQuality = (maybeQuality?: string): Quality => {
	const quality = maybeQuality as Quality
	if (!QUALITIES.includes(quality)) {
		return 'neutral'
	}
	return quality
}

const parseStep = (maybeStep?: string | number): Step => {
	if (['start', 'end', 'transition'].includes(maybeStep as string)) {
		return maybeStep as Step
	}
	const step = Number(maybeStep)
	if (Number.isNaN(step)) {
		return 0
	}
	return step
}
