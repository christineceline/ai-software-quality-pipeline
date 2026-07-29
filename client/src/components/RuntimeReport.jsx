function StatusBadge({ passed, passText = "Pass", failText = "Fail" }) {
  return (
    <span
      className={`report-status ${
        passed ? "report-status--pass" : "report-status--fail"
      }`}
    >
      {passed ? passText : failText}
    </span>
  );
}

function RuntimeReport({ report }) {
  if (!report) {
    return null;
  }

  const {
    summary,
    navigation,
    body,
    consoleErrors = [],
    uncaughtExceptions = [],
    requiredControls,
    analysisError,
  } = report;

  return (
    <section className="quality-report runtime-report">
      <div className="quality-report__heading">
        <h2>Runtime validation</h2>
        <StatusBadge
          passed={summary.runtimePassed}
          passText="Passed"
          failText="Issues detected"
        />
      </div>

      {analysisError && (
        <div className="report-error">
          <strong>Runtime analysis failed:</strong>{" "}
          {analysisError.message}
        </div>
      )}

      <dl className="report-summary">
        <div>
          <dt>Application opened</dt>
          <dd>
            <StatusBadge passed={summary.navigationSuccessful} />
          </dd>
        </div>

        <div>
          <dt>Visible body content</dt>
          <dd>
            <StatusBadge passed={summary.hasVisibleBodyContent} />
          </dd>
        </div>

        <div>
          <dt>Console errors</dt>
          <dd>{summary.consoleErrorCount}</dd>
        </div>

        <div>
          <dt>Uncaught exceptions</dt>
          <dd>{summary.uncaughtExceptionCount}</dd>
        </div>

        <div>
          <dt>Required controls</dt>
          <dd>
            {summary.requiredControlsPresent} /{" "}
            {summary.requiredControlsExpected}
          </dd>
        </div>

        <div>
          <dt>HTTP status</dt>
          <dd>{navigation.status ?? "Unavailable"}</dd>
        </div>
      </dl>

      <h3>Required controls</h3>

      {requiredControls.controls.length === 0 ? (
        <p>No runtime requirements were configured.</p>
      ) : (
        <ul className="report-list">
          {requiredControls.controls.map((control) => (
            <li key={control.id}>
              <StatusBadge passed={control.present} />{" "}
              {control.label}
            </li>
          ))}
        </ul>
      )}

      {consoleErrors.length > 0 && (
        <>
          <h3>Console errors</h3>
          <ul className="report-list report-list--errors">
            {consoleErrors.map((error, index) => (
              <li key={`${error.text}-${index}`}>
                <code>{error.text}</code>
                {error.location?.url && (
                  <small>
                    {" "}
                    {error.location.url}
                    {error.location.lineNumber !== null
                      ? `:${error.location.lineNumber}`
                      : ""}
                  </small>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {uncaughtExceptions.length > 0 && (
        <>
          <h3>Uncaught exceptions</h3>
          <ul className="report-list report-list--errors">
            {uncaughtExceptions.map((error, index) => (
              <li key={`${error.message}-${index}`}>
                <strong>{error.name}:</strong>{" "}
                <code>{error.message}</code>
              </li>
            ))}
          </ul>
        </>
      )}

      {!body.hasVisibleContent && (
        <p className="report-warning">
          The page did not contain visible body text.
        </p>
      )}
    </section>
  );
}

export default RuntimeReport;