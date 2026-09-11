# Run through browser-harness stdin in an owned BU_NAME window.
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse

OUT = Path(os.environ['ATLAS_QA_OUTPUT']).resolve()
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ['ATLAS_QA_URL']
assert urlparse(BASE).hostname in ('localhost', '127.0.0.1')

def val(expr): return js('(() => ' + expr + ')()')
def snap(name):
    time.sleep(.2)
    capture_screenshot(path=str(OUT / (name + '.png')))
def click(selector, align=True):
    if align:
        js('(() => document.querySelector(' + json.dumps(selector) + ').scrollIntoView({block:"center",behavior:"instant"}))()')
    r = val('document.querySelector(' + json.dumps(selector) + ').getBoundingClientRect().toJSON()')
    assert r['width'] > 0 and r['height'] > 0
    x, y = r['x'] + r['width']/2, r['y'] + r['height']/2
    assert 0 < x < val('innerWidth') and 0 < y < val('innerHeight'), (selector, r)
    assert val('document.querySelector(' + json.dumps(selector) + ').contains(document.elementFromPoint(' + str(x) + ',' + str(y) + '))'), selector
    click_at_xy(x,y)
def selected(): return val('document.querySelector("main button[aria-current=true]")?.textContent')
def bounds(width):
    result = val('({inner:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
    assert result['inner'] == width and result['scroll'] <= width, result
    return result

def active_visible():
    return val('(() => {const e=document.querySelector("main button[aria-current=true]"),r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1})()')

report=[]
for width in [1440,390,320]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False)
    goto_url(BASE+'#draft-charts');wait_for_load();cdp('Page.reload',ignoreCache=True);wait_for_load()
    js('(() => window.scrollTo({top:0,behavior:"instant"}))()')
    snap('draft-charts-'+str(width))
    assert selected() == 'Draft charts'
    assert active_visible()
    assert val('document.querySelectorAll("dialog[open]").length') == 0
    assert val('document.querySelectorAll("[data-draft-chart-card]").length') == 19
    assert val('document.querySelectorAll("[data-draft-chart-category]").length') == 6
    assert val('document.querySelectorAll(".draft-charts svg,.draft-charts [data-curve-point]").length') == 0
    dimensions=bounds(width)
    cards=val('[...document.querySelectorAll("[data-draft-chart-card]")].map(e=>({title:e.dataset.draftChartCard,rect:e.getBoundingClientRect().toJSON(),scroll:e.scrollWidth,client:e.clientWidth,readiness:e.querySelector("[data-draft-chart-readiness]").innerText,visible:!e.closest("[hidden]")}))')
    assert len(set(c['title'] for c in cards)) == 19
    for c in cards:
        assert c['visible'] and c['readiness'].casefold()=='no observations assembled', c
        assert c['rect']['x']>=0 and c['rect']['right']<=width and c['scroll']<=c['client'],c
    # Verify rendered text ranges, not only container overflow.
    clipped=val('[...document.querySelectorAll(".draft-charts h4,.draft-charts dd,.draft-charts dt,.draft-chart-readiness")].filter(e=>{const r=document.createRange();r.selectNodeContents(e);const a=r.getBoundingClientRect(),b=e.closest("article").getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1}).map(e=>e.textContent)')
    assert not clipped, clipped
    for ident in ['tissue-mapped','neural-recording-hours']:
        selector='.draft-charts a[href="#'+ident+'"]'
        click(selector);snap('draft-link-'+ident+'-'+str(width))
        assert val('document.querySelector("dialog[open]")?.getAttribute("aria-labelledby")') == ident+'-title'
        assert selected() == 'Metrics'
        press_key('Escape');snap('draft-return-'+ident+'-'+str(width))
        assert selected() == 'Draft charts'
        assert val('location.hash') == '#draft-charts'
        assert val('document.activeElement === document.querySelector('+json.dumps(selector)+')')
        js('(() => history.forward())()');snap('draft-forward-'+ident+'-'+str(width))
        assert selected() == 'Metrics'
        click('dialog .pc-modal-header button',False);snap('draft-close-'+ident+'-'+str(width))
        assert selected() == 'Draft charts'
        assert val('document.activeElement === document.querySelector('+json.dumps(selector)+')')
        bounds(width)
    # Real keyboard activation of the rail and restoration through history.
    js('(() => window.scrollTo({top:0,behavior:"instant"}))()')
    for label,fragment in [('Metrics','#performance_curves'),('Expectations','#expectations'),('Draft charts','#draft-charts')]:
        js('(() => {const e=[...document.querySelectorAll("main button")].find(e=>e.textContent==='+json.dumps(label)+');e.focus({preventScroll:true});})()')
        press_key('Enter');snap('draft-rail-'+label+'-'+str(width))
        assert selected()==label and val('location.hash')==fragment
        assert active_visible()
        bounds(width)
    js('(() => history.back())()');snap('draft-history-back-'+str(width));assert selected()=='Expectations'
    js('(() => history.forward())()');snap('draft-history-forward-'+str(width));assert selected()=='Draft charts'
    js('(() => window.scrollTo({top:0,behavior:"instant"}))()')
    snap('draft-charts-final-'+str(width))
    report.append({'width':width,'cards':len(cards),'categories':6,'definition_only':True,'fresh_deep_link':True,'both_metrics_links':True,'keyboard_tabs':True,'back_forward':True,'escape_close_focus_return':True,'text_unclipped':True,'bounds':dimensions})
# Theme/reduced-motion smoke with actual existing theme styling.
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
goto_url(BASE+'#draft-charts');wait_for_load()
previous=val('document.documentElement.className')
js('(() => document.documentElement.classList.add("dark"))()')
cdp('Emulation.setEmulatedMedia',features=[{'name':'prefers-reduced-motion','value':'reduce'}])
snap('draft-charts-dark-reduced');bounds(1440)
assert val('matchMedia("(prefers-reduced-motion: reduce)").matches')
js('(() => document.documentElement.className='+json.dumps(previous)+')()')
cdp('Emulation.setEmulatedMedia',features=[])
(OUT/'draft-charts-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
