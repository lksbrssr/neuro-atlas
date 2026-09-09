# Run through browser-harness stdin, never a standalone browser.
# Caller owns BU_NAME + lock. URL is loopback-only; hosted authentication is unchanged.
import json
import os
from pathlib import Path
from urllib.parse import urlparse

OUT = Path(os.environ.get('ATLAS_QA_OUTPUT', '.qa')).resolve()
OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('ATLAS_QA_URL', 'http://127.0.0.1:3387/field-velocity')
assert urlparse(URL).hostname in ('127.0.0.1', 'localhost'), 'Local QA only; preserve hosted auth'
ids = ['simultaneously-recorded-neurons', 'tissue-mapped', 'neural-recording-hours']
counts = [7, 7, 11]
report = []

def value(expression):
    return js('(() => ' + expression + ')()')

def shot(name):
    capture_screenshot(path=str(OUT / (name + '.png')))

def scroll_to(selector):
    js('(() => { const e=document.querySelector(' + json.dumps(selector) + '); window.scrollTo({top:scrollY+e.getBoundingClientRect().top-35,behavior:"instant"}); })()')

def click(selector):
    scroll_to(selector)
    rect = value('document.querySelector(' + json.dumps(selector) + ').getBoundingClientRect().toJSON()')
    click_at_xy(rect['x'] + rect['width'] / 2, rect['y'] + min(35, rect['height'] / 2))

goto_url(URL)
wait_for_load()
for width in [1440, 390, 320]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=1100, deviceScaleFactor=1, mobile=False)
    goto_url(URL)
    wait_for_load()
    scroll_to('#performance_curves')
    shot(f'cards-{width}')
    assert value('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), f'page overflow {width}'
    assert value("[...document.querySelectorAll('.pc-preview svg text')].every(t=>t.getBBox().x >= 0)"), f'preview tick clipped {width}'
    assert value("document.querySelectorAll('.pc-preview a,.pc-preview [tabindex],summary button,summary a').length") == 0
    for ident, count in zip(ids, counts):
        click('#' + ident + ' > summary')
        shot(f'{ident}-{width}')
        assert value(f'document.getElementById({json.dumps(ident)}).open')
        assert value(f'[...document.querySelectorAll("#{ident} [data-source-observation]")].filter(e=>e.checkVisibility()).length') == count
        assert value(f'document.querySelector("#{ident} .pc-methodology").checkVisibility()')
        assert value(f'Math.abs(document.getElementById({json.dumps(ident)}).getBoundingClientRect().width-document.querySelector(".pc-grid").getBoundingClientRect().width)<2')
        assert value('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), f'open page overflow {width} {ident}'
        if width == 1440:
            # Native Tab traverses every marker, including coincident evidence.
            js(f'(() => document.querySelector("#{ident} .pc-chart-scroll[tabindex]").focus())()')
            visited = []
            for i in range(count):
                press_key('Tab')
                shot(f'{ident}-keyboard-{i}')
                active = value('({id:document.activeElement.dataset.curvePoint,label:document.activeElement.getAttribute("aria-label"),description:document.activeElement.getAttribute("aria-describedby")})')
                assert active['id'], active
                assert active['description'], active
                text = value('document.getElementById(' + json.dumps(active['description']) + ').textContent')
                assert text == active['label']
                visited.append(active['id'])
            assert len(set(visited)) == count
            report.append({'width':width,'card':ident,'keyboard_points':len(visited)})
        # Escape collapses the actual detail and restores its summary focus.
        js(f'(() => document.querySelector("#{ident} > summary").focus())()')
        press_key('Escape')
        shot(f'{ident}-closed-{width}')
        assert not value(f'document.getElementById({json.dumps(ident)}).open')
        assert value('document.activeElement.tagName') == 'SUMMARY'
        report.append({'width':width,'card':ident,'visible_source_rows':count,'overflow':False,'escape_focus':'summary'})
    # Native provenance disclosure, no runtime freshness claim.
    click('.pc-provenance > summary')
    shot(f'provenance-{width}')
    assert value('document.querySelector(".pc-provenance").open')
    assert value('document.documentElement.scrollWidth <= document.documentElement.clientWidth')

print(json.dumps(report, indent=2))
(OUT / 'browser-report.json').write_text(json.dumps(report, indent=2))
