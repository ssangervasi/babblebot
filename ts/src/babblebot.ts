import Lodash from "lodash";

import * as CardScores from "./cardScores";
import { Encounter } from "./encounter";

const BabblebotC = {
	CardScores,
	Encounter,
	Lodash,
};

Object.assign(globalThis, {
	Babblebot: BabblebotC,
});

declare global {
	const Babblebot: typeof BabblebotC;
}
