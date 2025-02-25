import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import { spawn, IPty } from 'node-pty';

// Track all active PTY processes
const activePtyProcesses = new Set<IPty>();

// Cleanup function to terminate all PTY processes
const cleanupPtyProcesses = () => {
  console.log(`Cleaning up ${activePtyProcesses.size} PTY processes...`);
  for (const pty of activePtyProcesses) {
    try {
      pty.kill();
      activePtyProcesses.delete(pty);
    } catch (error) {
      console.error('Error killing PTY process:', error);
    }
  }
};

// Register cleanup handlers
['SIGINT', 'SIGTERM', 'SIGQUIT', 'beforeExit', 'exit'].forEach(signal => {
  process.on(signal, () => {
    console.log(`Received ${signal}, cleaning up...`);
    cleanupPtyProcesses();
    process.exit(0);
  });
});

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
    path: '/api/terminal',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000']
        : true, // Allow all origins in development
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8, // 100 MB
    allowEIO3: true
  });
  
  res.socket.server.io = io;
  
  // Handle terminal connections directly on main namespace
  io.on('connection', (socket) => {
    console.log('Client connected to terminal');
    let pty: IPty | null = null;
    
    // Determine shell based on OS
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const homeDir = os.homedir();
    
    try {
      // Get the project directory from the socket data or use home directory as fallback
      const socketData = socket.handshake.query;
      const projectDir = socketData.projectDirectory as string || homeDir;
      
      // Launch PTY process with project directory as working directory
      pty = spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: projectDir,
        env: process.env as Record<string, string>
      });
      
      // Track the new PTY process
      activePtyProcesses.add(pty);
      
      // Send initial greeting
      socket.emit('terminal-output', '\r\nWelcome to the terminal!\r\n\r\n');
      
      // Handle terminal output (from server to client)
      pty.onData((data) => {
        if (socket.connected) {
          socket.emit('terminal-output', data);
        }
      });
      
      // Handle terminal input (from client to server)
      socket.on('terminal-input', (data) => {
        if (pty && !pty.killed) {
          pty.write(data);
        }
      });
      
      // Handle terminal resize
      socket.on('terminal-resize', (size) => {
        if (pty && !pty.killed) {
          pty.resize(size.cols, size.rows);
        }
      });
      
      // Handle various disconnection scenarios
      const cleanup = () => {
        console.log('Cleaning up terminal session...');
        if (pty && !pty.killed) {
          try {
            pty.kill();
            activePtyProcesses.delete(pty);
            pty = null;
          } catch (error) {
            console.error('Error during PTY cleanup:', error);
          }
        }
      };

      socket.on('disconnect', cleanup);
      socket.on('error', cleanup);
      socket.on('end', cleanup);
      
    } catch (error) {
      console.error('Error creating terminal:', error);
      socket.emit('terminal-error', 'Failed to start terminal session');
      if (pty) {
        pty.kill();
        activePtyProcesses.delete(pty);
      }
    }
  });
  
  console.log('Socket.IO server setup complete');
  res.end();
}