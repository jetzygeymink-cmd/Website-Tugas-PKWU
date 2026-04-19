import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import nodemailer from "nodemailer";
import { Order } from "./src/types.ts";

// Email transporter configuration
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("SMTP_USER or SMTP_PASS not set. Email notifications will be skipped.");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

async function sendOrderEmail(order: Order) {
  const transporter = getTransporter();
  if (!transporter) return;

  const sellerEmail = "jetzygeymink@gmail.com";
  
  const itemsHtml = order.items
    .map(item => `<li>${item.quantity}x ${item.name} - Rp ${item.price.toLocaleString('id-ID')}</li>`)
    .join("");

  const mailOptions = {
    from: `"Tokoo Piaow System" <${process.env.SMTP_USER}>`,
    to: sellerEmail,
    subject: `🔔 Pesanan Baru dari ${order.customerName} (#${order.id.toUpperCase()})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #FFD200; text-align: center;">Tokoo Piaow - Pesanan Baru</h2>
        <p>Halo Penjual, ada pesanan baru masuk!</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <h3 style="margin-top: 0;">Detail Pelanggan:</h3>
          <p><strong>Nama:</strong> ${order.customerName}</p>
          <p><strong>WhatsApp:</strong> ${order.phoneNumber}</p>
          <p><strong>Catatan:</strong> ${order.note || "-"}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>Daftar Pesanan:</h3>
          <ul>${itemsHtml}</ul>
          <p style="font-size: 18px; font-weight: bold;">Total: Rp ${order.totalPrice.toLocaleString('id-ID')}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Pesan ini dikirim otomatis oleh sistem Tokoo Piaow.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent for order ${order.id}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

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
    
    // Send email notification to seller
    sendOrderEmail(newOrder).catch(err => console.error("Async email error:", err));
    
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
