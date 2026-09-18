"""Run via browser-harness against a loopback-only QA checkout; hosted auth stays unchanged."""
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse

BASE = os.environ.get('ATLAS_QA_URL', 'http://127.0.0.1:3477').rstrip('/')
assert urlparse(BASE).hostname in {'127.0.0.1', 'localhost'}, 'Local QA only'
ROOT = Path(os.environ['ATLAS_QA_ROOT'])
OUT = ROOT / 'docs/qa/company-logos'
OUT.mkdir(parents=True, exist_ok=True)
provenance = json.loads((ROOT / 'data/logos/restored-sources.json').read_text())
restored = {entry['slug'] for entry in provenance['logos']}
results = []

def measure_images():
    return js("""(() => [...document.querySelectorAll('img[src^="/logos/"]')].map(x => ({
        src:x.getAttribute('src'), loaded:x.complete && x.naturalWidth>0,
        label:x.closest('[aria-label]')?.getAttribute('aria-label') || x.parentElement.textContent,
        rect:x.getBoundingClientRect().toJSON()
    })))()""")

for width, height in [(1440, 1000), (390, 844), (320, 740)]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=1, mobile=False)
    for route in ['milestones', 'funding']:
        goto_url(f'{BASE}/{route}')
        wait_for_load()
        if route == 'milestones':
            rect = js("""(() => {const h=[...document.querySelectorAll('h2')].find(x=>x.textContent==='Milestone timeline');h.scrollIntoView({behavior:'instant',block:'start'});return h.getBoundingClientRect().toJSON()})()""")
            assert -1 <= rect['top'] < height, rect
        else:
            rect = js("""(() => {const el=document.querySelector('img[src="/logos/neuralink.png"]');el.scrollIntoView({behavior:'instant',block:'center'});return el.getBoundingClientRect().toJSON()})()""")
            assert -1 <= rect['top'] < height, rect
        capture_screenshot(path=str(OUT / f'after-{route}-{width}.png'))
        imgs = measure_images()
        visible = [x for x in imgs if x['rect']['bottom'] > 0 and x['rect']['top'] < height and x['rect']['right'] > 0 and x['rect']['left'] < width]
        # Screenshot capture is also a rendering boundary; retry pending image loads only.
        for attempt in range(20):
            if visible and all(x['loaded'] for x in visible): break
            time.sleep(.1)
            imgs = measure_images()
            visible = [x for x in imgs if x['rect']['bottom'] > 0 and x['rect']['top'] < height and x['rect']['right'] > 0 and x['rect']['left'] < width]
        assert visible and all(x['loaded'] for x in visible), visible
        bounds = js('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
        assert bounds['width'] == width and bounds['scroll'] <= width, bounds
        capture_screenshot(path=str(OUT / f'after-{route}-{width}.png'))
        results.append({'route':route,'width':width,'visibleLogos':len(visible),'allVisibleLoaded':True})

# Decode every restored served image, including those not in the current year/filter.
served = js("""(async () => {const slugs=RESTORED;return await Promise.all(slugs.map(async slug=>{
 const image=new Image();image.src='/logos/'+slug+'.png';try {await image.decode();return {slug,ok:image.naturalWidth>0};}catch{return {slug,ok:false};}
}));})()""".replace('RESTORED',json.dumps(sorted(restored))))
assert len(served) == len(restored) and all(x['ok'] for x in served), served
(OUT / 'browser-results.json').write_text(json.dumps({'views':results,'servedAssets':served},indent=2)+'\n')
print(json.dumps({'views':results,'servedAssets':len(served),'status':'PASS'}))
