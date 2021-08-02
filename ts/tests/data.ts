import { ScoreTable } from "../src/cardScores";

export const raw = `
Feature,Reaction,Feature_Reaction,Score
agree,good,agree_good,30
agree,bad,agree_bad,-10
agree,,agree,0
,,,
disagree,bad,disagree_bad,-40
disagree,,disagree,-10
,,,
listen,good,listen_good,20
listen,,listen,2
,,,
butt,good,butt_good,1000.1
`;

export const exampleTable: ScoreTable = [
	{ feature: "agree", reaction: "good", score: 30 },
	{ feature: "agree", reaction: "bad", score: -10 },
	{ feature: "agree", reaction: "", score: 0 },
	{ feature: "disagree", reaction: "bad", score: -40 },
	{ feature: "disagree", reaction: "", score: -10 },
	{ feature: "listen", reaction: "good", score: 20 },
	{ feature: "listen", reaction: "", score: 2 },
	{ feature: "butt", reaction: "good", score: 1000.1 },
];
