# -*- coding: utf-8 -*-
"""Push the per-model descriptions from products.json into the STATIC .html pages.

Why both trees need this
-----------------------
bongshaihousing.com is fronted by LiteSpeed, which serves a real file from the
document root before it ever proxies to the Node app. So for the 141 models that
have a static .html page, the <meta name="description"> Google indexes comes from
that FILE, not from products.json - the Node app's dynamic route is shadowed and
never runs. Only the 5 Cottage models with no static page (BH-CH-413..417) fall
through to Node. Fixing products.json alone therefore fixes staging and 5 pages;
this script fixes the other 141.

What it rewrites, per page:
  <meta content="..." name="description"/>
  <meta content="..." property="og:description"/>   (the WhatsApp/Facebook preview)
and the JSON-LD Product description where it currently describes the wrong
product entirely (all 12 Concrete Building pages claim to be shipping container
houses).

products.json is the single source - regenerate it first with
server/scripts/regenerate_product_descriptions.py, then run this. Idempotent.
    python server/scripts/sync_static_meta_descriptions.py [--write]
"""
import json, re, sys, io, os, html

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PRODUCTS = 'server/db/seeds/data/products.json'
# The one JSON-LD description that is factually about a different product line.
WRONG_LD = 'Modified shipping container house model by Bongshai Housing.'


def swap_attr(src, tag_re, new_desc):
    """Replace the content="..." of a matched meta tag, leaving attribute order alone."""
    esc = html.escape(new_desc, quote=True)
    hits = [0]

    def sub(m):
        tag = m.group(0)
        c = re.search(r'content="[^"]*"', tag)
        if not c:
            return tag
        hits[0] += 1
        # Spliced by index rather than re.sub, so a backslash or a group
        # reference inside the description text can never be reinterpreted.
        return tag[:c.start()] + 'content="' + esc + '"' + tag[c.end():]

    return tag_re.sub(sub, src), hits[0]


def main():
    write = '--write' in sys.argv
    data = json.load(open(PRODUCTS, encoding='utf-8'))
    re_desc = re.compile(r'<meta [^>]*name="description"[^>]*/?>')
    re_og = re.compile(r'<meta [^>]*property="og:description"[^>]*/?>')

    touched = skipped = no_file = ld_fixed = 0
    misses = []
    for p in data:
        path = p['slug']
        if not os.path.exists(path):
            no_file += 1
            continue
        # newline='' so existing CRLF/LF endings are preserved byte-for-byte.
        with io.open(path, encoding='utf-8', newline='') as fh:
            src = orig = fh.read()
        desc = p['description']

        src, n1 = swap_attr(src, re_desc, desc)
        src, n2 = swap_attr(src, re_og, desc)
        if not n1:
            misses.append(f'{path}: no name="description" tag')
        if not n2:
            misses.append(f'{path}: no og:description tag')

        # Only rewrite the JSON-LD description when it is about another product.
        if WRONG_LD in src:
            src = src.replace(WRONG_LD, desc.replace('"', '&quot;'))
            ld_fixed += 1

        if src != orig:
            touched += 1
            if write:
                with io.open(path, 'w', encoding='utf-8', newline='') as fh:
                    fh.write(src)
        else:
            skipped += 1

    print(f'{"WROTE" if write else "DRY RUN"}: {touched} static pages updated, '
          f'{skipped} already current, {no_file} models have no static page (served by Node)')
    print(f'  JSON-LD wrong-product descriptions corrected: {ld_fixed}')
    for m in misses:
        print(f'  WARN {m}')
    if misses:
        print(f'FAILED: {len(misses)} page(s) missing an expected meta tag.')
        sys.exit(1)


if __name__ == '__main__':
    main()
