# Proposed statistical analysis plan

## Design interpretation

The dataset is a balanced 3 × 3 factorial experiment:

- workflow: one-shot, quality-focused, automated-refinement;
- specification: todo, quiz, booking;
- 10 generated runs in each cell.

The `repetition` field is a replicate label within each cell. It should not be
treated as a repeated-measures subject identifier unless the experiment runner
was explicitly designed to pair repetition numbers across cells. The default
analysis should therefore treat the 90 generated applications as independent
experimental runs. `sequence` may be used in a sensitivity analysis for
run-order or temporal drift because execution was sequential but randomised.

## Outcome families

### Primary quality endpoint

- `finalAllPassed`: recorded conjunctive pass outcome across the pipeline's
  quality domains. This is an existing outcome, not a newly constructed score.

### Domain-specific quality endpoints

- binary: `finalStaticPassed`, `finalRuntimePassed`,
  `finalAccessibilityPassed`, `finalFunctionalPassed`;
- counts: final static issues/errors/warnings, runtime errors/exceptions,
  accessibility violations/nodes/impact counts, functional failed tests;
- initial equivalents for baseline and automated-refinement change analysis.

### Efficiency endpoints

- `aiGenerationDurationMs`;
- `workflowDurationMs`;
- derived `pipelineOverheadMs`;
- prompt, output and total tokens.

### Automated-refinement endpoints

- refinement iteration count;
- convergence and stop reason;
- initial-to-final changes;
- iteration-level duration and tokens.

## Planned sequence

1. Produce cell-level descriptive statistics and pass percentages with 95%
   confidence intervals.
2. Inspect distributions, zero inflation, skew, outliers and residual
   assumptions before selecting parametric models.
3. For binary outcomes, use exact or penalised methods where sparse cells or
   complete separation make ordinary logistic regression unstable. Report risk
   differences, odds ratios and confidence intervals. Use pairwise Fisher exact
   tests with Holm correction when required.
4. For continuous duration/token outcomes, use a two-factor model with
   workflow, specification and their interaction if residual assumptions are
   acceptable. Consider log transformation and heteroskedasticity-robust
   standard errors. Otherwise use clearly labelled non-parametric comparisons.
5. For count outcomes, assess dispersion and zero inflation before choosing
   Poisson, negative-binomial or non-parametric analysis.
6. Analyse automated-refinement initial-to-final outcomes as paired data:
   McNemar/exact tests for binary outcomes and Wilcoxon or exact sign-based
   methods for count changes where appropriate.
7. Treat convergence descriptively when a field has no variation.
8. Correct families of pairwise tests with Holm's method.
9. Report effect sizes and confidence intervals alongside p-values.
10. Keep specification-stratified analyses and workflow × specification
    interaction analyses distinct from overall workflow comparisons.

No composite software-quality score is proposed.
