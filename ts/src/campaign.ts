import csvParse from "csv-parse/lib/sync";

export const HEADINGS = {
	SCENE_NAME: "Scene Name",
	PREREQ: "Prereq",
} as const;

export type Mapping = {
	[sceneName: string]: string[]
};

export type CsvRow = {
	[HEADINGS.SCENE_NAME]?: string,
	[HEADINGS.PREREQ]?: string,
};

const PARSE_OPTIONS = {
	cast: true,
	columns: true,
	skip_empty_lines: true,
};

export const parseCampaign = (raw: string): Mapping => {
	const parsed: CsvRow[] = csvParse(raw, PARSE_OPTIONS);

	const mapping: Mapping = {};
	parsed.forEach((csvRow) => {
		const {
			[HEADINGS.SCENE_NAME]: sceneName,
			[HEADINGS.PREREQ]: prereq,
		} = csvRow;

		if (
			!(sceneName && prereq)
		) {
			return;
		}

		const prereqs = mapping[sceneName] || [];
		mapping[sceneName] = prereqs;
		prereqs.push(prereq)
	});

	return mapping;
};
