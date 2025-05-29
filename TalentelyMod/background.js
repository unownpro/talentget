// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  console.log("Command received:", command, "Tab:", tab);
  
  if (command === "rerun-script") {
    console.log("Rerun-script command triggered");
    handleCommand(tab, { action: "runPasteScript" }, "rerun-script");
  } else if (command === "toggle-gemini-panel") {
    console.log("Toggle Gemini panel command triggered");
    handleCommand(tab, { action: "toggleGeminiPanel" }, "toggle-gemini-panel");
  }
});

// Unified command handler with proper error handling
function handleCommand(tab, message, commandName) {
  function sendMessageToTab(tabId) {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(`Could not send ${commandName} message to tab ${tabId}:`, chrome.runtime.lastError.message);
        // Don't throw error, just log it as content script might not be loaded
      } else {
        console.log(`${commandName} message sent successfully, response:`, response);
      }
    });
  }

  if (tab && tab.id) {
    console.log(`Sending ${commandName} message to tab:`, tab.id);
    sendMessageToTab(tab.id);
  } else {
    // Fallback to query if tab is not directly available
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        console.log(`Sending ${commandName} message to active tab:`, tabs[0].id);
        sendMessageToTab(tabs[0].id);
      } else {
        console.warn(`Could not find active tab for ${commandName} command`);
      }
    });
  }
}

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
