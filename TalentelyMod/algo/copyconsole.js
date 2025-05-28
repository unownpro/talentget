// First ensure editor is initialized
const editor = ace.edit("editor");

// Then add the command
editor.commands.addCommand({
    name: 'copy',
    bindKey: {win: 'Ctrl-C', mac: 'Command-C'},
    exec: function(editor) {
        const selectedText = editor.getSelectedText();
        if (selectedText) {
            navigator.clipboard.writeText(selectedText);
        }
    }
});

// Enable better text selection
editor.setOption('selectionStyle', 'text');
editor.setOption('dragEnabled', true);
