import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";
import { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "132815750479-tn4q22thga3u8dg47uqdum1lpliksuou.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${APP_URL}/api/auth/google/callback`
);

// Initialize DB
const db = new Database(path.join(__dirname, "vidamixe.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    google_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS community_videos (
    id TEXT PRIMARY KEY,
    title TEXT,
    author TEXT,
    thumbnail TEXT,
    price TEXT,
    video_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    video_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(video_id) REFERENCES community_videos(id)
  );
`);

// Seed community videos if empty
const videoCount: any = db.prepare("SELECT COUNT(*) as count FROM community_videos").get();
if (videoCount.count === 0) {
  const seedVideos = [
    {
      id: "v1",
      title: "Guelaguetza en la Sierra Mixe 2025",
      author: "Cultura Ayuuk",
      thumbnail: "https://picsum.photos/seed/guelaguetza/800/450",
      price: "$150 MXN",
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4"
    },
    {
      id: "v2",
      title: "Entrevista con Maestros del CECAM",
      author: "Vida Mixe TV",
      thumbnail: "https://picsum.photos/seed/cecam-interview/800/450",
      price: "$99 MXN",
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4"
    },
    {
      id: "v3",
      title: "Paisajes de Tlahuitoltepec desde el Dron",
      author: "Ayuuk Media",
      thumbnail: "https://picsum.photos/seed/drone-mixe/800/450",
      price: "$120 MXN",
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4"
    }
  ];
  const insert = db.prepare("INSERT INTO community_videos (id, title, author, thumbnail, price, video_url) VALUES (?, ?, ?, ?, ?, ?)");
  seedVideos.forEach(v => insert.run(v.id, v.title, v.author, v.thumbnail, v.price, v.video_url));
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  const PORT = 3000;
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
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

  // Almacenar broadcasters: socket.id -> { id, name, viewers }
  const broadcasters = new Map<string, { id: string, name: string, viewers: number }>();
  const chatHistory: any[] = [];
  // Almacenar usuarios conectados: socket.id -> { username, id }
  const users: { [id: string]: { username: string; id: string } } = {};

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id, "Transport:", socket.conn.transport.name);
    
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
      }
      socket.emit("chat_history", chatHistory);
    });

    // Registro de usuario para el chat y lista de espectadores
    socket.on("register_user", (username: string) => {
      users[socket.id] = { username, id: socket.id };
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
      }

      if (broadcasters.has(socket.id)) {
        broadcasters.delete(socket.id);
        socket.broadcast.emit("disconnectPeer", socket.id);
        io.emit("broadcaster_list", Array.from(broadcasters.values()));
      } else {
        // Reducir viewers de todos los broadcasters donde este socket estaba mirando
        // (Simplificado: el cliente debería avisar al salir de una sala, pero aquí lo hacemos general)
        broadcasters.forEach(b => {
          socket.to(b.id).emit("disconnectPeer", socket.id);
        });
      }
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/news", (req, res) => {
    res.json(news);
  });

  app.get("/api/community-videos", (req, res) => {
    const videos = db.prepare("SELECT * FROM community_videos ORDER BY created_at DESC").all();
    res.json(videos);
  });

  app.post("/api/community-videos", (req, res) => {
    const { title, author, thumbnail, price, video_url, password } = req.body;
    if (password !== "mixe2024") {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!title || !author || !thumbnail || !price || !video_url) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const id = "v" + Date.now().toString();
    db.prepare("INSERT INTO community_videos (id, title, author, thumbnail, price, video_url) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, title, author, thumbnail, price, video_url);
    
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

  app.get("/api/my-purchases", (req, res) => {
    const userCookie = req.cookies.user;
    if (!userCookie) return res.status(401).json({ error: "No autenticado" });
    const user = JSON.parse(userCookie);
    
    const purchases = db.prepare(`
      SELECT v.* FROM community_videos v
      JOIN purchases p ON v.id = p.video_id
      WHERE p.user_id = ?
    `).all(user.id);
    
    res.json(purchases);
  });

  app.post("/api/purchase", (req, res) => {
    const userCookie = req.cookies.user;
    if (!userCookie) return res.status(401).json({ error: "Inicia sesión para comprar" });
    const user = JSON.parse(userCookie);
    const { videoId } = req.body;

    if (!videoId) return res.status(400).json({ error: "ID de video requerido" });

    try {
      const id = Math.random().toString(36).substring(2, 15);
      db.prepare("INSERT INTO purchases (id, user_id, video_id) VALUES (?, ?, ?)")
        .run(id, user.id, videoId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Error al procesar la compra" });
    }
  });

  // --- AUTH ROUTES ---

  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    try {
      const id = Math.random().toString(36).substring(2, 15);
      const stmt = db.prepare("INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)");
      stmt.run(id, email, password, name);
      
      const user = { id, email, name };
      res.cookie("user", JSON.stringify(user), {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.json({ user });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "El correo ya está registrado" });
      }
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    
    if (user) {
      const userData = { id: user.id, email: user.email, name: user.name };
      res.cookie("user", JSON.stringify(userData), {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      res.json({ user: userData });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const userCookie = req.cookies.user;
    if (userCookie) {
      res.json({ user: JSON.parse(userCookie) });
    } else {
      res.status(401).json({ error: "No autenticado" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("user", {
      secure: true,
      sameSite: 'none',
      httpOnly: true
    });
    res.json({ success: true });
  });

  // --- GOOGLE OAUTH ---

  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string;
    
    if (!code) {
      return res.status(400).send("No se proporcionó el código de autorización");
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(400).send("No se pudo obtener la información del usuario de Google");
      }

      const googleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
      };

      // Upsert user in DB
      const existingUser: any = db.prepare("SELECT * FROM users WHERE email = ?").get(googleUser.email);
      let userId;
      if (existingUser) {
        userId = existingUser.id;
        // Update name if it was empty or different
        db.prepare("UPDATE users SET name = ?, google_id = ? WHERE id = ?")
          .run(googleUser.name, googleUser.id, userId);
      } else {
        userId = Math.random().toString(36).substring(2, 15);
        db.prepare("INSERT INTO users (id, email, name, google_id) VALUES (?, ?, ?, ?)")
          .run(userId, googleUser.email, googleUser.name, googleUser.id);
      }

      const userData = { id: userId, email: googleUser.email, name: googleUser.name };
      res.cookie("user", JSON.stringify(userData), {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticación exitosa. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Google OAuth Error:", err);
      res.status(500).send("Error en la autenticación con Google: " + err.message);
    }
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
