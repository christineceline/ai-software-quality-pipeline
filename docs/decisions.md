# Architecture Decisions

## ADR-001: Use a single repository

### Decision
Store the React frontend, Express backend and experimental scripts in one repository.

### Rationale
The components form one research artefact and must evolve together.

### Consequences
The repository is simpler to reproduce, but generated artefacts must be managed carefully to avoid excessive size.