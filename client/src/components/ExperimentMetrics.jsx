function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) {
    return "Unavailable";
  }

  return `${(milliseconds / 1000).toFixed(1)} s`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return value.toLocaleString();
}

function formatConverged(value) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not applicable";
}

function formatStopReason(value) {
  if (!value) {
    return "Unavailable";
  }

  if (value === "not-applicable") {
    return "Not applicable";
  }

  return value
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function ExperimentMetrics({
  metrics,
  workflow,
}) {
  if (!metrics) {
    return null;
  }

  const iterations =
    metrics.iterations ?? [];

  const showIterations =
    workflow === "automated-refinement" &&
    iterations.length > 0;

  return (
    <section className="quality-section">
      <div className="report-heading">
        <div>
          <h3>Experiment metrics</h3>

          <p>
            Workflow efficiency and AI usage
            measurements
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <strong>
            {formatDuration(
              metrics.workflowDurationMs,
            )}
          </strong>

          <span>
            Total workflow duration
          </span>
        </article>

        <article className="metric-card">
          <strong>
            {formatDuration(
              metrics.aiGenerationDurationMs,
            )}
          </strong>

          <span>
            Total AI generation duration
          </span>
        </article>

        <article className="metric-card">
          <strong>
            {metrics.refinementIterations ??
              0}
          </strong>

          <span>
            Refinement iterations
          </span>
        </article>

        <article className="metric-card">
          <strong>
            {formatConverged(
              metrics.converged,
            )}
          </strong>

          <span>Converged</span>
        </article>

        <article className="metric-card">
          <strong>
            {formatNumber(
              metrics.totalPromptTokens,
            )}
          </strong>

          <span>Prompt tokens</span>
        </article>

        <article className="metric-card">
          <strong>
            {formatNumber(
              metrics.totalOutputTokens,
            )}
          </strong>

          <span>Output tokens</span>
        </article>

        <article className="metric-card">
          <strong>
            {formatNumber(
              metrics.totalTokens,
            )}
          </strong>

          <span>Total tokens</span>
        </article>

        <article className="metric-card">
          <strong>
            {formatStopReason(
              metrics.stopReason,
            )}
          </strong>

          <span>Stop reason</span>
        </article>
      </div>

      {showIterations && (
        <>
          <h3>Per-iteration metrics</h3>

          <div className="quality-grid">
            {iterations.map(
              (iteration) => (
                <article
                  className="quality-card"
                  key={iteration.iteration}
                >
                  <div className="quality-card__header">
                    <h3>
                      {iteration.iteration === 0
                        ? "Iteration 0 — Initial generation"
                        : `Iteration ${iteration.iteration} — Refinement`}
                    </h3>
                  </div>

                  <dl className="report-summary">
                    <div>
                      <dt>
                        Generation duration
                      </dt>

                      <dd>
                        {formatDuration(
                          iteration
                            .generationDurationMs,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Prompt tokens</dt>

                      <dd>
                        {formatNumber(
                          iteration.promptTokens,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Output tokens</dt>

                      <dd>
                        {formatNumber(
                          iteration.outputTokens,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Total tokens</dt>

                      <dd>
                        {formatNumber(
                          iteration.totalTokens,
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default ExperimentMetrics;