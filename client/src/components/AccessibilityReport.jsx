function AccessibilityReport({ report }) {
  if (!report) {
    return null;
  }

  if (!report.successful) {
    return (
      <section className="quality-section">
        <h3>Accessibility analysis</h3>

        <div className="error-message" role="alert">
          <strong>Accessibility analysis failed</strong>
          <p>
            {report.error?.message ??
              "axe-core did not complete successfully."}
          </p>
        </div>
      </section>
    );
  }

  const impactCounts = report.violationsByImpact ?? {};

  return (
    <section className="quality-section">
      <div className="report-heading">
        <div>
          <h3>Accessibility analysis</h3>
          <p>{report.standard}</p>
        </div>

        <span
          className={
            report.violationCount === 0
              ? "status status--connected"
              : "status status--disconnected"
          }
        >
          {report.violationCount === 0
            ? "No violations detected"
            : `${report.violationCount} violations`}
        </span>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <strong>{report.violationCount}</strong>
          <span>Violations</span>
        </article>

        <article className="metric-card">
          <strong>{report.violatingNodeCount}</strong>
          <span>Affected elements</span>
        </article>

        <article className="metric-card">
          <strong>{impactCounts.critical ?? 0}</strong>
          <span>Critical</span>
        </article>

        <article className="metric-card">
          <strong>{impactCounts.serious ?? 0}</strong>
          <span>Serious</span>
        </article>

        <article className="metric-card">
          <strong>{impactCounts.moderate ?? 0}</strong>
          <span>Moderate</span>
        </article>

        <article className="metric-card">
          <strong>{impactCounts.minor ?? 0}</strong>
          <span>Minor</span>
        </article>
      </div>

      {report.violations.length > 0 && (
        <div className="violation-list">
          {report.violations.map((violation) => (
            <details
              key={violation.id}
              className="report-details"
            >
              <summary>
                <strong>{violation.help}</strong>
                <span>
                  {violation.impact ?? "unknown"} ·{" "}
                  {violation.nodeCount} affected
                </span>
              </summary>

              <p>{violation.description}</p>

              {violation.nodes.map((node, index) => (
                <div
                  className="violation-node"
                  key={`${violation.id}-${index}`}
                >
                  <p>
                    <strong>Target:</strong>{" "}
                    {node.target?.join(", ")}
                  </p>

                  <pre>
                    <code>{node.html}</code>
                  </pre>

                  {node.failureSummary && (
                    <p>{node.failureSummary}</p>
                  )}
                </div>
              ))}
            </details>
          ))}
        </div>
      )}

      <p className="information-message">
        Automated axe-core testing can detect many common
        accessibility issues, but it does not establish full
        WCAG compliance.
      </p>
    </section>
  );
}

export default AccessibilityReport;