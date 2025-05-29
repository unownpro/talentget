// Test script for Gemini UI functionality
// Run this in the browser console to test the Gemini chat UI

console.log("=== Gemini UI Test Script ===");

// Test 1: Check if Gemini panel exists
console.log("1. Testing Gemini panel existence...");
const geminiPanel = document.getElementById('gemini-talent-utility-panel');
if (geminiPanel) {
    console.log("✅ Gemini panel found");
    console.log("  - Display:", geminiPanel.style.display);
    console.log("  - Visibility:", getComputedStyle(geminiPanel).visibility);
} else {
    console.log("❌ Gemini panel NOT found");
}

// Test 2: Check input and button elements
console.log("2. Testing UI elements...");
const promptInput = document.getElementById('gemini-prompt-input');
const sendButton = document.getElementById('gemini-send-button');
const conversationArea = document.getElementById('gemini-conversation-area');

if (promptInput) {
    console.log("✅ Prompt input found");
    console.log("  - Disabled:", promptInput.disabled);
    console.log("  - Value:", promptInput.value);
} else {
    console.log("❌ Prompt input NOT found");
}

if (sendButton) {
    console.log("✅ Send button found");
    console.log("  - Disabled:", sendButton.disabled);
    console.log("  - Text:", sendButton.innerHTML);
} else {
    console.log("❌ Send button NOT found");
}

if (conversationArea) {
    console.log("✅ Conversation area found");
    console.log("  - Children count:", conversationArea.children.length);
} else {
    console.log("❌ Conversation area NOT found");
}

// Test 3: Test panel toggle
console.log("3. Testing panel toggle...");
function testPanelToggle() {
    try {
        // Simulate Ctrl+Shift+H
        const event = new KeyboardEvent('keydown', {
            key: 'H',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
        console.log("✅ Panel toggle event dispatched");
        
        setTimeout(() => {
            const panel = document.getElementById('gemini-talent-utility-panel');
            if (panel) {
                console.log("  - Panel display after toggle:", panel.style.display);
            }
        }, 100);
    } catch (error) {
        console.log("❌ Panel toggle failed:", error);
    }
}

testPanelToggle();

// Test 4: Test input clearing
console.log("4. Testing input behavior...");
function testInputClearing() {
    const input = document.getElementById('gemini-prompt-input');
    if (input) {
        // Set test text
        input.value = "Test message for clearing";
        console.log("  - Set test text:", input.value);
        
        // Simulate send action
        input.dispatchEvent(new Event('input'));
        
        // Check if text clears when send button is clicked
        const sendBtn = document.getElementById('gemini-send-button');
        if (sendBtn) {
            console.log("  - Testing send button click...");
            sendBtn.click();
            
            setTimeout(() => {
                console.log("  - Input value after send:", input.value);
                console.log("  - Input disabled after send:", input.disabled);
                console.log("  - Send button disabled after send:", sendBtn.disabled);
            }, 100);
        }
    } else {
        console.log("❌ No input element to test");
    }
}

// Wait a bit before testing input to ensure panel is ready
setTimeout(testInputClearing, 500);

// Test 5: Test manual prompt sending
console.log("5. Testing manual prompt sending...");
function testManualPrompt() {
    const input = document.getElementById('gemini-prompt-input');
    if (input) {
        input.value = "Hello, this is a test message";
        
        // Try to manually trigger the send function
        if (typeof handleSendPrompt === 'function') {
            console.log("  - handleSendPrompt function found, testing...");
            try {
                handleSendPrompt(false);
                console.log("✅ Manual prompt send attempted");
            } catch (error) {
                console.log("❌ Manual prompt send failed:", error);
            }
        } else {
            console.log("❌ handleSendPrompt function not found in global scope");
        }
    }
}

setTimeout(testManualPrompt, 1000);

// Test 6: Check for error handling
console.log("6. Testing error scenarios...");
function testErrorHandling() {
    // Test with empty prompt
    const input = document.getElementById('gemini-prompt-input');
    const sendBtn = document.getElementById('gemini-send-button');
    
    if (input && sendBtn) {
        input.value = "";
        sendBtn.click();
        console.log("  - Tested empty prompt submission");
        
        // Test with very long prompt
        input.value = "A".repeat(1000);
        console.log("  - Set very long prompt (1000 chars)");
        
        setTimeout(() => {
            sendBtn.click();
            console.log("  - Tested long prompt submission");
        }, 200);
    }
}

setTimeout(testErrorHandling, 1500);

// Test 7: Monitor conversation updates
console.log("7. Setting up conversation monitor...");
function monitorConversation() {
    const conversationArea = document.getElementById('gemini-conversation-area');
    if (conversationArea) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    console.log("📝 Conversation updated:");
                    console.log("  - Added nodes:", mutation.addedNodes.length);
                    console.log("  - Removed nodes:", mutation.removedNodes.length);
                    console.log("  - Total messages:", conversationArea.children.length);
                }
            });
        });
        
        observer.observe(conversationArea, {
            childList: true,
            subtree: true
        });
        
        console.log("✅ Conversation monitor active");
        
        // Stop monitoring after 30 seconds
        setTimeout(() => {
            observer.disconnect();
            console.log("🔇 Conversation monitor stopped");
        }, 30000);
    }
}

setTimeout(monitorConversation, 2000);

console.log("=== Test Setup Complete ===");
console.log("\n📋 MANUAL TESTS TO PERFORM:");
console.log("1. Press Ctrl+Shift+H to toggle the Gemini panel");
console.log("2. Type a message in the input field");
console.log("3. Press Enter or click Send button");
console.log("4. Verify text clears from input after sending");
console.log("5. Check if you receive a response from Gemini");
console.log("6. Try sending multiple messages in succession");
console.log("7. Check console for any error messages");

console.log("\n🔧 WHAT TO LOOK FOR:");
console.log("✅ Input field clears immediately after sending");
console.log("✅ Send button shows '⋯' while processing");
console.log("✅ Typing indicator appears while waiting for response");
console.log("✅ Response appears in conversation area");
console.log("✅ No 'Received an empty or unexpected response' errors");
console.log("✅ Input field re-enables after response received");