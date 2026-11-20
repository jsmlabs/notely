"""Static Chromium layout regression for the actual full-tab entry point."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re

root = Path(__file__).resolve().parent
html = (root / 'popup.html').read_text()
html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)
for name in ['design-tokens.css','styles.css']:
    html = html.replace(f'<link rel="stylesheet" href="{name}" />', '<style>'+(root/name).read_text()+'</style>')
html = html.replace('<body data-theme="dark">','<body class="workspace" data-theme="dark">')
qa = root/'qa-screenshots';qa.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-extensions'])
    for w,h in [(400,740),(700,800),(701,800),(1024,768),(1440,900),(1700,950)]:
        page = browser.new_page(viewport={'width':w,'height':h}, device_scale_factor=1)
        page.set_content(html,wait_until='domcontentloaded')
        data=page.evaluate('''() => {const rect=s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,display:getComputedStyle(e).display}};return {sidebar:rect('.sidebar'),resize:rect('.sidebar-resize'),editor:rect('.editor-area'),app:rect('.app'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,columns:getComputedStyle(document.querySelector('.app')).gridTemplateColumns}}''')
        if w>=701:
            assert data['app']['display']=='grid', (w,data)
            assert data['sidebar']['y'] == data['editor']['y'],(w,data)
            assert abs(data['resize']['x']-(data['sidebar']['x']+data['sidebar']['width']))<2,(w,data)
            assert abs(data['editor']['x']-(data['resize']['x']+6))<2,(w,data)
            assert data['editor']['width']>250,(w,data)
            assert data['sidebar']['height']==h and data['editor']['height']==h,(w,data)
            if w==1440:
                page.screenshot(path=str(qa/'notely-v209-workspace-1440-fixed.png'))
                page.evaluate("document.body.classList.add('focus-mode'); document.querySelector('.app').dataset.view='editor'")
                focused=page.evaluate('''() => ({editorX:document.querySelector('.editor-area').getBoundingClientRect().x, editorWidth:document.querySelector('.editor-area').getBoundingClientRect().width,sidebarDisplay:getComputedStyle(document.querySelector('.sidebar')).display})''')
                assert focused['sidebarDisplay']=='none' and focused['editorX']==0 and focused['editorWidth']==w,focused
        else:
            assert data['app']['display']=='block',(w,data)
            assert data['resize']['display']=='none',(w,data)
        assert not data['overflow'],(w,data)
        print(f'PASS viewport {w}x{h}: columns={data["columns"]}; editor y={data["editor"]["y"]}; overflow={data["overflow"]}')
        page.close()
    browser.close()
