import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware để xác thực JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('Socket.IO auth attempt with token:', token ? token.substring(0, 20) + '...' : 'No token');
      
      if (!token) {
        console.error('No token provided');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456");
      console.log('JWT decoded:', decoded);
      
      const user = await User.findById(decoded.id);
      console.log('User found:', user ? user.username : 'Not found');
      
      if (!user) {
        console.error('User not found');
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      console.log('Socket.IO authentication successful for user:', user.username);
      next();
    } catch (err) {
      console.error('Socket.IO authentication error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected with socket ${socket.id}`);

    // Join room for a specific card
    socket.on('join-card', (cardId) => {
      socket.join(`card-${cardId}`);
      console.log(`User ${socket.username} joined card room: card-${cardId}`);
    });

    // Leave room for a specific card
    socket.on('leave-card', (cardId) => {
      socket.leave(`card-${cardId}`);
      console.log(`User ${socket.username} left card room: card-${cardId}`);
    });

    // Handle new comment
    socket.on('new-comment', (data) => {
      const { cardId, comment } = data;
      // Broadcast to all users in the card room
      socket.to(`card-${cardId}`).emit('comment-added', {
        comment,
        user: {
          _id: socket.userId,
          username: socket.username
        }
      });
    });

    // Handle comment update
    socket.on('update-comment', (data) => {
      const { cardId, comment } = data;
      socket.to(`card-${cardId}`).emit('comment-updated', {
        comment,
        user: {
          _id: socket.userId,
          username: socket.username
        }
      });
    });

    // Handle comment deletion
    socket.on('delete-comment', (data) => {
      const { cardId, commentId } = data;
      socket.to(`card-${cardId}`).emit('comment-deleted', {
        commentId,
        user: {
          _id: socket.userId,
          username: socket.username
        }
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected`);
    });
  });

  return io;
};

export default setupSocketIO;
