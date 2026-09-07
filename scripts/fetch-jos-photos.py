"""Download attributed Commons photographs used by the landing page."""
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

photos = [
    ('Shere Hills Jos Plateau.jpg', 'shere-hills', 'Shere Hills'),
    ('Jos plateau.jpg', 'jos-city', 'Jos city, May 2025'),
    ('Market in Jos.jpg', 'terminus', 'Market in Jos, May 2025'),
    ('Jos Carnival 2.jpg', 'jos-carnival', 'Jos Carnival 2018'),
]
root = Path(__file__).resolve().parents[1]
dest = root / 'src/image/jos'
dest.mkdir(parents=True, exist_ok=True)
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'JosCity/1.0 (website image credits)'})
    return urllib.request.urlopen(req, timeout=45).read()

credits = []
for title, slug, label in photos:
    source = 'https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(title.replace(' ', '_'))
    page = fetch(source).decode('utf-8')
    original = html.unescape(re.search(r'class="fullImageLink"[^>]*>\s*<a href="([^"]+)"', page).group(1)).split('?')[0]
    thumb = original.replace('upload.wikimedia.org', 'thumb.wikimedia.org').replace('/commons/', '/commons/thumb/') + '/960px-' + original.rsplit('/', 1)[1]
    if not sys.argv[1:] or slug in sys.argv[1:]:
        data = fetch(thumb)
        (dest / (slug + '.jpg')).write_bytes(data)
        print(slug, len(data), flush=True)
    credits.append({'label': label, 'source': source, 'original': original, 'file': slug + '.jpg'})
(dest / 'sources.json').write_text(json.dumps(credits, indent=2), encoding='utf-8')
