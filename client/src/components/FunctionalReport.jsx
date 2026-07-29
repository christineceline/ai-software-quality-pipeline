function StatusBadge({ passed }) {
  return (
    <span
      className={`report-status ${
        passed ? "report-status--pass" : "report-status--fail"
      }`}
    >
      {passed ? "Passed" : "Failed"}
    </span>
  );
}

function FunctionalReport({ report }) {
  if (!report) {
    return null;
  }

  const { summary, tests = [] } = report;

  return (
    <section className="quality-report functional-report">
      <div className="quality-report__heading">
        <h2>Functional validation</h2>

        <StatusBadge passed={summary.passed} />
      </div>

      <dl className="report-summary">
        <div>
          <dt>Tests passed</dt>
          <dd>{summary.passedCount}</dd>
        </div>

        <div>
          <dt>Tests failed</dt>
          <dd>{summary.failedCount}</dd>
        </div>

        <div>
          <dt>Total tests</dt>
          <dd>{summary.totalCount}</dd>
        </div>
      </dl>

      <h3>Specification requirements</h3>

      <ul className="report-list">
        {tests.map((test) => (
          <li key={test.id}>
            <StatusBadge passed={test.passed} />{" "}

            <strong>{test.requirement}</strong>

            {!test.passed && test.error?.message && (
              <p className="report-warning">
                {test.error.message}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FunctionalReport;