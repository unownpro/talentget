// This script is injected into the page to handle the smooth paste functionality
(function() {
    // Keep track of whether our paste handler is initialized
    let isPasteHandlerInitialized = false;
    
    // Initialize the paste handler
    function initializePasteHandler() {
        console.log("initializePasteHandler called, isPasteHandlerInitialized:", isPasteHandlerInitialized); // Added diagnostic logging
        
        // Only initialize once to avoid duplicate event listeners
        if (isPasteHandlerInitialized) {
            console.log("Handler already initialized, removing previous one"); // Added diagnostic logging
            removePasteHandler();
        }
        
        // Find the editor element - make sure this selector matches the editor on the target site
        const editorElement = document.getElementById('editor');
        console.log("Editor element found:", !!editorElement, "Ace defined:", typeof ace !== 'undefined'); // Added diagnostic logging
        
        if (!editorElement || typeof ace === 'undefined') {
            // If we can't find the editor or the ace library, try again after a short delay
            console.log("Editor not found or ace undefined, retrying in 500ms...");
            setTimeout(initializePasteHandler, 500);
            return;
        }
        
        // Get the editor instance
        let editor;
        try {
            editor = ace.edit("editor");
        } catch (error) {
            console.error("Failed to get ace editor instance:", error);
            setTimeout(initializePasteHandler, 500);
            return;
        }
        
        // Create our custom paste handler
        function handlePaste(e) {
            if (e.ctrlKey && e.key === 'v') {
                console.log("Ctrl+V detected in paste handler"); // Added diagnostic logging
                e.preventDefault();
                e.stopPropagation();
                
                navigator.clipboard.readText().then(text => {
                    console.log("Clipboard text read, length:", text.length); // Added diagnostic logging
                    const cursorPosition = editor.getCursorPosition();
                    const lines = text.split('\n');
                    let totalDelay = 0;
                    
                    lines.forEach((line, lineIndex) => {
                        // Split line into 13-character chunks while preserving words
                        const chunks = line.match(/(.{1,13}(?:\\s|$))|(.{1,13})/g) || [''];
                        
                        chunks.forEach((chunk, chunkIndex) => {
                            setTimeout(() => {
                                try {
                                    editor.session.insert(editor.getCursorPosition(), chunk);
                                    
                                    // Add newline if this is the last chunk of the line
                                    if (chunkIndex === chunks.length - 1 && lineIndex < lines.length - 1) {
                                        editor.session.insert(editor.getCursorPosition(), '\n');
                                    }
                                    
                                    editor.focus();
                                } catch (error) {
                                    console.error("Error inserting text into editor:", error);
                                }
                            }, totalDelay);
                            
                            totalDelay += 30; // Reduced delay for smoother pasting
                        });
                    });
                }).catch(err => {
                    console.error("Failed to read clipboard: ", err);
                });
            }
        }
        
        // Add the event listener to multiple targets for better coverage
        editorElement.addEventListener('keydown', handlePaste, true);
        document.addEventListener('keydown', handlePaste, true); // Also listen on document for fallback
        
        // Store the handler for later removal if needed
        window._smoothPasteHandler = handlePaste;
        window._smoothPasteElement = editorElement;
        isPasteHandlerInitialized = true;
        
        console.log("Smooth paste handler initialized with fallback listeners");
    }
    
    // Clean up any existing handlers
    function removePasteHandler() {
        if (window._smoothPasteHandler) {
            // Remove from editor element
            if (window._smoothPasteElement) {
                window._smoothPasteElement.removeEventListener('keydown', window._smoothPasteHandler, true);
            }
            // Remove from document
            document.removeEventListener('keydown', window._smoothPasteHandler, true);
            
            // Clean up references
            window._smoothPasteHandler = null;
            window._smoothPasteElement = null;
            isPasteHandlerInitialized = false;
            console.log("Removed previous paste handler from all targets");
        }
    }
    
    // Initialize on load
    console.log("Injected script loaded, initializing paste handler"); // Added diagnostic logging
    initializePasteHandler();
    
    // Listen for messages to reinitialize
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'REINITIALIZE_PASTE_SCRIPT') {
            console.log("Received REINITIALIZE_PASTE_SCRIPT message, reinitializing paste handler");
            // Wait a short time for any DOM updates to complete
            setTimeout(initializePasteHandler, 500);
        }
    });
    
    // Periodic check to ensure paste handler is still active
    setInterval(function() {
        const editorElement = document.getElementById('editor');
        if (editorElement && typeof ace !== 'undefined' && !isPasteHandlerInitialized) {
            console.log("Paste handler not active, reinitializing...");
            initializePasteHandler();
        }
    }, 5000); // Check every 5 seconds
    
    // Listen for focus events to reinitialize handler if needed
    window.addEventListener('focus', function() {
        if (!isPasteHandlerInitialized) {
            console.log("Window focused and handler not active, reinitializing...");
            setTimeout(initializePasteHandler, 100);
        }
    });
})();
