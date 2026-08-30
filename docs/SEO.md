# Oceanis search and AI discovery

Production URL: `https://oceanis.codarox.com/`

## Files

- `index.html` — title, description, canonical URL, Open Graph, Twitter metadata and JSON-LD.
- `public/robots.txt` — crawler permissions and sitemap location.
- `public/sitemap.xml` — canonical production URL for search engines.
- `public/llms.txt` — concise machine-readable project description for systems that choose to use it.
- `public/site.webmanifest` — PWA name and description aligned with the public Oceanis identity.

## After production deployment

1. Confirm `https://oceanis.codarox.com/robots.txt` returns HTTP 200.
2. Confirm `https://oceanis.codarox.com/sitemap.xml` returns HTTP 200.
3. Confirm `https://oceanis.codarox.com/llms.txt` returns HTTP 200.
4. Add `https://oceanis.codarox.com/sitemap.xml` to the `codarox.com` Domain property in Google Search Console.
5. Inspect `https://oceanis.codarox.com/` in Search Console and request indexing once after a meaningful deployment.
6. Keep the canonical URL, sitemap URL, GitHub README live URL and Cloudflare route consistent.

`llms.txt` is supplemental discovery metadata. It does not guarantee ranking or inclusion in AI answers.
