# Prototype Architecture

## Components

- React/Vite frontend
- Node.js/Express backend
- Ollama local AI service
- Generated application storage
- Automated quality assessment services
- Experiment result storage

## Data flow

1. User selects an application specification.
2. User selects a development workflow.
3. React submits the generation request to Express.
4. Express constructs the workflow-specific prompt.
5. Express sends the request to Ollama.
6. The generated files are validated and stored.
7. The application is displayed in a sandboxed preview.
8. Quality tools analyse the application.
9. Results and generation metadata are stored.