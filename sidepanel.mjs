// Chrome requires a user gesture to open the side panel. Invoke from the click handler.
export async function openNotelySidePanel(api) {
  if (!api?.sidePanel?.open || !api?.tabs?.query) throw new Error('Chrome Side Panel API is unavailable.');
  const tabs = await api.tabs.query({active:true,currentWindow:true});
  const windowId = tabs?.[0]?.windowId;
  if (!Number.isInteger(windowId) || windowId < 0) throw new Error('No active browser window is available.');
  await api.sidePanel.open({windowId});
}
