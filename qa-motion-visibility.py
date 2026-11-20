from pathlib import Path
from playwright.sync_api import sync_playwright
import re
base=Path(__file__).parent
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-extensions'])
  samples=[('popup.html',400,800,False),('sidepanel.html',280,760,False),('popup.html',700,780,True),('popup.html',701,780,True),('popup.html',1440,900,True)]
  checked=0
  for file,w,h,workspace in samples:
    for reduced in [False,True]:
      page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce' if reduced else 'no-preference')
      html=(base/file).read_text()
      html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
      html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
      styles=''.join('<style>'+ (base/n).read_text() +'</style>' for n in ('design-tokens.css','styles.css','motion.css'))
      html=html.replace('</head>',styles+'</head>')
      page.set_content(html)
      if workspace: page.evaluate("document.body.classList.add('workspace')")
      if file=='sidepanel.html': page.evaluate("document.body.classList.add('sidepanel')")
      def anim(): return page.locator('.editor-empty .empty-illustration').evaluate('(el)=>getComputedStyle(el).animationName')
      page.locator('#app').evaluate("el=>el.dataset.view='list'")
      expected_list = 'notely-empty-enter' if workspace and w>=701 and not reduced else 'none'
      assert anim()==expected_list,(file,w,reduced,'list',anim(),expected_list)
      page.locator('#app').evaluate("el=>el.dataset.view='editor'")
      assert anim()==('none' if reduced else 'notely-empty-enter'),(file,w,reduced,'editor',anim())
      result=page.evaluate("""() => {
        let s=document.querySelector('.sidebar').getBoundingClientRect(),e=document.querySelector('.editor-area').getBoundingClientRect();
        return {overflow: document.documentElement.scrollWidth>innerWidth, sidebarX:s.x, sidebarRight:s.right, editorX:e.x, editorY:e.y};
      }""")
      assert not result['overflow'],(file,w,reduced,result)
      if workspace and w>=701:
        assert result['editorX']>=result['sidebarRight'] and result['editorY']==result['editorY'],result
      checked+=1
      page.close()
  browser.close()
print(f'PASS: {checked} responsive/motion combinations')
