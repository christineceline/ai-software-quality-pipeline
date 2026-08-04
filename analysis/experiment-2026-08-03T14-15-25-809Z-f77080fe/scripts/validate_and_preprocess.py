from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


EXPERIMENT_ID = "experiment-2026-08-03T14-15-25-809Z-f77080fe"

EXPECTED_COLUMNS = [
    "experimentId", "experimentRunId", "sequence", "specificationId",
    "specificationName", "workflow", "repetition", "status",
    "resultClassification", "failureType", "failureStage", "error",
    "attemptCount", "startedAt", "completedAt", "runId", "provider", "model",
    "temperature", "promptVersion", "runOrder", "randomSeed",
    "workflowDurationMs", "aiGenerationDurationMs", "refinementIterations",
    "converged", "stopReason", "totalPromptTokens", "totalOutputTokens",
    "totalTokens", "initialStaticPassed", "initialRuntimePassed",
    "initialAccessibilityPassed", "initialFunctionalPassed", "initialAllPassed",
    "initialStaticTotalIssues", "initialStaticErrors", "initialStaticWarnings",
    "initialRuntimeConsoleErrors", "initialRuntimeUncaughtExceptions",
    "initialRequiredControlsPresent", "initialRequiredControlsExpected",
    "initialAccessibilityViolations", "initialAccessibilityViolatingNodes",
    "initialAccessibilityCritical", "initialAccessibilitySerious",
    "initialAccessibilityModerate", "initialAccessibilityMinor",
    "initialAccessibilityIncomplete", "initialFunctionalPassedTests",
    "initialFunctionalFailedTests", "initialFunctionalTotalTests",
    "finalStaticPassed", "finalRuntimePassed", "finalAccessibilityPassed",
    "finalFunctionalPassed", "finalAllPassed", "finalStaticTotalIssues",
    "finalStaticErrors", "finalStaticWarnings", "finalRuntimeConsoleErrors",
    "finalRuntimeUncaughtExceptions", "finalRequiredControlsPresent",
    "finalRequiredControlsExpected", "finalAccessibilityViolations",
    "finalAccessibilityViolatingNodes", "finalAccessibilityCritical",
    "finalAccessibilitySerious", "finalAccessibilityModerate",
    "finalAccessibilityMinor", "finalAccessibilityIncomplete",
    "finalFunctionalPassedTests", "finalFunctionalFailedTests",
    "finalFunctionalTotalTests", "staticIssueChange",
    "accessibilityViolationChange", "functionalFailedTestChange",
    "iterationMetrics", "responseFile",
]

BOOLEAN_COLUMNS = [
    "initialStaticPassed", "initialRuntimePassed",
    "initialAccessibilityPassed", "initialFunctionalPassed", "initialAllPassed",
    "finalStaticPassed", "finalRuntimePassed", "finalAccessibilityPassed",
    "finalFunctionalPassed", "finalAllPassed",
]

INTEGER_COLUMNS = [
    "sequence", "repetition", "attemptCount", "randomSeed",
    "workflowDurationMs", "aiGenerationDurationMs", "refinementIterations",
    "totalPromptTokens", "totalOutputTokens", "totalTokens",
    "initialStaticTotalIssues", "initialStaticErrors", "initialStaticWarnings",
    "initialRuntimeConsoleErrors", "initialRuntimeUncaughtExceptions",
    "initialRequiredControlsPresent", "initialRequiredControlsExpected",
    "initialAccessibilityViolations", "initialAccessibilityViolatingNodes",
    "initialAccessibilityCritical", "initialAccessibilitySerious",
    "initialAccessibilityModerate", "initialAccessibilityMinor",
    "initialAccessibilityIncomplete", "initialFunctionalPassedTests",
    "initialFunctionalFailedTests", "initialFunctionalTotalTests",
    "finalStaticTotalIssues", "finalStaticErrors", "finalStaticWarnings",
    "finalRuntimeConsoleErrors", "finalRuntimeUncaughtExceptions",
    "finalRequiredControlsPresent", "finalRequiredControlsExpected",
    "finalAccessibilityViolations", "finalAccessibilityViolatingNodes",
    "finalAccessibilityCritical", "finalAccessibilitySerious",
    "finalAccessibilityModerate", "finalAccessibilityMinor",
    "finalAccessibilityIncomplete", "finalFunctionalPassedTests",
    "finalFunctionalFailedTests", "finalFunctionalTotalTests",
    "staticIssueChange", "accessibilityViolationChange",
    "functionalFailedTestChange",
]

DATETIME_COLUMNS = ["startedAt", "completedAt"]

CATEGORICAL_COLUMNS = [
    "specificationId", "specificationName", "workflow", "status",
    "resultClassification", "provider", "model", "promptVersion", "runOrder",
    "stopReason",
]

