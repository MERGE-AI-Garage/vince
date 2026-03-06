// ABOUTME: Service worker that opens the AI brand guidelines side panel on icon click
// ABOUTME: Includes site detection messaging for active tab awareness

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Respond to site detection queries from the side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_ACTIVE_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || '' });
    });
    return true; // Keep the message channel open for async response
  }
});
