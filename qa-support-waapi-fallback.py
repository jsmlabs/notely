from pathlib import Path
from playwright.sync_api import sync_playwright
import re,base64
root=Path(__file__).resolve().parent
css='\n'.join((root/f).read_text() for f in ('design-tokens.css','styles.css','motion.css','donation.css'))
markup=(root/'popup.html').read_text()
support=re.search(r'<dialog id="support-dialog"[\s\S]*?</dialog>',markup).group(0)
support=support.replace('src="donations/usdc-solana-qr.png"','src="data:image/png;base64,'+base64.b64encode((root/'donations/usdc-solana-qr.png').read_bytes()).decode()+'"')
src=(root/'popup.js').read_text()
handlers=src[src.index('  // One-shot support dialog motion.'):src.index("  elements['backup-open'].addEventListener")]
html=f'''<html><head><style>{css}</style></head><body data-theme="dark"><button id="support-open">Support</button>{support}<script>const elements=Object.fromEntries(['support-open','support-close','support-dialog','support-copy','support-address','support-copy-result','support-done'].map(id=>[id,document.getElementById(id)]));{handlers}</script></body></html>'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':400,'height':580})
 page.set_content(html)
 page.click('#support-open')
 page.wait_for_timeout(180)
 page.evaluate('''() => {document.getElementById("support-dialog").animate=()=>{throw Error("no animation") }; return true;}''')
 page.click('#support-close')
 assert not page.locator('#support-dialog').evaluate('(el)=>el.open')
 page.click('#support-open')
 page.wait_for_timeout(180)
 assert page.locator('#support-dialog').evaluate('(el)=>el.open && getComputedStyle(el).opacity === "1"')
 page.keyboard.press('Escape')
 assert not page.locator('#support-dialog').evaluate('(el)=>el.open')
 print('PASS: throwing Web Animations API -> close fallback -> reopen -> Escape')
 b.close()
