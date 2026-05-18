import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialise Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create a plain HTTP server — HTTPS is handled upstream by Nginx
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

     // Let Next.js handle all HTTP requests
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the HTTP server — events to be implemented later
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "https://localhost",
      methods: ["GET", "POST"],
    },
  });

  httpServer.listen(port, () => {
    console.log(`[server] running on http://localhost:${port} (dev: ${dev})`);
  });
});