# Processing log

## Experiment

- Experiment ID: `experiment-2026-08-03T14-15-25-809Z-f77080fe`
- Raw CSV: `C:\Users\Administrator\Documents\Development\ai-software-quality-pipeline\experiments\experiment-2026-08-03T14-15-25-809Z-f77080fe\dataset.csv`
- Raw JSON: `C:\Users\Administrator\Documents\Development\ai-software-quality-pipeline\experiments\experiment-2026-08-03T14-15-25-809Z-f77080fe\dataset.json`
- Raw manifest: `C:\Users\Administrator\Documents\Development\ai-software-quality-pipeline\experiments\experiment-2026-08-03T14-15-25-809Z-f77080fe\manifest.json`
- Raw CSV SHA-256: `e1e9e7200543cbacd0c4416f6bed12ca74a3e32d8abf594cf4b82087259044f2`
- Raw JSON SHA-256: `abb85bed02581ec63e79a116347911b9261d8336455463b391e30ec77caa4bad`
- Raw manifest SHA-256: `c482f9c0cc8cf6295d53a4e7e5069914982b3751c47a74dfb66d329846c0822d`

## Raw-data protection

The script opened raw files in read-only mode and wrote all outputs below the
analysis workspace. It did not overwrite or modify any raw experiment file.

## Validation

- Integrity checks: 38
- Passed: 38
- Failed: 0
- Raw run rows: 90
- Processed run rows: 90
- Processed iteration rows: 125

## Type conversions

- Identifier and free-text fields: pandas string dtype.
- Design and fixed-label fields: categorical dtype.
- Count, duration, token, repetition and sequence fields: nullable integer.
- Temperature: nullable floating-point number.
- Pass flags: nullable boolean.
- `converged`: nullable boolean; null is retained for non-automated workflows.
- Timestamps: UTC-aware datetime.
- `iterationMetrics`: retained unchanged as JSON text in the run-level dataset
  and expanded into a separate iteration-level dataset.

## Derived variables

No composite quality score was created.

- `workflowDurationSeconds = workflowDurationMs / 1000`
- `aiGenerationDurationSeconds = aiGenerationDurationMs / 1000`
- `pipelineOverheadMs = workflowDurationMs - aiGenerationDurationMs`
- `pipelineOverheadSeconds = pipelineOverheadMs / 1000`
- `initialFunctionalPassRate = initialFunctionalPassedTests / initialFunctionalTotalTests`
- `finalFunctionalPassRate = finalFunctionalPassedTests / finalFunctionalTotalTests`
- `automatedRefinementUsed = refinementIterations > 0` for automated-refinement
  runs; null for one-shot and quality-focused runs.

## Row preservation

All 90 formal experiment rows were retained. No outliers, failed-quality runs,
zero-refinement runs or legitimate zero values were removed.