DERIVED_COLUMNS = [
    "workflowDurationSeconds",
    "aiGenerationDurationSeconds",
    "pipelineOverheadMs",
    "pipelineOverheadSeconds",
    "initialFunctionalPassRate",
    "finalFunctionalPassRate",
    "automatedRefinementUsed",
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def nested(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def normalise_exact(value: Any, column: str) -> str:
    if value is None:
        return ""
    if isinstance(value, (bool, np.bool_)):
        return "true" if bool(value) else "false"
    if isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    return str(value)


def flatten_dataset_run(
    run: dict[str, Any],
    dataset: dict[str, Any],
) -> dict[str, Any]:
    configuration = dataset["configuration"]
    experiment_metrics = nested(
        run, "metadata", "experimentMetrics", default={}
    ) or {}

    initial_pass = run.get("initialPassStatus") or {}
    final_pass = run.get("finalPassStatus") or {}
    initial_reports = run.get("initialReports") or {}
    final_reports = run.get("finalReports") or {}

    initial_quality = nested(
        initial_reports, "qualityReport", "summary", default={}
    ) or {}
    final_quality = nested(
        final_reports, "qualityReport", "summary", default={}
    ) or {}

    initial_runtime = nested(
        initial_reports, "runtimeReport", "summary", default={}
    ) or {}
    final_runtime = nested(
        final_reports, "runtimeReport", "summary", default={}
    ) or {}

    initial_accessibility = initial_reports.get("accessibilityReport") or {}
    final_accessibility = final_reports.get("accessibilityReport") or {}
    initial_impact = initial_accessibility.get("violationsByImpact") or {}
    final_impact = final_accessibility.get("violationsByImpact") or {}

    initial_functional = nested(
        initial_reports, "functionalReport", "summary", default={}
    ) or {}
    final_functional = nested(
        final_reports, "functionalReport", "summary", default={}
    ) or {}

    initial_static_issues = initial_quality.get("totalIssues")
    final_static_issues = final_quality.get("totalIssues")
    initial_accessibility_violations = initial_accessibility.get("violationCount")
    final_accessibility_violations = final_accessibility.get("violationCount")
    initial_functional_failures = initial_functional.get("failedCount")
    final_functional_failures = final_functional.get("failedCount")

    return {
        "experimentId": dataset.get("experimentId"),
        "experimentRunId": run.get("experimentRunId"),
        "sequence": run.get("sequence"),
        "specificationId": nested(run, "specification", "id"),
        "specificationName": nested(run, "specification", "name"),
        "workflow": run.get("workflow"),
        "repetition": run.get("repetition"),
        "status": run.get("status"),
        "resultClassification": run.get("resultClassification"),
        "failureType": run.get("failureType"),
        "failureStage": run.get("failureStage"),
        "error": run.get("error"),
        "attemptCount": run.get("attemptCount"),
        "startedAt": run.get("startedAt"),
        "completedAt": run.get("completedAt"),
        "runId": run.get("runId"),
        "provider": configuration.get("provider"),
        "model": nested(run, "metadata", "model"),
        "temperature": nested(run, "metadata", "temperature"),
        "promptVersion": nested(run, "metadata", "promptVersion"),
        "runOrder": configuration.get("runOrder"),
        "randomSeed": configuration.get("randomSeed"),
        "workflowDurationMs": experiment_metrics.get("workflowDurationMs"),
        "aiGenerationDurationMs": experiment_metrics.get(
            "aiGenerationDurationMs"
        ),
        "refinementIterations": experiment_metrics.get("refinementIterations"),
        "converged": experiment_metrics.get("converged"),
        "stopReason": experiment_metrics.get("stopReason"),
        "totalPromptTokens": experiment_metrics.get("totalPromptTokens"),
        "totalOutputTokens": experiment_metrics.get("totalOutputTokens"),
        "totalTokens": experiment_metrics.get("totalTokens"),
        "initialStaticPassed": initial_pass.get("staticPassed"),
        "initialRuntimePassed": initial_pass.get("runtimePassed"),
        "initialAccessibilityPassed": initial_pass.get("accessibilityPassed"),
        "initialFunctionalPassed": initial_pass.get("functionalPassed"),
        "initialAllPassed": initial_pass.get("allPassed"),
        "initialStaticTotalIssues": initial_quality.get("totalIssues"),
        "initialStaticErrors": initial_quality.get("totalErrors"),
        "initialStaticWarnings": initial_quality.get("totalWarnings"),
        "initialRuntimeConsoleErrors": initial_runtime.get("consoleErrorCount"),
        "initialRuntimeUncaughtExceptions": initial_runtime.get(
            "uncaughtExceptionCount"
        ),
        "initialRequiredControlsPresent": initial_runtime.get(
            "requiredControlsPresent"
        ),
        "initialRequiredControlsExpected": initial_runtime.get(
            "requiredControlsExpected"
        ),
        "initialAccessibilityViolations": initial_accessibility.get(
            "violationCount"
        ),
        "initialAccessibilityViolatingNodes": initial_accessibility.get(
            "violatingNodeCount"
        ),
        "initialAccessibilityCritical": initial_impact.get("critical"),
        "initialAccessibilitySerious": initial_impact.get("serious"),
        "initialAccessibilityModerate": initial_impact.get("moderate"),
        "initialAccessibilityMinor": initial_impact.get("minor"),
        "initialAccessibilityIncomplete": initial_accessibility.get(
            "incompleteCount"
        ),
        "initialFunctionalPassedTests": initial_functional.get("passedCount"),
        "initialFunctionalFailedTests": initial_functional.get("failedCount"),
        "initialFunctionalTotalTests": initial_functional.get("totalCount"),
        "finalStaticPassed": final_pass.get("staticPassed"),
        "finalRuntimePassed": final_pass.get("runtimePassed"),
        "finalAccessibilityPassed": final_pass.get("accessibilityPassed"),
        "finalFunctionalPassed": final_pass.get("functionalPassed"),
        "finalAllPassed": final_pass.get("allPassed"),
        "finalStaticTotalIssues": final_quality.get("totalIssues"),
        "finalStaticErrors": final_quality.get("totalErrors"),
        "finalStaticWarnings": final_quality.get("totalWarnings"),
        "finalRuntimeConsoleErrors": final_runtime.get("consoleErrorCount"),
        "finalRuntimeUncaughtExceptions": final_runtime.get(
            "uncaughtExceptionCount"
        ),
        "finalRequiredControlsPresent": final_runtime.get(
            "requiredControlsPresent"
        ),
        "finalRequiredControlsExpected": final_runtime.get(
            "requiredControlsExpected"
        ),
        "finalAccessibilityViolations": final_accessibility.get(
            "violationCount"
        ),
        "finalAccessibilityViolatingNodes": final_accessibility.get(
            "violatingNodeCount"
        ),
        "finalAccessibilityCritical": final_impact.get("critical"),
        "finalAccessibilitySerious": final_impact.get("serious"),
        "finalAccessibilityModerate": final_impact.get("moderate"),
        "finalAccessibilityMinor": final_impact.get("minor"),
        "finalAccessibilityIncomplete": final_accessibility.get(
            "incompleteCount"
        ),
        "finalFunctionalPassedTests": final_functional.get("passedCount"),
        "finalFunctionalFailedTests": final_functional.get("failedCount"),
        "finalFunctionalTotalTests": final_functional.get("totalCount"),
        "staticIssueChange": (
            final_static_issues - initial_static_issues
            if final_static_issues is not None
            and initial_static_issues is not None
            else None
        ),
        "accessibilityViolationChange": (
            final_accessibility_violations - initial_accessibility_violations
            if final_accessibility_violations is not None
            and initial_accessibility_violations is not None
            else None
        ),
        "functionalFailedTestChange": (
            final_functional_failures - initial_functional_failures
            if final_functional_failures is not None
            and initial_functional_failures is not None
            else None
        ),
        "iterationMetrics": experiment_metrics.get("iterations"),
        "responseFile": run.get("responseFile"),
    }


def flatten_manifest_run(run: dict[str, Any]) -> dict[str, Any]:
    return {
        "experimentRunId": run.get("experimentRunId"),
        "sequence": run.get("sequence"),
        "specificationId": nested(run, "specification", "id"),
        "specificationName": nested(run, "specification", "name"),
        "workflow": run.get("workflow"),
        "repetition": run.get("repetition"),
        "status": run.get("status"),
        "attemptCount": run.get("attemptCount"),
        "startedAt": run.get("startedAt"),
        "completedAt": run.get("completedAt"),
        "runId": run.get("runId"),
        "resultClassification": run.get("resultClassification"),
        "failureType": run.get("failureType"),
        "failureStage": run.get("failureStage"),
        "error": run.get("error"),
        "responseFile": run.get("responseFile"),
    }


def add_check(
    results: list[dict[str, Any]],
    name: str,
    passed: bool,
    detail: str,
) -> None:
    results.append(
        {
            "check": name,
            "passed": bool(passed),
            "detail": detail,
        }
    )


def compare_csv_and_json(
    raw_csv: pd.DataFrame,
    dataset: dict[str, Any],
) -> tuple[bool, list[dict[str, Any]]]:
    flattened = pd.DataFrame(
        [flatten_dataset_run(run, dataset) for run in dataset["runs"]]
    )

    mismatches: list[dict[str, Any]] = []
    if list(flattened.columns) != EXPECTED_COLUMNS:
        return False, [
            {
                "row": None,
                "column": "schema",
                "csv": ",".join(raw_csv.columns),
                "json": ",".join(flattened.columns),
            }
        ]

    for row_number in range(len(raw_csv)):
        for column in EXPECTED_COLUMNS:
            csv_value = raw_csv.iloc[row_number][column]
            json_value = normalise_exact(
                flattened.iloc[row_number][column],
                column,
            )
            if csv_value != json_value:
                mismatches.append(
                    {
                        "row": row_number + 2,
                        "column": column,
                        "csv": csv_value,
                        "json": json_value,
                    }
                )

    return len(mismatches) == 0, mismatches


def create_typed_runs(raw_csv: pd.DataFrame) -> pd.DataFrame:
    processed = raw_csv.copy()

    for column in INTEGER_COLUMNS:
        processed[column] = pd.to_numeric(
            processed[column], errors="raise"
        ).astype("Int64")

    processed["temperature"] = pd.to_numeric(
        processed["temperature"], errors="raise"
    ).astype("Float64")

    for column in BOOLEAN_COLUMNS:
        processed[column] = processed[column].map(
            {"true": True, "false": False}
        ).astype("boolean")

    processed["converged"] = processed["converged"].map(
        {"true": True, "false": False, "": pd.NA}
    ).astype("boolean")

    for column in DATETIME_COLUMNS:
        processed[column] = pd.to_datetime(
            processed[column], utc=True, errors="raise"
        )

    for column in CATEGORICAL_COLUMNS:
        processed[column] = processed[column].astype("category")

    string_columns = [
        column for column in EXPECTED_COLUMNS
        if column not in INTEGER_COLUMNS
        and column not in BOOLEAN_COLUMNS
        and column not in DATETIME_COLUMNS
        and column not in CATEGORICAL_COLUMNS
        and column not in {"temperature", "converged"}
    ]
    for column in string_columns:
        processed[column] = processed[column].astype("string")

    processed["workflowDurationSeconds"] = (
        processed["workflowDurationMs"] / 1000
    ).astype("Float64")
    processed["aiGenerationDurationSeconds"] = (
        processed["aiGenerationDurationMs"] / 1000
    ).astype("Float64")
    processed["pipelineOverheadMs"] = (
        processed["workflowDurationMs"]
        - processed["aiGenerationDurationMs"]
    ).astype("Int64")
    processed["pipelineOverheadSeconds"] = (
        processed["pipelineOverheadMs"] / 1000
    ).astype("Float64")
    processed["initialFunctionalPassRate"] = (
        processed["initialFunctionalPassedTests"]
        / processed["initialFunctionalTotalTests"]
    ).astype("Float64")
    processed["finalFunctionalPassRate"] = (
        processed["finalFunctionalPassedTests"]
        / processed["finalFunctionalTotalTests"]
    ).astype("Float64")

    refinement_used = pd.Series(
        pd.NA,
        index=processed.index,
        dtype="boolean",
    )
    automated = processed["workflow"].astype("string").eq(
        "automated-refinement"
    )
    refinement_used.loc[automated] = (
        processed.loc[automated, "refinementIterations"] > 0
    )
    processed["automatedRefinementUsed"] = refinement_used

    return processed


def create_iteration_dataset(processed_runs: pd.DataFrame) -> pd.DataFrame:
    records: list[dict[str, Any]] = []

    for _, row in processed_runs.iterrows():
        metrics = json.loads(row["iterationMetrics"])
        for metric in metrics:
            iteration = int(metric["iteration"])
            records.append(
                {
                    "experimentId": row["experimentId"],
                    "experimentRunId": row["experimentRunId"],
                    "sequence": int(row["sequence"]),
                    "specificationId": str(row["specificationId"]),
                    "workflow": str(row["workflow"]),
                    "repetition": int(row["repetition"]),
                    "runId": row["runId"],
                    "iteration": iteration,
                    "iterationType": (
                        "initial-generation"
                        if iteration == 0
                        else "refinement"
                    ),
                    "generationDurationMs": int(
                        metric["generationDurationMs"]
                    ),
                    "promptTokens": int(metric["promptTokens"]),
                    "outputTokens": int(metric["outputTokens"]),
                    "totalTokens": int(metric["totalTokens"]),
                }
            )

    return pd.DataFrame(records)


def source_path(column: str) -> str:
    direct = {
        "experimentId": "dataset.experimentId",
        "experimentRunId": "dataset.runs[].experimentRunId",
        "sequence": "dataset.runs[].sequence",
        "specificationId": "dataset.runs[].specification.id",
        "specificationName": "dataset.runs[].specification.name",
        "workflow": "dataset.runs[].workflow",
        "repetition": "dataset.runs[].repetition",
        "status": "dataset.runs[].status",
        "resultClassification": "dataset.runs[].resultClassification",
        "failureType": "dataset.runs[].failureType",
        "failureStage": "dataset.runs[].failureStage",
        "error": "dataset.runs[].error",
        "attemptCount": "dataset.runs[].attemptCount",
        "startedAt": "dataset.runs[].startedAt",
        "completedAt": "dataset.runs[].completedAt",
        "runId": "dataset.runs[].runId",
        "provider": "dataset.configuration.provider",
        "model": "dataset.runs[].metadata.model",
        "temperature": "dataset.runs[].metadata.temperature",
        "promptVersion": "dataset.runs[].metadata.promptVersion",
        "runOrder": "dataset.configuration.runOrder",
        "randomSeed": "dataset.configuration.randomSeed",
        "workflowDurationMs":
            "dataset.runs[].metadata.experimentMetrics.workflowDurationMs",
        "aiGenerationDurationMs":
            "dataset.runs[].metadata.experimentMetrics.aiGenerationDurationMs",
        "refinementIterations":
            "dataset.runs[].metadata.experimentMetrics.refinementIterations",
        "converged":
            "dataset.runs[].metadata.experimentMetrics.converged",
        "stopReason":
            "dataset.runs[].metadata.experimentMetrics.stopReason",
        "totalPromptTokens":
            "dataset.runs[].metadata.experimentMetrics.totalPromptTokens",
        "totalOutputTokens":
            "dataset.runs[].metadata.experimentMetrics.totalOutputTokens",
        "totalTokens":
            "dataset.runs[].metadata.experimentMetrics.totalTokens",
        "iterationMetrics":
            "dataset.runs[].metadata.experimentMetrics.iterations",
        "responseFile": "dataset.runs[].responseFile",
        "staticIssueChange":
            "CSV export: finalStaticTotalIssues - initialStaticTotalIssues",
        "accessibilityViolationChange":
            "CSV export: finalAccessibilityViolations - "
            "initialAccessibilityViolations",
        "functionalFailedTestChange":
            "CSV export: finalFunctionalFailedTests - "
            "initialFunctionalFailedTests",
    }
    if column in direct:
        return direct[column]

    prefix = "initial" if column.startswith("initial") else "final"
    suffix = column[len(prefix):]
    report_root = f"dataset.runs[].{prefix}Reports"

    pass_status = {
        "StaticPassed": "staticPassed",
        "RuntimePassed": "runtimePassed",
        "AccessibilityPassed": "accessibilityPassed",
        "FunctionalPassed": "functionalPassed",
        "AllPassed": "allPassed",
    }
    if suffix in pass_status:
        return (
            f"dataset.runs[].{prefix}PassStatus."
            f"{pass_status[suffix]}"
        )

    quality = {
        "StaticTotalIssues": "totalIssues",
        "StaticErrors": "totalErrors",
        "StaticWarnings": "totalWarnings",
    }
    if suffix in quality:
        return (
            f"{report_root}.qualityReport.summary."
            f"{quality[suffix]}"
        )

    runtime = {
        "RuntimeConsoleErrors": "consoleErrorCount",
        "RuntimeUncaughtExceptions": "uncaughtExceptionCount",
        "RequiredControlsPresent": "requiredControlsPresent",
        "RequiredControlsExpected": "requiredControlsExpected",
    }
    if suffix in runtime:
        return (
            f"{report_root}.runtimeReport.summary."
            f"{runtime[suffix]}"
        )

    accessibility = {
        "AccessibilityViolations": "violationCount",
        "AccessibilityViolatingNodes": "violatingNodeCount",
        "AccessibilityIncomplete": "incompleteCount",
    }
    if suffix in accessibility:
        return (
            f"{report_root}.accessibilityReport."
            f"{accessibility[suffix]}"
        )

    impact = {
        "AccessibilityCritical": "critical",
        "AccessibilitySerious": "serious",
        "AccessibilityModerate": "moderate",
        "AccessibilityMinor": "minor",
    }
    if suffix in impact:
        return (
            f"{report_root}.accessibilityReport."
            f"violationsByImpact.{impact[suffix]}"
        )

    functional = {
        "FunctionalPassedTests": "passedCount",
        "FunctionalFailedTests": "failedCount",
        "FunctionalTotalTests": "totalCount",
    }
    if suffix in functional:
        return (
            f"{report_root}.functionalReport.summary."
            f"{functional[suffix]}"
        )

    return "Derived during preprocessing"


def role_for(column: str) -> str:
    if column in {"experimentId", "experimentRunId", "runId", "responseFile"}:
        return "identifier"
    if column in {
        "sequence", "specificationId", "specificationName", "workflow",
        "repetition", "runOrder", "randomSeed",
    }:
        return "design"
    if column in {
        "status", "resultClassification", "failureType", "failureStage",
        "error", "attemptCount", "startedAt", "completedAt", "provider",
        "model", "temperature", "promptVersion",
    }:
        return "execution metadata"
    if column in {
        "workflowDurationMs", "aiGenerationDurationMs",
        "totalPromptTokens", "totalOutputTokens", "totalTokens",
    }:
        return "efficiency outcome"
    if column in {
        "refinementIterations", "converged", "stopReason",
        "iterationMetrics",
    }:
        return "refinement outcome"
    if column in {
        "staticIssueChange", "accessibilityViolationChange",
        "functionalFailedTestChange",
    }:
        return "recorded change outcome"
    if column.startswith("initial"):
        return "initial quality outcome"
    if column.startswith("final"):
        return "final quality outcome"
    return "derived analysis variable"


def recommended_type(column: str) -> str:
    if column in INTEGER_COLUMNS:
        return "integer"
    if column == "temperature":
        return "number"
    if column in BOOLEAN_COLUMNS:
        return "boolean"
    if column == "converged":
        return "nullable boolean"
    if column in DATETIME_COLUMNS:
        return "UTC datetime"
    if column == "iterationMetrics":
        return "JSON array stored as text"
    if column in CATEGORICAL_COLUMNS:
        return "categorical/string"
    return "string"


def description_for(column: str) -> str:
    descriptions = {
        "experimentId": "Identifier of the formal experiment.",
        "experimentRunId":
            "Design-level run identifier combining specification, workflow "
            "and repetition.",
        "sequence": "Execution position in the seeded random run order.",
        "specificationId": "Identifier of the predefined application specification.",
        "specificationName": "Display name of the application specification.",
        "workflow": "AI-assisted development workflow used for the run.",
        "repetition":
            "Replicate number within a specification/workflow combination.",
        "status": "Recorded execution status of the run.",
        "resultClassification":
            "Recorded classification of the completed run.",
        "failureType": "Recorded failure type; null when no failure was recorded.",
        "failureStage": "Recorded failure stage; null when no failure was recorded.",
        "error": "Recorded run error; null when no error was recorded.",
        "attemptCount": "Number of execution attempts recorded for the run.",
        "startedAt": "UTC timestamp when the experiment run started.",
        "completedAt": "UTC timestamp when the experiment run completed.",
        "runId": "Identifier of the generated application/pipeline run.",
        "provider": "AI provider configured for the experiment.",
        "model": "AI model recorded for the run.",
        "temperature": "Model temperature recorded for the run.",
        "promptVersion": "Version of the generation prompt.",
        "runOrder": "Run-order method recorded in the experiment configuration.",
        "randomSeed": "Seed used to generate the run order.",
        "workflowDurationMs":
            "Total recorded workflow/pipeline duration in milliseconds.",
        "aiGenerationDurationMs":
            "Total recorded AI generation duration in milliseconds.",
        "refinementIterations":
            "Number of refinement iterations after iteration 0.",
        "converged":
            "Recorded convergence flag; not applicable to non-automated workflows.",
        "stopReason": "Recorded reason that the workflow stopped.",
        "totalPromptTokens": "Total prompt tokens across AI calls in the run.",
        "totalOutputTokens": "Total output tokens across AI calls in the run.",
        "totalTokens": "Total prompt plus output tokens across AI calls.",
        "iterationMetrics":
            "Serialized per-iteration generation duration and token metrics.",
        "responseFile": "Relative path recorded for the run response JSON.",
        "staticIssueChange":
            "Final static issue count minus initial static issue count.",
        "accessibilityViolationChange":
            "Final accessibility violation count minus initial count.",
        "functionalFailedTestChange":
            "Final failed functional-test count minus initial count.",
        "workflowDurationSeconds":
            "workflowDurationMs divided by 1,000.",
        "aiGenerationDurationSeconds":
            "aiGenerationDurationMs divided by 1,000.",
        "pipelineOverheadMs":
            "workflowDurationMs minus aiGenerationDurationMs.",
        "pipelineOverheadSeconds":
            "pipelineOverheadMs divided by 1,000.",
        "initialFunctionalPassRate":
            "Initial passed functional tests divided by initial total tests.",
        "finalFunctionalPassRate":
            "Final passed functional tests divided by final total tests.",
        "automatedRefinementUsed":
            "For automated-refinement runs, whether refinementIterations is "
            "greater than zero; null for other workflows.",
    }
    if column in descriptions:
        return descriptions[column]

    phase = "Initial" if column.startswith("initial") else "Final"
    suffix = column[len("initial"):] if column.startswith("initial") else column[len("final"):]

    suffix_descriptions = {
        "StaticPassed": "static-analysis pass flag.",
        "RuntimePassed": "runtime-validation pass flag.",
        "AccessibilityPassed": "accessibility-validation pass flag.",
        "FunctionalPassed": "functional-validation pass flag.",
        "AllPassed": "flag indicating all recorded quality domains passed.",
        "StaticTotalIssues": "total static-analysis issues.",
        "StaticErrors": "static-analysis errors.",
        "StaticWarnings": "static-analysis warnings.",
        "RuntimeConsoleErrors": "browser console errors recorded by runtime validation.",
        "RuntimeUncaughtExceptions":
            "uncaught browser exceptions recorded by runtime validation.",
        "RequiredControlsPresent":
            "required controls found by runtime validation.",
        "RequiredControlsExpected":
            "required controls expected by runtime validation.",
        "AccessibilityViolations": "axe accessibility violation count.",
        "AccessibilityViolatingNodes":
            "number of DOM nodes affected by accessibility violations.",
        "AccessibilityCritical":
            "accessibility violations recorded with critical impact.",
        "AccessibilitySerious":
            "accessibility violations recorded with serious impact.",
        "AccessibilityModerate":
            "accessibility violations recorded with moderate impact.",
        "AccessibilityMinor":
            "accessibility violations recorded with minor impact.",
        "AccessibilityIncomplete":
            "axe checks recorded as incomplete.",
        "FunctionalPassedTests": "functional tests passed.",
        "FunctionalFailedTests": "functional tests failed.",
        "FunctionalTotalTests": "functional tests executed.",
    }
    if suffix in suffix_descriptions:
        return f"{phase} {suffix_descriptions[suffix]}"

    return "Field present in the exported formal experiment dataset."


def observed_values(raw_csv: pd.DataFrame, column: str) -> str:
    values = raw_csv[column].tolist()
    unique = sorted({value for value in values if value != ""})
    blank_count = sum(value == "" for value in values)

    if column in INTEGER_COLUMNS or column == "temperature":
        numeric = pd.to_numeric(raw_csv[column], errors="coerce")
        return (
            f"min={numeric.min():g}; max={numeric.max():g}; "
            f"unique={numeric.nunique()}"
        )

    if len(unique) <= 12:
        rendered = ", ".join(unique) if unique else "none"
        if blank_count:
            rendered += f"; blank={blank_count}"
        return rendered

    return f"{len(unique)} unique non-blank values; blank={blank_count}"


def create_data_dictionary(raw_csv: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for column in EXPECTED_COLUMNS + DERIVED_COLUMNS:
        is_derived = column in DERIVED_COLUMNS
        rows.append(
            {
                "column": column,
                "role": role_for(column),
                "recommendedType": (
                    "derived"
                    if is_derived
                    else recommended_type(column)
                ),
                "source": source_path(column),
                "description": description_for(column),
                "observedValues": (
                    "Created by preprocessing script"
                    if is_derived
                    else observed_values(raw_csv, column)
                ),
                "blankCountRawCsv": (
                    None
                    if is_derived
                    else int((raw_csv[column] == "").sum())
                ),
                "zeroCountRawCsv": (
                    None
                    if is_derived
                    else int((raw_csv[column] == "0").sum())
                ),
            }
        )
    return pd.DataFrame(rows)


def dataframe_to_markdown(dataframe: pd.DataFrame) -> str:
    columns = list(dataframe.columns)
    header = "| " + " | ".join(columns) + " |"
    separator = "| " + " | ".join(["---"] * len(columns)) + " |"
    rows = [header, separator]

    for _, row in dataframe.iterrows():
        values = []
        for column in columns:
            value = row[column]
            if pd.isna(value):
                text = ""
            else:
                text = str(value)
            text = text.replace("|", r"\|").replace("\n", " ")
            values.append(text)
        rows.append("| " + " | ".join(values) + " |")

    return "\n".join(rows) + "\n"


def run_validation(
    raw_csv: pd.DataFrame,
    dataset: dict[str, Any],
    manifest: dict[str, Any],
) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    checks: list[dict[str, Any]] = []

    add_check(
        checks,
        "CSV has 90 rows",
        len(raw_csv) == 90,
        f"Observed {len(raw_csv)} rows.",
    )
    add_check(
        checks,
        "CSV has expected 79-column schema",
        list(raw_csv.columns) == EXPECTED_COLUMNS,
        f"Observed {len(raw_csv.columns)} columns.",
    )

    workflow_counts = raw_csv["workflow"].value_counts()
    add_check(
        checks,
        "30 rows per workflow",
        set(workflow_counts.index)
        == {"one-shot", "quality-focused", "automated-refinement"}
        and (workflow_counts == 30).all(),
        workflow_counts.sort_index().to_json(),
    )

    specification_counts = raw_csv["specificationId"].value_counts()
    add_check(
        checks,
        "30 rows per specification",
        set(specification_counts.index) == {"todo", "quiz", "booking"}
        and (specification_counts == 30).all(),
        specification_counts.sort_index().to_json(),
    )

    cell_counts = raw_csv.groupby(
        ["specificationId", "workflow"]
    ).size()
    add_check(
        checks,
        "10 rows per specification/workflow cell",
        len(cell_counts) == 9 and (cell_counts == 10).all(),
        cell_counts.to_json(),
    )

    add_check(
        checks,
        "Unique experimentRunId values",
        raw_csv["experimentRunId"].is_unique,
        f"Unique values: {raw_csv['experimentRunId'].nunique()}.",
    )
    add_check(
        checks,
        "Unique runId values",
        raw_csv["runId"].is_unique,
        f"Unique values: {raw_csv['runId'].nunique()}.",
    )
    add_check(
        checks,
        "No exact duplicate CSV records",
        not raw_csv.duplicated().any(),
        f"Duplicate rows: {int(raw_csv.duplicated().sum())}.",
    )

    sequences = pd.to_numeric(raw_csv["sequence"], errors="raise")
    add_check(
        checks,
        "Sequence covers 1 through 90 exactly once",
        sequences.is_unique and set(sequences) == set(range(1, 91)),
        f"Minimum={sequences.min()}, maximum={sequences.max()}.",
    )

    add_check(
        checks,
        "Valid workflow categories",
        set(raw_csv["workflow"])
        == {"one-shot", "quality-focused", "automated-refinement"},
        ", ".join(sorted(set(raw_csv["workflow"]))),
    )
    add_check(
        checks,
        "Valid specification categories",
        set(raw_csv["specificationId"]) == {"todo", "quiz", "booking"},
        ", ".join(sorted(set(raw_csv["specificationId"]))),
    )
    add_check(
        checks,
        "All runs completed",
        set(raw_csv["status"]) == {"completed"},
        raw_csv["status"].value_counts().to_json(),
    )
    add_check(
        checks,
        "Only valid result classifications present",
        set(raw_csv["resultClassification"])
        == {"valid-passed", "valid-poor-quality"},
        raw_csv["resultClassification"].value_counts().to_json(),
    )

    csv_json_equal, mismatches = compare_csv_and_json(raw_csv, dataset)
    add_check(
        checks,
        "CSV and dataset JSON agree on every exported field",
        csv_json_equal,
        (
            "No mismatches across 90 × 79 exported values."
            if csv_json_equal
            else f"Mismatches: {len(mismatches)}."
        ),
    )

    add_check(
        checks,
        "Dataset JSON and manifest configuration agree",
        dataset.get("configuration") == manifest.get("configuration"),
        "Configuration objects compared directly.",
    )
    add_check(
        checks,
        "Dataset JSON and manifest summary agree",
        dataset.get("summary") == manifest.get("summary"),
        "Summary objects compared directly.",
    )

    manifest_runs = pd.DataFrame(
        [flatten_manifest_run(run) for run in manifest["runs"]]
    )
    dataset_runs = pd.DataFrame(
        [flatten_dataset_run(run, dataset) for run in dataset["runs"]]
    )
    manifest_columns = list(manifest_runs.columns)

    manifest_mismatches = []
    for row_number in range(len(manifest_runs)):
        for column in manifest_columns:
            manifest_value = normalise_exact(
                manifest_runs.iloc[row_number][column],
                column,
            )
            dataset_value = normalise_exact(
                dataset_runs.iloc[row_number][column],
                column,
            )
            if manifest_value != dataset_value:
                manifest_mismatches.append(
                    (row_number + 1, column)
                )

    add_check(
        checks,
        "Manifest and dataset JSON agree on run metadata",
        len(manifest_mismatches) == 0,
        (
            "No mismatches across shared run fields."
            if not manifest_mismatches
            else f"Mismatches: {len(manifest_mismatches)}."
        ),
    )

    csv_ids = set(raw_csv["experimentRunId"])
    dataset_ids = {
        run["experimentRunId"] for run in dataset["runs"]
    }
    manifest_ids = {
        run["experimentRunId"] for run in manifest["runs"]
    }
    add_check(
        checks,
        "No formal run omitted across CSV, JSON and manifest",
        csv_ids == dataset_ids == manifest_ids
        and len(csv_ids) == 90,
        f"CSV={len(csv_ids)}, JSON={len(dataset_ids)}, "
        f"manifest={len(manifest_ids)}.",
    )

    expected_response_paths = (
        "responses/" + raw_csv["experimentRunId"] + ".json"
    )
    add_check(
        checks,
        "Response-file references are unique and match run IDs",
        raw_csv["responseFile"].is_unique
        and raw_csv["responseFile"].equals(expected_response_paths),
        f"Unique references: {raw_csv['responseFile'].nunique()}.",
    )

    processed = create_typed_runs(raw_csv)
    iterations = processed["iterationMetrics"].map(json.loads)

    add_check(
        checks,
        "Timestamps are valid and ordered",
        (processed["completedAt"] >= processed["startedAt"]).all(),
        "All completedAt values are on or after startedAt.",
    )
    add_check(
        checks,
        "Started timestamps follow sequence order",
        processed.sort_values("sequence")[
            "startedAt"
        ].is_monotonic_increasing,
        "Sequential execution order is monotonic by startedAt.",
    )
    add_check(
        checks,
        "Durations are positive",
        (
            processed[
                ["workflowDurationMs", "aiGenerationDurationMs"]
            ] > 0
        ).all().all(),
        "Both duration fields checked.",
    )
    add_check(
        checks,
        "Workflow duration is at least AI generation duration",
        (
            processed["workflowDurationMs"]
            >= processed["aiGenerationDurationMs"]
        ).all(),
        "Checked for all rows.",
    )
    add_check(
        checks,
        "Total tokens equal prompt plus output tokens",
        (
            processed["totalTokens"]
            == processed["totalPromptTokens"]
            + processed["totalOutputTokens"]
        ).all(),
        "Checked for all rows.",
    )
    add_check(
        checks,
        "Initial static issues equal errors plus warnings",
        (
            processed["initialStaticTotalIssues"]
            == processed["initialStaticErrors"]
            + processed["initialStaticWarnings"]
        ).all(),
        "Checked for all rows.",
    )
    add_check(
        checks,
        "Final static issues equal errors plus warnings",
        (
            processed["finalStaticTotalIssues"]
            == processed["finalStaticErrors"]
            + processed["finalStaticWarnings"]
        ).all(),
        "Checked for all rows.",
    )
    add_check(
        checks,
        "Initial functional totals are internally consistent",
        (
            processed["initialFunctionalTotalTests"]
            == processed["initialFunctionalPassedTests"]
            + processed["initialFunctionalFailedTests"]
        ).all(),
        "Passed plus failed equals total.",
    )
    add_check(
        checks,
        "Final functional totals are internally consistent",
        (
            processed["finalFunctionalTotalTests"]
            == processed["finalFunctionalPassedTests"]
            + processed["finalFunctionalFailedTests"]
        ).all(),
        "Passed plus failed equals total.",
    )
    add_check(
        checks,
        "Required-control counts are bounded",
        (
            processed["initialRequiredControlsPresent"]
            <= processed["initialRequiredControlsExpected"]
        ).all()
        and (
            processed["finalRequiredControlsPresent"]
            <= processed["finalRequiredControlsExpected"]
        ).all(),
        "Present does not exceed expected.",
    )
    add_check(
        checks,
        "Accessibility impact counts sum to violation count",
        (
            processed["initialAccessibilityViolations"]
            == processed[
                [
                    "initialAccessibilityCritical",
                    "initialAccessibilitySerious",
                    "initialAccessibilityModerate",
                    "initialAccessibilityMinor",
                ]
            ].sum(axis=1)
        ).all()
        and (
            processed["finalAccessibilityViolations"]
            == processed[
                [
                    "finalAccessibilityCritical",
                    "finalAccessibilitySerious",
                    "finalAccessibilityModerate",
                    "finalAccessibilityMinor",
                ]
            ].sum(axis=1)
        ).all(),
        "Checked for initial and final reports.",
    )
    add_check(
        checks,
        "Recorded change fields are correct",
        (
            processed["staticIssueChange"]
            == processed["finalStaticTotalIssues"]
            - processed["initialStaticTotalIssues"]
        ).all()
        and (
            processed["accessibilityViolationChange"]
            == processed["finalAccessibilityViolations"]
            - processed["initialAccessibilityViolations"]
        ).all()
        and (
            processed["functionalFailedTestChange"]
            == processed["finalFunctionalFailedTests"]
            - processed["initialFunctionalFailedTests"]
        ).all(),
        "All three change fields checked.",
    )

    add_check(
        checks,
        "Iteration arrays contain iteration 0 plus refinements",
        all(
            len(metrics) == int(refinement_count) + 1
            for metrics, refinement_count in zip(
                iterations,
                processed["refinementIterations"],
            )
        ),
        "Array length equals refinementIterations + 1.",
    )
    add_check(
        checks,
        "Iteration numbers are contiguous from zero",
        all(
            [metric["iteration"] for metric in metrics]
            == list(range(len(metrics)))
            for metrics in iterations
        ),
        "Checked every iteration array.",
    )
    add_check(
        checks,
        "Iteration durations and tokens sum to run totals",
        all(
            sum(
                metric["generationDurationMs"]
                for metric in metrics
            ) == int(duration)
            and sum(metric["promptTokens"] for metric in metrics)
            == int(prompt_tokens)
            and sum(metric["outputTokens"] for metric in metrics)
            == int(output_tokens)
            and sum(metric["totalTokens"] for metric in metrics)
            == int(total_tokens)
            and all(
                metric["totalTokens"]
                == metric["promptTokens"] + metric["outputTokens"]
                for metric in metrics
            )
            for (
                metrics,
                duration,
                prompt_tokens,
                output_tokens,
                total_tokens,
            ) in zip(
                iterations,
                processed["aiGenerationDurationMs"],
                processed["totalPromptTokens"],
                processed["totalOutputTokens"],
                processed["totalTokens"],
            )
        ),
        "Duration and token totals checked for every run.",
    )

    non_automated = processed["workflow"].astype("string").ne(
        "automated-refinement"
    )
    automated = ~non_automated
    add_check(
        checks,
        "Non-automated refinement fields are not misread as outcomes",
        (
            processed.loc[
                non_automated, "refinementIterations"
            ] == 0
        ).all()
        and processed.loc[non_automated, "converged"].isna().all()
        and (
            processed.loc[non_automated, "stopReason"].astype("string")
            == "not-applicable"
        ).all(),
        "Zero refinements are structural for one-shot and "
        "quality-focused; converged is null.",
    )
    add_check(
        checks,
        "Automated refinement fields are within configured limits",
        processed.loc[
            automated, "refinementIterations"
        ].between(0, 3).all(),
        "Observed range checked against maxRefinementIterations=3.",
    )
    add_check(
        checks,
        "Automated zero-refinement runs remain present",
        (
            (
                automated
                & processed["refinementIterations"].eq(0)
            ).sum()
            == 1
        )
        and processed.loc[
            automated
            & processed["refinementIterations"].eq(0),
            "initialAllPassed",
        ].all(),
        "One automated run stopped at iteration 0 and is retained.",
    )

    add_check(
        checks,
        "Result classification matches final all-pass flag",
        (
            processed["resultClassification"].astype("string").eq(
                "valid-passed"
            )
            == processed["finalAllPassed"]
        ).all(),
        "Checked for all rows.",
    )

    return pd.DataFrame(checks), mismatches


def numeric_ranges(raw_csv: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for column in INTEGER_COLUMNS + ["temperature"]:
        numeric = pd.to_numeric(raw_csv[column], errors="coerce")
        rows.append(
            {
                "column": column,
                "minimum": numeric.min(),
                "maximum": numeric.max(),
                "uniqueValues": int(numeric.nunique()),
                "missingAfterNumericConversion": int(
                    numeric.isna().sum()
                ),
                "zeroCount": int((numeric == 0).sum()),
                "negativeCount": int((numeric < 0).sum()),
            }
        )
    return pd.DataFrame(rows)


def missing_values(raw_csv: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for column in raw_csv.columns:
        rows.append(
            {
                "column": column,
                "blankCount": int((raw_csv[column] == "").sum()),
                "zeroStringCount": int((raw_csv[column] == "0").sum()),
                "nonBlankCount": int((raw_csv[column] != "").sum()),
                "uniqueNonBlankValues": int(
                    raw_csv.loc[
                        raw_csv[column] != "", column
                    ].nunique()
                ),
            }
        )
    return pd.DataFrame(rows)


def write_processing_log(
    path: Path,
    csv_path: Path,
    json_path: Path,
    manifest_path: Path,
    processed_runs: pd.DataFrame,
    processed_iterations: pd.DataFrame,
    integrity: pd.DataFrame,
) -> None:
    failed_checks = integrity.loc[~integrity["passed"]]
    log = f"""# Processing log

## Experiment

- Experiment ID: `{EXPERIMENT_ID}`
- Raw CSV: `{csv_path}`
- Raw JSON: `{json_path}`
- Raw manifest: `{manifest_path}`
- Raw CSV SHA-256: `{sha256_file(csv_path)}`
- Raw JSON SHA-256: `{sha256_file(json_path)}`
- Raw manifest SHA-256: `{sha256_file(manifest_path)}`

## Raw-data protection

The script opened raw files in read-only mode and wrote all outputs below the
analysis workspace. It did not overwrite or modify any raw experiment file.

## Validation

- Integrity checks: {len(integrity)}
- Passed: {int(integrity["passed"].sum())}
- Failed: {len(failed_checks)}
- Raw run rows: 90
- Processed run rows: {len(processed_runs)}
- Processed iteration rows: {len(processed_iterations)}

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
"""
    path.write_text(log, encoding="utf-8")


def resolve_paths(args: argparse.Namespace) -> tuple[Path, Path, Path, Path]:
    if args.raw_dir:
        raw_dir = Path(args.raw_dir).resolve()
        csv_path = raw_dir / "dataset.csv"
        json_path = raw_dir / "dataset.json"
        manifest_path = raw_dir / "manifest.json"
    elif args.csv and args.json and args.manifest:
        csv_path = Path(args.csv).resolve()
        json_path = Path(args.json).resolve()
        manifest_path = Path(args.manifest).resolve()
    else:
        script_path = Path(__file__).resolve()
        repository_root = script_path.parents[3]
        raw_dir = repository_root / "experiments" / EXPERIMENT_ID
        csv_path = raw_dir / "dataset.csv"
        json_path = raw_dir / "dataset.json"
        manifest_path = raw_dir / "manifest.json"

    if args.analysis_dir:
        analysis_dir = Path(args.analysis_dir).resolve()
    else:
        analysis_dir = Path(__file__).resolve().parents[1]

    return csv_path, json_path, manifest_path, analysis_dir


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Validate and preprocess the formal AI Software Quality "
            "Pipeline experiment without changing raw data."
        )
    )
    parser.add_argument("--raw-dir")
    parser.add_argument("--csv")
    parser.add_argument("--json")
    parser.add_argument("--manifest")
    parser.add_argument("--analysis-dir")
    args = parser.parse_args()

    csv_path, json_path, manifest_path, analysis_dir = resolve_paths(args)

    for path in [csv_path, json_path, manifest_path]:
        if not path.is_file():
            raise FileNotFoundError(f"Required raw file not found: {path}")

    outputs_dir = analysis_dir / "outputs"
    tables_dir = analysis_dir / "tables"
    figures_dir = analysis_dir / "figures"
    for directory in [outputs_dir, tables_dir, figures_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    output_paths = [
        outputs_dir / "processed_runs.csv",
        outputs_dir / "processed_iterations.csv",
        outputs_dir / "schema_summary.json",
        tables_dir / "integrity_checks.csv",
        tables_dir / "numeric_ranges.csv",
        tables_dir / "missing_values.csv",
        tables_dir / "data_dictionary.csv",
        tables_dir / "data_dictionary.md",
        analysis_dir / "processing-log.md",
    ]
    raw_resolved = {
        csv_path.resolve(),
        json_path.resolve(),
        manifest_path.resolve(),
    }
    if any(path.resolve() in raw_resolved for path in output_paths):
        raise RuntimeError("An output path resolves to a raw-data file.")

    raw_csv = pd.read_csv(
        csv_path,
        dtype=str,
        keep_default_na=False,
    )
    with json_path.open(encoding="utf-8") as handle:
        dataset = json.load(handle)
    with manifest_path.open(encoding="utf-8") as handle:
        manifest = json.load(handle)

    integrity, mismatches = run_validation(
        raw_csv,
        dataset,
        manifest,
    )
    integrity.to_csv(
        tables_dir / "integrity_checks.csv",
        index=False,
    )

    if mismatches:
        pd.DataFrame(mismatches).to_csv(
            tables_dir / "csv_json_mismatches.csv",
            index=False,
        )

    processed_runs = create_typed_runs(raw_csv)
    processed_iterations = create_iteration_dataset(processed_runs)

    processed_runs.to_csv(
        outputs_dir / "processed_runs.csv",
        index=False,
        date_format="%Y-%m-%dT%H:%M:%S.%fZ",
    )
    processed_iterations.to_csv(
        outputs_dir / "processed_iterations.csv",
        index=False,
    )

    ranges = numeric_ranges(raw_csv)
    ranges.to_csv(tables_dir / "numeric_ranges.csv", index=False)

    missing = missing_values(raw_csv)
    missing.to_csv(tables_dir / "missing_values.csv", index=False)

    dictionary = create_data_dictionary(raw_csv)
    dictionary.to_csv(
        tables_dir / "data_dictionary.csv",
        index=False,
    )
    (tables_dir / "data_dictionary.md").write_text(
        "# Data dictionary\n\n"
        + dataframe_to_markdown(dictionary),
        encoding="utf-8",
    )

    schema_summary = {
        "experimentId": dataset["experimentId"],
        "datasetSchemaVersion": dataset["schemaVersion"],
        "manifestSchemaVersion": manifest["schemaVersion"],
        "exportedAt": dataset["exportedAt"],
        "rawRows": len(raw_csv),
        "rawColumns": len(raw_csv.columns),
        "processedRows": len(processed_runs),
        "processedColumns": len(processed_runs.columns),
        "iterationRows": len(processed_iterations),
        "rawFileSha256": {
            "dataset.csv": sha256_file(csv_path),
            "dataset.json": sha256_file(json_path),
            "manifest.json": sha256_file(manifest_path),
        },
        "blankCounts": {
            column: int((raw_csv[column] == "").sum())
            for column in raw_csv.columns
            if (raw_csv[column] == "").any()
        },
        "workflowCounts": raw_csv["workflow"].value_counts().to_dict(),
        "specificationCounts":
            raw_csv["specificationId"].value_counts().to_dict(),
        "resultClassificationCounts":
            raw_csv["resultClassification"].value_counts().to_dict(),
        "automatedRefinementIterationCounts": {
            str(int(key)): int(value)
            for key, value in (
                processed_runs.loc[
                    processed_runs["workflow"].astype("string").eq(
                        "automated-refinement"
                    ),
                    "refinementIterations",
                ]
                .value_counts()
                .sort_index()
                .items()
            )
        },
        "integrityChecksPassed": int(integrity["passed"].sum()),
        "integrityChecksTotal": len(integrity),
    }
    (outputs_dir / "schema_summary.json").write_text(
        json.dumps(schema_summary, indent=2, default=str),
        encoding="utf-8",
    )

    write_processing_log(
        analysis_dir / "processing-log.md",
        csv_path,
        json_path,
        manifest_path,
        processed_runs,
        processed_iterations,
        integrity,
    )

    if not integrity["passed"].all():
        failed = integrity.loc[~integrity["passed"], ["check", "detail"]]
        raise RuntimeError(
            "Integrity validation failed:\n"
            + failed.to_string(index=False)
        )

    print("Schema validation: PASSED")
    print(f"Integrity checks: {len(integrity)}/{len(integrity)}")
    print(f"Processed run rows: {len(processed_runs)}")
    print(f"Processed iteration rows: {len(processed_iterations)}")
    print(f"Analysis workspace: {analysis_dir}")


if __name__ == "__main__":
    main()
