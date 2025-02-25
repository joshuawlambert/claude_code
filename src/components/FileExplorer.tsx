import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import path from 'path';
import styles from '@/styles/FileExplorer.module.css';

interface FileExplorerProps {
  files: string[];
  currentFile: string | null;
  onFileSelect: (file: string) => void;
  projectDirectory?: string | null;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: FileNode[];
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetNode: FileNode | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  currentFile, 
  onFileSelect,
  projectDirectory 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null
  });
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close context menu and file input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Close context menu
        setContextMenu(prev => ({ ...prev, visible: false }));
        
        // Close new file/folder input if not focused in the input
        if (fileInputRef.current && event.target !== fileInputRef.current) {
          setShowNewFileInput(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus the file input when it becomes visible
  useEffect(() => {
    if (showNewFileInput && fileInputRef.current) {
      fileInputRef.current.focus();
    }
  }, [showNewFileInput]);

  // Build a tree structure from the flat file list
  const fileTree = useMemo(() => {
    const root: FileNode = { name: '/', path: '/', type: 'directory', children: [] };
    
    // Helper function to get file icon based on extension
    const getFileIcon = (fileName: string): string => {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      
      switch (ext) {
        case 'js': return '📄 '; // JavaScript
        case 'jsx': return '📄 '; // JSX
        case 'ts': return '📄 '; // TypeScript
        case 'tsx': return '📄 '; // TSX
        case 'css': return '🎨 '; // CSS
        case 'html': return '🌐 '; // HTML
        case 'json': return '📋 '; // JSON
        case 'md': return '📝 '; // Markdown
        case 'py': return '🐍 '; // Python
        case 'go': return '🔹 '; // Go
        case 'java': return '☕ '; // Java
        case 'c': case 'cpp': case 'h': return '⚙️ '; // C/C++
        case 'rb': return '💎 '; // Ruby
        case 'php': return '🐘 '; // PHP
        case 'rs': return '🦀 '; // Rust
        case 'swift': return '🔶 '; // Swift
        case 'vue': return '🟢 '; // Vue
        case 'scss': case 'sass': return '💄 '; // SCSS/SASS
        case 'svg': case 'png': case 'jpg': case 'jpeg': case 'gif': return '🖼️ '; // Images
        case 'yml': case 'yaml': return '⚙️ '; // YAML
        case 'sh': case 'bash': return '💻 '; // Shell
        default: return '📄 '; // Default
      }
    };
    
    // Insert each file into the tree
    files.forEach(filePath => {
      const parts = filePath.split('/');
      let currentNode = root;
      let currentPath = '';
      
      // Process each part of the path
      parts.forEach((part, index) => {
        if (!part) return; // Skip empty parts
        
        currentPath += '/' + part;
        
        // If this is the last part, it's a file; otherwise, it's a directory
        const isFile = index === parts.length - 1;
        const type = isFile ? 'file' : 'directory';
        
        console.log(`Processing path part: "${part}", currentPath: "${currentPath}", type: ${type}`);
        
        // Look for existing node
        let node = currentNode.children.find(child => child.name === part);
        
        if (!node) {
          // Create new node if it doesn't exist
          node = {
            name: part,
            path: currentPath,
            type,
            children: []
          };
          currentNode.children.push(node);
          console.log(`Created node: ${part} with path: ${currentPath}`);
        }
        
        // Update current node for next iteration
        currentNode = node;
      });
    });
    
    // Sort each level - directories first, then files
    const sortNode = (node: FileNode) => {
      node.children.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });
      
      node.children.forEach(sortNode);
    };
    
    sortNode(root);
    return root;
  }, [files]);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Show context menu
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();  // Add this to prevent event bubbling
    
    // Determine if this is the root directory (path is '/')
    const isRoot = node.path === '/';
    
    // Log detailed information about the node for debugging
    console.log('Context menu triggered for node:', { 
      path: node.path, 
      name: node.name,
      type: node.type,
      isRoot,
      children: node.children?.length,
      fullNode: node
    });
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetNode: node
    });
    
    // Reset any error message
    setErrorMessage(null);
    setShowNewFileInput(false);
  };

  // Handle context menu on the entire explorer area
  const handleExplorerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Use the root node if clicking in empty space
    console.log('Explorer context menu triggered with root node:', fileTree);
    
    // Make sure fileTree has the proper path and name
    if (fileTree && fileTree.path) {
      // Explicitly mark this as the root node by setting both path and name
      const rootNode = {
        ...fileTree,
        path: '/',
        name: '/'
      };
      
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetNode: rootNode
      });
    } else {
      // Fallback if fileTree isn't available
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetNode: { name: '/', path: '/', type: 'directory', children: [] }
      });
    }
    
    // Reset any error message
    setErrorMessage(null);
    setShowNewFileInput(false);
  };

  // Start creating a new file
  const handleNewFile = () => {
    setShowNewFileInput(true);
    setNewFileName('');
    setContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Start creating a new folder
  const handleNewFolder = () => {
    setShowNewFileInput(true);
    // We'll prepend a special marker to indicate it's a folder
    setNewFileName('folder/');
    setContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Simple delete file/folder handler
  const handleDeleteFile = async () => {
    if (!contextMenu.targetNode || !projectDirectory) {
      console.log('Cannot delete: Missing node or project directory');
      return;
    }
    
    const nodeInfo = contextMenu.targetNode;
    
    // Just skip root directory
    if (nodeInfo.path === '/') {
      setErrorMessage("Cannot delete root directory");
      setContextMenu(prev => ({ ...prev, visible: false }));
      return;
    }
    
    // Simple confirm message
    const isFolder = nodeInfo.type === 'directory';
    const msg = `Delete ${isFolder ? 'folder' : 'file'} "${nodeInfo.name}"?`;
    
    if (!window.confirm(msg)) {
      setContextMenu(prev => ({ ...prev, visible: false }));
      return;
    }
    
    try {
      // Remove leading slash if present
      const relativePath = nodeInfo.path.startsWith('/') 
        ? nodeInfo.path.substring(1) 
        : nodeInfo.path;
      
      // Build full path  
      const fullPath = `${projectDirectory}/${relativePath}`;
      
      console.log(`Deleting: ${fullPath}`);
      
      // Call API to delete the file/folder
      await axios.post('/api/deleteFile', { filePath: fullPath });
      
      // Close context menu
      setContextMenu(prev => ({ ...prev, visible: false }));
      
      // Clear file selection if needed
      if (currentFile === nodeInfo.path) {
        onFileSelect('');
      }
      
      // Brief success message
      setErrorMessage(`${isFolder ? 'Folder' : 'File'} deleted`);
      setTimeout(() => setErrorMessage(null), 2000);
      
      // Refresh file list
      window.dispatchEvent(new CustomEvent('file-modified'));
      
    } catch (error) {
      console.error('Delete failed:', error);
      setErrorMessage('Delete failed');
    }
  };

  // Handle creating the new file or folder
  const createNewFile = async () => {
    if (!contextMenu.targetNode || !newFileName || !projectDirectory) {
      console.log('Missing data:', { 
        targetNode: contextMenu.targetNode, 
        newFileName, 
        projectDirectory 
      });
      return;
    }
    
    const isFolder = newFileName.endsWith('/');
    const fileName = isFolder ? newFileName.slice(0, -1) : newFileName;
    
    const targetPath = contextMenu.targetNode.type === 'directory' 
      ? contextMenu.targetNode.path 
      : contextMenu.targetNode.path.substring(0, contextMenu.targetNode.path.lastIndexOf('/'));
    
    console.log(`Creating ${isFolder ? 'folder' : 'file'} with path:`, targetPath);
    
    try {
      // Remove leading / to make it relative to project directory
      const relativePath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
      
      const fullPath = projectDirectory + (relativePath !== '/' ? '/' + relativePath : '');
      console.log('Full directory path:', fullPath);
      console.log('Name:', fileName);
      
      if (isFolder) {
        // For folders, we create an empty directory
        const response = await axios.post('/api/createFile', {
          directory: fullPath,
          fileName: fileName,
          isDirectory: true
        });
        
        console.log('API response:', response.data);
      } else {
        // For files, create a file
        const response = await axios.post('/api/createFile', {
          directory: fullPath,
          fileName: fileName
        });
        
        console.log('API response:', response.data);
      }
      
      // Clear the input and show success briefly
      setNewFileName('');
      setShowNewFileInput(false);
      setErrorMessage(null);
      
      // Dispatch event to refresh file list in parent component
      window.dispatchEvent(new CustomEvent('file-modified'));
      
    } catch (error: any) {
      console.error(`Failed to create ${isFolder ? 'folder' : 'file'}:`, error);
      console.error('Error response:', error.response?.data);
      setErrorMessage(error.response?.data?.message || `Failed to create ${isFolder ? 'folder' : 'file'}`);
    }
  };

  // Handle key press in the new file input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      createNewFile();
    } else if (e.key === 'Escape') {
      setShowNewFileInput(false);
      setErrorMessage(null);
    }
  };

  // Recursive component to render tree nodes
  const renderTreeNode = (node: FileNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    
    // Skip the root node in rendering
    if (node.path === '/' && level === 0) {
      return (
        <div key="root">
          {node.children.map(child => renderTreeNode(child, level))}
          
          {/* New file input at root level */}
          {showNewFileInput && contextMenu.targetNode && contextMenu.targetNode.path === '/' && (
            <div className={styles.newFileInput} style={{ paddingLeft: '20px' }}>
              <input
                ref={fileInputRef}
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter file name..."
              />
            </div>
          )}
        </div>
      );
    }

    const indent = level * 10;
    
    // Directory node
    if (node.type === 'directory') {
      const folderIcon = isExpanded ? '📂 ' : '📁 ';
      
      return (
        <div key={node.path}>
          <div 
            className={styles.fileItem}
            style={{ paddingLeft: `${indent + 10}px` }}
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            <span className={styles.fileIcon}>{folderIcon}</span>
            <span className={styles.fileName}>{node.name}</span>
          </div>
          
          {isExpanded && (
            <div>
              {node.children.map(child => renderTreeNode(child, level + 1))}
              
              {/* New file input */}
              {showNewFileInput && contextMenu.targetNode && contextMenu.targetNode.path === node.path && (
                <div className={styles.newFileInput} style={{ paddingLeft: `${indent + 20}px` }}>
                  <input
                    ref={fileInputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter file name..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // File node
    const fileIcon = node.path.split('.').length > 1 
      ? getFileIcon(node.name)
      : '📄 ';
      
    return (
      <div
        key={node.path}
        className={`${styles.fileItem} ${currentFile === node.path ? styles.active : ''}`}
        style={{ paddingLeft: `${indent + 10}px` }}
        onClick={() => onFileSelect(node.path)}
        onContextMenu={(e) => handleContextMenu(e, node)}
      >
        <span className={styles.fileIcon}>{fileIcon}</span>
        <span className={styles.fileName}>{node.name}</span>
      </div>
    );
  };

  // Helper function to filter out the first slash in path
  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (ext) {
      case 'js': return '📄 '; // JavaScript
      case 'jsx': return '📄 '; // JSX
      case 'ts': return '📄 '; // TypeScript
      case 'tsx': return '📄 '; // TSX
      case 'css': return '🎨 '; // CSS
      case 'html': return '🌐 '; // HTML
      case 'json': return '📋 '; // JSON
      case 'md': return '📝 '; // Markdown
      default: return '📄 '; // Default
    }
  };

  // References for drag and drop
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null);
  const [dragTarget, setDragTarget] = useState<FileNode | null>(null);
  const [dragOverClass, setDragOverClass] = useState<string | null>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    if (node.type === 'file') {
      setDraggedNode(node);
      e.dataTransfer.setData('text/plain', node.path);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, node: FileNode) => {
    e.preventDefault();
    if (node.type === 'directory' && draggedNode && node.path !== draggedNode.path) {
      setDragTarget(node);
      setDragOverClass(node.path);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverClass(null);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetNode: FileNode) => {
    e.preventDefault();
    setDragOverClass(null);
    
    if (!draggedNode || !targetNode || targetNode.type !== 'directory' || !projectDirectory) {
      return;
    }
    
    // Cannot drop onto itself or its child directories
    if (targetNode.path === draggedNode.path || 
        targetNode.path.startsWith(draggedNode.path + '/')) {
      return;
    }
    
    try {
      // Get source and target paths
      const sourcePath = draggedNode.path;
      const sourceFileName = draggedNode.name;
      
      // Get target directory path
      const targetPath = targetNode.path;
      
      // Create the full paths
      const sourceFullPath = projectDirectory + (sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`);
      const targetFullPath = projectDirectory + (targetPath.startsWith('/') ? targetPath : `/${targetPath}`);
      
      console.log('Moving file:', sourceFullPath, 'to', targetFullPath + '/' + sourceFileName);
      
      // Call the API to move the file
      const response = await axios.post('/api/moveFile', {
        sourcePath: sourceFullPath,
        targetPath: `${targetFullPath}/${sourceFileName}`
      });
      
      console.log('Move response:', response.data);
      
      // Reset drag state
      setDraggedNode(null);
      setDragTarget(null);
      
      // Refresh file list
      window.dispatchEvent(new CustomEvent('file-modified'));
    } catch (error) {
      console.error('Error moving file:', error);
      setErrorMessage('Failed to move file');
    }
  };

  // Enhanced version of renderTreeNode to include drag and drop
  const renderTreeNodeWithDragDrop = (node: FileNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isDragOver = dragOverClass === node.path;
    
    // Skip the root node in rendering
    if (node.path === '/' && level === 0) {
      return (
        <div key="root">
          {node.children.map(child => renderTreeNodeWithDragDrop(child, level))}
          
          {/* New file input at root level */}
          {showNewFileInput && contextMenu.targetNode && contextMenu.targetNode.path === '/' && (
            <div className={styles.newFileInput} style={{ paddingLeft: '20px' }}>
              <input
                ref={fileInputRef}
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter file name..."
              />
            </div>
          )}
        </div>
      );
    }

    const indent = level * 10;
    
    // Directory node
    if (node.type === 'directory') {
      const folderIcon = isExpanded ? '📂 ' : '📁 ';
      
      return (
        <div key={node.path}>
          <div 
            className={`${styles.fileItem} ${isDragOver ? styles.dragOver : ''}`}
            style={{ paddingLeft: `${indent + 10}px` }}
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            onDragOver={(e) => handleDragOver(e, node)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node)}
          >
            <span className={styles.fileIcon}>{folderIcon}</span>
            <span className={styles.fileName}>{node.name}</span>
          </div>
          
          {isExpanded && (
            <div>
              {node.children.map(child => renderTreeNodeWithDragDrop(child, level + 1))}
              
              {/* New file input */}
              {showNewFileInput && contextMenu.targetNode && contextMenu.targetNode.path === node.path && (
                <div className={styles.newFileInput} style={{ paddingLeft: `${indent + 20}px` }}>
                  <input
                    ref={fileInputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter file name..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // File node
    const fileIcon = node.path.split('.').length > 1 
      ? getFileIcon(node.name)
      : '📄 ';
      
    return (
      <div
        key={node.path}
        className={`${styles.fileItem} ${currentFile === node.path ? styles.active : ''}`}
        style={{ paddingLeft: `${indent + 10}px` }}
        onClick={() => onFileSelect(node.path)}
        onContextMenu={(e) => handleContextMenu(e, node)}
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
      >
        <span className={styles.fileIcon}>{fileIcon}</span>
        <span className={styles.fileName}>{node.name}</span>
      </div>
    );
  };

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      onContextMenu={handleExplorerContextMenu}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>EXPLORER</h3>
      </div>
      <div 
        className={styles.fileList}
        onContextMenu={handleExplorerContextMenu}
      >
        {renderTreeNodeWithDragDrop(fileTree)}
        
        {/* Show error message if there's any */}
        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div 
            className={styles.contextMenuItem}
            onClick={handleNewFile}
          >
            <span className={styles.menuIcon}>📝</span> New File
          </div>
          
          <div 
            className={styles.contextMenuItem}
            onClick={() => {
              setNewFileName('folder/');
              handleNewFolder();
            }}
          >
            <span className={styles.menuIcon}>📁</span> New Folder
          </div>
          
          {/* Always show delete option */}
          <div 
            className={`${styles.contextMenuItem} ${styles.deleteMenuItem}`}
            onClick={handleDeleteFile}
          >
            <span className={styles.menuIcon}>🗑️</span> Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;