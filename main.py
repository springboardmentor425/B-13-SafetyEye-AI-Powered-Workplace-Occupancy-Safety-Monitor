import io
import base64
import os
import shutil
import tempfile
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

from inference import SafetyEyeModel
from database import SessionLocal, create_tables
from models import Detection, DetectionSession, VideoSource, Violation

app = FastAPI(title="Safety Eye API", version="2.0.0")

MODEL_PATH = Path(__file__).parent / "model" / "weights" / "best.onnx"
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

model = SafetyEyeModel(str(MODEL_PATH))

# In-memory job tracker for background video processing
_jobs: dict[str, dict] = {}


@app.on_event("startup")
async def startup_event():
    create_tables()
    print(f"YOLO model loaded: {MODEL_PATH}")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "alive", "message": "Safety Eye API is running"}


# ---------------------------------------------------------------------------
# Existing inference endpoints (unchanged)
# ---------------------------------------------------------------------------

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        detections = model(img)
        predictions = [
            {
                "class": d["class_id"],
                "class_name": d["class_name"],
                "confidence": d["confidence"],
                "bbox": {"x1": d["bbox"][0], "y1": d["bbox"][1],
                         "x2": d["bbox"][2], "y2": d["bbox"][3]},
            }
            for d in detections
        ]

        annotated_bgr = model.plot(img, detections)
        annotated_rgb = annotated_bgr[:, :, ::-1]          # BGR → RGB
        annotated_pil = Image.fromarray(annotated_rgb)
        buf = io.BytesIO()
        annotated_pil.save(buf, format="PNG")
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "success": True,
            "predictions": predictions,
            "image": f"data:image/png;base64,{img_b64}",
            "num_detections": len(predictions),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict-raw")
