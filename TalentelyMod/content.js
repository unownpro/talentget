// Flag to track if script has been injected
let scriptInjected = false;

// Function to inject the paste script (existing functionality)
function injectPasteScript() {
  if (scriptInjected) {
    window.postMessage({ type: "REINITIALIZE_PASTE_SCRIPT" }, "*");
    return;
  }
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    scriptInjected = true;
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

window.addEventListener('load', () => {
  injectPasteScript();
});

// Observer for Next button (existing functionality)
const observeNextButton = () => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        const nextButtonSelectors = [
          'button.jss651.jss622.jss630.jss655',
          'button[aria-label="LOG IN"]',
          'button:has(span:contains("Next"))',
          'button > span.jss623'
        ];
        let nextButtons = [];
        for (const selector of nextButtonSelectors) {
          try {
            const buttons = Array.from(document.querySelectorAll(selector));
            if (buttons.length > 0) nextButtons = nextButtons.concat(buttons);
          } catch (e) { console.log(`Selector ${selector} failed: ${e.message}`); }
        }
        const buttonsByText = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Next'));
        nextButtons = nextButtons.concat(buttonsByText);
        try {
          const xpathResult = document.evaluate("/html/body/div[1]/div[1]/div/main/div/div/div[3]/div[2]/div/div[3]/button[5]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < xpathResult.snapshotLength; i++) nextButtons.push(xpathResult.snapshotItem(i));
        } catch (e) { console.log(`XPath selection failed: ${e.message}`); }
        nextButtons = Array.from(new Set(nextButtons));
        nextButtons.forEach(button => {
          if (!button.getAttribute('data-paste-listener')) {
            button.setAttribute('data-paste-listener', 'true');
            button.addEventListener('click', () => { setTimeout(() => { window.postMessage({ type: "REINITIALIZE_PASTE_SCRIPT" }, "*"); }, 500); });
            if (button.tagName.toLowerCase() !== 'button' && button.parentElement && button.parentElement.tagName.toLowerCase() === 'button') {
              if (!button.parentElement.getAttribute('data-paste-listener')) {
                button.parentElement.setAttribute('data-paste-listener', 'true');
                button.parentElement.addEventListener('click', () => { setTimeout(() => { window.postMessage({ type: "REINITIALIZE_PASTE_SCRIPT" }, "*"); }, 500); });
              }
            }
          }
        });
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeNextButton);
} else {
  observeNextButton();
}

// --- Gemini AI Panel ---
let geminiPanel = null;
let geminiPanelVisible = false;
const GEMINI_PANEL_ID = 'gemini-talent-utility-panel';
const EMBEDDED_API_KEY = 'AIzaSyB3SyM_RQgGqrLQ8qSOEn2DtUdDZvjFcK8';
let selectedModel = 'gemini-1.5-flash';
let conversationHistory = [];
let currentModelInfo = { name: 'Gemini 1.5 Flash', emoji: '✨' };

// Response caching for identical queries
const responseCache = new Map();
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Background request handling
let backgroundRequestQueue = [];
let isProcessingBackground = false;

// System prompt for enhanced responses - optimized for direct answers
const SYSTEM_PROMPT = {
  role: "user",
  parts: [{
    text: `You are an exceptional AI assistant optimized for direct, concise responses. Your core principles:

🎯 DIRECT RESPONSE APPROACH:
- For choice questions (A, B, C, D): Give the answer immediately, then brief explanation
- For coding problems: Provide solution code first, then minimal explanation
- For leetcode-style problems: Show optimized solution with time/space complexity
- For yes/no questions: Answer directly, then reasoning

🧠 CONCISE THINKING:
- Get straight to the point
- Avoid unnecessary introductory phrases
- Skip verbose explanations unless specifically requested
- Focus on actionable solutions

💡 OPTIMIZED RESPONSE STYLE:
- Start with the direct answer or solution
- Use markdown formatting for code: \`\`\`language\`\`\`
- Use **bold** for key points and answers
- Use bullet points (-) for quick lists
- Keep explanations brief and focused

🎨 EFFICIENT FORMATTING:
- Code blocks for all programming solutions
- Headers (##) only when organizing complex responses
- Minimal use of emojis (only when they add value)
- Prioritize readability over decoration

Remember: Speed and directness are key. Provide accurate, complete answers in the most concise way possible.`
  }]
};

