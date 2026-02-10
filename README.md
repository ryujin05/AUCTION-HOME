# Auction Home – Real‑time Real Estate Auction Platform

> A real‑time real‑estate auction platform with listing management, live bidding, chat, notifications, admin operations, and reporting. Cleanly separated backend and modern frontend, ready for production‑grade workflows.

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)

---

## ✨ Key Features

- 🏷️ **Listings & property management** (create/edit/delete, status moderation, advanced filters)
- 🔨 **Real‑time auctions** with countdown tick and bid history
- 💬 **Live chat** between buyers and sellers
- 🔔 **System notifications** and abuse reporting
- 📊 **Admin dashboard**: stats, user management, listings, report handling
- 🧭 **Maps & location** (Mapbox)
- 🔐 **Authentication**: JWT + Google OAuth, profile & avatar management

---

## 🏗️ Architecture

| Component | Technology |
|-----------|-----------|
| **Backend API** | Node.js, Express, MongoDB (Mongoose), Socket.IO |
| **Frontend** | React (Vite), Chakra UI, Zustand |
| **Integrations** | Cloudinary, Mapbox, Google OAuth |

---

## 📁 Directory Structure

```
.
├── backend/              # 🔧 API server
├── frontend/             # 🎨 React client (Vite)
├── docker-compose.yml    # 🐳 Docker configuration
└── package.json          # backend scripts
```

---

## 🎥 Live Demo

[![Watch Demo on Google Drive](https://img.shields.io/badge/Google%20Drive-Demo-4285F4?logo=google-drive&logoColor=white)](https://drive.google.com/file/d/1D5CWyTqM3gV3bwEY3_xtLkyQJ7u4Zm78/view?usp=drive_link)

**Watch the full demo:** [Google Drive Link]([https://drive.google.com/file/d/1D5CWyTqM3gV3bwEY3_xtLkyQJ7u4Zm78/view?usp=drive_link](https://drive.google.com/file/d/1TSZYkAHAuPCsgE1LpJpEykQ4lV6Fcg3g/view?usp=sharing))

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB (local or Atlas)
- Cloudinary, Mapbox (recommended)

### 1) Install

```bash
# Backend (root)
npm install

# Frontend
cd frontend
npm install
```

### 2) Environment Setup

**Backend**: create `backend/.env`

```bash
PORT=5000
MONGO_URI="mongodb://USER:PASSWORD@HOST:PORT/DB_NAME"
JWT_SECRET_KEY="your-secret-key"
FRONTEND_ORIGIN="https://localhost:5173"

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Google OAuth
GOOGLE_CLIENT_ID=""

# Security
PASSWORD_PEPPER="your-pepper"

# Email (Brevo) - optional
BREVO_API_KEY=""
BREVO_USER=""
BREVO_SENDER_NAME="Support Team"

# Runtime
NODE_ENV=development
DOCKER_ENV=false

# Seed admin (optional)
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=Admin@123
SEED_ADMIN_NAME="Super Admin"
SEED_ADMIN_PHONE="0000000000"
SEED_ADMIN_EMAIL="admin@gmail.com"
```

**Frontend**: create `frontend/.env`

```bash
VITE_API_BASE_URL=https://localhost:5000/api
VITE_SOCKET_URL=https://localhost:5000
VITE_MAPBOX_TOKEN=""
VITE_GOOGLE_CLIENT_ID=""
VITE_SKIP_API=false
```

### 3) Run in development

```bash
# Backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

---

## 🐳 Docker

```bash
docker-compose up --build
```

---

## 📌 Scripts

**Root** ([package.json](package.json))
- `npm run dev` – start backend (nodemon)
- `npm run seed:admin` – seed admin account
- `npm run seed:demo` – seed demo listings

**Frontend** ([frontend/package.json](frontend/package.json))
- `npm run dev` – Vite dev server
- `npm run build` – production build
- `npm run preview` – preview build

---

## 📄 API Routes (main)

```
/api/user         - Auth, profile, Google login, saved listings
/api/list         - Listings, bidding, search
/api/chat         - Conversations & messages
/api/admin        - Dashboard, users, listings, reports
/api/report       - Report listing/user
/api/notification - System notifications
```

---

## 👨‍💻 Author

**Phạm Thế Đạt**

---

## 📜 License

MIT License – see [LICENSE](LICENSE).
