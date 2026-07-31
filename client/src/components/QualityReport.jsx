function ResultCard({
  title,
  result,
}) {
  return (
    <article className="quality-card">
      <div className="quality-card__header">
        <h3>{title}</h3>

        <span
          className={
            result.passed
              ? "quality-status quality-status--passed"
              : "quality-status quality-status--failed"
          }
        >
          {result.passed ? "Passed" : "Issues found"}
        </span>
      </div>

      <dl className="quality-counts">
        <div>
          <dt>Issues</dt>
          <dd>{result.issueCount}</dd>
        </div>

        <div>
          <dt>Errors</dt>
          <dd>{result.errorCount}</dd>
        </div>

        <div>
          <dt>Warnings</dt>
          <dd>{result.warningCount}</dd>
        </div>
      </dl>

      {result.messages.length > 0 && (
        <details>
          <summary>
            View {result.messages.length} issue
            {result.messages.length === 1 ? "" : "s"}
          </summary>

          <ul className="quality-message-list">
            {result.messages.map((message, index) => (
              <li
                key={`${message.ruleId}-${message.line}-${index}`}
              >
                <strong>
                  {message.ruleId}
                </strong>

                <span>{message.message}</span>

                {message.line && (
                  <small>
                    Line {message.line}
                    {message.column
                      ? `, column ${message.column}`
                      : ""}
                  </small>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function QualityReport({ report }) {
  if (!report) {
    return null;
  }

  return (
    <section className="quality-report">
      <div className="quality-summary">
        <div>
          <span>Total issues</span>
          <strong>{report.summary.totalIssues}</strong>
        </div>

        <div>
          <span>Errors</span>
          <strong>{report.summary.totalErrors}</strong>
        </div>

        <div>
          <span>Warnings</span>
          <strong>{report.summary.totalWarnings}</strong>
        </div>
      </div>

      <div className="quality-grid">
        <ResultCard
          title="HTML standards"
          result={report.analyzers.html}
        />

        <ResultCard
          title="CSS quality"
          result={report.analyzers.css}
        />

        <ResultCard
          title="JavaScript quality"
          result={report.analyzers.javascript}
        />
      </div>
    </section>
  );
}

export default QualityReport;