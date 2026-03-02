import streamlit as st
import cv2
from ultralytics import YOLO
import numpy as np
import streamlit.components.v1 as components

# 1. Page Configuration
st.set_page_config(
    page_title="SafetyEye AI | Command Center",
    page_icon="🚨",
    layout="centered" 
)

# 2. Strong CSS for Visibility & Styling
st.markdown("""
    <style>
    .stApp { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #ffffff; }
    
    p, span, label, [data-testid="stMetricLabel"] {
        color: #00DBFF !important;
        font-weight: 700 !important;
    }
    
    .desc-box {
        background: rgba(255, 255, 255, 0.05);
        border-left: 5px solid #ff4b4b;
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0px;
        color: #e0e0e0;
        font-size: 1.1rem;
        line-height: 1.6;
    }

    .main-title {
        background: -webkit-linear-gradient(#ff4b4b, #ff9068);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.8rem; font-weight: 800; text-align: center;
        margin-bottom: 0px;
    }
    
    [data-testid="stImage"] img { border: 3px solid #00DBFF; border-radius: 15px; }

    /* Custom Full Screen Button Style */
    .fs-btn {
        background-color: #ff4b4b;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        margin-bottom: 10px;
    }
    </style>
    """, unsafe_allow_html=True)

# Full Screen JavaScript Logic
st.markdown("""
    <script>
    function toggleFullScreen() {
        var el = window.parent.document.querySelector('img[data-testid="stImage"]');
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }
    </script>
    """, unsafe_allow_html=True)

# 3. Load Model
@st.cache_resource
def load_model():
    return YOLO('runs/detect/train/weights/best.pt')
model = load_model()

# 4. Header & Project Description
st.markdown('<p class="main-title">SAFETYEYE COMMAND CENTER</p>', unsafe_allow_html=True)

st.markdown("""
<div class="desc-box">
    <b>Safety Eye Project</b> is an AI-powered workplace safety monitoring system. 
    It uses computer vision models like <b>YOLOv8</b> to detect whether workers are wearing proper PPE. 
    Its main goal is to improve workplace safety, reduce accidents, and ensure compliance 
    with safety regulations automatically.
</div>
""", unsafe_allow_html=True)

# 5. Metrics
col_m1, col_m2, col_m3 = st.columns(3)
m1, m2, m3 = col_m1.empty(), col_m2.empty(), col_m3.empty()
st.markdown("---")

# 6. Sidebar Settings
st.sidebar.markdown("<h2 style='color: #ff4b4b;'>⚙️ SETTINGS</h2>", unsafe_allow_html=True)
conf_val = st.sidebar.slider("AI Sensitivity", 0.05, 1.0, 0.20)

# 7. Camera Control
run = st.checkbox('🚀 ENGAGE AI SURVEILLANCE', value=False)

# Full Screen Button (Is par click karte hi camera poori screen par aa jayega)
if run:
    components.html(
        """
        <button class="fs-btn" onclick="window.parent.document.querySelector('img').requestFullscreen()" 
        style="background-color: #ff4b4b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
        🖥️ CLICK FOR FULL SCREEN CAMERA
        </button>
        """,
        height=50,
    )

FRAME_WINDOW = st.image([], width=700)
camera = cv2.VideoCapture(0)

while run:
    success, frame = camera.read()
    if not success: break

    results = model(frame, conf=conf_val)
    detected_labels = []
    annotated_frame = frame.copy()

    for r in results:
        for box in r.boxes:
            lbl = model.names[int(box.cls)].lower()
            detected_labels.append(lbl)
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
           # Is line ko apne app.py mein replace kar lijiye (Black Labels ke liye)
            cv2.putText(annotated_frame, lbl.upper(), (x1, y1 - 10), 
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2) # (0,0,0) is Black

    violations = []
    if 'person' in detected_labels:
        if 'helmet' not in detected_labels and 'no_helmet' not in detected_labels: violations.append("HELMET")
        if 'boots' not in detected_labels and 'no_boots' not in detected_labels: violations.append("BOOTS")
        if 'goggles' not in detected_labels and 'no_goggle' not in detected_labels: violations.append("GOGGLES")
        if 'gloves' not in detected_labels and 'no_gloves' not in detected_labels: violations.append("GLOVES")

    m1.metric("SYSTEM", "ONLINE 🟢")
    m2.metric("PERSONNEL", detected_labels.count('person'))
    m3.metric("BREACHES", len(violations))

    if violations:
        cv2.rectangle(annotated_frame, (5, 5), (450, 60 + len(violations)*45), (0, 0, 0), -1)
        cv2.putText(annotated_frame, "!!! PPE VIOLATION !!!", (20, 45), 
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, (0, 0, 255), 2)
        y = 95
        for v in violations:
            cv2.putText(annotated_frame, f">> MISSING: {v}", (30, y), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            y += 40

    FRAME_WINDOW.image(cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB), width=700)

if not run:
    camera.release()
    m1.metric("SYSTEM", "OFFLINE ⚪")
    st.info("System is on Standby.")