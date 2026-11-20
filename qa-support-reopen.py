from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path('/mnt/data/notely-support-reopen-fix-v2.0.20')
css='\n'.join((root/f).read_text() for f in ['design-tokens.css','styles.css','motion.css','donation.css'])
markup=(root/'popup.html').read_text()
# Original UI source with support dialog, all original CSS; no extension-specific storage interactions.
import re
support=re.search(r'<dialog id="support-dialog"[\s\S]*?</dialog>',markup).group(0)
support=support.replace('src="donations/usdc-solana-qr.png"','src="data:image/png;base64,'+__import__('base64').b64encode((root/'donations/usdc-solana-qr.png').read_bytes()).decode()+'"')
source=(root/'popup.js').read_text()
start=source.index('  // One-shot support dialog motion.')
end=source.index("  elements['backup-open'].addEventListener",start)
handlers=source[start:end]
html=f'''<!doctype html><html><head><style>{css}</style></head><body data-theme="dark"><button id="support-open">Support</button>{support}<script>
const elements=Object.fromEntries(['support-open','support-close','support-dialog','support-copy','support-address','support-copy-result','support-done'].map(x=>[x,document.getElementById(x)]));
{handlers}
</script></body></html>'''
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for reduce in [False,True]:
  page=browser.new_page(viewport={'width':400,'height':580},reduced_motion='reduce' if reduce else 'no-preference')
  page.set_content(html)
  page.click('#support-open')
  page.wait_for_timeout(210)
  opened=page.evaluate('''() => {const d=document.querySelector('#support-dialog'),r=d.getBoundingClientRect();return {open:d.open,top:r.top,bottom:r.bottom,width:r.width,animation:getComputedStyle(d).animationName,backdropAnimation:getComputedStyle(d,'::backdrop').animationName}}''')
  assert opened['open'] and opened['top']>=0 and opened['bottom']<=580,opened
  if reduce: assert opened['animation']=='none',opened
  else: assert 'support-reveal' in opened['animation'],opened
  page.keyboard.press('Escape')
  page.wait_for_timeout(200)
  closed=page.evaluate('''() => ({open:document.getElementById('support-dialog').open,focused:document.activeElement.id})''')
  assert not closed['open'] and closed['focused']=='support-open',closed
  page.click('#support-open')
  page.wait_for_timeout(220)
  second=page.evaluate('''() => {const d=document.querySelector('#support-dialog');return {open:d.open,opacity:getComputedStyle(d).opacity,animations:d.getAnimations().map(a=>({playState:a.playState,fill:a.effect?.getTiming().fill,frames:a.effect?.getKeyframes().map(f=>f.opacity)}))}}''')
  assert second['open'] and second['opacity']=='1', second
  print('SECOND OPEN',reduce,second)
  results.append({'reduced_motion':reduce,'opened':opened,'closed':closed,'second':second})
  page.click('#support-close')
  page.wait_for_timeout(160)
  assert not page.evaluate('document.getElementById("support-dialog").open')
  page.click('#support-open')
  page.wait_for_timeout(220)
  assert page.evaluate('getComputedStyle(document.getElementById("support-dialog")).opacity') == '1'
  page.click('#support-done')
  page.wait_for_timeout(160)
  assert not page.evaluate('document.getElementById("support-dialog").open')
  page.close()
 browser.close()
print(json.dumps(results,indent=2))
