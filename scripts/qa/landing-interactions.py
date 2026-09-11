"""Interaction, theme, keyboard and reduced-motion checks on local QA origin."""
import json
import base64
from pathlib import Path

BASE = 'http://127.0.0.1:3147'
OUT = Path('/opt/data/tmp/neuro-landing-evidence')

def center(selector):
    return js(f"(() => {{ const r=document.querySelector({json.dumps(selector)}).getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]; }})()")

def capture(name):
    capture_screenshot(path=str(OUT / name))

cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1000, deviceScaleFactor=1, mobile=False)
goto_url(BASE)
wait_for_load()
capture('interaction-home.png')
click_at_xy(*center('.landing-explore'))
capture('interaction-explore.png')
assert js("location.hash") == '#explore'
assert js("document.activeElement.id") == 'explore'
press_key('Tab')
capture('interaction-keyboard.png')
assert js("document.activeElement.getAttribute('href')") == '/milestones'
assert js("getComputedStyle(document.activeElement).outlineStyle") != 'none'
for i, route in enumerate(['/milestones', '/ecosystem', '/funding', '/field-velocity']):
    goto_url(BASE)
    wait_for_load()
    selector = f'.landing-tile[href="{route}"]'
    js(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{behavior:'instant',block:'center'}})")
    capture(f'interaction-tile-{i}.png')
    click_at_xy(*center(selector))
    wait_for_load()
    capture(f'interaction-route-{i}.png')
    assert js('location.pathname') == route
    assert js("!!document.querySelector('h1')")

goto_url(BASE)
wait_for_load()
# Toggle through the actual user control (never inject a theme class).
print(js("[...document.querySelectorAll('button')].map(b=>({label:b.getAttribute('aria-label'),title:b.title}))"))
capture('interaction-before-theme.png')
click_at_xy(*center('aside button'))
capture('landing-dark-1440.png')
assert js("document.documentElement.classList.contains('dark')")
# Reduced-motion preference disables tile motion in the actual stylesheet.
cdp('Emulation.setEmulatedMedia', features=[{'name':'prefers-reduced-motion','value':'reduce'}])
assert js("getComputedStyle(document.querySelector('.landing-tile')).transitionDuration") == '0s'
cdp('Emulation.setEmulatedMedia', features=[])
click_at_xy(*center('aside button'))
capture('landing-light-restored.png')
assert not js("document.documentElement.classList.contains('dark')")
cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=False)
js("window.scrollTo({top:0,behavior:'instant'})")
capture('landing-mobile-final.png')
size=cdp('Page.getLayoutMetrics')['cssContentSize']
image=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=True,clip={'x':0,'y':0,'width':390,'height':size['height'],'scale':1})
(OUT / 'landing-mobile-full.png').write_bytes(base64.b64decode(image['data']))
print(json.dumps({'interactions':'PASS','routes':4,'explore':'scroll and focus','keyboard':'visible focus','themes':'light/dark/restored','reducedMotion':'PASS'}))
