# 🦺 SafetyEye: AI-Powered Workplace Safety Monitoring System

SafetyEye is an AI-based computer vision system designed to enhance workplace safety by detecting Personal Protective Equipment (PPE) such as helmets and goggles in real-time. This project leverages deep learning and object detection techniques to ensure compliance with safety protocols in industrial environments.

---

## 📌 Features

- 🔍 Real-time PPE detection using YOLOv8  
- 🧠 Deep learning-based object detection  
- 🖼️ Image and video processing support  
- 📊 High accuracy detection for helmets and goggles  
- ⚡ Efficient and scalable monitoring system  

---

## 🛠️ Tech Stack

- **Programming Language:** Python  
- **Frameworks/Libraries:** YOLOv8, OpenCV, NumPy  
- **Tools:** Jupyter Notebook, GitHub  
- **Concepts:** Computer Vision, Object Detection, Deep Learning  

---

## 📂 Project Workflow

1. Data Collection and Annotation  
2. Dataset Preparation (YOLO format)  
3. Model Training using YOLOv8  
4. Model Evaluation and Testing  
5. Real-time Detection Implementation  

---

## 🎯 Use Cases

- Industrial workplace safety monitoring  
- Construction site compliance checking  
- Automated surveillance systems  
- Smart factory environments  

---

## 📈 Future Enhancements

- Add detection for more PPE (vests, gloves, masks)  
- Improve model accuracy with larger datasets  
- Deploy as a web or mobile application  
- Integrate alert/notification system  

---

## 👩‍💻 My Contribution

- Annotated datasets and prepared YOLO-format training data  
- Assisted in model training and evaluation  
- Analyzed detection results and improved performance  
- Contributed to overall system workflow and testing  

---

## 🤝 Acknowledgment

This project was developed as part of the **Infosys Springboard AI/ML Internship Program**.

---

## 📎 Repository Link

👉 https://github.com/springboardmentor425/B-13-SafetyEye-AI-Powered-Workplace-Occupancy-Safety-Monitor

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  Docker Compose                  │
│                                                  │
│  ┌─────────────────┐    ┌─────────────────────┐ │
│  │  safety_eye_api  │    │  safety_eye_grafana  │ │
│  │                 │    │                     │ │
│  │  FastAPI :8000  │    │   Grafana  :3000    │ │
│  │  React (static) │    │  (provisioned auto) │ │
│  │  ONNX inference │    └──────────┬──────────┘ │
│  └────────┬────────┘               │             │
│           └──────────┬─────────────┘             │
│                      │                           │
│          ┌───────────▼───────────┐               │
│          │  safety_eye_postgres  │               │
│          │    PostgreSQL :5432   │               │
│          └───────────────────────┘               │
└─────────────────────────────────────────────────┘

Host ports:  API + Frontend → 8100  |  Grafana → 3100  |  DB → 5433
```

---

## 🗂 Project Structure

```
safty_eye/
├── main.py                  # FastAPI app — all API endpoints + serves frontend
├── inference.py             # ONNX inference wrapper (no PyTorch needed)
├── video_processor.py       # Frame-by-frame video analysis pipeline
├── models.py                # SQLAlchemy ORM — 4 database tables
├── database.py              # DB engine and session factory
├── config.py                # Environment config (DB, model path, etc.)
│
├── model/
│   └── weights/
│       └── best.onnx        # Trained YOLOv8 model (ONNX format, 212MB)
│
├── frontend/                # React + Vite frontend
│   └── src/
│       ├── pages/           # Dashboard, Upload, Violations, Live
│       └── components/      # Sidebar, StatCard
│
├── grafana/
│   └── provisioning/        # Auto-configured datasource + dashboard
│
├── Dockerfile               # Multi-stage: builds React then embeds in Python image
├── docker-compose.yml       # Local build (for developers)
├── docker-compose.hub.yml   # Pre-built image from Docker Hub (for end users)
├── init.sql                 # PostgreSQL schema — runs automatically on first start
└── .env                     # Port and credential configuration
```

---

## ⚙️ Configuration

All settings live in the `.env` file. Edit before running `docker compose up`:

```env
# Database
DB_NAME=safety_eye
DB_USER=postgres
DB_PASSWORD=123          # change this in production
DB_PORT=5433

# API + Frontend
API_PORT=8100

# Grafana
GRAFANA_PORT=3100
GRAFANA_USER=Admin
GRAFANA_PASSWORD=MyStrongPass123   # change this in production
```

## 🗄 Database Schema

```
video_sources
  └── detection_sessions    (one row per sampled frame)
        ├── detections       (one row per bounding box detected)
        └── violations       (filtered subset — only violation detections)

---

## ⭐ If you find this project useful, consider giving it a star!


