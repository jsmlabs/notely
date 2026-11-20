from pathlib import Path
import base64,re,json
from playwright.sync_api import sync_playwright
root=Path(__file__).parent
out=root/'qa-screenshots';out.mkdir(exist_ok=True)
css=''.join('<style>'+ (root/p).read_text()+'</style>' for p in ['design-tokens.css','styles.css','motion.css','donation.css'])
logo='data:image/svg+xml;base64,'+base64.b64encode((root/'brand/mark.svg').read_bytes()).decode()
qr='data:image/png;base64,'+base64.b64encode((root/'donations/usdc-solana-qr.png').read_bytes()).decode()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-extensions'])
 for file,cls,w,h in [('sidepanel.html','sidepanel',280,580),('sidepanel.html','sidepanel',280,450),('popup.html','',400,580),('popup.html','workspace',1440,900)]:
  html=(root/file).read_text()
  html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
  html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
  html=html.replace('src="brand/mark.svg"','src="'+logo+'"').replace('src="donations/usdc-solana-qr.png"','src="'+qr+'"')
  html=html.replace('</head>',css+'</head>')
  html=html.replace('<body data-theme="dark">',f'<body data-theme="dark" class="{cls}">')
  page=b.new_page(viewport={'width':w,'height':h})
  page.set_content(html)
  page.evaluate("document.querySelector('#support-dialog').showModal()")
  page.wait_for_timeout(250)
  data=page.evaluate('''() => {const dlg=document.querySelector('#support-dialog');const r=dlg.getBoundingClientRect();const input=document.querySelector('#support-address');const d=document.querySelector('#support-done');return {view:[innerWidth,innerHeight],rect:[r.x,r.y,r.width,r.height],maxHeight:getComputedStyle(dlg).maxHeight,scrollHeight:dlg.scrollHeight,clientHeight:dlg.clientHeight,scrollable:dlg.scrollHeight>dlg.clientHeight+1,viewportOverflow:document.documentElement.scrollWidth>innerWidth,qrLoaded:document.querySelector('.support-qr-frame img').naturalWidth>0,addressVisible:getComputedStyle(input).display!=='none',address:input.value,doneBottom:d.getBoundingClientRect().bottom}}''')
  assert data['qrLoaded'] and data['addressVisible'],data
  assert data['rect'][0]>=0 and data['rect'][2]<=w+1 and data['rect'][1]>=0 and data['rect'][3]<=h+1,data
  assert not data['viewportOverflow'],data
  if data['scrollable']:
   page.evaluate("document.querySelector('#support-dialog').scrollTop=10000")
   assert page.locator('#support-done').is_visible()
  path=out/f'notely-v215-support-{w}x{h}.png'
  page.screenshot(path=str(path))
  print(json.dumps({'file':file,'screenshot':str(path),**data}))
  page.close()
 b.close()