// Simplified model database
const modelDatabase = {
  'gemini-2.5-flash-preview-05-20': { name: 'Gemini 2.5 Flash Preview', emoji: '🚀' },
  'gemini-2.5-flash-preview-native-audio-dialog': { name: 'Gemini 2.5 Audio Dialog', emoji: '🎤' },
  'gemini-2.5-flash-exp-native-audio-thinking-dialog': { name: 'Gemini 2.5 Audio Thinking', emoji: '🧠' },
  'gemini-2.5-flash-preview-tts': { name: 'Gemini 2.5 Flash TTS', emoji: '🔊' },
  'gemini-2.5-pro-preview-05-06': { name: 'Gemini 2.5 Pro Preview', emoji: '🏆' },
  'gemini-2.5-pro-preview-tts': { name: 'Gemini 2.5 Pro TTS', emoji: '🎵' },
  'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', emoji: '⭐' },
  'gemini-2.0-flash-preview-image-generation': { name: 'Gemini 2.0 Image Gen', emoji: '🎨' },
  'gemini-2.0-flash-lite': { name: 'Gemini 2.0 Flash-Lite', emoji: '💨' },
  'gemini-2.0-flash-live-001': { name: 'Gemini 2.0 Live', emoji: '🎥' },
  'gemini-1.5-flash': { name: 'Gemini 1.5 Flash', emoji: '✨' },
  'gemini-1.5-flash-8b': { name: 'Gemini 1.5 Flash-8B', emoji: '📊' },
  'gemini-1.5-pro': { name: 'Gemini 1.5 Pro', emoji: '💎' },
  'gemini-embedding-exp': { name: 'Gemini Embedding', emoji: '🔗' },
  'imagen-3.0-generate-002': { name: 'Imagen 3', emoji: '🖼️' },
  'veo-2.0-generate-001': { name: 'Veo 2', emoji: '🎬' }
};

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>');
  
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraphs if not already wrapped
  if (!html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<ul>') && !html.includes('<pre>')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
}

function updateModelInfo(model) {
  currentModelInfo = modelDatabase[model] || { name: model, emoji: '🤖' };
  if (geminiPanel) {
    const titleElement = geminiPanel.querySelector('.panel-title');
    if (titleElement) titleElement.textContent = currentModelInfo.name;
  }
}

// Clear conversation function
function clearConversation() {
  // Reset conversation history to just the system prompt
  conversationHistory = [SYSTEM_PROMPT];
  
  // Clear the conversation UI
  const conversationArea = document.getElementById('gemini-conversation-area');
  if (conversationArea) {
    conversationArea.innerHTML = '';
  }
  
  // Clear response cache
  responseCache.clear();
  
  // Reset any background processing
  backgroundRequestQueue = [];
  isProcessingBackground = false;
  
  console.log('Conversation cleared');
}

// Generate cache key from conversation history
function generateCacheKey(prompt, history) {
  const historyString = JSON.stringify(history.slice(-5)); // Last 5 messages for context
  const input = prompt + historyString;
  
  // Simple Unicode-safe hash function
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to base36 string (alphanumeric) and take first 50 characters
  return Math.abs(hash).toString(36).padStart(8, '0').substring(0, 50);
}

// Check cache for existing response
function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.response;
  }
  if (cached) {
    responseCache.delete(key); // Remove expired cache
  }
  return null;
}

// Store response in cache
function setCachedResponse(key, response) {
  responseCache.set(key, {
    response: response,
    timestamp: Date.now()
  });
  
  // Limit cache size to prevent memory issues
  if (responseCache.size > 50) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}

