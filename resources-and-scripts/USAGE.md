# Virtual Environment Setup

Use a virtual environment so project dependencies stay isolated from global Python packages.

## Windows (PowerShell)

### 1) Create a virtual environment

```powershell
python -m venv venv
```

Description:
- `python`: runs the Python interpreter.
- `-m venv`: runs Python's built-in virtual environment module.
- `venv`: name of the folder to create for the environment (you can rename it).

### 2) Activate the virtual environment

```powershell
.\venv\Scripts\Activate.ps1
```

Description:
- `.\venv\Scripts\Activate.ps1`: runs the PowerShell activation script inside the `venv` folder.

### 3) Deactivate when done

```powershell
deactivate
```

Description:
- `deactivate`: exits the active virtual environment and returns to the system Python.

## Linux

### 1) Create a virtual environment

```bash
python3 -m venv venv
```

Description:
- `python3`: runs Python 3.
- `-m venv`: creates an isolated environment.
- `venv`: target folder for the environment.

### 2) Activate the virtual environment

```bash
source venv/bin/activate
```

Description:
- `source`: executes the activate script in the current shell session.
- `venv/bin/activate`: activation script path on Linux.

### 3) Deactivate when done

```bash
deactivate
```

Description:
- `deactivate`: leaves the virtual environment.

## macOS

### 1) Create a virtual environment

```bash
python3 -m venv venv
```

Description:
- Same purpose as Linux: creates an isolated Python environment in `venv`.

### 2) Activate the virtual environment

```bash
source venv/bin/activate
```

Description:
- Same as Linux: activates the environment for the current terminal session.

### 3) Deactivate when done

```bash
deactivate
```

Description:
- Leaves the virtual environment.

---

# Existing Project Command

```powershell
python .\main.py downloader -y --classes Goggles Helmet --type_csv validation --multiclasses 1 --limit 30
```

Description:
- `python .\main.py`: runs the toolkit entry script.
- `downloader`: required command to download object detection images.
- `-y`: auto-confirms download prompts (for missing CSV files, etc.).
- `--classes Goggles Helmet`: downloads images for classes `Goggles` and `Helmet`.
- `--type_csv validation`: uses the validation split.
- `--multiclasses 1`: combines selected classes into one output group instead of separate class folders.
- `--limit 30`: caps download to 30 images.
