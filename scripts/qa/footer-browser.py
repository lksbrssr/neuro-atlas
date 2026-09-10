import json, os, time
from pathlib import Path
base = os.environ.get('ATLAS_QA_URL', 'http://127.0.0.1:3417').rstrip('/')
out = Path(os.environ.get('ATLAS_QA_OUT', '.qa/footer'))
goto_url(base + '/milestones')
wait_for_load()
out.mkdir(exist_ok=True)
reports = []
def contrast(foreground, background):
    import re
    fg = [float(x) for x in re.findall(r'[\d.]+', foreground)]
    bg = [float(x) for x in re.findall(r'[\d.]+', background)][:3]
    alpha = fg[3] if len(fg) == 4 else 1
    mixed = [a*alpha+b*(1-alpha) for a,b in zip(fg[:3], bg)]
    def luminance(rgb):
        v = [c/255 for c in rgb]
        v = [c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in v]
        return sum(a*b for a,b in zip(v, [.2126,.7152,.0722]))
    a,b = sorted([luminance(mixed), luminance(bg)])
    return (b+.05)/(a+.05)
for width, height in [(1440,1000), (390,1000), (320,1000)]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=1, mobile=False)
    for theme in ['light','dark']:
        js(f"(() => {{ document.documentElement.classList.remove('light','dark'); document.documentElement.classList.add('{theme}'); document.documentElement.style.colorScheme='{theme}'; }})()")
        # Existing link colors transition for 150ms; measure the settled theme.
        time.sleep(0.3)
        js("(() => {document.querySelector('footer').scrollIntoView({behavior:'instant',block:'end'});})()")
        report = js("""(() => {
          const f=document.querySelector('footer');
          const composite=(element)=>{
            const c=document.createElement('canvas');c.width=c.height=1;
            const ctx=c.getContext('2d');
            ctx.fillStyle=getComputedStyle(document.body).backgroundColor;ctx.fillRect(0,0,1,1);
            ctx.fillStyle=getComputedStyle(element).color;ctx.fillRect(0,0,1,1);
            return 'rgb('+[...ctx.getImageData(0,0,1,1).data].slice(0,3).join(',')+')';
          };
          return {url:location.href,width:innerWidth,theme:document.documentElement.className,
            footerCount:document.querySelectorAll('footer').length,outsideMain:!f.closest('main'),
            overflow:document.documentElement.scrollWidth>innerWidth,
            footer:f.getBoundingClientRect().toJSON(),
            links:[...f.querySelectorAll('a')].map(a=>({label:a.textContent.trim(),href:a.href,rect:a.getBoundingClientRect().toJSON(),color:composite(a)})),
            background:getComputedStyle(document.body).backgroundColor,text:f.innerText};
        })()""")
        assert report['footerCount']==1 and report['outsideMain'] and not report['overflow'], report
        for a in report['links']:
            assert a['rect']['left'] >= 0 and a['rect']['right'] <= width and a['rect']['height'] >= 44, a
            ratio = contrast(a['color'], report['background'])
            assert ratio >= 4.5, f"Insufficient contrast: {a['label']} = {ratio:.2f}:1"
        capture_screenshot(path=str(out/f'footer-{width}-{theme}.png'))
        reports.append(report)
# Each real plate inherits one footer, with no extra copy nested inside its content.
for route in ['/', '/milestones', '/ecosystem', '/funding', '/field-velocity', '/methodology']:
    goto_url(base+route)
    wait_for_load()
    report=js("(() => ({url:location.href,footerCount:document.querySelectorAll('footer').length,outsideMain:!document.querySelector('footer').closest('main'),links:document.querySelectorAll('footer a').length}))()")
    assert report['footerCount']==1 and report['outsideMain'] and report['links']==7, report
    reports.append(report)
(out/'report.json').write_text(json.dumps(reports, indent=2))
print(json.dumps({'verdict':'PASS','screenshots':6,'routeChecks':6,'report':str(out/'report.json')}))
