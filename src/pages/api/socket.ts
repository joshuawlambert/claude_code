import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import { Server as SocketIOServer } from 'socket.io';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.IO server...');
  
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000']
        : ['http://localhost:3000', 'http://localhost:4000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected to socket');
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from socket');
    });
  });

  console.log('Socket.IO server setup complete');
  res.end();
} 