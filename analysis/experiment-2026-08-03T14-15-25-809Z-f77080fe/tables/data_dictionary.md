# Data dictionary

| column | role | recommendedType | source | description | observedValues | blankCountRawCsv | zeroCountRawCsv |
| --- | --- | --- | --- | --- | --- | --- | --- |
| experimentId | identifier | string | dataset.experimentId | Identifier of the formal experiment. | experiment-2026-08-03T14-15-25-809Z-f77080fe | 0.0 | 0.0 |
| experimentRunId | identifier | string | dataset.runs[].experimentRunId | Design-level run identifier combining specification, workflow and repetition. | 90 unique non-blank values; blank=0 | 0.0 | 0.0 |
| sequence | design | integer | dataset.runs[].sequence | Execution position in the seeded random run order. | min=1; max=90; unique=90 | 0.0 | 0.0 |
| specificationId | design | categorical/string | dataset.runs[].specification.id | Identifier of the predefined application specification. | booking, quiz, todo | 0.0 | 0.0 |
| specificationName | design | categorical/string | dataset.runs[].specification.name | Display name of the application specification. | Appointment Booking Form, Multiple-choice Quiz, To-do List | 0.0 | 0.0 |
| workflow | design | categorical/string | dataset.runs[].workflow | AI-assisted development workflow used for the run. | automated-refinement, one-shot, quality-focused | 0.0 | 0.0 |
| repetition | design | integer | dataset.runs[].repetition | Replicate number within a specification/workflow combination. | min=1; max=10; unique=10 | 0.0 | 0.0 |
| status | execution metadata | categorical/string | dataset.runs[].status | Recorded execution status of the run. | completed | 0.0 | 0.0 |
| resultClassification | execution metadata | categorical/string | dataset.runs[].resultClassification | Recorded classification of the completed run. | valid-passed, valid-poor-quality | 0.0 | 0.0 |
| failureType | execution metadata | string | dataset.runs[].failureType | Recorded failure type; null when no failure was recorded. | none; blank=90 | 90.0 | 0.0 |
| failureStage | execution metadata | string | dataset.runs[].failureStage | Recorded failure stage; null when no failure was recorded. | none; blank=90 | 90.0 | 0.0 |
| error | execution metadata | string | dataset.runs[].error | Recorded run error; null when no error was recorded. | none; blank=90 | 90.0 | 0.0 |
| attemptCount | execution metadata | integer | dataset.runs[].attemptCount | Number of execution attempts recorded for the run. | min=1; max=1; unique=1 | 0.0 | 0.0 |
| startedAt | execution metadata | UTC datetime | dataset.runs[].startedAt | UTC timestamp when the experiment run started. | 90 unique non-blank values; blank=0 | 0.0 | 0.0 |
| completedAt | execution metadata | UTC datetime | dataset.runs[].completedAt | UTC timestamp when the experiment run completed. | 90 unique non-blank values; blank=0 | 0.0 | 0.0 |
| runId | identifier | string | dataset.runs[].runId | Identifier of the generated application/pipeline run. | 90 unique non-blank values; blank=0 | 0.0 | 0.0 |
| provider | execution metadata | categorical/string | dataset.configuration.provider | AI provider configured for the experiment. | openai | 0.0 | 0.0 |
| model | execution metadata | categorical/string | dataset.runs[].metadata.model | AI model recorded for the run. | gpt-5.6-luna | 0.0 | 0.0 |
| temperature | execution metadata | number | dataset.runs[].metadata.temperature | Model temperature recorded for the run. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| promptVersion | execution metadata | categorical/string | dataset.runs[].metadata.promptVersion | Version of the generation prompt. | 1.0.0 | 0.0 | 0.0 |
| runOrder | design | categorical/string | dataset.configuration.runOrder | Run-order method recorded in the experiment configuration. | seeded-random | 0.0 | 0.0 |
| randomSeed | design | integer | dataset.configuration.randomSeed | Seed used to generate the run order. | min=77077; max=77077; unique=1 | 0.0 | 0.0 |
| workflowDurationMs | efficiency outcome | integer | dataset.runs[].metadata.experimentMetrics.workflowDurationMs | Total recorded workflow/pipeline duration in milliseconds. | min=17882; max=102675; unique=90 | 0.0 | 0.0 |
| aiGenerationDurationMs | efficiency outcome | integer | dataset.runs[].metadata.experimentMetrics.aiGenerationDurationMs | Total recorded AI generation duration in milliseconds. | min=15604; max=95302; unique=89 | 0.0 | 0.0 |
| refinementIterations | refinement outcome | integer | dataset.runs[].metadata.experimentMetrics.refinementIterations | Number of refinement iterations after iteration 0. | min=0; max=2; unique=3 | 0.0 | 61.0 |
| converged | refinement outcome | nullable boolean | dataset.runs[].metadata.experimentMetrics.converged | Recorded convergence flag; not applicable to non-automated workflows. | true; blank=60 | 60.0 | 0.0 |
| stopReason | refinement outcome | categorical/string | dataset.runs[].metadata.experimentMetrics.stopReason | Recorded reason that the workflow stopped. | no-actionable-feedback, not-applicable | 0.0 | 0.0 |
| totalPromptTokens | efficiency outcome | integer | dataset.runs[].metadata.experimentMetrics.totalPromptTokens | Total prompt tokens across AI calls in the run. | min=734; max=11581; unique=35 | 0.0 | 0.0 |
| totalOutputTokens | efficiency outcome | integer | dataset.runs[].metadata.experimentMetrics.totalOutputTokens | Total output tokens across AI calls in the run. | min=2059; max=10915; unique=89 | 0.0 | 0.0 |
| totalTokens | efficiency outcome | integer | dataset.runs[].metadata.experimentMetrics.totalTokens | Total prompt plus output tokens across AI calls. | min=2802; max=22496; unique=87 | 0.0 | 0.0 |
| initialStaticPassed | initial quality outcome | boolean | dataset.runs[].initialPassStatus.staticPassed | Initial static-analysis pass flag. | false, true | 0.0 | 0.0 |
| initialRuntimePassed | initial quality outcome | boolean | dataset.runs[].initialPassStatus.runtimePassed | Initial runtime-validation pass flag. | false, true | 0.0 | 0.0 |
| initialAccessibilityPassed | initial quality outcome | boolean | dataset.runs[].initialPassStatus.accessibilityPassed | Initial accessibility-validation pass flag. | false, true | 0.0 | 0.0 |
| initialFunctionalPassed | initial quality outcome | boolean | dataset.runs[].initialPassStatus.functionalPassed | Initial functional-validation pass flag. | false, true | 0.0 | 0.0 |
| initialAllPassed | initial quality outcome | boolean | dataset.runs[].initialPassStatus.allPassed | Initial flag indicating all recorded quality domains passed. | false, true | 0.0 | 0.0 |
| initialStaticTotalIssues | initial quality outcome | integer | dataset.runs[].initialReports.qualityReport.summary.totalIssues | Initial total static-analysis issues. | min=0; max=4; unique=5 | 0.0 | 42.0 |
| initialStaticErrors | initial quality outcome | integer | dataset.runs[].initialReports.qualityReport.summary.totalErrors | Initial static-analysis errors. | min=0; max=3; unique=4 | 0.0 | 45.0 |
| initialStaticWarnings | initial quality outcome | integer | dataset.runs[].initialReports.qualityReport.summary.totalWarnings | Initial static-analysis warnings. | min=0; max=1; unique=2 | 0.0 | 74.0 |
| initialRuntimeConsoleErrors | initial quality outcome | integer | dataset.runs[].initialReports.runtimeReport.summary.consoleErrorCount | Initial browser console errors recorded by runtime validation. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| initialRuntimeUncaughtExceptions | initial quality outcome | integer | dataset.runs[].initialReports.runtimeReport.summary.uncaughtExceptionCount | Initial uncaught browser exceptions recorded by runtime validation. | min=0; max=1; unique=2 | 0.0 | 89.0 |
| initialRequiredControlsPresent | initial quality outcome | integer | dataset.runs[].initialReports.runtimeReport.summary.requiredControlsPresent | Initial required controls found by runtime validation. | min=2; max=2; unique=1 | 0.0 | 0.0 |
| initialRequiredControlsExpected | initial quality outcome | integer | dataset.runs[].initialReports.runtimeReport.summary.requiredControlsExpected | Initial required controls expected by runtime validation. | min=2; max=2; unique=1 | 0.0 | 0.0 |
| initialAccessibilityViolations | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.violationCount | Initial axe accessibility violation count. | min=0; max=2; unique=3 | 0.0 | 38.0 |
| initialAccessibilityViolatingNodes | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.violatingNodeCount | Initial number of DOM nodes affected by accessibility violations. | min=0; max=13; unique=11 | 0.0 | 38.0 |
| initialAccessibilityCritical | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.violationsByImpact.critical | Initial accessibility violations recorded with critical impact. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| initialAccessibilitySerious | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.violationsByImpact.serious | Initial accessibility violations recorded with serious impact. | min=0; max=2; unique=3 | 0.0 | 38.0 |
| initialAccessibilityModerate | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.violationsByImpact.moderate | Initial accessibility violations recorded with moderate impact. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| initialAccessibilityMinor | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.violationsByImpact.minor | Initial accessibility violations recorded with minor impact. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| initialAccessibilityIncomplete | initial quality outcome | integer | dataset.runs[].initialReports.accessibilityReport.incompleteCount | Initial axe checks recorded as incomplete. | min=0; max=2; unique=3 | 0.0 | 29.0 |
| initialFunctionalPassedTests | initial quality outcome | integer | dataset.runs[].initialReports.functionalReport.summary.passedCount | Initial functional tests passed. | min=1; max=9; unique=7 | 0.0 | 0.0 |
| initialFunctionalFailedTests | initial quality outcome | integer | dataset.runs[].initialReports.functionalReport.summary.failedCount | Initial functional tests failed. | min=0; max=5; unique=5 | 0.0 | 85.0 |
| initialFunctionalTotalTests | initial quality outcome | integer | dataset.runs[].initialReports.functionalReport.summary.totalCount | Initial functional tests executed. | min=6; max=9; unique=3 | 0.0 | 0.0 |
| finalStaticPassed | final quality outcome | boolean | dataset.runs[].finalPassStatus.staticPassed | Final static-analysis pass flag. | false, true | 0.0 | 0.0 |
| finalRuntimePassed | final quality outcome | boolean | dataset.runs[].finalPassStatus.runtimePassed | Final runtime-validation pass flag. | false, true | 0.0 | 0.0 |
| finalAccessibilityPassed | final quality outcome | boolean | dataset.runs[].finalPassStatus.accessibilityPassed | Final accessibility-validation pass flag. | false, true | 0.0 | 0.0 |
| finalFunctionalPassed | final quality outcome | boolean | dataset.runs[].finalPassStatus.functionalPassed | Final functional-validation pass flag. | false, true | 0.0 | 0.0 |
| finalAllPassed | final quality outcome | boolean | dataset.runs[].finalPassStatus.allPassed | Final flag indicating all recorded quality domains passed. | false, true | 0.0 | 0.0 |
| finalStaticTotalIssues | final quality outcome | integer | dataset.runs[].finalReports.qualityReport.summary.totalIssues | Final total static-analysis issues. | min=0; max=4; unique=5 | 0.0 | 62.0 |
| finalStaticErrors | final quality outcome | integer | dataset.runs[].finalReports.qualityReport.summary.totalErrors | Final static-analysis errors. | min=0; max=3; unique=4 | 0.0 | 64.0 |
| finalStaticWarnings | final quality outcome | integer | dataset.runs[].finalReports.qualityReport.summary.totalWarnings | Final static-analysis warnings. | min=0; max=1; unique=2 | 0.0 | 81.0 |
| finalRuntimeConsoleErrors | final quality outcome | integer | dataset.runs[].finalReports.runtimeReport.summary.consoleErrorCount | Final browser console errors recorded by runtime validation. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| finalRuntimeUncaughtExceptions | final quality outcome | integer | dataset.runs[].finalReports.runtimeReport.summary.uncaughtExceptionCount | Final uncaught browser exceptions recorded by runtime validation. | min=0; max=1; unique=2 | 0.0 | 89.0 |
| finalRequiredControlsPresent | final quality outcome | integer | dataset.runs[].finalReports.runtimeReport.summary.requiredControlsPresent | Final required controls found by runtime validation. | min=2; max=2; unique=1 | 0.0 | 0.0 |
| finalRequiredControlsExpected | final quality outcome | integer | dataset.runs[].finalReports.runtimeReport.summary.requiredControlsExpected | Final required controls expected by runtime validation. | min=2; max=2; unique=1 | 0.0 | 0.0 |
| finalAccessibilityViolations | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.violationCount | Final axe accessibility violation count. | min=0; max=2; unique=3 | 0.0 | 63.0 |
| finalAccessibilityViolatingNodes | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.violatingNodeCount | Final number of DOM nodes affected by accessibility violations. | min=0; max=13; unique=11 | 0.0 | 63.0 |
| finalAccessibilityCritical | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.violationsByImpact.critical | Final accessibility violations recorded with critical impact. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| finalAccessibilitySerious | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.violationsByImpact.serious | Final accessibility violations recorded with serious impact. | min=0; max=2; unique=3 | 0.0 | 63.0 |
| finalAccessibilityModerate | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.violationsByImpact.moderate | Final accessibility violations recorded with moderate impact. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| finalAccessibilityMinor | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.violationsByImpact.minor | Final accessibility violations recorded with minor impact. | min=0; max=0; unique=1 | 0.0 | 90.0 |
| finalAccessibilityIncomplete | final quality outcome | integer | dataset.runs[].finalReports.accessibilityReport.incompleteCount | Final axe checks recorded as incomplete. | min=0; max=2; unique=3 | 0.0 | 29.0 |
| finalFunctionalPassedTests | final quality outcome | integer | dataset.runs[].finalReports.functionalReport.summary.passedCount | Final functional tests passed. | min=1; max=9; unique=7 | 0.0 | 0.0 |
| finalFunctionalFailedTests | final quality outcome | integer | dataset.runs[].finalReports.functionalReport.summary.failedCount | Final functional tests failed. | min=0; max=5; unique=5 | 0.0 | 86.0 |
| finalFunctionalTotalTests | final quality outcome | integer | dataset.runs[].finalReports.functionalReport.summary.totalCount | Final functional tests executed. | min=6; max=9; unique=3 | 0.0 | 0.0 |
| staticIssueChange | recorded change outcome | integer | CSV export: finalStaticTotalIssues - initialStaticTotalIssues | Final static issue count minus initial static issue count. | min=-4; max=0; unique=5 | 0.0 | 70.0 |
| accessibilityViolationChange | recorded change outcome | integer | CSV export: finalAccessibilityViolations - initialAccessibilityViolations | Final accessibility violation count minus initial count. | min=-2; max=0; unique=3 | 0.0 | 65.0 |
| functionalFailedTestChange | recorded change outcome | integer | CSV export: finalFunctionalFailedTests - initialFunctionalFailedTests | Final failed functional-test count minus initial count. | min=-1; max=0; unique=2 | 0.0 | 89.0 |
| iterationMetrics | refinement outcome | JSON array stored as text | dataset.runs[].metadata.experimentMetrics.iterations | Serialized per-iteration generation duration and token metrics. | 90 unique non-blank values; blank=0 | 0.0 | 0.0 |
| responseFile | identifier | string | dataset.runs[].responseFile | Relative path recorded for the run response JSON. | 90 unique non-blank values; blank=0 | 0.0 | 0.0 |
| workflowDurationSeconds | derived analysis variable | derived | Derived during preprocessing | workflowDurationMs divided by 1,000. | Created by preprocessing script |  |  |
| aiGenerationDurationSeconds | derived analysis variable | derived | Derived during preprocessing | aiGenerationDurationMs divided by 1,000. | Created by preprocessing script |  |  |
| pipelineOverheadMs | derived analysis variable | derived | Derived during preprocessing | workflowDurationMs minus aiGenerationDurationMs. | Created by preprocessing script |  |  |
| pipelineOverheadSeconds | derived analysis variable | derived | Derived during preprocessing | pipelineOverheadMs divided by 1,000. | Created by preprocessing script |  |  |
| initialFunctionalPassRate | initial quality outcome | derived | Derived during preprocessing | Initial passed functional tests divided by initial total tests. | Created by preprocessing script |  |  |
| finalFunctionalPassRate | final quality outcome | derived | Derived during preprocessing | Final passed functional tests divided by final total tests. | Created by preprocessing script |  |  |
| automatedRefinementUsed | derived analysis variable | derived | Derived during preprocessing | For automated-refinement runs, whether refinementIterations is greater than zero; null for other workflows. | Created by preprocessing script |  |  |
