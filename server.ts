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
  app.use(express.json()); // Add this for POST bodies
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // News storage
  let news: any[] = [
    {
      id: "1",
      title: "Bienvenidos a Vida Mixe TV",
      content: "Iniciamos transmisiones para conectar a la comunidad Ayuuk con el mundo. Sintoniza nuestras transmisiones en vivo desde la Sierra Norte.",
      date: new Date().toISOString(),
      author: "Admin"
    }
  ];

  // User storage for broadcasters
  let broadcasters_accounts: any[] = [
    { id: "1", username: "admin", password: "password123", name: "Administrador" }
  ];

  // Almacenar broadcasters: socket.id -> { id, name, viewers }
  const broadcasters = new Map<string, { id: string, name: string, viewers: number }>();
  const chatHistory: any[] = [];
  // Almacenar usuarios conectados: socket.id -> { username, id }
  const users: { [id: string]: { username: string; id: string } } = {};

  const emitUserList = () => {
    const userList = Object.values(users);
    io.emit("user_list", userList);
  };

  io.on("connection", (socket) => {
    socket.on("broadcaster", (streamName: string) => {
      broadcasters.set(socket.id, { 
        id: socket.id, 
        name: streamName || `Transmisión de ${socket.id.slice(0, 4)}`,
        viewers: 0 
      });
      io.emit("broadcaster_list", Array.from(broadcasters.values()));
    });

    socket.on("get_broadcasters", () => {
      socket.emit("broadcaster_list", Array.from(broadcasters.values()));
    });

    socket.on("watcher", (broadcasterId: string) => {
      const b = broadcasters.get(broadcasterId);
      if (b) {
        socket.to(broadcasterId).emit("watcher", socket.id);
        b.viewers++;
        io.emit("broadcaster_list", Array.from(broadcasters.values()));
        // Emitir conteo específico al broadcaster
        io.to(broadcasterId).emit("viewers_count", b.viewers);
      }
      socket.emit("chat_history", chatHistory);
    });

    // Registro de usuario para el chat y lista de espectadores
    socket.on("register_user", (username: string) => {
      users[socket.id] = { username, id: socket.id };
      emitUserList();
    });

    socket.on("chat_message", (message) => {
      chatHistory.push(message);
      if (chatHistory.length > 100) chatHistory.shift(); // Keep last 100 messages
      io.emit("chat_message", message);
    });

    socket.on("delete_message", (messageId) => {
      // Solo el broadcaster de la sala actual o un admin podría borrar
      // Por simplicidad, permitimos si el socket.id está en broadcasters
      if (broadcasters.has(socket.id)) {
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
        emitUserList();
      }

      if (broadcasters.has(socket.id)) {
        broadcasters.delete(socket.id);
        socket.broadcast.emit("disconnectPeer", socket.id);
        io.emit("broadcaster_list", Array.from(broadcasters.values()));
      } else {
        // Reducir viewers de todos los broadcasters donde este socket estaba mirando
        broadcasters.forEach(b => {
          socket.to(b.id).emit("disconnectPeer", socket.id);
          // Opcional: decrementar viewers si sabemos que estaba mirando
          // Por simplicidad, el cliente debería avisar al salir de una sala
        });
      }
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    console.log("GET /api/health");
    res.json({ status: "ok" });
  });

  app.get("/api/news", (req, res) => {
    console.log("GET /api/news");
    res.json(news);
  });

  app.post("/api/news", (req, res) => {
    const { title, content, author, password } = req.body;
    // Simple password check for admin
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    const newEntry = {
      id: Date.now().toString(),
      title,
      content,
      author: author || "Admin",
      date: new Date().toISOString()
    };
    news.unshift(newEntry);
    res.json(newEntry);
  });

  app.delete("/api/news/:id", (req, res) => {
    const { id } = req.params;
    const { password } = req.query;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    news = news.filter(n => n.id !== id);
    res.json({ success: true });
  });

  // Auth endpoints
  app.post("/api/auth/register", (req, res) => {
    const { username, password, name } = req.body;
    if (broadcasters_accounts.find(u => u.username === username)) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }
    const newUser = {
      id: Date.now().toString(),
      username,
      password, // In a real app, hash this!
      name: name || username
    };
    broadcasters_accounts.push(newUser);
    res.json({ success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = broadcasters_accounts.find(u => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    res.json({ success: true, user: { id: user.id, username: user.username, name: user.name } });
  });

  // Catch-all for API routes to prevent falling through to Vite
  app.all("/api/*", (req, res) => {
    console.log(`404 API: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.url}` });
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
