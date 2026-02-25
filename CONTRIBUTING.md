# Contributing to SafetyEye

Thank you for contributing to SafetyEye. This document defines the baseline workflow for safe and consistent contributions.

## Prerequisites

- Python 3.x
- Git
- A virtual environment for local development

See `resources-and-scripts/USAGE.md` for OS-specific environment setup instructions.

## Development Workflow

1. Fork the repository and create a feature branch from `main`.
2. Keep changes scoped to a single concern.
3. Update documentation when behavior, commands, or structure changes.
4. Open a pull request with a clear summary and validation notes.

## Branch Naming

Use descriptive branch names:
- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

## Commit Message Guidance

Use conventional style when possible:
- `feat: add PPE violation rule`
- `fix: correct OID command parsing docs`
- `docs: update setup instructions`

## Pull Request Checklist

- Code is scoped and readable.
- Related documentation is updated.
- No large datasets or generated artifacts are committed.
- Any limitations or follow-up tasks are noted in the PR description.

## Reporting Issues

- Use GitHub issue templates.
- Include reproduction steps, expected behavior, and environment details.

## Code Style

- Python: follow PEP 8 conventions.
- Markdown/YAML: keep formatting clean and consistent.
- Prefer explicit, maintainable logic over clever shortcuts.
