# -*- coding: utf-8 -*-
"""Gate: every claim in every product `description` must trace to that product's data.

`description` is rendered as <meta name="description"> and og:description
(server/routes/products.js:286,289), so a wrong number here is a wrong number in
Google's search result and in the Facebook/WhatsApp link preview. It was
category boilerplate before commit-time regeneration, which is how 134 pages
came to advertise the wrong bedroom count and 116 the wrong price.

This re-derives every fact independently of
server/scripts/regenerate_product_descriptions.py (it does not import it) and
fails non-zero on any mismatch, so a clean run is real evidence and CI can gate
on it. Run from the repo root:
    python server/scripts/verify_product_descriptions.py
"""
import json, re, sys, io, collections

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PATH = 'server/db/seeds/data/products.json'
MAX_LEN = 160
NO_ROOM_CLAIMS = {'Industrial Steel Sheds', 'Worker Accommodation'}


def taka(n):
    s = str(int(round(n)))
    last3, rest = s[-3:], s[:-3]
    return '৳' + (re.sub(r'\B(?=(\d{2})+(?!\d))', ',', rest) + ',' + last3 if rest else last3)


def main():
    data = json.load(open(PATH, encoding='utf-8'))
    errors = 0
    for p in data:
        m, desc = p['modelNumber'], p.get('description') or ''
        tier = (p.get('floorData') or {}).get(next(iter(p.get('floorData') or {}), None)) or {}
        area = p.get('totalFloorArea')
        fixed = p.get('fixedPrice')
        # Mirrors the fallback in server/routes/products.js:208 - the number the
        # page actually shows when there is no fixed package price.
        price = fixed or (round(p['pricePerSqft'] * area) if p.get('pricePerSqft') and area else None)

        if m not in desc:
            errors += 1
            print(f'  {m}: model number missing from description')

        quoted_area = {int(x) for x in re.findall(r'([\d,]+) sq\.ft', desc.replace(',', ''))}
        if quoted_area and quoted_area != {area}:
            errors += 1
            print(f'  {m}: description says {sorted(quoted_area)} sq.ft, data says {area}')

        # rstrip(',') because the lakh grouping runs straight into the sentence comma.
        money = [x.rstrip(',') for x in re.findall(r'৳[\d,]+', desc)]
        if price and money != [taka(price)]:
            errors += 1
            print(f'  {m}: description quotes {money}, page renders {taka(price)}')
        if not price and money:
            errors += 1
            print(f'  {m}: quotes {money} but the product has no price data')
        # "Fixed package price" is a promise; only make it where fixedPrice exists.
        if fixed and 'Fixed package price' not in desc:
            errors += 1
            print(f'  {m}: has fixedPrice but does not label it "Fixed package price"')
        if not fixed and 'Fixed package price' in desc:
            errors += 1
            print(f'  {m}: claims "Fixed package price" but fixedPrice is unset')

        bed = re.findall(r'(\d+)-bedroom', desc)
        bath = re.findall(r'(\d+)-bath', desc)
        real_bed = re.findall(r'\d+', str(tier.get('bed') or ''))
        real_bath = re.findall(r'\d+', str(tier.get('bath') or ''))
        if bed and (not real_bed or bed[0] != real_bed[0]):
            errors += 1
            print(f'  {m}: description says {bed[0]} bedroom, floorData says {tier.get("bed")!r}')
        if bath and (not real_bath or bath[0] != real_bath[0]):
            errors += 1
            print(f'  {m}: description says {bath[0]} bath, floorData says {tier.get("bath")!r}')
        if p['categoryName'] in NO_ROOM_CLAIMS and (bed or bath):
            errors += 1
            print(f'  {m}: {p["categoryName"]} floorData is known-wrong - must not claim room counts')

        if len(desc) > MAX_LEN:
            errors += 1
            print(f'  {m}: {len(desc)} chars, over the {MAX_LEN}-char search-snippet limit')

    dupes = {k: v for k, v in collections.Counter(x.get('description') for x in data).items() if v > 1}
    for text, n in dupes.items():
        errors += 1
        print(f'  duplicate description reused by {n} models: {text[:90]}...')

    if errors:
        print(f'\nFAILED: {errors} description error(s) across {len(data)} products.')
        sys.exit(1)
    print(f'PASSED: {len(data)} products, every area/price/room claim traced to source data.')


if __name__ == '__main__':
    main()
