from pathlib import Path
from playwright.sync_api import sync_playwright
import re, sys, json, base64
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]; source=(root/'popup.js').read_text(); html=(root/'popup.html').read_text()
css='\n'.join((root/x).read_text() for x in ['design-tokens.css','styles.css','motion.css','donation.css'])
support=re.search(r'<dialog id="support-dialog"[\s\S]*?</dialog>',html).group(0)
backup=re.search(r'<dialog id="backup-dialog"[\s\S]*?</dialog>',html).group(0)
qr=base64.b64encode((root/'donations/usdc-solana-qr.png').read_bytes()).decode()
support=support.replace('src="donations/usdc-solana-qr.png"','src="data:image/png;base64,'+qr+'"')
handlers=source[source.index('  // One-shot support dialog motion.'):source.index("  elements['backup-open'].addEventListener")]
reset=source[source.index('function resetImportPreviewOnClose()'):source.index('function refreshImportPreview()')]
markup=f'''<!DOCTYPE html><html><head><style>{css}</style></head><body data-theme="dark">
<button id="support-open">Support</button><button id="backup-open">Backup / Import</button>{support}{backup}
<script>
const elements=Object.fromEntries(['support-open','support-close','support-dialog','support-copy','support-address','support-copy-result','support-done','backup-open','backup-close','backup-dialog','backup-download','import-file','replace-confirm','import-result','import-summary','import-mode','replace-confirm-row','import-apply'].map(k=>[k,document.getElementById(k)]));
let importedNotes=null, importPreviewBase=null, importing=false;
const importSelection={{rev:0,invalidate(){{return ++this.rev;}}}};
function refreshImportPreview(){{ elements['import-apply'].disabled=true; }}
{reset}
{handlers}
elements['backup-open'].addEventListener('click',()=>elements['backup-dialog'].showModal());
elements['backup-close'].addEventListener('click',()=>{{if(!importing)elements['backup-dialog'].close();}});
elements['backup-dialog'].addEventListener('cancel',e=>{{if(importing)e.preventDefault();}});
elements['backup-dialog'].addEventListener('close',()=>{{if(!importing)resetImportPreviewOnClose();}});
</script></body></html>'''
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for reduced in [False,True]:
  for width,height in [(400,580),(280,650)]:
   page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference')
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(markup)
   for i in range(3):
    page.click('#support-open');page.wait_for_timeout(180)
    assert page.locator('#support-dialog').evaluate('(e)=>e.open && getComputedStyle(e).opacity !== "0"')
    if i==1:page.keyboard.press('Escape')
    else:page.click('#support-done')
    page.wait_for_function('!document.querySelector("#support-dialog").open')
   page.click('#backup-open')
   page.evaluate('''() => { importedNotes=[{id:'stale'}];importPreviewBase=[{id:'stale'}];document.getElementById('replace-confirm').checked=true;document.getElementById('import-file').value='';}''')
   page.click('#backup-close')
   page.wait_for_function('!document.querySelector("#backup-dialog").open')
   page.wait_for_function("importSelection.rev===1")
   assert page.evaluate('''() => importedNotes===null && importPreviewBase===null && document.getElementById('replace-confirm').checked===false && importSelection.rev===1''')
   page.click('#backup-open')
   assert page.locator('#import-apply').is_disabled()
   assert not errors,errors
   results.append({'viewport':f'{width}x{height}','reduced_motion':reduced,'support_open_close_cycles':3,'backup_reset':'passed'})
   page.close()
 browser.close()
print(json.dumps(results,indent=2))
