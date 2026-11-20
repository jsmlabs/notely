"""Static HTML/CSS layout verification only; not an installed extension test."""
from pathlib import Path
import re, base64, json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
out=root/'qa-screenshots';out.mkdir(exist_ok=True)
css=''.join(f'<style>{(root/name).read_text()}</style>' for name in ('design-tokens.css','styles.css','motion.css','donation.css'))
logo='data:image/svg+xml;base64,'+base64.b64encode((root/'brand/mark.svg').read_bytes()).decode()
checks=[('popup.html','',400,580),('sidepanel.html','sidepanel',280,600),('sidepanel.html','sidepanel',360,680),('popup.html','workspace',700,800),('popup.html','workspace',701,800),('popup.html','workspace',1440,900)]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-extensions'])
 for filename,cls,w,h in checks:
  html=(root/filename).read_text()
  html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
  html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
  html=html.replace('src="brand/mark.svg"','src="'+logo+'"')
  html=html.replace('</head>',css+'</head>')
  html=html.replace('<body data-theme="dark">',f'<body data-theme="dark" class="{cls}">')
  page=b.new_page(viewport={'width':w,'height':h})
  page.set_content(html)
  data=page.evaluate('''() => {
   const box=s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,display:getComputedStyle(e).display}};
   return {overflow:document.documentElement.scrollWidth>innerWidth,sidebar:box('.sidebar'),editor:box('.editor-area'),resize:box('.sidebar-resize')};
  }''')
  assert not data['overflow'],(cls,w,data)
  if cls=='workspace' and w>=701:
   assert abs(data['sidebar']['y']-data['editor']['y'])<1 and data['editor']['w']>=300,(w,data)
  if cls!='workspace' or w<=700: assert data['resize']['display']=='none',(w,data)
  label=cls or 'popup'
  if (w,cls) in ((400,''),(280,'sidepanel'),(1440,'workspace')):
   page.screenshot(path=str(out/f'notely-v218-{label}-{w}.png'))
  print(f'PASS {filename} {cls or "popup"} {w}x{h}: no horizontal overflow')
  page.close()
 b.close()
