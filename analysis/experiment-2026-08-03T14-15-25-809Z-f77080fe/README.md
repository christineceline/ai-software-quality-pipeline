# Formal experiment analysis workspace

Experiment: `experiment-2026-08-03T14-15-25-809Z-f77080fe`

## Purpose

This workspace validates and preprocesses the formal experiment dataset without
modifying the raw files under `experiments/experiment-2026-08-03T14-15-25-809Z-f77080fe/`.

## Run from the repository root

```powershell
python -m venv .venv-analysis
.\.venv-analysis\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r "analysis\experiment-2026-08-03T14-15-25-809Z-f77080fe\requirements.txt"

python "analysis\experiment-2026-08-03T14-15-25-809Z-f77080fe\scripts\validate_and_preprocess.py"
```

Expected terminal output:

```text
Schema validation: PASSED
Processed run rows: 90
Processed iteration rows: 125
```

## Generated outputs

- `outputs/processed_runs.csv`
- `outputs/processed_iterations.csv`
- `outputs/schema_summary.json`
- `tables/integrity_checks.csv`
- `tables/numeric_ranges.csv`
- `tables/missing_values.csv`
- `tables/data_dictionary.csv`
- `tables/data_dictionary.md`
- `processing-log.md`

The script never writes to the raw experiment directory.
