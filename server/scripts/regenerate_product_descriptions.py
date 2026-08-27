# -*- coding: utf-8 -*-
"""Rewrite every product `description` in products.json from that product's OWN data.

Why this exists
---------------
`description` is not decorative - server/routes/products.js:286,289 feed it
straight into <meta name="description"> and og:description, so it is the text
Google and Facebook show for the page. It was written as per-CATEGORY
boilerplate: every Concrete Building said "3-5 bedroom, 750-1250 sq.ft,
Tk2,750/sq.ft" regardless of the model, so 134/146 pages advertised the wrong
bedroom count and the wrong area, and 116/146 quoted a rate the page never
charges.

Source of truth
---------------
`fixedPrice` + `totalFloorArea` came from the owner's own "Floor area.XLSX"
(commit f0ed4cb1); `pricePerSqft` is a leftover from the original site scrape
(commit 0ee2c920) and is a category constant, not a per-model rate. The product
page renders `fixedPrice`, so the description quotes the same package total the
visitor sees rather than a per-sq.ft rate that no longer matches anything.
The 37 models with no fixedPrice fall back to pricePerSqft x area, exactly as
server/routes/products.js:208 does, and are worded "From ..." because that
number is derived rather than quoted.

Room counts come from floorData. Two categories are deliberately described
WITHOUT room counts because their floorData is known-wrong (see NO_ROOM_CLAIMS).

Idempotent: re-running produces identical output. Run from the repo root:
    python server/scripts/regenerate_product_descriptions.py [--write]
"""
import json, re, sys, io, collections

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PATH = 'server/db/seeds/data/products.json'
TAKA = '৳'
MAX_LEN = 160  # Google truncates the meta description around here.

# Industrial Steel Sheds carry a 400 sq.ft *residential* plan (Bed room 1/2,
# Living room, Kitchen) and Worker Accommodation carries the exact same 1200
# sq.ft family-villa plan as Low-Cost Villa (Master bedroom, Family Living,
# Balcony, Portch). Describing either by its floorData would advertise
# bedrooms in an industrial shed and a private master suite in a labour
# dormitory, so these get area + price only until the real plans are supplied.
NO_ROOM_CLAIMS = {'Industrial Steel Sheds', 'Worker Accommodation'}


def format_taka(n):
    """Bangladeshi lakh grouping - must match server/lib/format.js formatTaka."""
    s = str(int(round(n)))
    last3, rest = s[-3:], s[:-3]
    if rest:
        rest = re.sub(r'\B(?=(\d{2})+(?!\d))', ',', rest)
        s = rest + ',' + last3
    return TAKA + s


def first_int(v):
    m = re.findall(r'\d+', str(v or ''))
    return int(m[0]) if m else None


# Only one catalog category is pluralized; spelled out rather than guessed at
# with a naive trailing-"s" strip, which would mangle a future "Premises" or
# "Terraces".
SINGULAR = {'Industrial Steel Sheds': 'Industrial Steel Shed'}


def one(cat):
    return SINGULAR.get(cat, cat)


def article(word):
    return 'an' if word[:1].upper() in 'AEIOU' else 'a'


def facts(p):
    fd = p.get('floorData') or {}
    key = next(iter(fd), None)
    tier = fd.get(key) or {}
    area = p.get('totalFloorArea') or (int(key) if key else None)
    price = p.get('fixedPrice')
    fixed = bool(price)
    if not fixed and p.get('pricePerSqft') and area:
        price = round(p['pricePerSqft'] * area)
    return {
        'area': area, 'price': price, 'fixed': fixed,
        'bed': first_int(tier.get('bed')), 'bath': first_int(tier.get('bath')),
    }


# Three opener shapes and three closer shapes, matching the variety the
# hand-written copy already had, so SEO fingerprints stay distinct per page.
def opener(kind, model, cat, f, plain):
    cat = one(cat)
    if plain:
        return f'{model} is a {f["area"]} sq.ft {cat} from Bongshai Housing.'
    # Attributive form ("2-bedroom", not "2 bedrooms") - it modifies "layout".
    rooms = f'{f["bed"]}-bedroom'
    if f['bath']:
        rooms += f', {f["bath"]}-bath'
    if kind == 'B':
        return f'{model}, {article(cat)} {cat} from Bongshai Housing, offers a {rooms} layout in {f["area"]} sq.ft.'
    if kind == 'C':
        return f'Engineered as {article(cat)} {cat}, {model} fits a {rooms} layout into {f["area"]} sq.ft.'
    return f'{model} is a {f["area"]} sq.ft {cat} with a {rooms} layout.'


def closer(kind, f):
    if f['price']:
        lead = 'Fixed package price ' if f['fixed'] else 'From '
        money = lead + format_taka(f['price'])
    else:
        money = 'Priced on request'
    if kind == '2':
        return f'{money}, steel-composite framing delivered to all 64 districts.'
    if kind == '3':
        return f"{money}, anti-rust galvanized steel built for Bangladesh's climate."
    return f'{money}, pre-engineered steel for fast, durable assembly nationwide.'


SHORT = {'1': ' pre-engineered steel, built fast nationwide.',
         '2': ' steel-composite framing, all 64 districts.',
         '3': " galvanized steel for Bangladesh's climate."}


def detect(desc):
    """Keep the variant this model already used, so the diff stays 1:1."""
    d = desc or ''
    o = 'C' if d.startswith('Engineered as a') else ('B' if 'from Bongshai Housing, offers' in d else 'A')
    if 'Steel-composite framing at' in d:
        c = '2'
    elif 'anti-rust galvanized steel' in d:
        c = '3'
    else:
        c = '1'
    return o, c


def build(p):
    f = facts(p)
    plain = p['categoryName'] in NO_ROOM_CLAIMS or not f['bed']
    o, c = detect(p.get('description'))
    head = opener(o, p['modelNumber'], p['categoryName'], f, plain)
    out = head + ' ' + closer(c, f)
    if len(out) > MAX_LEN:  # fall back to the terse closer rather than get cut off
        if f['price']:
            lead = 'Fixed package price ' if f['fixed'] else 'From '
            out = head + ' ' + lead + format_taka(f['price']) + ';' + SHORT[c]
        if len(out) > MAX_LEN:
            out = head + (' Fixed package price ' if f['fixed'] else ' From ') + format_taka(f['price']) + '.'
    return out, f


def main():
    write = '--write' in sys.argv
    data = json.load(open(PATH, encoding='utf-8'))
    changed = 0
    lengths = []
    per_cat = collections.defaultdict(int)
    for p in data:
        new, f = build(p)
        lengths.append(len(new))
        if new != p.get('description'):
            changed += 1
            per_cat[p['categoryName']] += 1
        if write:
            p['description'] = new
    if write:
        # newline='' keeps LF endings (Windows text mode would rewrite the entire
        # file to CRLF), and indent=2 with no trailing newline reproduces the
        # file's existing byte layout - so the diff is only the description lines.
        with open(PATH, 'w', encoding='utf-8', newline='') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        print('WROTE', PATH)
    print(f'{changed}/{len(data)} descriptions rewritten')
    print(f'length: min={min(lengths)} max={max(lengths)} over{MAX_LEN}={sum(1 for x in lengths if x > MAX_LEN)}')
    for c in sorted(per_cat):
        print(f'   {c:24s} {per_cat[c]}')
    print('\n=== samples ===')
    seen = set()
    for p in data:
        if p['categoryName'] in seen:
            continue
        seen.add(p['categoryName'])
        new, f = build(p)
        print(f'  [{len(new):3d}] {new}')


if __name__ == '__main__':
    main()
