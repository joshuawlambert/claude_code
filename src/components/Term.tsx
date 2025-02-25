import React, { useEffect, useRef } from 'react';
import styles from '@/styles/Term.module.css';

// Create a client-side only component
const Term = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import browser-only libraries to avoid SSR issues
    const loadTerminal = async () => {
      try {
        // Import terminal libraries
        const { Terminal } = await import('xterm');
        const { FitAddon } = await import('xterm-addon-fit');
        const { WebLinksAddon } = await import('xterm-addon-web-links');
        const { io } = await import('socket.io-client');
        
        // Import CSS
        await import('xterm/css/xterm.css');

        // Initialize Socket.IO connection
        // First initialize the websocket server
        await fetch('/api/terminal');
        
        // Then connect to it and pass the project directory
        const socket = io('/terminal', {
          path: '/api/socket',
          query: {
            projectDirectory: localStorage.getItem('lastProjectDirectory') || ''
          }
        });
        socketRef.current = socket;

        // Create terminal
        const terminal = new Terminal({
          cursorBlink: true,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          theme: {
            background: '#1e1e1e',
            foreground: '#cccccc',
            cursor: '#ffffff',
            selection: 'rgba(255, 255, 255, 0.3)',
            black: '#000000',
            brightBlack: '#686868',
            red: '#ff5f57',
            brightRed: '#ff5f57',
            green: '#5af78e',
            brightGreen: '#5af78e',
            yellow: '#f3f99d',
            brightYellow: '#f3f99d',
            blue: '#57c7ff',
            brightBlue: '#57c7ff',
            magenta: '#ff6ac1',
            brightMagenta: '#ff6ac1',
            cyan: '#9aedfe',
            brightCyan: '#9aedfe',
            white: '#f1f1f1',
            brightWhite: '#ffffff'
          }
        });
        xtermRef.current = terminal;

        // Create fit addon (to resize terminal to container)
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        fitAddonRef.current = fitAddon;

        // Add web links addon
        terminal.loadAddon(new WebLinksAddon());

        // Open terminal in the container
        if (terminalRef.current) {
          terminal.open(terminalRef.current);
          fitAddon.fit();
        }

        // Handle connection
        socket.on('connect', () => {
          console.log('Socket.IO connection established');
        });

        // Handle terminal output
        socket.on('terminal-output', (data: string) => {
          terminal.write(data);
        });

        // Handle connection error
        socket.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error);
          terminal.write('\r\nError connecting to terminal server.\r\n');
        });

        // Handle terminal error
        socket.on('terminal-error', (error: string) => {
          terminal.write(`\r\nError: ${error}\r\n`);
        });

        // Handle disconnection
        socket.on('disconnect', (reason: string) => {
          terminal.write(`\r\nDisconnected from terminal server: ${reason}\r\n`);
        });

        // Handle terminal input
        terminal.onData((data) => {
          socket.emit('terminal-input', data);
        });

        // Handle window resize
        const handleResize = () => {
          fitAddon.fit();
          socket.emit('terminal-resize', { 
            cols: terminal.cols, 
            rows: terminal.rows 
          });
        };

        window.addEventListener('resize', handleResize);

        // Call resize once after terminal is opened
        setTimeout(handleResize, 100);

        // Handle "send to terminal" events from editor
        const handleSendToTerminal = (event: Event) => {
          const customEvent = event as CustomEvent;
          if (customEvent.detail && customEvent.detail.text) {
            // Show popup notification
            const popup = document.createElement('div');
            popup.className = styles.terminalPopup;
            popup.textContent = 'Code sent to terminal';
            
            if (terminalRef.current) {
              terminalRef.current.appendChild(popup);
              setTimeout(() => {
                popup.style.opacity = '0';
                setTimeout(() => {
                  if (terminalRef.current && terminalRef.current.contains(popup)) {
                    terminalRef.current.removeChild(popup);
                  }
                }, 500);
              }, 1500);
            }
            
            // Send text to terminal
            socket.emit('terminal-input', customEvent.detail.text + '\r');
          }
        };

        window.addEventListener('send-to-terminal', handleSendToTerminal);

        // Store cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('send-to-terminal', handleSendToTerminal);
          terminal.dispose();
          socket.disconnect();
        };
      } catch (error) {
        console.error('Failed to load terminal:', error);
        if (terminalRef.current) {
          terminalRef.current.innerHTML = 'Failed to load terminal. Please check console for errors.';
        }
      }
    };

    // Load terminal and store cleanup function
    let cleanup: (() => void) | undefined;
    loadTerminal().then(cleanupFn => {
      if (cleanupFn) cleanup = cleanupFn;
    });

    // Clean up on component unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return <div ref={terminalRef} className={styles.terminalContainer} />;
};

export default Term;