import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/ChatPanel.module.css';

interface TerminalProps {
  className?: string;
}

const Terminal: React.FC<TerminalProps> = ({ className }) => {
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  useEffect(() => {
    setHistory([
      'Claude Code (Research Preview) [Version 0.1.0]',
      '(c) 2025 Anthropic, Inc. All rights reserved.',
      '',
      'Type "claude" to start Claude Code CLI',
      ''
    ]);
  }, []);

  // Always scroll to the bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on load and click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle special keys
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = input.trim();
      
      // Add command to history
      if (command) {
        setCommandHistory(prev => [...prev, command]);
        
        // Process the command
        processCommand(command);
        
        // Reset input and history index
        setInput('');
        setHistoryIndex(-1);
      } else {
        // Just add a blank line for empty Enter
        setHistory(prev => [...prev, '']);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const processCommand = (command: string) => {
    // Add command to output history
    setHistory(prev => [...prev, `$ ${command}`]);
    
    // Process different commands
    if (command === 'clear') {
      setHistory([]);
    } else if (command === 'help') {
      setHistory(prev => [
        ...prev,
        'Available commands:',
        '  claude    Start the Claude Code CLI',
        '  clear     Clear the terminal',
        '  help      Display this help message',
        ''
      ]);
    } else if (command === 'claude') {
      setHistory(prev => [
        ...prev,
        'Starting Claude Code CLI...',
        '',
        'Claude Code CLI [Version 0.1.0]',
        '(c) 2025 Anthropic, Inc. All rights reserved.',
        '',
        'Type /help to see available commands.',
        '',
        'You can ask me to:',
        '- Explain code and architecture',
        '- Implement new features',
        '- Debug and fix issues',
        '- Refactor code',
        '- Run tests and build',
        '- Work with git',
        ''
      ]);
    } else if (command.startsWith('claude ')) {
      const prompt = command.substring(7);
      setHistory(prev => [
        ...prev,
        'Processing request: ' + prompt,
        '',
        'This is a simulation. In a real implementation, this would call the Claude API to process your request.',
        '',
        'Example response:',
        'I\'ll help you with that. Let me analyze the code...',
        '...',
        'Done! The requested changes have been implemented.',
        ''
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        `Command not found: ${command}`,
        'Type "help" to see available commands.',
        ''
      ]);
    }
  };

  return (
    <div 
      className={`${styles.terminal} ${className}`}
      onClick={handleTerminalClick}
      ref={terminalRef}
    >
      <div className={styles.terminalOutput}>
        {history.map((line, index) => (
          <div key={index} className={styles.terminalLine}>
            {line}
          </div>
        ))}
        <div className={styles.terminalInputLine}>
          <span className={styles.prompt}>$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.terminalInput}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;