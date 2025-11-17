# 🎉 FestFlow - College Event Management System

**A secure, role-based event management system tailored for college fests.**

FestFlow is designed to streamline how colleges manage club-based events, replacing manual Google Forms, WhatsApp broadcasts, Excel sheets, and offline attendance tracking.  
The project models a **real administrative hierarchy**, ensuring **security, role integrity, and controlled event workflows**.

---

---

## 📌 Why This Project Matters

Many college event platforms are simple CRUD apps or form submissions.  
FestFlow moves beyond that by implementing:

- Verified user onboarding  
- Access-controlled event publication  
- QR-secured attendance verification  
- Governance-based event ownership  
- Clear separation of active vs past events  

This aligns with **industry-grade backend thinking**, not just academic project development.

---

## 🧩 Role-Based System Design

| Role | Assigned By | Capabilities | Restrictions |
|------|-------------|--------------|--------------|
| **Super Admin (Faculty)** | Seed script (one-time setup) | Create/approve clubs, assign coordinator accounts, full visibility | Cannot self-register through UI |
| **Club Coordinator** | Super Admin | Create & manage events under assigned club, view registrations, perform QR check-ins | Cannot manage other clubs |
| **Student / User** | Self-register | View events, register, attend via QR | Cannot create events or clubs |

---

## 🚀 Key Features

### 🔐 Authentication & Security
- JWT-based authentication (stateless, scalable)
- Secure HTTP-only cookies
- Mandatory first-login password reset for coordinators
- No privilege escalation possible via registration

### 📅 Event Lifecycle Management
- Coordinators create events only for their assigned club
- Deadline-controlled registrations  
- Automatic separation of **active** vs **past** events  
- Email confirmation with unique QR code

### 📍 QR-Based Check-in System
- Verified check-ins only by authorized coordinators
- Duplicate and unauthorized check-in prevention

---

## 🛠️ Tech Stack

| Layer | Technology | Reasoning |
|--------|------------------------|----------------------|
| Backend | Node.js + Express.js   | Lightweight & scalable API |
| Database | MongoDB (Mongoose ORM) | Flexible schema for event metadata |
| Templating | EJS (SSR) | No SPA overhead, SEO-friendly |
| Styling | TailwindCSS | Rapid UI development |
| Auth | JWT + Cookies | Stateless authentication |
| Email + QR | Nodemailer + QR library | Native confirmation workflow |

---

## ⚙️ Getting Started Locally

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/HarshitM07/FestFlow.git
cd FestFlow
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Set Up Environment Variables

Create a `.env` file in the root folder:

```env
MONGO_URI=your_mongo_db_connection
JWT_SECRET=your_long_random_secret
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_google_app_password
NODE_ENV=development
```

### 4️⃣ Run Super Admin Seed Script(only once)

```bash
npm run seed-superadmin
```

### 5️⃣ Start Server

```bash
npm start
```

---

### 📌 Deployment Notes
- Built-in QR scanner (mobile-camera)
- Analytics dashboard (per club & fest)
- CSV / Excel export
- Dedicated REST API for mobile app version
- Notification services (SMS / WhatsApp)

### 🔮 Future Enhancements
- Change NODE_ENV=production on deployment
- Use production-grade JWT secret
- Never commit .env
- Use environment variable management provided by platform

---

## 📁 Folder Structure

```
FestFlow/
├── models/ # Database schemas
├── routes/ # API & view routes
├── middleware/ # Authentication & authorization
├── utils/ # QR + email utilities
├── scripts/ # Super admin seeding
├── views/ # EJS UI templates
├── server.js # App bootstrap
└── README.md
```

---

## 👤 Author

**Harshit Mahajan**  
Backend Developer | NIT Hamirpur  
Open for collaborations & improvements.


---

## 📃 License

This project is licensed under the [MIT License](LICENSE).
