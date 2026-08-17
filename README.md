<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=250&section=header&text=Setu&fontSize=90&fontAlignY=35&desc=Next-Gen%20Telemetry%20%26%20Routing%20Intelligence&descAlignY=60&descAlign=60" alt="Setu Banner" />

  <p align="center">
    <strong>A high-performance, real-time spatial telemetry and routing platform.</strong>
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#simulation">Simulation</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?style=for-the-badge&logo=react" alt="Frontend" />
    <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" alt="Backend" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Timescale-336791?style=for-the-badge&logo=postgresql" alt="Database" />
    <img src="https://img.shields.io/badge/Streaming-Kafka-231F20?style=for-the-badge&logo=apachekafka" alt="Streaming" />
  </p>
</div>

---

## ✨ Features

*   **🌍 Advanced Geospatial Visualization**: Powered by `deck.gl` and `MapLibre GL` for highly performant, WebGL-accelerated 3D mapping and rendering.
*   **⚡ Real-Time Telemetry & Event Streaming**: Leverages `Apache Kafka` for high-throughput event streaming and `TimescaleDB` for time-series geospatial telemetry storage.
*   **🛣️ Intelligent Routing**: Integrated with `OSRM` (Open Source Routing Machine) to calculate optimal paths and network logistics.
*   **📊 Insightful Analytics**: Built-in `Metabase` integration to explore data and visualize trends seamlessly.
*   **🔒 Secure Identity Management**: Implements `Keycloak` (backend) and `Clerk` (frontend) for robust authentication and role-based access control.
*   **🚀 Ultra-Fast API**: Built on `FastAPI` with asynchronous database communication (`asyncpg`) and `Redis` caching for lightning-fast responses.
*   **🎨 Stunning UI/UX**: Designed with `TailwindCSS v4`, featuring smooth animations using `Framer Motion` and `GSAP`.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 19, Vite
*   **Styling & Animation**: TailwindCSS, Framer Motion, GSAP
*   **Maps & Data Viz**: Deck.gl, MapLibre GL, Recharts
*   **Auth**: Clerk

### Backend
*   **API**: Python, FastAPI, Uvicorn
*   **ORM & DB Driver**: SQLAlchemy 2.0, asyncpg

### Infrastructure (Dockerized)
*   **Databases**: PostgreSQL (with PostGIS), TimescaleDB, Redis
*   **Message Broker**: Confluent Kafka & Zookeeper
*   **Storage**: MinIO (S3-compatible)
*   **Services**: Keycloak (IAM), Metabase (BI), OSRM (Routing)

## 🏗️ Architecture Overview

Setu uses a microservices-inspired architecture designed for scale:
1.  **Ingestion & Streaming**: IoT or synthetic telemetry data is published to **Kafka** topics.
2.  **Processing & Storage**: The **FastAPI** backend consumes and processes these events, storing relational state in **PostGIS** and time-series metrics in **TimescaleDB**.
3.  **Routing**: The backend queries the local **OSRM** instance to compute travel times and routes.
4.  **Client Application**: The **React** frontend fetches data via REST APIs, leveraging **Deck.gl** to overlay millions of data points on the map seamlessly.

## 🚀 Getting Started

Follow these instructions to set up the project locally. 

### Prerequisites
*   [Docker](https://www.docker.com/) & Docker Compose
*   [Python 3.10+](https://www.python.org/)
*   [Node.js](https://nodejs.org/) & npm
*   `make` utility (optional, but recommended for using the provided Makefile)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Mayank-iitj/Setu.git
    cd Setu
    ```

2.  **Environment Setup**
    This command will copy the sample environment variables, create a Python virtual environment, install backend dependencies, and install frontend packages.
    ```bash
    make setup
    ```

3.  **Start Infrastructure Services**
    Spin up all the required databases, message brokers, and sidecar services in the background using Docker Compose.
    ```bash
    make up
    ```

4.  **Run Development Servers**
    Start both the FastAPI backend and Vite frontend development servers.
    ```bash
    make dev
    ```
    *The frontend will be accessible at `http://localhost:5173` and the API at `http://localhost:8000`.*

## 🧪 Simulation & Seeding

Setu comes with built-in scripts to test the platform with synthetic telemetry data.

*   **Seed the Database**: Generate initial spatial networks and entities.
    ```bash
    make seed
    ```
*   **Run Simulator**: Start publishing real-time mock location data to the streaming pipeline.
    ```bash
    make simulate
    ```

## 🛑 Teardown

To stop the containers and wipe the volumes (database state):
```bash
make down
```

---
<div align="center">
  <sub>Built with ❤️ for SIH</sub>
</div>
