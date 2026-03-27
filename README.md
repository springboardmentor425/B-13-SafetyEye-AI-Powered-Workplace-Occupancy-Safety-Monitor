# YOLO Safety Detection API

A FastAPI server for running predictions using your pretrained YOLO detection model.

## Setup

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server**
   ```bash
   python main.py
   ```
   
   The server will start on `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/` - Returns server status

### Make Predictions
- **POST** `/predict` - Returns predictions + annotated image as base64
  - Input: Image file (multipart/form-data)
  - Response: JSON with predictions and encoded image
  
- **POST** `/predict-raw` - Returns only predictions (lighter response)
  - Input: Image file (multipart/form-data)
  - Response: JSON with predictions only

## Response Format

### Predict Endpoint Response
```json
{
  "success": true,
  "predictions": [
    {
      "class": 0,
      "class_name": "hazard",
      "confidence": 0.95,
      "bbox": {
        "x1": 100.5,
        "y1": 200.3,
        "x2": 300.2,
        "y2": 400.1
      }
    }
  ],
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "num_detections": 1
}
```

## Testing

You can test the API using:

### cURL
```bash
curl -X POST "http://localhost:8000/predict" -F "image=@path/to/image.jpg"
```

### Python
```python
import requests

with open('test_image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:8000/predict', files=files)
    print(response.json())
```

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

## Model Configuration

- Model weights: `model/weights/best.pt`
- Model config: `model/args.yaml`
- Input size: 768x768
- Task: Object detection
