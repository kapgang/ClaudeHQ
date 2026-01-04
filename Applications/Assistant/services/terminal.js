const pty = require('node-pty');
const os = require('os');

class TerminalService {
  constructor() {
    this.terminals = new Map();
  }

  createTerminal(id, ws, workingDir) {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: workingDir || process.env.HOME || process.env.USERPROFILE,
      env: process.env
    });

    this.terminals.set(id, ptyProcess);

    // Buffer for batching output
    let outputBuffer = '';
    let flushTimer = null;
    const FLUSH_INTERVAL = 50; // 50ms batching - smooth but efficient

    const flushBuffer = () => {
      if (outputBuffer && ws.readyState === 1) { // 1 = OPEN
        ws.send(JSON.stringify({ type: 'output', data: outputBuffer }));
        outputBuffer = '';
      }
      flushTimer = null;
    };

    ptyProcess.onData((data) => {
      outputBuffer += data;

      // Flush immediately if buffer is large (>2KB) or schedule batch flush
      if (outputBuffer.length > 2048) {
        if (flushTimer) clearTimeout(flushTimer);
        flushBuffer();
      } else if (!flushTimer) {
        flushTimer = setTimeout(flushBuffer, FLUSH_INTERVAL);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      // Flush any remaining data before exit
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushBuffer();
      }

      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'exit', exitCode }));
      }
      this.terminals.delete(id);
    });

    return ptyProcess;
  }

  write(id, data) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.write(data);
    }
  }

  resize(id, cols, rows) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.resize(cols, rows);
    }
  }

  kill(id) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.kill();
      this.terminals.delete(id);
    }
  }

  startClaudeCode(id, ws, workingDir) {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: workingDir || process.env.HOME || process.env.USERPROFILE,
      env: process.env
    });

    this.terminals.set(id, ptyProcess);

    // Buffer for batching output
    let outputBuffer = '';
    let flushTimer = null;
    const FLUSH_INTERVAL = 50; // 50ms batching - smooth but efficient

    const flushBuffer = () => {
      if (outputBuffer && ws.readyState === 1) { // 1 = OPEN
        ws.send(JSON.stringify({ type: 'output', data: outputBuffer }));
        outputBuffer = '';
      }
      flushTimer = null;
    };

    ptyProcess.onData((data) => {
      outputBuffer += data;

      // Flush immediately if buffer is large (>2KB) or schedule batch flush
      if (outputBuffer.length > 2048) {
        if (flushTimer) clearTimeout(flushTimer);
        flushBuffer();
      } else if (!flushTimer) {
        flushTimer = setTimeout(flushBuffer, FLUSH_INTERVAL);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      // Flush any remaining data before exit
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushBuffer();
      }

      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'exit', exitCode }));
      }
      this.terminals.delete(id);
    });

    // Start Claude Code after shell initializes
    setTimeout(() => {
      ptyProcess.write('claude\r');
    }, 500);

    return ptyProcess;
  }
}

module.exports = new TerminalService();
