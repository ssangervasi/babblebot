import { Guard, Payload } from 'narrow-minded'

export const DialogueNode = Guard.narrow({
	title: 'string',
	quality: 'string',
	step: 'number',
	featureReactions: 'string',
	promptedMs: 'number',
	tickedMs: 'number',
}).and((u): u is { quality: Quality } =>
	QUALITIES.includes((u as any).quality as Quality),
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

	const quality = parseQuality(title)
	const step = parseStep(title)

	return {
		...promptNode,
		title,
		quality,
		step,
		tickedMs: promptedMs,
	}
}

const parseQuality = (title: string): Quality => {
	const qualityStr = title.split('_')[0]!
	const quality = qualityStr as Quality
	if (!QUALITIES.includes(quality)) {
		console.warn('Dialogue title does not include a quality', title)
		return 'neutral'
	}
	return quality
}

const parseStep = (title: string): number => {
	const stepStr = title.split('_')[1]!
	const step = Number(stepStr)
	if (Number.isNaN(step)) {
		console.warn('Dialogue title does not include a step', title)
		return 1
	}
	return step
}

export const QUALITIES = ['good', 'neutral', 'bad'] as const
export type Quality = typeof QUALITIES[number]
