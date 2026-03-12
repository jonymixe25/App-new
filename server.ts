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

  CREATE TABLE IF NOT EXISTS community_videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    price TEXT NOT NULL,
    video_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS broadcasters (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS team (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    image TEXT NOT NULL,
    icon TEXT NOT NULL,
    linkedin TEXT,
    twitter TEXT,
    github TEXT,
    email TEXT
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

const adminCount = db.prepare("SELECT COUNT(*) as count FROM broadcasters").get() as { count: number };
if (adminCount.count === 0) {
  db.prepare(`
    INSERT INTO broadcasters (id, username, password, name)
    VALUES (?, ?, ?, ?)
  `).run("1", "admin", "password123", "Administrador");
}

console.log("Checking team count...");
const teamCount = db.prepare("SELECT COUNT(*) as count FROM team").get() as { count: number };
if (teamCount.count === 0) {
  console.log("Seeding initial team data...");
  const initialTeam = [
    {
      id: "1",
      name: "Xunashi Martínez",
      role: "Directora General",
      bio: "Originaria de Tlahuitoltepec, Xunashi lidera la visión de Vida Mixe TV para llevar la cultura Ayuuk a audiencias globales.",
      image: "https://picsum.photos/seed/xunashi/400/400",
      icon: "Heart",
      linkedin: "#",
      email: "xunashi@vidamixe.tv"
    },
    {
      id: "2",
      name: "Pável González",
      role: "Director de Producción",
      bio: "Especialista en medios audiovisuales con 10 años de experiencia documentando las fiestas y tradiciones de la Sierra Norte.",
      image: "https://picsum.photos/seed/pavel/400/400",
      icon: "Camera",
      twitter: "#",
      email: "pavel@vidamixe.tv"
    },
    {
      id: "3",
      name: "Floriberto Díaz",
      role: "Ingeniero de Sonido",
      bio: "Músico del CECAM encargado de capturar la esencia de las bandas de viento con la más alta fidelidad.",
      image: "https://picsum.photos/seed/floriberto/400/400",
      icon: "Music",
      email: "flor@vidamixe.tv"
    },
    {
      id: "4",
      name: "Citlali Rojas",
      role: "Desarrolladora de Plataforma",
      bio: "Encargada de la infraestructura digital que permite nuestras transmisiones en tiempo real desde la montaña.",
      image: "https://picsum.photos/seed/citlali/400/400",
      icon: "Code",
      github: "#",
      linkedin: "#"
    },
    {
      id: "5",
      name: "Mateo Jiménez",
      role: "Locutor y Traductor",
      bio: "La voz de nuestras noticias en Ayuuk y Español, asegurando que nuestro mensaje llegue a todos los rincones.",
      image: "https://picsum.photos/seed/mateo/400/400",
      icon: "Mic2",
      twitter: "#"
    }
  ];

  const insertTeam = db.prepare(`
    INSERT INTO team (id, name, role, bio, image, icon, linkedin, twitter, github, email)
    VALUES (@id, @name, @role, @bio, @image, @icon, @linkedin, @twitter, @github, @email)
  `);

  for (const member of initialTeam) {
    insertTeam.run({
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      image: member.image,
      icon: member.icon,
      linkedin: member.linkedin || null,
      twitter: member.twitter || null,
      github: member.github || null,
      email: member.email || null
    });
  }
}

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

  // Community Videos Routes
  app.get("/api/community-videos", (req, res) => {
    const videos = db.prepare("SELECT * FROM community_videos").all();
    res.json(videos);
  });

  app.post("/api/community-videos", (req, res) => {
    const { title, author, thumbnail, price, video_url, password } = req.body;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    const id = Date.now().toString();
    db.prepare(`
      INSERT INTO community_videos (id, title, author, thumbnail, price, video_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, author, thumbnail, price, video_url);
    res.json({ id, title, author, thumbnail, price, video_url });
  });

  app.delete("/api/community-videos/:id", (req, res) => {
    const { id } = req.params;
    const { password } = req.query;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    db.prepare("DELETE FROM community_videos WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Team Routes
  app.get("/api/team", (req, res) => {
    const team = db.prepare("SELECT * FROM team").all();
    res.json(team);
  });

  app.post("/api/team", (req, res) => {
    const { name, role, bio, image, icon, linkedin, twitter, github, email, password } = req.body;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    const id = Date.now().toString();
    db.prepare(`
      INSERT INTO team (id, name, role, bio, image, icon, linkedin, twitter, github, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, role, bio, image, icon, linkedin || null, twitter || null, github || null, email || null);
    res.json({ id, name, role, bio, image, icon, linkedin, twitter, github, email });
  });

  app.delete("/api/team/:id", (req, res) => {
    const { id } = req.params;
    const { password } = req.query;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    db.prepare("DELETE FROM team WHERE id = ?").run(id);
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

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
