// Enhanced test script for debugging both paste and Gemini panel functionality
// Run this in the browser console to test the extension functionality

console.log("=== Enhanced Extension Test Script ===");

// Test 1: Check if content script is loaded
console.log("1. Testing content script presence...");
try {
    chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Content script communication failed:", chrome.runtime.lastError.message);
        } else {
            console.log("✅ Content script responded:", response);
        }
    });
} catch (error) {
    console.error("❌ Chrome runtime not available:", error);
}

// Test 2: Check if editor element exists
console.log("2. Testing editor element...");
const editorElement = document.getElementById('editor');
if (editorElement) {
    console.log("✅ Editor element found:", editorElement);
} else {
    console.log("❌ Editor element NOT found. Available elements with IDs:");
    const elementsWithIds = document.querySelectorAll('[id]');
    elementsWithIds.forEach(el => console.log("  -", el.id, el.tagName));
}

// Test 3: Check if ace editor is available
console.log("3. Testing ace editor...");
if (typeof ace !== 'undefined') {
    console.log("✅ Ace editor library is available");
    try {
        const editor = ace.edit("editor");
        console.log("✅ Ace editor instance created successfully");
    } catch (error) {
        console.log("❌ Failed to create ace editor instance:", error);
    }
} else {
    console.log("❌ Ace editor library is NOT available");
}

// Test 4: Manually trigger paste script
console.log("4. Testing manual paste script injection...");
try {
    chrome.runtime.sendMessage({ action: "runPasteScript" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Failed to trigger paste script:", chrome.runtime.lastError.message);
        } else {
            console.log("✅ Paste script triggered:", response);
        }
    });
} catch (error) {
    console.error("❌ Failed to send message:", error);
}

// Test 5: Check for injected script
console.log("5. Checking for injected script elements...");
const scripts = document.querySelectorAll('script');
let foundInjectedScript = false;
scripts.forEach(script => {
    if (script.src && script.src.includes('injected.js')) {
        foundInjectedScript = true;
        console.log("✅ Found injected script:", script.src);
    }
});
if (!foundInjectedScript) {
    console.log("❌ No injected script found");
}

// Test 6: Check for Gemini panel
console.log("6. Testing Gemini panel...");
const geminiPanel = document.getElementById('gemini-talent-utility-panel');
if (geminiPanel) {
    console.log("✅ Gemini panel element found:", geminiPanel);
    console.log("  - Display:", geminiPanel.style.display);
    console.log("  - Visibility:", geminiPanel.style.visibility);
} else {
    console.log("❌ Gemini panel element NOT found");
}

// Test 7: Test Gemini panel toggle
console.log("7. Testing Gemini panel toggle...");
try {
    chrome.runtime.sendMessage({ action: "toggleGeminiPanel" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Failed to toggle Gemini panel:", chrome.runtime.lastError.message);
        } else {
            console.log("✅ Gemini panel toggle response:", response);
        }
    });
} catch (error) {
    console.error("❌ Failed to send toggle message:", error);
}

// Test 8: Test keyboard shortcut registration
console.log("8. Testing extension commands...");
try {
    chrome.commands.getAll((commands) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Failed to get commands:", chrome.runtime.lastError.message);
        } else {
            console.log("✅ Available commands:");
            commands.forEach(cmd => {
                console.log(`  - ${cmd.name}: ${cmd.shortcut || 'No shortcut assigned'} - ${cmd.description}`);
            });
        }
    });
} catch (error) {
    console.log("❌ Commands API not available (run this from extension context)");
}

// Test 9: Test paste handler existence
console.log("9. Testing paste handler...");
if (window._smoothPasteHandler) {
    console.log("✅ Paste handler function exists");
} else {
    console.log("❌ Paste handler function NOT found");
}

// Test 10: Simulate keyboard events
console.log("10. Testing keyboard event simulation...");
function simulateKeyPress(key, ctrlKey = false, shiftKey = false) {
    const event = new KeyboardEvent('keydown', {
        key: key,
        ctrlKey: ctrlKey,
        shiftKey: shiftKey,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
    console.log(`  - Simulated: Ctrl=${ctrlKey}, Shift=${shiftKey}, Key=${key}`);
}

console.log("  Simulating Ctrl+Shift+Y (paste script)...");
simulateKeyPress('Y', true, true);

setTimeout(() => {
    console.log("  Simulating Ctrl+Shift+H (Gemini panel)...");
    simulateKeyPress('H', true, true);
}, 1000);

console.log("=== Test Complete ===");
console.log("\n📋 INSTRUCTIONS:");
console.log("1. Check the console for any error messages");
console.log("2. Try pressing Ctrl+Shift+Y on the page (should initialize paste script)");
console.log("3. Try pressing Ctrl+Shift+H on the page (should toggle Gemini panel)");
console.log("4. After opening Gemini panel, try Ctrl+Shift+Y again (should still work)");
console.log("5. Check if paste functionality works with Ctrl+V in the editor");
console.log("6. Make sure the extension is enabled and reloaded after updates");
console.log("\n🔧 TROUBLESHOOTING:");
console.log("- If paste script fails: Reload the page and try again");
console.log("- If Gemini panel doesn't open: Check extension permissions");
console.log("- If shortcuts conflict: Check chrome://extensions/shortcuts");
console.log("- If both fail: Reload extension at chrome://extensions/");