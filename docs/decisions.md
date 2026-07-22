# Architecture Decisions

## ADR-001: Use a single repository

### Decision
Store the React frontend, Express backend and experimental scripts in one repository.

### Rationale
The components form one research artefact and must evolve together.

### Consequences
The repository is simpler to reproduce, but generated artefacts must be managed carefully to avoid excessive size.


## ADR-002: Use fixed application specifications

### Decision

The pipeline provides three predefined application specifications rather
than accepting arbitrary user-written requirements.

### Rationale

Fixed specifications support controlled comparison between development
workflows and reduce variation caused by differences in user input.

### Consequences

The prototype has less general-purpose flexibility, but experimental runs
are more reproducible and comparable.

## ADR-003: Use structured JSON generation

### Decision

The AI model is instructed to return HTML, CSS, JavaScript and metadata
inside one predefined JSON structure.

### Rationale

Structured output allows the pipeline to parse, validate, store and preview
generated applications automatically.

### Consequences

Generation may fail when the model returns malformed JSON. These failures
must be recorded rather than silently corrected during formal experiments.

## ADR-004: Sandbox generated applications

### Decision

Generated applications are displayed using an iframe with a restricted
sandbox configuration.

### Rationale

Generated JavaScript should not execute with access to the pipeline's main
document or application state.

### Consequences

Some browser capabilities are intentionally unavailable to generated
applications.