# 🎓 Students Table App

A full-featured Student Records Management System built with **React.js + Vite**.  
All CRUD operations run entirely on the frontend using in-memory state — no backend required.

---

## 🚀 Live Demo

> https://students-table-app.vercel.app *(update this link after you deploy)*

---

## ✅ Features

| Feature | Details |
|---|---|
| **Student List** | Name, Email, Age columns with sortable headers |
| **Add Student** | Modal form with full validation |
| **Edit Student** | Pre-filled modal, same validations |
| **Delete Student** | Confirmation dialog before removal |
| **Search / Filter** | Live search by name, email or age |
| **Loading State** | Skeleton rows on first mount (1.4s simulated) |
| **Excel Export** | Downloads filtered or full data as `.xlsx` |
| **Pagination** | 7 rows/page, smart page clamping |
| **Toast Alerts** | Success / warn / danger notifications |
| **Stats Cards** | Total, Avg Age, Filtered count, Pages |
| **Responsive** | Mobile-friendly layout |

---

## 🛠️ Tech Stack

- **React 18** — hooks only (useState, useEffect, useMemo)
- **Vite 5** — build tool
- **xlsx** — Excel file generation
- **Google Fonts** — Space Mono + Barlow
- **Pure CSS** — no UI library, no Tailwind

---

## 📁 Project Structure

```
students-table-app/
├── index.html          ← HTML entry with Google Fonts
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx        ← React DOM entry point
    └── App.jsx         ← Entire application (single file)
```

---

## ⚙️ Local Setup

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/students-table-app.git
cd students-table-app

# 2. Install
npm install

# 3. Run dev server
npm run dev
# → http://localhost:5173

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
npm run build
vercel
```
When prompted:
- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

### Option B — Vercel Dashboard
1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import the repo → auto-detects Vite → click **Deploy**

---

## 🔒 Validation Rules

| Field | Rules |
|---|---|
| Name | Required, minimum 2 characters |
| Email | Required, valid format, **unique** (no duplicates) |
| Age | Required, whole integer only, range 16–60 |

---

## 📦 Optional Backend (Bonus)

A NestJS + PostgreSQL backend can be added for extra credit:

```bash
npm install -g @nestjs/cli
nest new students-backend
cd students-backend
npm install @nestjs/typeorm typeorm pg class-validator class-transformer
```

REST endpoints: `GET /students`, `POST /students`, `PUT /students/:id`, `DELETE /students/:id`

---

## 🧑‍💻 Author

**Rajkumar** — Full Stack Assignment Submission
