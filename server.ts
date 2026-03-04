import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  let broadcaster: string | null = null;
  let viewersCount = 0;
  const chatHistory: any[] = [];
  // Almacenar usuarios conectados: socket.id -> { username, id }
  const users: { [id: string]: { username: string; id: string } } = {};

  io.on("connection", (socket) => {
    socket.on("broadcaster", () => {
      broadcaster = socket.id;
      socket.broadcast.emit("broadcaster");
    });

    socket.on("watcher", () => {
      if (broadcaster) {
        socket.to(broadcaster).emit("watcher", socket.id);
      }
      viewersCount++;
      io.emit("viewers_count", viewersCount);
      socket.emit("chat_history", chatHistory);
    });

    // Registro de usuario para el chat y lista de espectadores
    socket.on("register_user", (username: string) => {
      users[socket.id] = { username, id: socket.id };
      // Enviar lista actualizada al broadcaster
      if (broadcaster) {
        io.to(broadcaster).emit("user_list", Object.values(users));
      }
    });

    socket.on("chat_message", (message) => {
      chatHistory.push(message);
      if (chatHistory.length > 100) chatHistory.shift(); // Keep last 100 messages
      io.emit("chat_message", message);
    });

    socket.on("delete_message", (messageId) => {
      if (socket.id === broadcaster) {
        const index = chatHistory.findIndex(m => m.id === messageId);
        if (index !== -1) {
          chatHistory.splice(index, 1);
        }
        io.emit("message_deleted", messageId);
      }
    });

    // Señalización para Broadcast (Uno a Muchos)
    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
    });

    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message);
    });

    socket.on("candidate", (id, message) => {
      socket.to(id).emit("candidate", socket.id, message);
    });

    // Señalización para Llamada Privada (Bidireccional)
    socket.on("private_offer", (targetId, description) => {
      socket.to(targetId).emit("private_offer", socket.id, description);
    });

    socket.on("private_answer", (targetId, description) => {
      socket.to(targetId).emit("private_answer", socket.id, description);
    });

    socket.on("private_candidate", (targetId, candidate) => {
      socket.to(targetId).emit("private_candidate", socket.id, candidate);
    });

    socket.on("disconnect", () => {
      // Eliminar usuario de la lista
      if (users[socket.id]) {
        delete users[socket.id];
        if (broadcaster) {
          io.to(broadcaster).emit("user_list", Object.values(users));
        }
      }

      if (broadcaster === socket.id) {
        broadcaster = null;
        socket.broadcast.emit("disconnectPeer", socket.id);
      } else {
        if (broadcaster) {
          socket.to(broadcaster).emit("disconnectPeer", socket.id);
        }
        viewersCount = Math.max(0, viewersCount - 1);
        io.emit("viewers_count", viewersCount);
      }
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
