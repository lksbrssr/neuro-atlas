# Executed by browser-harness in the worker's existing locked window.
import json
import os
from pathlib import Path
from urllib.parse import urlparse
OUT=Path(os.environ.get('ATLAS_QA_OUTPUT', '.qa')).resolve()
OUT.mkdir(parents=True, exist_ok=True)
BASE=os.environ.get('ATLAS_QA_URL', 'http://127.0.0.1:3387/field-velocity')
parsed=urlparse(BASE)
assert parsed.hostname in ('127.0.0.1', 'localhost'), 'Local QA only; preserve hosted auth'
BASE=parsed._replace(query=(parsed.query+'&' if parsed.query else '')+'review=share-qa',fragment='').geturl()
ORIGIN=parsed.scheme+'://'+parsed.netloc
IDS=['simultaneously-recorded-neurons','tissue-mapped','neural-recording-hours']

def val(expr): return js('(() => '+expr+')()')
def snap(name): capture_screenshot(path=str(OUT/(name+'.png')))
def click_selector(selector):
    js('(() => {const e=document.querySelector('+json.dumps(selector)+');window.scrollTo({top:scrollY+e.getBoundingClientRect().top-50,behavior:"instant"});})()')
    r=val('document.querySelector('+json.dumps(selector)+').getBoundingClientRect().toJSON()')
    click_at_xy(r['x']+r['width']/2,r['y']+min(30,r['height']/2))
def opened(): return val('[...document.querySelectorAll(".pc-card[open]")].map(d=>d.id)')

report=[]
# Clipboard read permission scoped ONLY to this local QA origin, reverted below.
goto_url(BASE);wait_for_load()
previous_permission=js('(async () => (await navigator.permissions.query({name:"clipboard-read"})).state)()')
cdp('Browser.setPermission',permission={'name':'clipboard-read'},setting='granted',origin=ORIGIN)
try:
    for width in [1440,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False)
        for ident in IDS:
            expected=BASE+'#'+ident
            goto_url(expected);wait_for_load()
            snap(f'share-fresh-{ident}-{width}')
            assert opened()==[ident], (width,ident,opened())
            assert val('document.getElementById('+json.dumps(ident)+').getBoundingClientRect().top') < 150
            assert val('document.querySelector("#'+ident+' .pc-share").checkVisibility()')
            assert val('document.querySelector("#'+ident+' .pc-share a").href')==expected
            click_selector('#'+ident+' .pc-share button')
            snap(f'share-copied-{ident}-{width}')
            assert val('document.querySelector("#'+ident+' .pc-share [role=status]").textContent')=='Link copied'
            copied=js('(async () => await navigator.clipboard.readText())()')
            assert copied==expected, copied
            click_selector('#'+ident+' > summary')
            snap(f'share-closed-{ident}-{width}')
            assert val('location.hash')=='#performance_curves' and opened()==[]
            js('(() => history.back())()')
            snap(f'share-back-{ident}-{width}')
            assert opened()==[ident] and val('location.href')==expected
            js('(() => history.forward())()')
            snap(f'share-forward-{ident}-{width}')
            assert opened()==[] and val('location.hash')=='#performance_curves'
            assert val('document.documentElement.scrollWidth<=document.documentElement.clientWidth')
            report.append({'width':width,'graph':ident,'fresh_open_scroll':True,'clipboard_exact':True,'close_back_forward':True})
        # Graph-to-graph history, not just graph-to-overview.
        for ident in IDS:
            click_selector('#'+ident+' > summary');snap(f'history-select-{ident}-{width}')
            assert opened()==[ident]
        for ident in reversed(IDS[:-1]):
            js('(() => history.back())()');snap(f'history-back-{ident}-{width}')
            assert opened()==[ident]
        for ident in IDS[1:]:
            js('(() => history.forward())()');snap(f'history-forward-{ident}-{width}')
            assert opened()==[ident]
        # Hidden Expectations panel must not swallow incoming graph links.
        js('(() => [...document.querySelectorAll("button")].find(b=>b.textContent==="Expectations").focus())()')
        press_key('Enter');snap(f'expectations-{width}')
        assert val('location.hash')=='#expectations'
        goto_url(BASE+'#tissue-mapped');wait_for_load();snap(f'expectations-to-graph-{width}')
        assert opened()==['tissue-mapped']
        assert val('document.getElementById("tissue-mapped").checkVisibility()')
    print(json.dumps(report,indent=2))
    (OUT/'share-browser-report.json').write_text(json.dumps(report,indent=2))
finally:
    cdp('Browser.setPermission',permission={'name':'clipboard-read'},setting=previous_permission,origin=ORIGIN)
