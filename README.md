# Formal experiment preflight and reproducibility freeze

Extract into the repository root and replace the included files.

## Run preflight

Start the server first:

```powershell
npm run dev
```

In a second terminal:

```powershell
cd server
npm run experiment:preflight
```

The preflight blocks a new experiment unless:

- `AI_PROVIDER=openai`
- a model is configured
- all three specifications and workflows are present
- required pipeline files exist
- the server health endpoint is reachable
- a reproducibility fingerprint can be generated

## Reproducibility fingerprint

Every new experiment manifest records:

- SHA-256 for the complete prompt directory
- SHA-256 for specifications
- SHA-256 for quality and validation pipeline files
- a combined SHA-256 fingerprint
- the preflight timestamp

This allows you to show that prompts, tests and pipeline code remained fixed during the formal experiment.

## Pilot

After preflight passes:

```powershell
npm run experiment -- 1
```

## Formal run example

```powershell
npm run experiment -- --repetitions=10 --seed=77077
```
