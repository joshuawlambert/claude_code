import { useState, useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import axios from 'axios';
import path from 'path';
import styles from '@/styles/Home.module.css';
import FileExplorer from '@/components/FileExplorer';
import SimpleTerm from '@/components/SimpleTerm';
import * as monaco from 'monaco-editor';
import DirectorySelector from '@/components/DirectorySelector';

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [projectDirectory, setProjectDirectory] = useState<string | null>(null);
  const [showDirectorySelector, setShowDirectorySelector] = useState<boolean>(true);
  
  // Try to load the last used directory from localStorage on initial render
  useEffect(() => {
    const lastDirectory = localStorage.getItem('lastProjectDirectory');
    if (lastDirectory) {
      // Check if the directory still exists
      axios.get('/api/directoryExists', {
        params: { directory: lastDirectory }
      })
      .then(response => {
        if (response.data.exists) {
          // Directory exists, load it
          setProjectDirectory(lastDirectory);
          setShowDirectorySelector(false);
        }
      })
      .catch(error => {
        console.error('Error checking directory:', error);
        // On error, fallback to directory selector
      });
    }
  }, []);
  const [sidebarWidth, setSidebarWidth] = useState<number>(250);
  const [terminalWidth, setTerminalWidth] = useState<number>(350);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizingSidebarRef = useRef<boolean>(false);
  const resizingTerminalRef = useRef<boolean>(false);
  const lastClientXRef = useRef<number>(0);

  // Function to fetch files
  const fetchFiles = async (directory: string) => {
    try {
      const response = await axios.get('/api/listFiles', {
        params: { directory }
      });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      // Fallback to empty array if API fails
      setFiles([]);
    }
  };

  // Fetch files when project directory changes
  useEffect(() => {
    if (projectDirectory) {
      fetchFiles(projectDirectory);
    }
  }, [projectDirectory]);
  
  // Event listener for file updates (creation, deletion, etc.)
  useEffect(() => {
    const refreshFiles = () => {
      if (projectDirectory) {
        fetchFiles(projectDirectory);
      }
    };
    
    // Listen for both events for backward compatibility
    window.addEventListener('file-created', refreshFiles);
    window.addEventListener('file-modified', refreshFiles);
    
    return () => {
      window.removeEventListener('file-created', refreshFiles);
      window.removeEventListener('file-modified', refreshFiles);
    };
  }, [projectDirectory]);

  // Set up resize handlers
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Check if we're clicking on a resize handle
      if (containerRef.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const clickX = e.clientX - containerRect.left;
        
        // Check if we're near the sidebar resize handle
        if (Math.abs(clickX - sidebarWidth) <= 10) {
          console.log('Starting sidebar resize');
          resizingSidebarRef.current = true;
          resizingTerminalRef.current = false;
          lastClientXRef.current = e.clientX;
          e.preventDefault();
        }
        // Check if we're near the terminal resize handle
        else if (Math.abs(clickX - (containerRect.width - terminalWidth)) <= 10) {
          console.log('Starting terminal resize');
          resizingSidebarRef.current = false;
          resizingTerminalRef.current = true;
          lastClientXRef.current = e.clientX;
          e.preventDefault();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingSidebarRef.current && containerRef.current) {
        const deltaX = e.clientX - lastClientXRef.current;
        const newWidth = Math.max(100, Math.min(500, sidebarWidth + deltaX));
        setSidebarWidth(newWidth);
        lastClientXRef.current = e.clientX;
      } else if (resizingTerminalRef.current && containerRef.current) {
        const deltaX = e.clientX - lastClientXRef.current;
        const newWidth = Math.max(200, Math.min(600, terminalWidth - deltaX));
        setTerminalWidth(newWidth);
        lastClientXRef.current = e.clientX;
      }
    };

    const handleMouseUp = () => {
      if (resizingSidebarRef.current || resizingTerminalRef.current) {
        console.log('Ending resize operation');
        resizingSidebarRef.current = false;
        resizingTerminalRef.current = false;
      }
    };

    // Add event listeners with capture phase to ensure they get triggered before other handlers
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [sidebarWidth, terminalWidth]);

  const handleDirectorySelected = (directory: string) => {
    setProjectDirectory(directory);
    setShowDirectorySelector(false);
    // Reset current file and content when directory changes
    setCurrentFile(null);
    setFileContent('');
    
    // Save the directory to localStorage for next time
    localStorage.setItem('lastProjectDirectory', directory);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Set up context menu for "Send to Terminal"
    editor.addAction({
      id: 'send-to-terminal',
      label: 'Send to Terminal',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed) => {
        const selection = ed.getSelection();
        if (selection && !selection.isEmpty()) {
          const selectedText = ed.getModel()?.getValueInRange(selection) || '';
          // Dispatch custom event to be caught by the terminal component
          window.dispatchEvent(new CustomEvent('send-to-terminal', { 
            detail: { text: selectedText } 
          }));
        }
      }
    });
    
    // Set up keyboard shortcut for sending to terminal (Ctrl+Enter or Cmd+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || '';
        window.dispatchEvent(new CustomEvent('send-to-terminal', { 
          detail: { text: selectedText } 
        }));
      }
    });
  };

  const handleFileSelect = async (file: string) => {
    // If file is empty, clear the editor
    if (!file) {
      setCurrentFile(null);
      setFileContent('');
      return;
    }
    
    if (!projectDirectory) return;
    
    // Convert the path based on whether it's absolute or relative
    let fullPath;
    if (file.startsWith('/')) {
      // For absolute paths (from our virtual file tree), resolve them relative to project directory
      const relativePath = file.substring(1); // Remove leading slash
      fullPath = path.join(projectDirectory, relativePath);
    } else {
      // Already a full path
      fullPath = file;
    }
    
    setCurrentFile(file);
    
    try {
      console.log('Reading file:', fullPath);
      const response = await axios.get('/api/readFile', {
        params: { filePath: fullPath }
      });
      setFileContent(response.data.content);
    } catch (error) {
      console.error('Failed to read file:', error);
      // Fallback content if API fails
      setFileContent(`// Failed to load content of ${file}\n// Please try again`);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };

  const saveFile = async () => {
    if (!currentFile || !projectDirectory) return;
    
    // Convert the path based on whether it's absolute or relative
    let fullPath;
    if (currentFile.startsWith('/')) {
      // For absolute paths (from our virtual file tree), resolve them relative to project directory
      const relativePath = currentFile.substring(1); // Remove leading slash
      fullPath = path.join(projectDirectory, relativePath);
    } else {
      // Already a full path
      fullPath = currentFile;
    }
    
    try {
      console.log('Saving file:', fullPath);
      await axios.post('/api/writeFile', {
        filePath: fullPath,
        content: fileContent
      });
      // Show a temporary save indicator
      const saveIndicator = document.createElement('div');
      saveIndicator.className = styles.saveIndicator;
      saveIndicator.textContent = 'Saved!';
      document.body.appendChild(saveIndicator);
      setTimeout(() => {
        document.body.removeChild(saveIndicator);
      }, 2000);
    } catch (error) {
      console.error('Failed to save file:', error);
      // Handle error, show notification, etc.
    }
  };

  // Get language identifier from file extension
  const getLanguageForFile = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    switch (ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'go': return 'go';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'h': return 'c';
      case 'rb': return 'ruby';
      case 'php': return 'php';
      case 'rs': return 'rust';
      case 'swift': return 'swift';
      case 'vue': return 'html';
      case 'scss': case 'sass': return 'scss';
      case 'yml': case 'yaml': return 'yaml';
      case 'sh': case 'bash': return 'shell';
      default: return 'plaintext';
    }
  };

  // Show folder selection dialog again
  const handleOpenFolder = () => {
    setShowDirectorySelector(true);
  };

  // Generate grid template columns CSS value
  const gridTemplateColumns = `${sidebarWidth}px 1fr ${terminalWidth}px`;
  
  // Update the position of resize handles in the CSS
  useEffect(() => {
    // Set the position of the resize handles to match the grid layout
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .${styles.layout}::before {
        left: ${sidebarWidth}px;
        margin-left: -5px;
      }
      .${styles.layout}::after {
        right: ${terminalWidth}px;
        margin-right: -5px;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, [sidebarWidth, terminalWidth, styles.layout]);

  return (
    <div className={styles.container}>
      {showDirectorySelector ? (
        <DirectorySelector onDirectorySelected={handleDirectorySelected} />
      ) : (
        <div 
          className={styles.layout} 
          ref={containerRef}
          style={{ gridTemplateColumns }}
        >
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>EXPLORER</h3>
              <button 
                className={styles.folderButton} 
                title="Open Folder"
                onClick={handleOpenFolder}
              >
                📂 Open Folder
              </button>
            </div>
            <FileExplorer 
              files={files} 
              onFileSelect={handleFileSelect} 
              currentFile={currentFile}
              projectDirectory={projectDirectory}
            />
          </div>
          <div className={styles.editor}>
            {currentFile ? (
              <>
                <div className={styles.editorHeader}>
                  <div className={styles.fileName}>{currentFile}</div>
                  <button className={styles.saveButton} onClick={saveFile}>
                    Save
                  </button>
                </div>
                <Editor
                  height="calc(100% - 40px)"
                  defaultLanguage={getLanguageForFile(currentFile)}
                  defaultValue={fileContent}
                  value={fileContent}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'all',
                    bracketPairColorization: { enabled: true },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: true,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    autoIndent: 'full',
                    renderWhitespace: 'selection',
                    contextmenu: true,
                  }}
                />
              </>
            ) : (
              <div className={styles.noFile}>
                <div className={styles.welcomeMessage}>
                  <h2>Welcome to Claude Code IDE</h2>
                  <p>Select a file from the explorer to start editing</p>
                  <p className={styles.directoryPath}>
                    Project: {projectDirectory}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className={styles.terminal}>
            <SimpleTerm />
          </div>
          
          {/* Resize handle indicators */}
          <div 
            className={styles.resizeHandle} 
            style={{ left: `${sidebarWidth}px` }}
            title="Drag to resize sidebar"
          />
          <div 
            className={styles.resizeHandle} 
            style={{ right: `${terminalWidth}px` }}
            title="Drag to resize terminal"
          />
        </div>
      )}
    </div>
  );
}