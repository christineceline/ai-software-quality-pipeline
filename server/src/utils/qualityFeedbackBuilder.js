export function buildQualityFeedback({
  qualityReport,
  runtimeReport,
  accessibilityReport,
}) {
  return {
    staticAnalysis: null,
    runtimeValidation: null,
    accessibility: null,
  };
}