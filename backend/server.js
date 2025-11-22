const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");
const usersFile = path.join(__dirname, "data/users.json");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

// File paths
const productsFile = path.join(__dirname, "data/products.json");
const servicesFile = path.join(__dirname, "data/services.json");
const ordersFile = path.join(__dirname, "orders.json");

// Helper functions
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Helper to read orders
function readOrders() {
  try {
    const data = fs.readFileSync(ordersFile, "utf-8");
    const parsed = JSON.parse(data);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed.orders && Array.isArray(parsed.orders)) {
      return parsed.orders;
    }

    return [];
  } catch (error) {
    console.error("Error reading orders:", error.message);
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({
      message: "Login successful!",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

app.get("/api/products", (req, res) => {
  const products = readJSON(productsFile);
  const category = req.query.category;

  if (category) {
    const filtered = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    return res.json(filtered);
  }

  res.json(products);
});

app.get("/api/services", (req, res) => {
  const services = readJSON(servicesFile);
  res.json(services);
});

app.get("/api/orders", (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// NEW: Get specific order by ID for tracking
app.get("/api/orders/:orderId", (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = readOrders();

    const order = orders.find((o) => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// Place order
app.post("/api/orders", async (req, res) => {
  const orderData = req.body;

  try {
    const orderId = `ORD${Date.now()}`;

    const order = {
      orderId: orderId,
      orderDate: new Date().toISOString(),
      firstName: orderData.firstName,
      lastName: orderData.lastName,
      location: orderData.location,
      email: orderData.email,
      phone: orderData.phone,
      items: orderData.items,
      totalAmount: orderData.total,
      status: "confirmed",
    };

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);

    console.log(`✅ Order ${orderId} saved successfully`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "abvy7661@gmail.com",
        pass: "jqffxcirwnxyxomw",
      },
    });

    // Enhanced HTML email with full order details for admin and user
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#4a6fa5;">Order Confirmation - ${orderId}</h2>
        <p><strong>Customer Name:</strong> ${order.firstName} ${order.lastName}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Location:</strong> ${order.location}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>

        <h3>Items Ordered:</h3>
        <ul>
          ${order.items
            .map(
              (item) =>
                `<li>${item.name} x ${item.qty} - $${(
                  item.price * item.qty
                ).toFixed(2)}</li>`
            )
            .join("")}
        </ul>

        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>

        <div style="background-color:#e8f4f8; padding:15px; border-radius:8px; margin:20px 0;">
          <p style="margin:0;"><strong>📦 Track Your Order:</strong></p>
          <p style="margin:5px 0 0 0;">Use Order ID: <strong>${orderId}</strong> on our login page to track your delivery status.</p>
        </div>

        <p style="color:#666; margin-top:20px;">If you have any questions, please contact us at info@pawsandclaws.com</p>
      </div>
    `;

    const mailOptionsAdmin = {
      from: "abvy7661@gmail.com",
      to: "abvy7661@gmail.com",
      subject: `New Order Received - ${orderId}`,
      html: emailHTML,
    };

    const mailOptionsUser = {
      from: "abvy7661@gmail.com",
      to: order.email,
      subject: `Order Confirmation - ${orderId}`,
      html: emailHTML,
    };

    try {
      await transporter.sendMail(mailOptionsAdmin);
      console.log("✅ Admin email sent");
    } catch (err) {
      console.error("❌ Failed to send admin email:", err.message);
    }

    try {
      await transporter.sendMail(mailOptionsUser);
      console.log("✅ User email sent with full details");
    } catch (err) {
      console.error("❌ Failed to send user email:", err.message);
    }

    res.json({
      message: "Order placed successfully and emails sent!",
      orderId: orderId,
      order: order,
    });
  } catch (err) {
    console.error("❌ Order placement error:", err);
    res.status(500).json({ error: "Failed to place order or send emails." });
  }
});

app.post("/api/register", (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required." });
    }

    let users = [];
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
      password,
    };

    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({ message: "Registration successful! Please go back to login." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
