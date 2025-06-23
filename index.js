let command = '';

let term = new Terminal({cols: 80, cursorBlink: true});

term.prompt = () => {
  term.write('\n\rbahadur $ ');
}

term.open(document.getElementById('terminal'));
term.prompt();

let ui = new Terminal({cols: 80, disableStdin: true});

ui.writeCenter = (text) => {
    let x = Math.floor(ui.cols / 2 - text.length / 2) + 1;
    let y = Math.floor(ui.rows / 2) + 1;
    ui.write(`\x9B${y};${x}H${text}`);
}

ui.open(document.getElementById('ui'));
ui.writeCenter("BAHADUR");

term.onData(e => {
    if (e === '\r') { // Enter key
      term.write('\n\r');
      handleCommand(command.trim());
      command = ''; // Reset command buffer
      term.prompt();
    } else if (e === '\x7F') { // Backspace key
        if (command.length > 0) {
            term.write('\b \b'); // Move cursor back, erase character, move cursor back again
            command = command.slice(0, -1); // Remove last character from command buffer
        }
    } else {
        term.write(e); // Echo the typed character
        command += e; // Add typed character to command buffer
    }
});

function handleCommand(input) {
    const args = input.split(' ');
    const command = args[0];
    const params = args.slice(1).join(' ');

    switch (command) {
        case 'echo':
            term.write(params + '\n');
            break;
        case 'cat':
            // Implement 'cat' command logic here
            break;
        default:
            term.write(`Command not found: ${command}\n`);
    }
}