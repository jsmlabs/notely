from pathlib import Path
from playwright.sync_api import sync_playwright
import re, base64
base=Path(__file__).parent
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-extensions'])
  for file,w in [('popup.html',400),('sidepanel.html',280),('popup.html',1440)]:
    for reduced in [False,True]:
      page=browser.new_page(viewport={'width':w,'height':800},reduced_motion='reduce' if reduced else 'no-preference')
      html=(base/file).read_text()
      html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
      html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
      styles=''.join('<style>'+ (base/n).read_text() +'</style>' for n in ['design-tokens.css','styles.css','motion.css'])
      html=html.replace('</head>',styles+'</head>')
      html=html.replace('<body data-theme="dark">', '<body class="workspace" data-theme="dark">' if w==1440 else '<body class="sidepanel" data-theme="dark">' if file=='sidepanel.html' else '<body data-theme="dark">')
      page.set_content(html,wait_until='domcontentloaded')
      outcome=page.evaluate('''() => {
        const style=(sel)=>getComputedStyle(document.querySelector(sel));
        const empty=style('.editor-empty .empty-illustration');
        const button=style('.create-button');
        return {emptyAnimation:empty.animationName,buttonTransition:button.transitionDuration,
                overflow:document.documentElement.scrollWidth>innerWidth};
      }''')
      dialog=page.evaluate('''() => {const d=document.querySelector('#confirm-dialog');d.showModal();return getComputedStyle(d).animationName;}''')
      assert dialog==('none' if reduced else 'notely-dialog-enter'),(file,w,reduced,dialog)
      page.evaluate("() => document.querySelector('#confirm-dialog').close()")
      notice=page.evaluate('''() => {const n=document.querySelector('#notice');n.hidden=false;return getComputedStyle(n).animationName;}''')
      assert notice==('none' if reduced else 'notely-feedback-enter'),(file,w,reduced,notice)
      if file=='popup.html' and w==1440 and not reduced:
        page.screenshot(path=str(base/'qa-screenshots'/'notely-v211-workspace.png'))
      print(file,w,'reduce' if reduced else 'normal',outcome,'dialog=',dialog,'notice=',notice)
      assert not outcome['overflow']
      if reduced:
        assert outcome['emptyAnimation']=='none'
        assert all(float(t.rstrip('s')) == 0 for t in outcome['buttonTransition'].split(', '))
      else:
        assert outcome['emptyAnimation']==('notely-empty-enter' if w == 1440 else 'none')
        assert outcome['buttonTransition']!='0s'
      page.close()
  browser.close()
