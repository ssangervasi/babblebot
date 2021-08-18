import Lodash from "lodash";

import * as CardScores from "./cardScores";
import * as UserData from "./userData";
import { Encounter } from "./encounter";

const BabblebotC = {
	UserData,
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
