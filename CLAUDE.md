# Project rules

## This site must never be indexed by search engines

Keep every layer below in place. Do not remove or weaken any of them unless the owner explicitly asks to go live in search.

1. **HTTP header** — `vercel.json` sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` on every path. If the site moves off Vercel, re-create the same header on the new host before deploying (e.g. Netlify `_headers`, Apache `.htaccess`, Nginx `add_header`).
2. **Meta tag on every HTML page** — each page's `<head>` must include:
   ```html
   <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
   ```
   If a framework is used, put it in the shared root layout so no page can miss it.
3. **Do not block crawling in `robots.txt`** — crawlers must be able to fetch pages to see the noindex. A `Disallow: /` would hide the noindex and can let URLs get indexed from external links. Do not add a `robots.txt` that disallows paths, and do not add a sitemap.
4. Do not add canonical links, sitemaps, or structured data that point search engines at this site.

## Site structure

The website lives in `site/` and `vercel.json` sets `"outputDirectory": "site"`, so only that folder is served. Source material (brand questionnaire, raw photos, Instagram exports) stays at the repo root and must never be copied into `site/`.

## Inner pages

`site/index.html` is the source of truth for the header, mobile menu, credentials strip, consultation form and footer. Inner pages are written as fragments in `pages/<name>.html` (a metadata comment, then the `<main>` content) and built with `python3 scripts/build_pages.py`, which writes `site/<slug>/index.html` with the shared blocks and the noindex meta tag. After changing the homepage header, footer or form, rerun the script.
