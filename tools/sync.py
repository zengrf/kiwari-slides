from pathlib import Path
import json,yaml
p=Path(__file__).resolve().parents[1];s=(p/'deck.yaml').read_text();yaml.safe_load(s);(p/'deck-data.js').write_text('window.DECK_SOURCE = '+json.dumps(s)+';\n');print('Updated deck-data.js')
