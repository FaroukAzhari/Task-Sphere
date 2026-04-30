require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocketServer } = require("./sockets/socketServer");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const httpServer = http.createServer(app);
  const io = initSocketServer(httpServer);
  app.set("io", io);

  httpServer.listen(PORT, () => {
    console.log(`Task Sphere API listening on port ${PORT}`);
  });
};

startServer();
