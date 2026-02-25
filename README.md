# SafetyEye

AI-powered workplace occupancy and safety monitoring system focused on PPE compliance detection from video streams.

## Overview

SafetyEye is designed to analyze surveillance or webcam feeds and identify workplace safety violations, such as missing helmets or protective gear. The system targets office and industrial environments where administrators need live visibility into compliance and operational safety.

## Problem Statement

Workplaces need a practical way to:
- Monitor occupancy and safety behavior from existing camera infrastructure.
- Detect PPE non-compliance in near real time.
- Provide actionable alerts and visibility to administrators.

## Project Goals

- Train a computer vision model for PPE detection.
- Run real-time inference on live video feeds.
- Apply rule-based violation logic (for example, missing helmet).
- Trigger alerts when violations are detected.
- Present live feed and compliance analytics in a dashboard.

## Planned System Modules

- Data Preparation: Load, clean, and convert datasets into YOLO-compatible format.
- Model Training: Train and tune YOLOv8 for PPE classes.
- Detection Engine: Perform real-time frame inference with bounding boxes.
- Alerting: Emit notifications/logs for rule violations.
- Dashboard: Display live stream, metrics, and incident history.

## Milestones

- Week 1-2: Data preparation, architecture definition, environment setup.
- Week 3-4: YOLOv8 training, evaluation (mAP/precision/recall), tuning.
- Week 5-6: Real-time inference pipeline and violation rule engine.
- Week 7-8: Dashboard integration, testing, and final reporting.

## Repository Structure

- `code/`: Main project codebase (training/inference/dashboard implementation).
- `resources-and-scripts/OIDv4_ToolKit/`: Dataset tooling for Open Images downloads and labels.
- `resources-and-scripts/USAGE.md`: Local command guide, including virtual environment setup and data download commands.
- `project-docs/`: Project documentation and planning materials.

## Dataset

- Primary source documented for project development:
  - Construction Site Safety Image Dataset (Roboflow on Kaggle):  
    https://www.kaggle.com/datasets/snehilsanyal/construction-site-safety-image-dataset-roboflow
- Additional data tooling included in this repository:
  - Open Images OIDv4 Toolkit (`resources-and-scripts/OIDv4_ToolKit`)

## Tech Stack

- Python 3
- Ultralytics YOLOv8 (planned training/inference stack)
- PyTorch, OpenCV, NumPy (planned CV stack)
- Dashboard layer: Streamlit or Flask/Dash + frontend (planned)

## Quick Start

1. Clone the repository:

```bash
git clone <your-repo-url>
cd SaftyEye
```

2. Create and activate a virtual environment:
- See detailed OS-specific instructions in  
  `resources-and-scripts/USAGE.md`

3. Install dependencies for included OID tooling:

```bash
cd resources-and-scripts/OIDv4_ToolKit
pip install -r requirements.txt
```

4. Example dataset download command:

```bash
python .\main.py downloader -y --classes Goggles Helmet --type_csv validation --multiclasses 1 --limit 30
```

## Current Status

- Project scope, milestones, and architecture are documented.
- OIDv4 dataset tooling is integrated and runnable.
- Initial usage documentation has been added.
- End-to-end SafetyEye application modules are in active implementation.

## Documentation

- Project brief:  
  `project-docs/AI SafetyEye-AI Powered Workplace Occupancy & Safety Monitor.pdf`
- Usage guide:  
  `resources-and-scripts/USAGE.md`

## License

This repository is licensed under the terms in [LICENSE](LICENSE).
