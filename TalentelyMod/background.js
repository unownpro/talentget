// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "rerun-script") {
    // Ensure tabs[0] exists before trying to access its id
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "runPasteScript" });
      } else {
        console.error("Could not find active tab to send message for rerun-script");
      }
    });
  } else if (command === "toggle-gemini-panel") {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "toggleGeminiPanel" });
    } else {
      // Fallback to query if tab is not directly available
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleGeminiPanel" });
        } else {
          console.error("Could not find active tab to send message for toggle-gemini-panel");
        }
      });
    }
  }
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Talent Website Utility Extension installed/updated");
});

// Handle extension icon click: Do nothing, as per requirements.
chrome.action.onClicked.addListener((tab) => {
  // Intentionally left blank to prevent any action on icon click.
  console.log("Browser action icon clicked, no action taken as per new requirements.");
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === "openOptionsPage") {
    console.log('Opening options page...');
    try {
      chrome.runtime.openOptionsPage();
      sendResponse({ status: "Options page opened" });
      console.log('Options page opened successfully');
    } catch (error) {
      console.error('Error opening options page:', error);
      sendResponse({ status: "Error opening options page", error: error.message });
    }
  }
  return true;
});
