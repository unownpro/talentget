const editor = ace.edit("editor");

document.getElementById('editor').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        
        navigator.clipboard.readText().then(text => {
            const cursorPosition = editor.getCursorPosition();
            const lines = text.split('\n');
            let totalDelay = 0;
            
            lines.forEach((line, lineIndex) => {
                // Split line into 13-character chunks while preserving words
                const chunks = line.match(/(.{1,13}(?:\s|$))|(.{1,13})/g) || [''];
                
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
        });
    }
}, true);