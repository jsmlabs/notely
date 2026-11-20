"""Static CSS/layout smoke checks only. Not an installed extension or storage test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
import base64
root = Path(__file__).resolve().parent
out = root / 'qa-screenshots'
out.mkdir(exist_ok=True)
logo = 'data:image/svg+xml;base64,' + base64.b64encode((root/'brand/mark.svg').read_bytes()).decode()
css = ''.join(f'<style>{(root / x).read_text()}</style>' for x in ['design-tokens.css','styles.css'])
scenarios = [('sidepanel.html', 'sidepanel', 280, 700), ('sidepanel.html', 'sidepanel', 360, 740), ('popup.html','',400,580), ('popup.html','workspace',700,800), ('popup.html','workspace',701,800), ('popup.html','workspace',1440,900), ('popup.html','workspace',1700,950)]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-extensions'])
    for filename,klass,w,h in scenarios:
        html = (root / filename).read_text()
        html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)
        html = html.replace('src="brand/mark.svg"', 'src="' + logo + '"')
        html = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', '', html)
        html = html.replace('</head>', css + '</head>')
        html = html.replace('<body data-theme="dark">', f'<body class="{klass}" data-theme="dark">')
        page=browser.new_page(viewport={'width':w,'height':h})
        page.set_content(html, wait_until='domcontentloaded')
        data=page.evaluate('''() => {
          let r=(s)=>{const e=document.querySelector(s), b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,d:getComputedStyle(e).display}};
          return {app:r('.app'), sidebar:r('.sidebar'),editor:r('.editor-area'),resize:r('.sidebar-resize'),overflow:document.documentElement.scrollWidth>innerWidth};
        }''')
        assert not data['overflow'], (w, klass, data)
        if klass == 'workspace' and w >= 701:
            assert data['app']['d'] == 'grid' and abs(data['sidebar']['y']-data['editor']['y'])<1, data
            assert abs(data['resize']['x']+6-data['editor']['x'])<1.5, data
            assert data['editor']['w'] >= 300, data
        if klass != 'workspace' or w <= 700:
            assert data['resize']['d'] == 'none', (klass,w,data)
        label = klass or 'popup'
        page.screenshot(path=str(out/f'notely-v210-{label}-{w}.png'))
        print(f'PASS {label} {w}x{h}: no horizontal overflow; editor x={data["editor"]["x"]:.0f} y={data["editor"]["y"]:.0f}')
        page.close()
    browser.close()
