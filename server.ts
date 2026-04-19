import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Order } from "./src/types.ts";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory order storage (demo purposes)
  let orders: Order[] = [];

  // API Routes
  app.get("/api/orders", (req, res) => {
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const newOrder: Order = {
      ...req.body,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      createdAt: Date.now(),
    };
    orders.unshift(newOrder);
    
    // Notify all connected clients (especially the seller dashboard)
    io.emit("new_order", newOrder);
    
    res.status(201).json(newOrder);
  });

  app.patch("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    orders = orders.map(o => o.id === id ? { ...o, status } : o);
    const updatedOrder = orders.find(o => o.id === id);
    
    if (updatedOrder) {
      io.emit("order_updated", updatedOrder);
      res.json(updatedOrder);
    } else {
      res.status(404).send("Order not found");
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
