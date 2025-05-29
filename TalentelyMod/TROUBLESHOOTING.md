# Extension Troubleshooting Guide

## ✅ ALL ISSUES FIXED

### Issue 1: Ctrl+Shift+Y (paste script) not working after Ctrl+Shift+H (Gemini panel)
**Status: FIXED** - Both functionalities now work together properly

### Issue 2: Gemini chat UI problems
**Status: FIXED** - Text clearing, response handling, and model selection improved

### Issue 3: Unnecessary models cluttering interface
**Status: FIXED** - Simplified to only text generation models

### Issue 4: "Could not establish connection" error
**Status: FIXED** - Improved error handling in background script and added proper permissions

### Quick Fixes (Try these first):

1. **Reload the Extension**
   - Go to `chrome://extensions/`
   - Find "Talent Website Utility"
   - Click the reload button (🔄)
   - Test Ctrl+Shift+Y again

2. **Check Extension Permissions**
   - Go to `chrome://extensions/`
   - Click "Details" on your extension
   - Ensure "Allow on all sites" is enabled
   - Check that all permissions are granted

3. **Refresh the Target Page**
   - Close and reopen the tab where you're trying to use the paste script
   - Try Ctrl+Shift+Y again

### Detailed Diagnostics:

1. **Test the Extension**
   - Open the browser console (F12 → Console)
   - Copy and paste the contents of `test_extension.js` into the console
   - Run it and check the results

2. **Check Console Logs**
   - Open developer tools (F12)
   - Go to Console tab
   - Press Ctrl+Shift+Y
   - Look for diagnostic messages starting with:
     - "Command received: rerun-script"
     - "Content script received message"
     - "injectPasteScript called"
     - "Injected script loaded"

3. **Verify Keyboard Shortcut Registration**
   - Go to `chrome://extensions/shortcuts`
   - Look for "Talent Website Utility"
   - Ensure "Rerun the paste script" shows "Ctrl+Shift+Y"
   - If not assigned, click in the shortcut field and press Ctrl+Shift+Y

### Common Issues and Solutions:

#### Issue 1: Extension not reloaded after update
**Solution:** Manually reload the extension at `chrome://extensions/`

#### Issue 2: Keyboard shortcut conflict
**Solution:** 
- Check `chrome://extensions/shortcuts` for conflicts
- Temporarily disable other extensions to test
- Reassign the shortcut if needed

#### Issue 3: Content script not injecting
**Solution:**
- Check if the page URL matches the manifest patterns
- Ensure the page is fully loaded before testing
- Try refreshing the page

#### Issue 4: Editor element not found
**Solution:**
- The script looks for element with ID "editor"
- Check if the target website changed their HTML structure
- Use the test script to verify editor availability

#### Issue 5: Ace editor library not available
**Solution:**
- The script requires the Ace editor library to be loaded
- Ensure you're on a page that uses Ace editor
- Wait for the page to fully load before testing

### Fallback Solution:

The extension now includes a fallback mechanism. If the command API isn't working, the extension will also listen for Ctrl+Shift+Y directly on the page.

### Manual Testing:

If automatic shortcuts aren't working, you can manually trigger the paste script:

1. Open developer console (F12)
2. Run: `chrome.runtime.sendMessage({ action: "runPasteScript" })`

### Advanced Debugging:

1. **Check Extension Service Worker**
   - Go to `chrome://extensions/`
   - Click "Details" on your extension
   - Click "inspect views: service worker"
   - Check for error messages in the console

2. **Verify Manifest Permissions**
   - Ensure the manifest includes necessary permissions:
     - "scripting"
     - "activeTab" 
     - "storage"

3. **Test on Different Pages**
   - Try the extension on different websites
   - Verify it works on pages with Ace editor

### Still Not Working?

If none of the above solutions work:

1. **Complete Extension Reinstall**
   - Remove the extension completely
   - Restart Chrome
   - Reinstall the extension
   - Test again

2. **Check Chrome Version**
   - Ensure you're using a supported Chrome version
   - Update Chrome if necessary

3. **Browser Restart**
   - Close all Chrome windows
   - Restart Chrome
   - Test the extension

### Extension Changes Made:

The following improvements have been implemented to fix the interaction issues:

1. **Enhanced Event Handling**:
   - Fixed event propagation between Gemini panel and page
   - Added proper event isolation for panel vs page interactions
   - Improved keyboard shortcut handling with capture phase

2. **Automatic Reinitializer**:
   - Paste script automatically reinitializes when Gemini panel is toggled
   - Periodic checks ensure paste handler stays active
   - Focus event handling to restore functionality

3. **Improved Resilience**:
   - Multiple event listener targets for better coverage
   - Fallback mechanisms when primary handlers fail
   - Better error handling and recovery

4. **Enhanced Diagnostics**:
   - Comprehensive logging throughout the extension
   - Enhanced test script for both functionalities
   - Better troubleshooting information

### Success Indicators:

When working properly, you should see these console messages:

**For Paste Script (Ctrl+Shift+Y):**
- "Command received: rerun-script" (from background)
- "Content script received message"
- "injectPasteScript called"
- "Injected script loaded, initializing paste handler"
- "Smooth paste handler initialized with fallback listeners"
- "Ctrl+V detected in paste handler" (when pasting)

**For Gemini Panel (Ctrl+Shift+H):**
- "Ctrl+Shift+H detected directly in content script"
- "Background AI request triggered for: [text]" (if text is selected)
- "Gemini panel toggled: visible/hidden"
- "Received REINITIALIZE_PASTE_SCRIPT message" (ensures paste script stays active)

### Both Functionalities Working Together:

✅ **Ctrl+Shift+Y**: Initializes/reinitializes the paste script
✅ **Ctrl+Shift+H**: Opens Gemini panel (and processes selected text if any)
✅ **Ctrl+V**: Performs smooth paste in editor (works before and after opening Gemini panel)
✅ **Panel Interaction**: Paste functionality remains active even when Gemini panel is open