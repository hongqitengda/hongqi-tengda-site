# HQTD Chinese + English Website

Deploy the contents of this package to the document root of https://www.hongqitengda.com/.

- Chinese home: `/`
- English home: `/en/`
- Chinese project search: `/catalog.html`
- English project search: `/en/catalog.html`

Keep the root folders and `en/` together. Both editions share the original images and reference PDFs at the root. The English edition has its own pages, scripts, project data, and Word forms. Only Simplified Chinese and English are provided.

English service names, product names, scientific acronyms (including DFT, CFD, SEM, and XRD), and project IDs can be searched in both catalogs. English queries can contain multiple words in any order. Language links lead to the equivalent page and retain search keywords.

The package includes reciprocal hreflang links, self-referencing canonical URLs, a bilingual sitemap, an English sitemap, crawler configuration, and English machine-readable site information. Customer portal pages are excluded from public indexing.

After deployment, submit `https://www.hongqitengda.com/sitemap.xml` in the existing search-engine webmaster accounts. Indexing and ranking depend on each search engine; this package does not submit to those accounts.

Existing CloudBase service endpoints and account integration are retained. No production orders or messages were submitted during verification. Backend-generated documents and content supplied by customers or staff remain controlled by the existing backend.

For a local preview, run `python3 -m http.server 8000` in this directory and open `http://localhost:8000/` or `http://localhost:8000/en/`. Use an HTTP server rather than opening HTML files directly.

SEO implementation reference: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
