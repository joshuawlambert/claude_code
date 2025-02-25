import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import { spawn } from 'node-pty';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponseServerIO
) {
  // Only set up socket server once
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.IO server...');
  
  // Create a new Socket.IO server
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });
  
  // Store the Socket.IO instance on the server object
  res.socket.server.io = io;
  
  // Terminal namespace
  const terminalIo = io.of('/terminal');
  
  // Handle terminal connections
  terminalIo.on('connection', (socket) => {
    console.log('Client connected to terminal');
    
    // Determine shell based on OS
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const homeDir = os.homedir();
    
    try {
      // Launch PTY process
      const pty = spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: homeDir,
        env: process.env as Record<string, string>
      });
      
      // Send initial greeting
      socket.emit('terminal-output', '\r\nWelcome to the terminal!\r\n\r\n');
      
      // Handle terminal output (from server to client)
      pty.onData((data) => {
        socket.emit('terminal-output', data);
      });
      
      // Handle terminal input (from client to server)
      socket.on('terminal-input', (data) => {
        pty.write(data);
      });
      
      // Handle terminal resize
      socket.on('terminal-resize', (size) => {
        pty.resize(size.cols, size.rows);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected from terminal');
        pty.kill();
      });
    } catch (error) {
      console.error('Error creating terminal:', error);
      socket.emit('terminal-error', 'Failed to start terminal session');
    }
  });
  
  console.log('Socket.IO server setup complete');
  res.end();
}