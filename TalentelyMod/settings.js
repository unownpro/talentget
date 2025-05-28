document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('modelSelect');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    const modelPreview = document.getElementById('modelPreview');

    // Model information database
    const modelInfo = {
        'gemini-2.5-flash-preview-05-20': {
            name: 'Gemini 2.5 Flash Preview',
            description: 'Latest model with adaptive thinking capabilities and cost efficiency. Supports audio, images, videos, and text inputs.',
            optimized: 'Adaptive thinking, cost efficiency'
        },
        'gemini-2.5-flash-preview-native-audio-dialog': {
            name: 'Gemini 2.5 Flash Native Audio Dialog',
            description: 'Advanced conversational AI with natural audio processing capabilities.',
            optimized: 'High quality, natural conversational audio outputs'
        },
        'gemini-2.5-flash-exp-native-audio-thinking-dialog': {
            name: 'Gemini 2.5 Flash Native Audio Thinking',
            description: 'Enhanced audio model with advanced thinking capabilities for complex conversations.',
            optimized: 'Natural conversational audio with thinking'
        },
        'gemini-2.5-flash-preview-tts': {
            name: 'Gemini 2.5 Flash TTS',
            description: 'Advanced text-to-speech generation with low latency and controllable output.',
            optimized: 'Low latency text-to-speech audio generation'
        },
        'gemini-2.5-pro-preview-05-06': {
            name: 'Gemini 2.5 Pro Preview',
            description: 'Most advanced reasoning model with enhanced thinking, multimodal understanding, and advanced coding capabilities.',
            optimized: 'Enhanced thinking, reasoning, multimodal understanding'
        },
        'gemini-2.5-pro-preview-tts': {
            name: 'Gemini 2.5 Pro TTS',
            description: 'Professional-grade text-to-speech with multi-speaker capabilities.',
            optimized: 'Professional text-to-speech generation'
        },
        'gemini-2.0-flash': {
            name: 'Gemini 2.0 Flash',
            description: 'Next generation model with cutting-edge features, enhanced speed, and realtime streaming capabilities.',
            optimized: 'Next generation features, speed, thinking'
        },
        'gemini-2.0-flash-preview-image-generation': {
            name: 'Gemini 2.0 Flash Image Generation',
            description: 'Specialized model for conversational image generation and editing tasks.',
            optimized: 'Conversational image generation and editing'
        },
        'gemini-2.0-flash-lite': {
            name: 'Gemini 2.0 Flash-Lite',
            description: 'Optimized for cost efficiency and low latency while maintaining good performance.',
            optimized: 'Cost efficiency and low latency'
        },
        'gemini-2.0-flash-live-001': {
            name: 'Gemini 2.0 Flash Live',
            description: 'Real-time bidirectional voice and video interactions with low latency.',
            optimized: 'Low-latency voice and video interactions'
        },
        'gemini-1.5-flash': {
            name: 'Gemini 1.5 Flash',
            description: 'Fast and versatile performance across diverse tasks. Excellent balance of speed and capability.',
            optimized: 'Fast and versatile performance'
        },
        'gemini-1.5-flash-8b': {
            name: 'Gemini 1.5 Flash-8B',
            description: 'Optimized for high volume processing and lower intelligence tasks with good efficiency.',
            optimized: 'High volume and lower intelligence tasks'
        },
        'gemini-1.5-pro': {
            name: 'Gemini 1.5 Pro',
            description: 'Advanced model for complex reasoning tasks requiring higher intelligence and deeper analysis.',
            optimized: 'Complex reasoning tasks requiring more intelligence'
        },
        'gemini-embedding-exp': {
            name: 'Gemini Embedding',
            description: 'Specialized model for measuring relatedness of text strings and creating embeddings.',
            optimized: 'Measuring relatedness of text strings'
        },
        'imagen-3.0-generate-002': {
            name: 'Imagen 3',
            description: 'Advanced image generation model capable of creating high-quality, detailed images from text prompts.',
            optimized: 'Advanced image generation'
        },
        'veo-2.0-generate-001': {
            name: 'Veo 2',
            description: 'High-quality video generation model that can create videos from text and image inputs.',
            optimized: 'High quality video generation'
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
                        chrome.tabs.sendMessage(tab.id, { 
                            action: "modelUpdated", 
                            model: selectedModel 
                        }).catch(() => {
                            // Ignore errors for tabs that don't have content script
                        });
                    });
                });
            }
        });
    });

    // Initialize preview with current selection
    updateModelPreview(modelSelect.value);
});