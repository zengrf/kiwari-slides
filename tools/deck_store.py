"""Save the seminar deck, with revision checks and private backups."""
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import tempfile
import threading

import yaml

DECK_ROOT = Path(__file__).resolve().parents[1]
BACKUP_ROOT = DECK_ROOT / '.local/backups'
LOCK = threading.Lock()
TEXT_FIELDS = ('title', 'body', 'statement', 'statement_label', 'code', 'code_title',
               'code_result', 'code_file', 'central_message', 'transition', 'notes',
               'kicker', 'nav_title', 'source', 'source_url', 'visual', 'layout', 'class')


class DeckDumper(yaml.SafeDumper):
    pass


def validate_design(design):
    if design is None:
        return
    if not isinstance(design, dict):
        raise ValueError('Slide design must be an object.')
    limits = {'titleSize': (28, 100), 'bodySize': (14, 48), 'headingSize': (18, 60),
              'lineHeight': (1, 2), 'paragraphGap': (0, 60), 'columnGap': (0, 120),
              'paddingX': (24, 140), 'paddingY': (20, 120), 'contentOffset': (-80, 100),
              'columnRatio': (20, 80)}
    enums = {'preset': ('text', 'columns-2', 'columns-3'), 'align': ('left', 'center', 'right')}
    image_limits = {'width': (40, 1152), 'height': (40, 600), 'x': (0, 100), 'y': (0, 100)}

    def number(value, bounds):
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and bounds[0] <= value <= bounds[1]

    for key, value in design.items():
        if key in limits:
            if not number(value, limits[key]):
                raise ValueError('Invalid slide design: ' + key)
        elif key in enums:
            if value not in enums[key]:
                raise ValueError('Invalid slide design: ' + key)
        elif key == 'images':
            if not isinstance(value, dict):
                raise ValueError('Invalid image settings.')
            for image in value.values():
                if not isinstance(image, dict):
                    raise ValueError('Invalid image settings.')
                for name, setting in image.items():
                    if name == 'fit':
                        if setting not in ('cover', 'contain'):
                            raise ValueError('Invalid image fit.')
                    elif name not in image_limits or not number(setting, image_limits[name]):
                        raise ValueError('Invalid image setting: ' + name)
        else:
            raise ValueError('Unknown slide design setting: ' + key)


DeckDumper.add_representer(str, lambda dumper, value: dumper.represent_scalar(
    'tag:yaml.org,2002:str', value, style='|' if '\n' in value else None))


def validate(deck):
    if not isinstance(deck, dict) or not isinstance(deck.get('meta'), dict):
        raise ValueError('The deck needs metadata.')
    slides = deck.get('slides')
    if not isinstance(slides, list) or not 1 <= len(slides) <= 1000:
        raise ValueError('The deck must contain between 1 and 1,000 slides.')
    seen = set()
    for slide in slides:
        if not isinstance(slide, dict):
            raise ValueError('Each slide must be an object.')
        key = slide.get('id')
        if not isinstance(key, str) or not key or key in seen:
            raise ValueError('Each slide needs a unique text id.')
        seen.add(key)
        if not slide.get('title'):
            raise ValueError('Each slide needs a title.')
        validate_design(slide.get('design'))
        for field in TEXT_FIELDS:
            if slide.get(field) is not None and not isinstance(slide[field], str):
                raise ValueError('Slide fields must contain text: ' + field)
        minutes = slide.get('minutes', 0)
        if (not isinstance(minutes, (int, float)) or isinstance(minutes, bool)
                or not math.isfinite(minutes) or minutes < 0):
            raise ValueError('Slide timing must be a nonnegative number.')
    # Reject non-JSON data (and NaN) even when called outside the HTTP endpoint.
    json.dumps(deck, allow_nan=False)
    return deck


def revision(source):
    return hashlib.sha256(source).hexdigest()


def read():
    with LOCK:
        source = (DECK_ROOT / 'deck.yaml').read_bytes()
        return {'deck': validate(yaml.safe_load(source)), 'revision': revision(source)}


def atomic_write(path, data):
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name + '-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temporary, 0o644)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def save(data):
    if not isinstance(data, dict) or set(data) != {'deck', 'revision'}:
        return 400, {'error': 'Send the deck and its saved revision.'}
    try:
        deck = validate(data['deck'])
        source = ('# Edit Markdown and LaTeX inside the block fields below.\n' +
                  yaml.dump(deck, Dumper=DeckDumper, sort_keys=False,
                            allow_unicode=True, width=110)).encode()
    except (ValueError, TypeError, RecursionError):
        return 400, {'error': 'The slide data is invalid. Your browser draft is still available.'}
    fallback = ('// Generated from deck.yaml; run python tools/sync.py after editing.\n'
                'window.DECK_SOURCE = ' + json.dumps(source.decode(), ensure_ascii=False) + ';\n').encode()
    with LOCK:
        yaml_path, js_path = DECK_ROOT / 'deck.yaml', DECK_ROOT / 'deck-data.js'
        previous, previous_js = yaml_path.read_bytes(), js_path.read_bytes()
        if data['revision'] != revision(previous):
            return 409, {'error': 'The server deck has changed. Export your draft to keep a copy, '
                                'then load the server version before saving.'}
        if deck == yaml.safe_load(previous):
            return 200, {'ok': True, 'revision': revision(previous), 'unchanged': True}
        BACKUP_ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
        backup = Path(tempfile.mkdtemp(
            prefix=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S-'), dir=BACKUP_ROOT))
        (backup / 'deck.yaml').write_bytes(previous)
        (backup / 'deck-data.js').write_bytes(previous_js)
        atomic_write(js_path, fallback)
        try:
            atomic_write(yaml_path, source)
        except OSError:
            atomic_write(js_path, previous_js)
            raise
        return 200, {'ok': True, 'revision': revision(source)}