function createGeminiPanel() {
  if (document.getElementById(GEMINI_PANEL_ID)) {
    geminiPanel = document.getElementById(GEMINI_PANEL_ID);
    return;
  }

  // Create minimalist panel
  geminiPanel = document.createElement('div');
  geminiPanel.id = GEMINI_PANEL_ID;
  
  // Force light theme styling with !important declarations
  const panelStyles = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 400px !important;
    height: 600px !important;
    background: #ffffff !important;
    border: 1px solid #e1e5e9 !important;
    border-radius: 8px !important;
    z-index: 2147483647 !important;
    display: none;
    flex-direction: column !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    overflow: hidden !important;
    resize: both !important;
    min-width: 320px !important;
    min-height: 400px !important;
    max-width: 800px !important;
    max-height: 90vh !important;
    color: #202124 !important;
    box-sizing: border-box !important;
  `;
  
  geminiPanel.style.cssText = panelStyles;

  // Force light theme header
  const header = document.createElement('div');
  header.style.cssText = `
    background: #f8f9fa !important;
    padding: 12px 16px !important;
    border-bottom: 1px solid #e1e5e9 !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    color: #495057 !important;
    box-sizing: border-box !important;
  `;

  const title = document.createElement('span');
  title.className = 'panel-title';
  title.textContent = currentModelInfo.name;
  title.style.cssText = 'font-weight: 500 !important; font-size: 14px !important; color: #495057 !important;';

  // Create button container for settings and clear buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex !important;
    gap: 8px !important;
    align-items: center !important;
  `;

  // Clear conversation button
  const clearButton = document.createElement('button');
  clearButton.innerHTML = '🗑️';
  clearButton.title = 'Clear Conversation';
  clearButton.style.cssText = `
    background: none !important;
    border: none !important;
    font-size: 16px !important;
    cursor: pointer !important;
    padding: 4px !important;
    border-radius: 4px !important;
    opacity: 0.7 !important;
    transition: opacity 0.2s !important;
    color: #495057 !important;
    box-sizing: border-box !important;
  `;
  
  clearButton.onmouseover = () => {
    clearButton.style.opacity = '1';
    clearButton.style.background = '#f1f3f4 !important';
  };
  clearButton.onmouseout = () => {
    clearButton.style.opacity = '0.7';
    clearButton.style.background = 'none !important';
  };
  clearButton.onclick = clearConversation;

  const settingsButton = document.createElement('button');
  settingsButton.innerHTML = '⚙️';
  settingsButton.title = 'Settings';
  settingsButton.style.cssText = `
    background: none !important;
    border: none !important;
    font-size: 16px !important;
    cursor: pointer !important;
    padding: 4px !important;
    border-radius: 4px !important;
    opacity: 0.7 !important;
    transition: opacity 0.2s !important;
    color: #495057 !important;
    box-sizing: border-box !important;
  `;
  
  settingsButton.onmouseover = () => {
    settingsButton.style.opacity = '1';
    settingsButton.style.background = '#f1f3f4 !important';
  };
  settingsButton.onmouseout = () => {
    settingsButton.style.opacity = '0.7';
    settingsButton.style.background = 'none !important';
  };

  settingsButton.onclick = () => {
    try {
      chrome.runtime.sendMessage({ action: "openOptionsPage" }, (response) => {
        if (chrome.runtime.lastError) {
          window.open(chrome.runtime.getURL('settings.html'), '_blank');
        }
      });
    } catch (error) {
      window.open(chrome.runtime.getURL('settings.html'), '_blank');
    }
  };

  buttonContainer.appendChild(clearButton);
  buttonContainer.appendChild(settingsButton);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  geminiPanel.appendChild(header);

  // Conversation area with forced light theme
  const conversationArea = document.createElement('div');
  conversationArea.id = 'gemini-conversation-area';
  conversationArea.style.cssText = `
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 16px !important;
    background: #ffffff !important;
    color: #202124 !important;
    box-sizing: border-box !important;
  `;
  
  // Force light theme scrollbar and content styling
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = `
    #${GEMINI_PANEL_ID} #gemini-conversation-area::-webkit-scrollbar {
      width: 6px !important;
    }
    #${GEMINI_PANEL_ID} #gemini-conversation-area::-webkit-scrollbar-track {
      background: #f1f3f4 !important;
    }
    #${GEMINI_PANEL_ID} #gemini-conversation-area::-webkit-scrollbar-thumb {
      background: #dadce0 !important;
      border-radius: 3px !important;
    }
    #${GEMINI_PANEL_ID} #gemini-conversation-area::-webkit-scrollbar-thumb:hover {
      background: #bdc1c6 !important;
    }
    
    /* Force light theme for all panel content */
    #${GEMINI_PANEL_ID} * {
      color: #202124 !important;
      box-sizing: border-box !important;
    }
    
    /* Markdown styling with forced light theme */
    #${GEMINI_PANEL_ID} .markdown-content h1,
    #${GEMINI_PANEL_ID} .markdown-content h2,
    #${GEMINI_PANEL_ID} .markdown-content h3 {
      margin: 16px 0 8px 0 !important;
      font-weight: 600 !important;
      line-height: 1.3 !important;
    }
    #${GEMINI_PANEL_ID} .markdown-content h1 { font-size: 1.25em !important; color: #1a73e8 !important; }
    #${GEMINI_PANEL_ID} .markdown-content h2 { font-size: 1.15em !important; color: #1967d2 !important; }
    #${GEMINI_PANEL_ID} .markdown-content h3 { font-size: 1.1em !important; color: #1557b0 !important; }
    #${GEMINI_PANEL_ID} .markdown-content strong { font-weight: 600 !important; color: #202124 !important; }
    #${GEMINI_PANEL_ID} .markdown-content em { font-style: italic !important; color: #5f6368 !important; }
    #${GEMINI_PANEL_ID} .markdown-content code {
      background: #f8f9fa !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      font-family: 'SF Mono', Monaco, monospace !important;
      font-size: 0.9em !important;
      color: #d73a49 !important;
    }
    #${GEMINI_PANEL_ID} .markdown-content pre {
      background: #f8f9fa !important;
      padding: 12px !important;
      border-radius: 6px !important;
      overflow-x: auto !important;
      margin: 8px 0 !important;
      border-left: 3px solid #1a73e8 !important;
    }
    #${GEMINI_PANEL_ID} .markdown-content pre code {
      background: none !important;
      padding: 0 !important;
      color: #24292e !important;
    }
    #${GEMINI_PANEL_ID} .markdown-content ul,
    #${GEMINI_PANEL_ID} .markdown-content ol {
      margin: 8px 0 !important;
      padding-left: 20px !important;
    }
    #${GEMINI_PANEL_ID} .markdown-content li {
      margin: 4px 0 !important;
      line-height: 1.5 !important;
      color: #202124 !important;
    }
    #${GEMINI_PANEL_ID} .markdown-content p {
      margin: 8px 0 !important;
      line-height: 1.6 !important;
      color: #202124 !important;
    }
  `;
  document.head.appendChild(scrollbarStyle);
  
  geminiPanel.appendChild(conversationArea);

  // Force light theme input area
  const inputArea = document.createElement('div');
  inputArea.style.cssText = `
    padding: 12px 16px !important;
    background: #ffffff !important;
    border-top: 1px solid #e1e5e9 !important;
    box-sizing: border-box !important;
  `;

  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    display: flex !important;
    gap: 8px !important;
    align-items: flex-end !important;
    border: 1px solid #dadce0 !important;
    border-radius: 24px !important;
    padding: 4px !important;
    transition: border-color 0.2s !important;
    background: #ffffff !important;
    box-sizing: border-box !important;
  `;

  const promptInput = document.createElement('textarea');
  promptInput.id = 'gemini-prompt-input';
  promptInput.placeholder = 'Ask anything...';
  promptInput.style.cssText = `
    flex: 1 !important;
    border: none !important;
    background: #ffffff !important;
    resize: none !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    max-height: 100px !important;
    min-height: 20px !important;
    outline: none !important;
    padding: 8px 12px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: #202124 !important;
    box-sizing: border-box !important;
  `;
  promptInput.rows = 1;

  // Auto-resize textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 100) + 'px';
  });

  // Focus styling with forced colors
  promptInput.addEventListener('focus', () => {
    inputContainer.style.borderColor = '#1a73e8';
    inputContainer.style.background = '#ffffff';
  });
  
  promptInput.addEventListener('blur', () => {
    inputContainer.style.borderColor = '#dadce0';
    inputContainer.style.background = '#ffffff';
  });

  const sendButton = document.createElement('button');
  sendButton.innerHTML = '→';
  sendButton.id = 'gemini-send-button';
  sendButton.style.cssText = `
    background: #1a73e8 !important;
    border: none !important;
    border-radius: 20px !important;
    width: 32px !important;
    height: 32px !important;
    cursor: pointer !important;
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: bold !important;
    transition: background-color 0.2s !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  `;

  sendButton.onmouseover = () => {
    sendButton.style.background = '#1557b0 !important';
    sendButton.style.color = '#ffffff !important';
  };
  sendButton.onmouseout = () => {
    sendButton.style.background = '#1a73e8 !important';
    sendButton.style.color = '#ffffff !important';
  };

  inputContainer.appendChild(promptInput);
  inputContainer.appendChild(sendButton);
  inputArea.appendChild(inputContainer);
  geminiPanel.appendChild(inputArea);

  document.body.appendChild(geminiPanel);

  // Event listeners
  sendButton.addEventListener('click', handleSendPrompt);
  promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  });

  // Load model selection and initialize
  loadModelSelection();
}

function loadModelSelection() {
  chrome.storage.sync.get(['selectedModel'], (result) => {
    console.log('Loading model selection from storage:', result);
    if (result.selectedModel) {
      selectedModel = result.selectedModel;
      updateModelInfo(selectedModel);
      console.log('Model loaded successfully:', selectedModel);
    } else {
      console.log('No model selection found, using default');
      selectedModel = 'gemini-1.5-flash';
      updateModelInfo(selectedModel);
    }
    
    // Initialize conversation with system message (without displaying "Ready to help")
    conversationHistory = [SYSTEM_PROMPT];
    // Removed the "Ready to help" system message display
  });
}

function addMessageToConversation(sender, text, type = 'user') {
  const conversationArea = document.getElementById('gemini-conversation-area');
  if (!conversationArea) return;

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 16px !important;
    word-wrap: break-word !important;
    color: #202124 !important;
    box-sizing: border-box !important;
  `;

  let messageContent = '';
  
  if (type === 'user') {
    messageContent = `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 4px;">
        <div style="
          background: #1a73e8 !important;
          color: #ffffff !important;
          padding: 8px 12px !important;
          border-radius: 18px 18px 4px 18px !important;
          max-width: 80% !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          box-sizing: border-box !important;
        ">
          ${text}
        </div>
      </div>
    `;
  } else if (type === 'model') {
    const htmlContent = markdownToHtml(text);
    messageContent = `
      <div style="display: flex; justify-content: flex-start; margin-bottom: 4px;">
        <div style="
          background: #f8f9fa !important;
          color: #202124 !important;
          padding: 12px 16px !important;
          border-radius: 18px 18px 18px 4px !important;
          max-width: 85% !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          border: 1px solid #e8eaed !important;
          box-sizing: border-box !important;
        ">
          <div style="font-size: 12px !important; color: #5f6368 !important; margin-bottom: 8px !important; font-weight: 500 !important;">
            ${currentModelInfo.emoji} ${currentModelInfo.name}
          </div>
          <div class="markdown-content">${htmlContent}</div>
        </div>
      </div>
    `;
  } else { // System message
    messageContent = `
      <div style="display: flex; justify-content: center; margin: 12px 0;">
        <div style="
          background: #e8f0fe !important;
          color: #1a73e8 !important;
          padding: 6px 12px !important;
          border-radius: 12px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          box-sizing: border-box !important;
        ">
          ${text}
        </div>
      </div>
    `;
  }

  messageDiv.innerHTML = messageContent;
  fragment.appendChild(messageDiv);
  
  // Single DOM operation for better performance
  conversationArea.appendChild(fragment);
  
  // Optimized scrolling - use requestAnimationFrame for smooth scrolling
  requestAnimationFrame(() => {
    conversationArea.scrollTop = conversationArea.scrollHeight;
  });
}

