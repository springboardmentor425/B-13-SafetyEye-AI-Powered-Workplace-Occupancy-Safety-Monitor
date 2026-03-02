import cv2
from ultralytics import YOLO

# 1. Model Load
model = YOLO('runs/detect/train/weights/best.pt') 

cap = cv2.VideoCapture(0)

# 2. Exact Mapping (Aapke data.yaml ke indices ke hisab se)
# In labels ko detect karte hi specific alert aayega
VIOLATION_MAP = {
    'no_helmet': 'HELMET',
    'no_boots': 'BOOTS',
    'no_gloves': 'GLOVES',
    'no_goggle': 'GOGGLES',
    'none': 'PPE GEAR' # Jab model generic 'none' dikhaye
}

while cap.isOpened():
    success, frame = cap.read()
    if success:
        # Confidence thoda kam (0.25) rakha hai taaki model detections miss na kare
        results = model(frame, conf=0.25)
        
        found_violations = []
        
        for result in results:
            names = result.names
            for box in result.boxes:
                label = names[int(box.cls)]
                
                # Check if detected label is in our violation map
                if label in VIOLATION_MAP:
                    found_violations.append(VIOLATION_MAP[label])

        annotated_frame = results[0].plot()

        # 3. Dynamic Alert Display
        if found_violations:
            unique_v = list(set(found_violations)) # Unique violations only
            
            # Draw Alert Box
            cv2.rectangle(annotated_frame, (10, 10), (500, 150), (0, 0, 0), -1) 
            cv2.putText(annotated_frame, "⚠️ SAFETY VIOLATION!", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
            
            y_offset = 90
            for v in unique_v:
                cv2.putText(annotated_frame, f"MISSING: {v}", (20, y_offset), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                y_offset += 35

        cv2.imshow("SafetyEye - Full PPE Monitor", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    else:
        break

cap.release()
cv2.destroyAllWindows()