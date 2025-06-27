# 🎉 FestFlow - College Event Management System

FestFlow is a full-stack event management web application designed for colleges, inspired by the fests held at NIT Hamirpur — `Hill'ffair` (Cultural) and `Nimbus` (Technical). 

This platform helps clubs manage their events and enables users to register, receive confirmation via email, and check in via QR code on the day of the event.

---

## 🚀 Features

### 🧑‍💼 For Admins (Clubs)
- ✅ Create, edit, and delete events
- ✅ View registrations for each event
- ✅ Download user lists (CSV support can be added)
- ✅ Perform QR-based check-ins for participants

### 🙋 For Users (Attendees)
- ✅ View and explore upcoming events
- ✅ Filter events by fest type or club name
- ✅ Register for events (with deadline validation)
- ✅ Receive email confirmation with unique QR code

---

## 🛠️ Tech Stack

| Technology        | Purpose                  |
|------------------|---------------------------|
| Node.js          | Backend runtime           |
| Express.js       | Web framework             |
| MongoDB + Mongoose | Database                |
| EJS              | Server-side rendering     |
| Tailwind CSS     | Styling                   |
| bcrypt           | Password hashing          |
| express-session  | Session handling          |
| connect-mongo    | Session storage           |
| connect-flash    | Flash messages (UI)       |
| nodemailer       | QR code email delivery    |

---

## ⚙️ Getting Started Locally

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/HarshitM07/FestFlow.git
cd FestFlow