function showTypingIndicator() {
  const conversationArea = document.getElementById('gemini-conversation-area');
  if (!conversationArea) return;

  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div style="display: flex; justify-content: flex-start; margin-bottom: 4px;">
      <div style="
        background: #f8f9fa !important;
        color: #5f6368 !important;
        padding: 8px 12px !important;
        border-radius: 18px 18px 18px 4px !important;
        border: 1px solid #e8eaed !important;
        font-size: 14px !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        box-sizing: border-box !important;
      ">
        <span style="color: #5f6368 !important;">●</span>
        <span style="color: #5f6368 !important;">●</span>
        <span style="color: #5f6368 !important;">●</span>
      </div>
    </div>
  `;
  
  // Add simple animation
  const dots = typingDiv.querySelectorAll('span');
  let current = 0;
  const interval = setInterval(() => {
    dots.forEach((dot, index) => {
      dot.style.opacity = index === current ? '1' : '0.3';
    });
    current = (current + 1) % dots.length;
  }, 500);
  
  typingDiv.dataset.interval = interval;
  conversationArea.appendChild(typingDiv);
  conversationArea.scrollTop = conversationArea.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    if (typingIndicator.dataset.interval) {
      clearInterval(parseInt(typingIndicator.dataset.interval));
    }
    typingIndicator.remove();
  }
}

async function handleSendPrompt(isBackground = false) {
  const promptInput = document.getElementById('gemini-prompt-input');
  const sendButton = document.getElementById('gemini-send-button');
  const promptText = promptInput.value.trim();

  if (!promptText) return;

  // Check cache first for identical queries
  const cacheKey = generateCacheKey(promptText, conversationHistory);
  const cachedResponse = getCachedResponse(cacheKey);
  
  if (cachedResponse) {
    console.log('Using cached response for:', promptText.substring(0, 50));
    addMessageToConversation('You', promptText, 'user');
    conversationHistory.push({ role: "user", parts: [{ text: promptText }] });
    addMessageToConversation('AI', cachedResponse, 'model');
    conversationHistory.push({ role: "model", parts: [{ text: cachedResponse }] });
    
    if (!isBackground) {
      promptInput.value = '';
      promptInput.style.height = 'auto';
      promptInput.focus();
    }
    return;
  }

  // Add user message
  addMessageToConversation('You', promptText, 'user');
  conversationHistory.push({ role: "user", parts: [{ text: promptText }] });
  
  // Clear input and disable controls only if not background
  if (!isBackground) {
    promptInput.value = '';
    promptInput.style.height = 'auto';
    promptInput.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '⋯';
    
    // Show typing indicator
    showTypingIndicator();
  }

  try {
    // Optimized API call with reduced timeout for faster responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${EMBEDDED_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      }),
    });

    clearTimeout(timeoutId);
    
    if (!isBackground) {
      removeTypingIndicator();
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      addMessageToConversation('Error', `API Error: ${errorData.error?.message || response.statusText}`, 'system');
      conversationHistory.pop();
      return;
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      const modelResponse = data.candidates[0].content.parts[0].text;
      addMessageToConversation('AI', modelResponse, 'model');
      conversationHistory.push({ role: "model", parts: [{ text: modelResponse }] });
      
      // Cache the response for future use
      setCachedResponse(cacheKey, modelResponse);
    } else if (data.promptFeedback && data.promptFeedback.blockReason) {
      addMessageToConversation('System', `Response blocked: ${data.promptFeedback.blockReason}`, 'system');
    } else {
      addMessageToConversation('System', 'Received an empty or unexpected response', 'system');
    }

  } catch (error) {
    if (!isBackground) {
      removeTypingIndicator();
    }
    console.error('Error calling Gemini API:', error);
    if (error.name === 'AbortError') {
      addMessageToConversation('System', 'Request timed out. Please try again.', 'system');
    } else {
      addMessageToConversation('System', `Network Error: ${error.message}`, 'system');
    }
    conversationHistory.pop();
  } finally {
    // Re-enable controls only if not background
    if (!isBackground) {
      promptInput.disabled = false;
      sendButton.disabled = false;
      sendButton.innerHTML = '→';
      promptInput.focus();
    }
  }
}

function toggleGeminiPanel() {
  if (!geminiPanel) {
    createGeminiPanel();
  }
  
  geminiPanelVisible = !geminiPanelVisible;
  geminiPanel.style.display = geminiPanelVisible ? 'flex' : 'none';
  
  if (geminiPanelVisible) {
    document.getElementById('gemini-prompt-input')?.focus();
    // Refresh model selection
    loadModelSelection();
  }
  
  console.log(`Gemini panel toggled: ${geminiPanelVisible ? 'visible' : 'hidden'}`);
}

// Create panel on load but keep hidden
createGeminiPanel();

// Background request processing
async function processBackgroundQueue() {
  if (isProcessingBackground || backgroundRequestQueue.length === 0) return;
  
  isProcessingBackground = true;
  console.log('Processing background queue:', backgroundRequestQueue.length, 'requests');
  
  while (backgroundRequestQueue.length > 0) {
    const request = backgroundRequestQueue.shift();
    try {
      // Set the prompt input temporarily for processing
      const promptInput = document.getElementById('gemini-prompt-input');
      if (promptInput) {
        const originalValue = promptInput.value;
        promptInput.value = request.prompt;
        await handleSendPrompt(true); // Background mode
        promptInput.value = originalValue;
      }
    } catch (error) {
      console.error('Background request failed:', error);
    }
  }
  
  isProcessingBackground = false;
}

// Enhanced keyboard shortcut handling for background requests
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+H for background AI request
  if (e.ctrlKey && e.shiftKey && e.key === 'H') {
    e.preventDefault();
    
    // Try to get selected text or focused input value
    let selectedText = window.getSelection().toString().trim();
    
    if (!selectedText) {
      // Try to get text from focused input/textarea
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        selectedText = activeElement.value.trim();
      }
    }
    
    if (selectedText) {
      console.log('Background AI request triggered for:', selectedText.substring(0, 50));
      
      // Add to background queue for processing
      backgroundRequestQueue.push({
        prompt: selectedText,
        timestamp: Date.now()
      });
      
      // Process queue if not already processing
      processBackgroundQueue();
      
      // Show the panel to display results
      if (!geminiPanelVisible) {
        toggleGeminiPanel();
      }
    } else {
      console.log('No text selected for background AI request');
    }
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPasteScript") {
    injectPasteScript();
    sendResponse({ status: "Script executed" });
  } else if (message.action === "getStatus") {
    sendResponse({ status: scriptInjected ? "Active" : "Inactive" });
  } else if (message.action === "toggleGeminiPanel") {
    toggleGeminiPanel();
    sendResponse({ status: "Gemini panel toggled", visible: geminiPanelVisible });
  } else if (message.action === "backgroundRequest") {
    // Handle background AI requests from other parts of the extension
    if (message.prompt) {
      backgroundRequestQueue.push({
        prompt: message.prompt,
        timestamp: Date.now()
      });
      processBackgroundQueue();
      sendResponse({ status: "Background request queued" });
    }
  } else if (message.action === "modelUpdated") {
    // Handle model updates from settings
    selectedModel = message.model;
    updateModelInfo(selectedModel);
    console.log('Model updated from settings:', selectedModel);
    if (geminiPanelVisible) {
      addMessageToConversation('System', `Model updated to ${currentModelInfo.name}`, 'system');
    }
    sendResponse({ status: "Model updated" });
  }
  return true;
});
