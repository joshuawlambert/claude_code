import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import chokidar from 'chokidar';

// Store active watchers to prevent duplicate watchers
const activeWatchers = new Map<string, fs.FSWatcher>();

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponseServerIO
) {
  // Only set up socket server once
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server in fileWatcher...');
    
    // Create a new Socket.IO server if not already created
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    // Store the Socket.IO instance on the server object
    res.socket.server.io = io;
  }
  
  // Get the project directory from query parameters
  const projectDir = req.query.directory as string;
  
  if (!projectDir) {
    return res.status(400).json({ error: 'Project directory is required' });
  }
  
  // Check if directory exists
  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ error: 'Directory not found' });
  }
  
  // Create a namespace for file watching
  const fileWatcherIo = res.socket.server.io.of('/file-watcher');
  
  // Clean up any existing watcher for this directory
  if (activeWatchers.has(projectDir)) {
    console.log(`Closing existing watcher for ${projectDir}`);
    const watcher = activeWatchers.get(projectDir);
    watcher?.close();
    activeWatchers.delete(projectDir);
  }
  
  try {
    console.log(`Setting up file watcher for ${projectDir}`);
    
    // Initialize watcher
    const watcher = chokidar.watch(projectDir, {
      ignored: [
        /(^|[/\\])\../, // ignore dotfiles
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true,
      ignoreInitial: true
    });
    
    // Store the watcher
    activeWatchers.set(projectDir, watcher);
    
    // File events
    watcher
      .on('add', filePath => {
        console.log(`File ${filePath} has been added`);
        // Emit to all clients in the file-watcher namespace
        fileWatcherIo.emit('file-change', { type: 'add', path: filePath });
      })
      .on('change', filePath => {
        console.log(`File ${filePath} has been changed`);
        fileWatcherIo.emit('file-change', { type: 'change', path: filePath });
      })
      .on('unlink', filePath => {
        console.log(`File ${filePath} has been removed`);
        fileWatcherIo.emit('file-change', { type: 'unlink', path: filePath });
      })
      .on('addDir', dirPath => {
        console.log(`Directory ${dirPath} has been added`);
        fileWatcherIo.emit('file-change', { type: 'addDir', path: dirPath });
      })
      .on('unlinkDir', dirPath => {
        console.log(`Directory ${dirPath} has been removed`);
        fileWatcherIo.emit('file-change', { type: 'unlinkDir', path: dirPath });
      })
      .on('error', error => {
        console.error(`Watcher error: ${error}`);
        fileWatcherIo.emit('watcher-error', { error: error.toString() });
      });
    
    // Handle connections to the file-watcher namespace
    fileWatcherIo.on('connection', (socket) => {
      console.log('Client connected to file-watcher');
      
      // When client disconnects
      socket.on('disconnect', () => {
        console.log('Client disconnected from file-watcher');
      });
    });
    
    res.status(200).json({ success: true, message: 'File watcher initialized' });
  } catch (error) {
    console.error('Error setting up file watcher:', error);
    res.status(500).json({ error: 'Failed to set up file watcher' });
  }
}