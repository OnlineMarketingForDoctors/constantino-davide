#!/usr/bin/env python3
"""Build inner pages from pages/*.html using shared blocks from site/index.html.

site/index.html is the source of truth for the header, mobile menu, credentials
strip, consultation form and footer. Each pages/<name>.html starts with a
comment of "key: value" lines, followed by the page's <main> content, which may
use {{credentials}} and {{consultation}} placeholders.

Usage: python3 scripts/build_pages.py
Writes site/<slug>/index.html for every page.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
HOME = (SITE / "index.html").read_text(encoding="utf-8")


def block(start_marker, end_marker):
    start = HOME.index(start_marker)
    end = HOME.index(end_marker, start) + len(end_marker)
    return HOME[start:end]


def for_subpage(html):
    """Point homepage-relative links and assets at the site root."""
    html = re.sub(r'(src|href)="assets/', r'\1="/assets/', html)
    html = re.sub(r'(srcset="|, )assets/', r'\1/assets/', html)
    # In-page anchors that only exist on the homepage
    html = re.sub(r'href="#(?!top"|main"|consultation")([\w-]+)"', r'href="/#\1"', html)
    return html


HEADER = for_subpage(block("  <!-- ============ HEADER", "  <main id=\"main\">").replace("  <main id=\"main\">", ""))
HEADER = HEADER.replace('<a class="header-logo" href="#top" aria-label="Dr Costantino Davide, back to top">',
                        '<a class="header-logo" href="/" aria-label="Dr Costantino Davide, home">')
CREDENTIALS = for_subpage(block("    <!-- ============ CREDENTIALS", "</section>"))
CONSULTATION = for_subpage(block("    <!-- ============ CONSULTATION FORM", "</section>"))
FOOTER = for_subpage(block("  <!-- ============ FOOTER", "</script>"))


def build(page):
    text = page.read_text(encoding="utf-8")
    meta_match = re.match(r"\s*<!--(.*?)-->\n", text, re.S)
    meta = dict(line.strip().split(": ", 1) for line in meta_match.group(1).strip().splitlines())
    body = text[meta_match.end():]
    body = body.replace("{{credentials}}", CREDENTIALS).replace("{{consultation}}", CONSULTATION)

    header = HEADER
    current = f'href="/{meta["nav"]}/"'
    header = header.replace(current, current + ' aria-current="page" class="is-current"', 1)
    # Mobile menu link gets aria-current only
    idx = header.index('id="mobile-menu"')
    head, tail = header[:idx], header[idx:]
    header = head + tail.replace(current, current + ' aria-current="page"', 1)

    html = f"""<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
  <title>{meta["title"]}</title>
  <meta name="description" content="{meta["description"]}">
  <meta name="theme-color" content="#1A3350">
  <link rel="icon" type="image/png" href="/assets/img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="preload" as="image" href="{meta["preload-desktop"]}" media="(min-width: 768px)">
  <link rel="preload" as="image" href="{meta["preload-mobile"]}" media="(max-width: 767px)">
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body id="top">
  <a class="skip-link" href="#main">Skip to content</a>

{header}
  <main id="main">
{body}  </main>

{FOOTER}
</body>
</html>
"""
    out = SITE / meta["slug"] / "index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print("built", out.relative_to(ROOT))


for page in sorted((ROOT / "pages").glob("*.html")):
    build(page)
