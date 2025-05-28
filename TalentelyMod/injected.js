// This script is injected into the page to handle the smooth paste functionality
(function() {
    // Keep track of whether our paste handler is initialized
    let isPasteHandlerInitialized = false;
    
    // Initialize the paste handler
    function initializePasteHandler() {
        // Only initialize once to avoid duplicate event listeners
        if (isPasteHandlerInitialized) {
            removePasteHandler();
        }
        
        // Find the editor element - make sure this selector matches the editor on the target site
        const editorElement = document.getElementById('editor');
        if (!editorElement || typeof ace === 'undefined') {
            // If we can't find the editor or the ace library, try again after a short delay
            console.log("Editor not found, retrying...");
            setTimeout(initializePasteHandler, 500);
            return;
        }
        
        // Get the editor instance
        const editor = ace.edit("editor");
        
        // Create our custom paste handler
        function handlePaste(e) {
            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                e.stopPropagation();
                
                navigator.clipboard.readText().then(text => {
                    const cursorPosition = editor.getCursorPosition();
                    const lines = text.split('\n');
                    let totalDelay = 0;
                    
                    lines.forEach((line, lineIndex) => {
                        // Split line into 13-character chunks while preserving words
                        const chunks = line.match(/(.{1,13}(?:\\s|$))|(.{1,13})/g) || [''];
                        
                        chunks.forEach((chunk, chunkIndex) => {
                            setTimeout(() => {
                                editor.session.insert(editor.getCursorPosition(), chunk);
                                
                                // Add newline if this is the last chunk of the line
                                if (chunkIndex === chunks.length - 1 && lineIndex < lines.length - 1) {
                                    editor.session.insert(editor.getCursorPosition(), '\n');
                                }
                                
                                editor.focus();
                            }, totalDelay);
                            
                            totalDelay += 30; // Reduced delay for smoother pasting
                        });
                    });
                }).catch(err => {
                    console.error("Failed to read clipboard: ", err);
                });
            }
        }
        
        // Add the event listener to the editor
        editorElement.addEventListener('keydown', handlePaste, true);
        
        // Store the handler for later removal if needed
        window._smoothPasteHandler = handlePaste;
        isPasteHandlerInitialized = true;
        
        console.log("Smooth paste handler initialized");
    }
    
    // Clean up any existing handlers
    function removePasteHandler() {
        const editorElement = document.getElementById('editor');
        if (editorElement && window._smoothPasteHandler) {
            editorElement.removeEventListener('keydown', window._smoothPasteHandler, true);
            isPasteHandlerInitialized = false;
            console.log("Removed previous paste handler");
        }
    }
    
    // Initialize on load
    initializePasteHandler();
    
    // Listen for messages to reinitialize
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'REINITIALIZE_PASTE_SCRIPT') {
            console.log("Reinitializing paste handler");
            // Wait a short time for any DOM updates to complete
            setTimeout(initializePasteHandler, 500);
        }
    });
})();
