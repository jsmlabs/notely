import { chromeCoordinator, CAPTURE_SOURCE_KEY, CAPTURE_MENU_ID } from './coordinator.mjs';
const coordinator=chromeCoordinator(chrome.storage.local);

function reply(promise,sendResponse) {
  Promise.resolve(promise).then(data=>sendResponse({ok:true,data}), error=>sendResponse({ok:false,error:error?.message || 'Storage error'}));
  return true;
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(sender.id!==chrome.runtime.id || !message || typeof message!=='object') return false;
  switch(message.type) {
    case 'NOTES_GET': return reply(coordinator.read(),sendResponse);
    case 'NOTES_EDIT': return reply(coordinator.edit(message.base,message.notes),sendResponse);
    case 'NOTES_IMPORT': return reply(coordinator.import(message.notes,message.mode,message.expected),sendResponse);
    default: return false;
  }
});

chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.removeAll(()=>{
    chrome.contextMenus.create({id:CAPTURE_MENU_ID,title:'Save selection to Notely',contexts:['selection']},()=>{
      if(chrome.runtime.lastError) console.error('Notely menu:',chrome.runtime.lastError.message);
    });
  });
});
async function indicate(error) {
  try {
    await chrome.action.setBadgeBackgroundColor({color:error?'#B93F49':'#355C36'});
    await chrome.action.setBadgeText({text:error?'!':'✓'});
  } catch {} // Badge is convenience only. Storage acknowledgement is authoritative.
}
chrome.contextMenus.onClicked.addListener((info,tab)=>{
  if(info.menuItemId!==CAPTURE_MENU_ID) return;
  (async()=>{
    const value=await chrome.storage.local.get(CAPTURE_SOURCE_KEY);
    await coordinator.capture(info.selectionText,{title:tab?.title || '',url:info.pageUrl || '',includeSource:value[CAPTURE_SOURCE_KEY]!==false});
    await indicate(false);
  })().catch(error=>{console.error('Notely capture:',error);void indicate(true)});
});
chrome.commands.onCommand.addListener(command=>{
  if(command!=='quick-note') return;
  coordinator.quick().then(()=>indicate(false)).catch(error=>{
    // The quick-note command creates an intentionally blank note (separate from selection capture).
    console.error('Notely shortcut:',error);void indicate(true);
  });
});
