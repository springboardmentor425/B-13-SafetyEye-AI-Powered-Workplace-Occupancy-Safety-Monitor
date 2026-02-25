# SafetyEye

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.x-blue)
![Status](https://img.shields.io/badge/Status-Active%20Development-green)

AI-powered workplace occupancy and safety monitoring focused on PPE compliance detection from image/video streams.

## Overview

SafetyEye aims to help administrators monitor safety compliance in office and industrial spaces using computer vision. The documented target outcomes are:
- Detect PPE violations such as missing helmets and related gear.
- Generate alerts and compliance insights.
- Present results through a real-time monitoring dashboard.

## Scope

- Data preparation for YOLO-compatible datasets.
- PPE model training (YOLOv8 planned stack).
- Real-time detection and rule-based violation logic.
- Alerting layer for safety incidents.
- Dashboard with live feed and compliance metrics.

## Project Milestones

- Week 1-2: Data preparation and environment setup.
- Week 3-4: Model training, validation, and tuning.
- Week 5-6: Real-time inference and alert engine.
- Week 7-8: Dashboard integration and final system testing.

## Repository Layout

- `code/`: Main project code area for SafetyEye modules.
- `resources-and-scripts/OIDv4_ToolKit/`: Open Images download/label tooling.
- `resources-and-scripts/USAGE.md`: OS-specific environment setup and command usage.
- `project-docs/`: Project brief and planning documentation.

## Quick Start

1. Clone the repository.
2. Create and activate a virtual environment (see `resources-and-scripts/USAGE.md`).
3. Install toolkit dependencies:

```bash
cd resources-and-scripts/OIDv4_ToolKit
pip install -r requirements.txt
```

4. Example OID download:

```bash
python .\main.py downloader -y --classes Goggles Helmet --type_csv validation --multiclasses 1 --limit 30
```

## Dataset References

- Construction Site Safety Image Dataset (Kaggle/Roboflow):
  https://www.kaggle.com/datasets/snehilsanyal/construction-site-safety-image-dataset-roboflow
- Open Images Toolkit (included under `resources-and-scripts/OIDv4_ToolKit`).

## Governance and Community

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Changelog](CHANGELOG.md)
- [Citation Metadata](CITATION.cff)

## Documentation

- Project brief:
  `project-docs/AI SafetyEye-AI Powered Workplace Occupancy & Safety Monitor.pdf`
- Usage:
  `resources-and-scripts/USAGE.md`

## License

This repository is licensed under the terms in [LICENSE](LICENSE).