async def predict_raw(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        detections = model(img)
        predictions = [
            {
                "class": d["class_id"],
                "class_name": d["class_name"],
                "confidence": d["confidence"],
                "bbox": {"x1": d["bbox"][0], "y1": d["bbox"][1],
                         "x2": d["bbox"][2], "y2": d["bbox"][3]},
            }
            for d in detections
        ]

        return {"success": True, "predictions": predictions, "num_detections": len(predictions)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Step 1 — Data query endpoints
# ---------------------------------------------------------------------------

@app.get("/sessions")
def list_sessions(
    video_source_id: Optional[int] = Query(None, description="Filter by video source"),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
):
    """List detection sessions with stats, newest first."""
    db = SessionLocal()
    try:
        q = db.query(DetectionSession)
        if video_source_id is not None:
            q = q.filter(DetectionSession.video_source_id == video_source_id)
        total = q.count()
        sessions = q.order_by(DetectionSession.captured_at.desc()).offset(offset).limit(limit).all()

        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "sessions": [
                {
                    "id": str(s.id),
                    "video_source_id": s.video_source_id,
                    "frame_number": s.frame_number,
                    "timestamp_in_video": s.timestamp_in_video,
                    "captured_at": s.captured_at.isoformat() if s.captured_at else None,
                    "person_count": s.person_count,
                    "violation_count": s.violation_count,
                    "compliance_rate": s.compliance_rate,
                    "total_detections": s.total_detections,
                    "inference_time_ms": s.inference_time_ms,
                    "has_frame": bool(s.annotated_frame_path and Path(s.annotated_frame_path).exists()),
                }
                for s in sessions
            ],
        }
    finally:
        db.close()


@app.get("/sessions/{session_id}/frame")
def get_session_frame(session_id: str):
    """Return the annotated JPEG for a detection session."""
    db = SessionLocal()
    try:
        s = db.query(DetectionSession).filter(DetectionSession.id == session_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Session not found")
        if not s.annotated_frame_path or not Path(s.annotated_frame_path).exists():
            raise HTTPException(status_code=404, detail="Annotated frame not available")
        return FileResponse(s.annotated_frame_path, media_type="image/jpeg")
    finally:
        db.close()


@app.get("/sessions/{session_id}/detections")
def get_session_detections(session_id: str):
    """Return all bounding-box detections for a session."""
    db = SessionLocal()
    try:
        s = db.query(DetectionSession).filter(DetectionSession.id == session_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Session not found")

        dets = db.query(Detection).filter(Detection.session_id == session_id).all()
        return {
            "session_id": session_id,
            "detections": [
                {
                    "id": str(d.id),
                    "class_name": d.class_name,
                    "confidence": d.confidence,
                    "is_violation": d.is_violation,
                    "bbox": {"x1": d.bbox_x1, "y1": d.bbox_y1, "x2": d.bbox_x2, "y2": d.bbox_y2},
                    "bbox_center": {"x": d.bbox_center_x, "y": d.bbox_center_y},
                    "bbox_area": d.bbox_area,
                }
                for d in dets
            ],
        }
    finally:
        db.close()


@app.get("/violations")
def list_violations(
    violation_type: Optional[str] = Query(None, description="e.g. no_helmet"),
    severity: Optional[str] = Query(None, description="high or medium"),
    acknowledged: Optional[bool] = Query(None),
    video_source_id: Optional[int] = Query(None),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
):
    """List violations with optional filters."""
    db = SessionLocal()
    try:
        q = db.query(Violation)
        if violation_type:
            q = q.filter(Violation.violation_type == violation_type)
        if severity:
            q = q.filter(Violation.severity == severity)
        if acknowledged is not None:
            q = q.filter(Violation.acknowledged == acknowledged)
        if video_source_id is not None:
            q = q.filter(Violation.video_source_id == video_source_id)

        total = q.count()
        viols = q.order_by(Violation.frame_timestamp.desc()).offset(offset).limit(limit).all()

        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "violations": [
                {
                    "id": str(v.id),
                    "session_id": str(v.session_id),
                    "detection_id": str(v.detection_id),
                    "video_source_id": v.video_source_id,
                    "violation_type": v.violation_type,
                    "severity": v.severity,
                    "frame_timestamp": v.frame_timestamp.isoformat() if v.frame_timestamp else None,
                    "acknowledged": v.acknowledged,
                }
                for v in viols
            ],
        }
    finally:
        db.close()


@app.patch("/violations/{violation_id}/acknowledge")
def acknowledge_violation(violation_id: str):
    """Mark a violation as acknowledged."""
    db = SessionLocal()
    try:
        v = db.query(Violation).filter(Violation.id == violation_id).first()
        if not v:
            raise HTTPException(status_code=404, detail="Violation not found")
        v.acknowledged = True
        db.commit()
        return {"success": True, "violation_id": violation_id}
    finally:
        db.close()


@app.get("/stats")
def get_stats(video_source_id: Optional[int] = Query(None)):
    """Overall summary stats — useful as Grafana data source later."""
    db = SessionLocal()
    try:
        sq = db.query(DetectionSession)
        vq = db.query(Violation)
        if video_source_id is not None:
            sq = sq.filter(DetectionSession.video_source_id == video_source_id)
            vq = vq.filter(Violation.video_source_id == video_source_id)

        sessions = sq.all()
        total_sessions = len(sessions)

        if total_sessions == 0:
            return {"total_sessions": 0}

        avg_compliance = sum(s.compliance_rate for s in sessions) / total_sessions
        total_persons = sum(s.person_count for s in sessions)
        total_violations = vq.count()
        unacknowledged = vq.filter(Violation.acknowledged == False).count()

        from sqlalchemy import func
        type_counts = (
            db.query(Violation.violation_type, func.count(Violation.id))
            .group_by(Violation.violation_type)
            .all()
        )

        return {
            "total_sessions": total_sessions,
            "total_persons_detected": total_persons,
            "total_violations": total_violations,
            "unacknowledged_violations": unacknowledged,
            "avg_compliance_rate": round(avg_compliance, 2),
            "violations_by_type": {vtype: cnt for vtype, cnt in type_counts},
        }
    finally:
        db.close()


@app.get("/sources")
def list_sources():
    """List all video sources."""
    db = SessionLocal()
    try:
        sources = db.query(VideoSource).order_by(VideoSource.id.desc()).all()
        return {
            "sources": [
                {
                    "id": s.id,
                    "name": s.name,
                    "location": s.location,
                    "fps": s.fps,
                    "total_frames": s.total_frames,
                    "duration_sec": s.duration_sec,
                    "status": s.status,
                    "processed_at": s.processed_at.isoformat() if s.processed_at else None,
                }
                for s in sources
            ]
        }
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Step 2 — Background video processing
# ---------------------------------------------------------------------------

def _run_processor(job_id: str, video_path: str, location: Optional[str], interval: int):
    """Runs in a background thread; updates _jobs on progress/completion."""
    from video_processor import process_video

    _jobs[job_id]["status"] = "processing"
    try:
        process_video(video_path, location=location, interval=interval)
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["finished_at"] = datetime.utcnow().isoformat()
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)
    finally:
        # Clean up the temp file if we created one
        tmp = _jobs[job_id].get("_tmp_path")
        if tmp and Path(tmp).exists():
            Path(tmp).unlink(missing_ok=True)


@app.post("/process-video")
async def process_video_endpoint(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    location: Optional[str] = Query(None, description="Camera/zone label"),
    interval: int = Query(25, description="Process every Nth frame"),
):
    """
    Upload a video file and process it in the background.
    Returns a job_id to track progress via GET /jobs/{job_id}.
    """
    # Save upload to a temp file (background thread needs a real path)
    suffix = Path(video.filename).suffix or ".mp4"
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    contents = await video.read()
    tmp_file.write(contents)
    tmp_file.close()

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "filename": video.filename,
        "location": location,
        "interval": interval,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "_tmp_path": tmp_file.name,
    }

    background_tasks.add_task(
        _run_processor, job_id, tmp_file.name, location, interval
    )

    return {"job_id": job_id, "status": "pending", "filename": video.filename}


@app.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    """Check the status of a background video processing job."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = {k: v for k, v in _jobs[job_id].items() if not k.startswith("_")}
    return job


@app.get("/jobs")
def list_jobs():
    """List all processing jobs."""
    return {
        "jobs": [
            {k: v for k, v in job.items() if not k.startswith("_")}
            for job in _jobs.values()
        ]
    }


# Serve React frontend (built into static/ by Dockerfile)
_static = Path(__file__).parent / "static"
if _static.exists():
    app.mount("/", StaticFiles(directory=str(_static), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
