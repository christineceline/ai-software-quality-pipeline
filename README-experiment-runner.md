# Experiment runner checkpoint

Copy these files into the repository, preserving paths.

## Files

- `server/src/routes/generationRoutes.js` — complete replacement
- `server/src/experiments/experimentConfig.js` — new
- `server/src/experiments/experimentStorage.js` — new
- `server/src/experiments/experimentDataset.js` — new
- `server/src/scripts/runExperiment.js` — new
- `server/package.json` — complete replacement

## Run

Terminal 1, repository root:

```powershell
npm run dev
```

Terminal 2:

```powershell
cd server
npm run experiment -- --repetitions 1
```

A full formal experiment with `N = 10` produces `3 × 3 × 10 = 90` sequential runs:

```powershell
npm run experiment -- --repetitions 10
```

## Resume

Use the experiment ID printed by the runner:

```powershell
npm run experiment -- --experiment-id experiment-...
```

Completed and failed runs are skipped. A run that was marked `running` when the process stopped is reset to `pending`.

Retry failed runs explicitly:

```powershell
npm run experiment -- --experiment-id experiment-... --retry-failed
```

## Output

Each experiment is stored under:

```text
experiments/<experiment-id>/
├── manifest.json
├── dataset.json
├── dataset.csv
└── responses/
```

`manifest.json` is updated before and after every run. `dataset.json` and `dataset.csv` are regenerated after every run, so partial results survive interruption.

## Failure definitions

- `generation-api-failure`: initial prompt construction, provider/API generation, or generated-response parsing.
- `pipeline-failure`: storage, static analysis, runtime validation, accessibility, functional validation, refinement, or finalisation.
- `valid-passed`: a generated application completed the pipeline and all available final quality checks passed.
- `valid-poor-quality`: a generated application completed the pipeline but one or more final quality checks failed.

## Checkpoint commit

```powershell
git status
git add server/src/routes/generationRoutes.js server/src/experiments server/src/scripts/runExperiment.js server/package.json
git commit -m "feat: add resumable sequential experiment runner"
git push
```
