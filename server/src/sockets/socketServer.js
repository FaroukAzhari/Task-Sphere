const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      return next();
    } catch (_error) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on("project:join", (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
    });
  });

  return io;
};

module.exports = {
  initSocketServer,
};
