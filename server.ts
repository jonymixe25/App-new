import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
console.log("Initializing Database...");
const db = new Database("vidamixe.db");

// Create tables if they don't exist
console.log("Creating tables...");
db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    date TEXT NOT NULL,
    imageUrl TEXT,
    videoUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS broadcasters (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );
`);

console.log("Tables created successfully.");

// Seed initial data if empty
console.log("Checking news count...");
const newsCount = db.prepare("SELECT COUNT(*) as count FROM news").get() as { count: number };
if (newsCount.count === 0) {
  db.prepare(`
    INSERT INTO news (id, title, content, author, date, imageUrl)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    "1",
    "Bienvenidos a Vida Mixe TV",
    "Iniciamos transmisiones para conectar a la comunidad Ayuuk con el mundo. Sintoniza nuestras transmisiones en vivo desde la Sierra Norte.",
    "Admin",
    new Date().toISOString(),
    "https://picsum.photos/seed/mixe-welcome/800/600"
  );
}

  // No initial admin seeding needed

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
  const PORT = 3000;
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Almacenar broadcasters: socket.id -> { id, name, viewers }
  const activeBroadcasters = new Map<string, { id: string, name: string, viewers: number }>();
  const chatHistory: any[] = [];
  // Almacenar usuarios conectados: socket.id -> { username, id }
  const users: { [id: string]: { username: string; id: string } } = {};

  const emitUserList = () => {
    const userList = Object.values(users);
    io.emit("user_list", userList);
  };

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("broadcaster", (streamName: string) => {
      activeBroadcasters.set(socket.id, { 
        id: socket.id, 
        name: streamName || `Transmisión de ${socket.id.slice(0, 4)}`,
        viewers: 0 
      });
      io.emit("broadcaster_list", Array.from(activeBroadcasters.values()));
    });

    socket.on("get_broadcasters", () => {
      socket.emit("broadcaster_list", Array.from(activeBroadcasters.values()));
    });

    socket.on("watcher", (broadcasterId: string) => {
      const b = activeBroadcasters.get(broadcasterId);
      if (b) {
        socket.to(broadcasterId).emit("watcher", socket.id);
        b.viewers++;
        io.emit("broadcaster_list", Array.from(activeBroadcasters.values()));
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
      // Por simplicidad, permitimos si el socket.id está en activeBroadcasters
      if (activeBroadcasters.has(socket.id)) {
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

      if (activeBroadcasters.has(socket.id)) {
        activeBroadcasters.delete(socket.id);
        socket.broadcast.emit("disconnectPeer", socket.id);
        io.emit("broadcaster_list", Array.from(activeBroadcasters.values()));
      } else {
        // Reducir viewers de todos los broadcasters donde este socket estaba mirando
        activeBroadcasters.forEach(b => {
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
    const news = db.prepare("SELECT * FROM news ORDER BY date DESC").all();
    res.json(news);
  });

  app.post("/api/news", (req, res) => {
    const { title, content, author, password, imageUrl, videoUrl } = req.body;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    const id = Date.now().toString();
    const date = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO news (id, title, content, author, date, imageUrl, videoUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, content, author || "Admin", date, imageUrl || null, videoUrl || null);
    
    res.json({ id, title, content, author, date, imageUrl, videoUrl });
  });

  app.delete("/api/news/:id", (req, res) => {
    const { id } = req.params;
    const { password } = req.query;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    db.prepare("DELETE FROM news WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Auth endpoints
  app.post("/api/auth/register", (req, res) => {
    const { username, password, name } = req.body;
    try {
      const id = Date.now().toString();
      db.prepare(`
        INSERT INTO broadcasters (id, username, password, name)
        VALUES (?, ?, ?, ?)
      `).run(id, username, password, name || username);
      res.json({ success: true, user: { id, username, name: name || username } });
    } catch (err) {
      res.status(400).json({ error: "El usuario ya existe" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM broadcasters WHERE username = ? AND password = ?").get(username, password) as any;
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    res.json({ success: true, user: { id: user.id, username: user.username, name: user.name } });
  });

  // Catch-all for API routes to prevent falling through to Vite
  app.all("/api/*all", (req, res) => {
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
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
