# 🌍 LandStack GIS

**LandStack GIS** is a full-stack Geographic Information System (GIS) and Land Parcel Management platform designed for cadastral exploration, land registry validation, and AI-powered satellite encroachment detection.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup (Express API)](#2-backend-setup-express-api)
  - [3. AI Service Setup (FastAPI & Computer Vision)](#3-ai-service-setup-fastapi--computer-vision)
  - [4. Frontend Setup (React & Vite)](#4-frontend-setup-react--vite)
- [Service URLs & Ports](#-service-urls--ports)
- [Core Features](#-core-features)
- [Git & Contribution Guide](#-git--contribution-guide)

---

## 🏛 Architecture Overview

```
land-stack-gis/
├── frontend/             # React 19 + Vite + Leaflet + Tailwind CSS
├── backend/
│   ├── server.js         # Node.js + Express REST API (Land Records & GIS Data)
│   └── ai-service/       # Python FastAPI + OpenCV + SSIM Encroachment Detection
```

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Leaflet, React-Leaflet, Tailwind CSS, Lucide Icons
- **Backend API**: Node.js, Express, CORS
- **AI / CV Service**: Python 3.10+, FastAPI, OpenCV, NumPy, Scikit-Image (SSIM), Uvicorn

---

## 📂 Repository Structure

```text
land-stack-gis/
├── .gitignore                   # Ignores node_modules, virtualenvs, .env, build outputs
├── README.md                    # Project documentation
├── backend/
│   ├── package.json             # Express dependencies
│   ├── server.js                # Core API server (Port 5000)
│   └── ai-service/
│       ├── main.py              # FastAPI satellite comparison service (Port 8000)
│       └── requirements.txt     # Python AI & CV libraries
└── frontend/
    ├── package.json             # React dependencies
    ├── vite.config.js           # Vite build configuration
    ├── tailwind.config.js       # Tailwind CSS configuration
    └── src/
        ├── App.jsx              # Main application shell
        └── components/          # Map, Search, Admin Dashboard, & AI modules
```

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher ([Download Python](https://www.python.org/))
- **Git**: ([Download Git](https://git-scm.com/))

---

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/land-stack-gis.git
cd land-stack-gis
```

---

### 2. Backend Setup (Express API)

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
npm install
```

Start the backend server:

```bash
npm run dev
```

> The Express backend will start on **`http://localhost:5000`**.

---

### 3. AI Service Setup (FastAPI & Computer Vision)

Open a **second terminal** and navigate to `backend/ai-service`:

```bash
cd backend/ai-service
```

#### Create a Python Virtual Environment:
* **Windows (PowerShell/CMD):**
  ```bash
  python -m venv .venv
  .venv\Scripts\activate
  ```
* **macOS / Linux:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

#### Install Python Dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Run the AI Service:
```bash
python main.py
```
*(Or via uvicorn directly: `uvicorn main:app --reload --port 8000`)*

> The AI service will start on **`http://localhost:8000`**.  
> Interactive Swagger API docs are available at **`http://localhost:8000/docs`**.

---

### 4. Frontend Setup (React & Vite)

Open a **third terminal** and navigate to `frontend`:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

> The web application will be accessible at **`http://localhost:5173`**.

---

## 🌐 Service URLs & Ports

| Service | Technology | Port | URL |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React + Vite | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | Node.js + Express | `5000` | [http://localhost:5000](http://localhost:5000) |
| **Encroachment AI API**| FastAPI + OpenCV | `8000` | [http://localhost:8000](http://localhost:8000) |
| **Interactive AI Docs**| Swagger UI | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## ✨ Core Features

- **Interactive Cadastral GIS Map**: High-performance spatial parcel visualization using Leaflet with layer toggles (satellite, street, hybrid).
- **ULPIN & Land Parcel Search**: Instant lookup of land titles, ownership history, khasra numbers, and mutation status.
- **Multidimensional Parcel Insights**:
  - Encumbrance certificate verification (non-encumbrance status, active loans, legal dispute records).
  - Zone classification (Residential, Commercial, Industrial, Agricultural) and building bylaws.
  - Municipal utilities check (water pipeline, power grid capacity, sewage linkages).
  - Circle rates, guideline valuations, and tax compliance indicators.
- **AI Satellite Encroachment Detection**:
  - Image difference analysis using OpenCV and Structural Similarity Index (SSIM).
  - Compares baseline historical satellite imagery against recent captures to flag unauthorized construction (>15% alteration threshold).
- **Administrative & Citizen Portals**: Secured role-based access for revenue officials and open transparency portal for citizens.

---

## 🔒 Git & Contribution Guide

### Why are dependencies and `.venv` not in Git?
This repository enforces clean version control via `.gitignore`:
- **`node_modules/`** and **`.venv/`** contain machine-generated, platform-dependent files and are **never committed**. Each developer installs their own local copies using `npm install` and `pip install -r requirements.txt`.
- **`.env`** files containing sensitive credentials or private keys must stay local.

### Workflow:
1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: describe your change"
   ```
3. Push to your branch and open a Pull Request.

---

## 📄 License
This project is developed for SIH / Smart India Hackathon. Refer to repository licensing terms for details.
