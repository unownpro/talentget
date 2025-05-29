document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('modelSelect');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    const modelPreview = document.getElementById('modelPreview');

    // Model information database - Only text generation models
    const modelInfo = {
        'gemini-1.5-flash': {
            name: 'Gemini 1.5 Flash',
            description: 'Fast and versatile performance across diverse tasks. Excellent balance of speed and capability for text generation.',
            optimized: 'Fast text generation, coding assistance, general questions'
        },
        'gemini-1.5-flash-8b': {
            name: 'Gemini 1.5 Flash-8B',
            description: 'Optimized for high volume text processing and simpler tasks with good efficiency.',
            optimized: 'High volume text processing, simple questions'
        },
        'gemini-1.5-pro': {
            name: 'Gemini 1.5 Pro',
            description: 'Advanced model for complex reasoning tasks requiring higher intelligence and deeper text analysis.',
            optimized: 'Complex reasoning, detailed analysis, advanced coding'
        },
        'gemini-2.0-flash': {
            name: 'Gemini 2.0 Flash',
            description: 'Latest generation model with enhanced speed and improved text generation capabilities.',
            optimized: 'Enhanced text generation, improved reasoning, latest features'
        },
        'gemini-2.5-flash-preview-05-20': {
            name: 'Gemini 2.5 Flash Preview',
            description: 'Latest model with adaptive thinking capabilities and cost efficiency. Supports text generation with enhanced performance.',
            optimized: 'Adaptive thinking, cost efficiency, advanced text generation'
        },
        'gemini-2.5-pro-preview-05-06': {
            name: 'Gemini 2.5 Pro Preview',
            description: 'Most advanced reasoning model with enhanced thinking, multimodal understanding, and advanced text generation capabilities.',
            optimized: 'Enhanced thinking, reasoning, complex text analysis'
        }
    };

    // Update model preview
    function updateModelPreview(modelValue) {
        const info = modelInfo[modelValue];
        if (info) {
            modelPreview.innerHTML = `
                <h4>📝 ${info.name}</h4>
                <p><strong>Description:</strong> ${info.description}</p>
                <p><strong>Optimized for:</strong> ${info.optimized}</p>
            `;
        } else {
            modelPreview.innerHTML = `
                <h4>📝 Selected Model Info</h4>
                <p>Model information not available.</p>
            `;
        }
    }

    // Show status message
    function showStatus(message, isSuccess = true) {
        statusDiv.textContent = message;
        statusDiv.className = isSuccess ? 'status-success' : 'status-error';
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Load saved model selection
    chrome.storage.sync.get(['selectedModel'], (result) => {
        console.log('Settings page - Loading model selection from storage:', result);
        if (result.selectedModel) {
            modelSelect.value = result.selectedModel;
            updateModelPreview(result.selectedModel);
            console.log('Settings page - Model selection loaded:', result.selectedModel);
        } else {
            console.log('Settings page - No model selection found, using default');
            modelSelect.value = 'gemini-1.5-flash';
            updateModelPreview('gemini-1.5-flash');
        }
    });

    // Update preview when model changes
    modelSelect.addEventListener('change', (e) => {
        updateModelPreview(e.target.value);
    });

    // Save model selection
    saveButton.addEventListener('click', () => {
        const selectedModel = modelSelect.value;
        console.log('Settings page - Attempting to save model selection:', selectedModel);
        
        // Add loading state
        saveButton.textContent = '💾 Saving...';
        saveButton.disabled = true;
        
        chrome.storage.sync.set({ selectedModel: selectedModel }, () => {
            saveButton.textContent = '💾 Save Settings';
            saveButton.disabled = false;
            
            if (chrome.runtime.lastError) {
                console.error('Settings page - Error saving model selection:', chrome.runtime.lastError);
                showStatus('❌ Error saving settings: ' + chrome.runtime.lastError.message, false);
            } else {
                console.log('Settings page - Model selection saved successfully');
                showStatus('✅ Settings saved successfully!', true);
                
                // Notify content scripts about model change
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                action: "modelUpdated",
                                model: selectedModel
                            }, (response) => {
                                if (chrome.runtime.lastError) {
                                    // Silently ignore errors for tabs without content script
                                    console.log(`Content script not available on tab ${tab.id}`);
                                } else {
                                    console.log(`Model update sent to tab ${tab.id}:`, response);
                                }
                            });
                        }
                    });
                });
            }
        });
    });

    // Initialize preview with current selection
    updateModelPreview(modelSelect.value);
});