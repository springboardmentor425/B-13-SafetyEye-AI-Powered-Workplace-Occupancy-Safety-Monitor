from ultralytics import YOLO

# 1. Ek pre-trained YOLOv8 model load karein (Nano version fast hota hai)
model = YOLO('yolov8n.pt') 

# 2. Training shuru karein
results = model.train(
    data='dataset/data.yaml',  # Aapki yaml file ka path [cite: 13]
    epochs=25,                 # Kitni baar model pura data dekhega
    imgsz=640,                 # Image ka size
    plots=True                 # Results ke graphs banane ke liye [cite: 7]
)



