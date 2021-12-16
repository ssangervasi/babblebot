
Each encounter directory matches the name of the external layout for that encounter.

Each encounter has this structure:
- `dialogue.json` - The dialogue tree for the encounter.
- `scoreOverrides.csv` - Scores that apply only to this encounter.
- `deck.csv` - If present, determines the exact deck that will be used for the encounter, in order, instead of using random cards.
- `character/` - Images used for character reaction state.
  - `Bad.png`
  - `Good.png`
  - `Neutral.png`
- `background.png` - Single background image. May turn into dir later?