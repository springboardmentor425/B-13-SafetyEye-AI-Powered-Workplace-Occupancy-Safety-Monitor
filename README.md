# 🚨 SafetyEye AI: Real-Time PPE Compliance Monitor

SafetyEye is an AI-powered workplace safety monitoring system. It uses **YOLOv8** computer vision to detect workers and ensure they are wearing proper Personal Protective Equipment (PPE) in real-time.

## 📖 Project Overview
SafetyEye is designed to automate safety inspections in industrial environments. By leveraging deep learning, the system monitors live camera feeds to detect whether workers are following safety protocols. Its main goal is to improve workplace safety, reduce accidents, and ensure compliance with safety regulations automatically.

## ✨ Key Features
* **Live Surveillance Feed:** Real-time monitoring via webcam or connected camera systems.
* **Full PPE Detection:** Specifically trained to track **Helmets**, **Boots**, **Goggles**, and **Gloves**.
* **Instant Violation Alerts:** High-contrast visual overlays appear immediately when safety gear is missing.
* **Modern AI Dashboard:** Futuristic dark-themed interface with high-visibility neon metrics.
* **Full-Screen Capability:** Dedicated button to expand the camera feed to the entire laptop screen for focused monitoring.

## 🛠️ Tech Stack
* **AI Engine:** YOLOv8 (Ultralytics)
* **Web Interface:** Streamlit
* **Computer Vision:** OpenCV
* **Programming Language:** Python 3.9+

## 🚀 Quick Setup Guide

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/SafetyEye-AI.git](https://github.com/YOUR_USERNAME/SafetyEye-AI.git)
   cd SafetyEye-AI
Install Required Libraries:

Bash
pip install -r requirements.txt
Launch the Application:

Bash
streamlit run app.py
🛡️ Monitoring Capabilities
The AI system is programmed to identify the following safety breaches:

🪖 Head Protection: Detects Missing Helmets

🥾 Foot Protection: Detects Missing Safety Boots

🥽 Eye Protection: Detects Missing Goggles

🧤 Hand Protection: Detects Missing Gloves

Developed for Industrial Safety Excellence.


---

### **Quick Deployment Checklist:**
To make sure your GitHub and Deployment work perfectly, ensure your folder looks exactly like this:
* `app.py` (The final code I gave you)
* `README.md` (The English content above)
* `requirements.txt` (With the 4 libraries: `streamlit`, `ultralytics`, `opencv-python-headless`, and `numpy`)
* `runs/detect/train/weights/best.pt` (Your model file)

