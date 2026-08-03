import { useEffect, useState } from "react";
import "./App.css";
import ApplicationPreview from "./components/ApplicationPreview";
import CodeViewer from "./components/CodeViewer";
import QualityReport from "./components/QualityReport";
import RuntimeReport from "./components/RuntimeReport";
import AccessibilityReport from "./components/AccessibilityReport";
import FunctionalReport from "./components/FunctionalReport";
import ExperimentMetrics from "./components/ExperimentMetrics";

const workflows = [
  {
    id: "one-shot",
    name: "One-shot generation",
    description:
      "Generates the application from the functional specification without explicit quality instructions.",
  },
  {
    id: "quality-focused",
    name: "Quality-focused prompt engineering",
    description:
      "Adds explicit accessibility, maintainability, responsiveness and code-quality requirements.",
  },
  {
    id: "automated-refinement",
    name: "Automated quality-guided refinement",
    description:
      "Uses automated quality reports to identify defects and refine the generated application.",
  },
];

function App() {
  const [apiStatus, setApiStatus] = useState("Checking API");
  const [specifications, setSpecifications] = useState([]);
  const [specificationId, setSpecificationId] = useState("");
  const [workflow, setWorkflow] = useState("one-shot");
  const [application, setApplication] = useState(null);
  const [run, setRun] = useState(null);
  const [activeResultView, setActiveResultView] =
    useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [qualityReport, setQualityReport] = useState(null);
  const [runtimeReport, setRuntimeReport] = useState(null);
  const [accessibilityReport, setAccessibilityReport] =
    useState(null);
  const [functionalReport, setFunctionalReport] = useState(null);
  const [generationMetrics, setGenerationMetrics] = useState(null);
  const [refinementIterations, setRefinementIterations] =
    useState([]);
  const [selectedIteration, setSelectedIteration] = useState(null);

  useEffect(() => {
    async function initialiseApplication() {
      try {
        const [healthResponse, specificationResponse] =
          await Promise.all([
            fetch("/api/health"),
            fetch("/api/specifications"),
          ]);

        if (!healthResponse.ok) {
          throw new Error("The API health check failed.");
        }

        if (!specificationResponse.ok) {
          throw new Error(
            "The application specifications could not be loaded.",
          );
        }

        const healthData = await healthResponse.json();
        const specificationData =
          await specificationResponse.json();

        setApiStatus(
          healthData.status === "ok"
            ? "API connected"
            : "API unavailable",
        );

        setSpecifications(
          specificationData.specifications ?? [],
        );

        if (specificationData.specifications?.length > 0) {
          setSpecificationId(
            specificationData.specifications[0].id,
          );
        }
      } catch (initialisationError) {
        setApiStatus("API unavailable");
        setError(initialisationError.message);
      }
    }

    initialiseApplication();
  }, []);

  async function handleGenerate(event) {
    event.preventDefault();

    setError("");
    setApplication(null);
    setRun(null);
    setIsGenerating(true);
    setQualityReport(null);
    setRuntimeReport(null);
    setAccessibilityReport(null);
    setFunctionalReport(null);
    setGenerationMetrics(null);
    setRefinementIterations([]);
    setSelectedIteration(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specificationId,
          workflow,
          temperature: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Generation failed.",
        );
      }

      setRun(data.run);
      setGenerationMetrics(
        data.run?.generationMetrics ?? null,
      );

      if (workflow === "automated-refinement") {
        const completedRefinements =
          data.refinement?.iterations ?? [];

        const allIterations = [
          data.initial,
          ...completedRefinements,
        ];

        setRefinementIterations(allIterations);

        const finalIteration =
          allIterations[allIterations.length - 1];

        setSelectedIteration(finalIteration.iteration);
        setApplication(finalIteration.application);
        setGenerationMetrics(
          finalIteration.generationMetrics ?? null,
        );
        setQualityReport(finalIteration.qualityReport);
        setRuntimeReport(finalIteration.runtimeReport);
        setAccessibilityReport(
          finalIteration.accessibilityReport ??
            finalIteration.runtimeReport?.accessibility ??
            null,
        );
        setFunctionalReport(
          finalIteration.functionalReport ?? null,
        );
      } else {
        setRefinementIterations([]);
        setSelectedIteration(null);

        setApplication(data.application);
        setQualityReport(data.qualityReport);
        setRuntimeReport(data.runtimeReport);
        setAccessibilityReport(
          data.accessibilityReport ??
            data.runtimeReport?.accessibility ??
            null,
        );
        setFunctionalReport(data.functionalReport ?? null);
      }

      setActiveResultView("preview");
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="pipeline-shell">
      <header className="site-header">
        <div className="brand">
          <div className="brand-copy">
            <p className="eyebrow">7CS077 Dissertation Prototype</p>
            <h1>AQuA</h1>
            <p className="brand-subtitle">
              AI Quality Assessment Pipeline
            </p>
          </div>
        </div>

        <div className="header-meta">
          <span className="header-label">System status</span>
          <span
            className={
              apiStatus === "API connected"
                ? "status status--connected"
                : "status status--disconnected"
            }
          >
            <span className="status-dot" aria-hidden="true" />
            {apiStatus}
          </span>
        </div>
      </header>

      <main className="main-layout">
        <section className="panel generation-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Configuration</p>
              <h2>Generate application</h2>
            </div>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label htmlFor="specification">
                Application specification
              </label>

              <select
                id="specification"
                value={specificationId}
                onChange={(event) =>
                  setSpecificationId(event.target.value)
                }
                disabled={
                  isGenerating || specifications.length === 0
                }
              >
                {specifications.map((specification) => (
                  <option
                    key={specification.id}
                    value={specification.id}
                  >
                    {specification.name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset disabled={isGenerating}>
              <legend>Development workflow</legend>

              <div className="workflow-options">
                {workflows.map((workflowOption) => (
                  <label
                    key={workflowOption.id}
                    className={
                      workflowOption.disabled
                        ? "workflow-option workflow-option--disabled"
                        : "workflow-option"
                    }
                  >
                    <input
                      type="radio"
                      name="workflow"
                      value={workflowOption.id}
                      checked={workflow === workflowOption.id}
                      disabled={workflowOption.disabled}
                      onChange={(event) =>
                        setWorkflow(event.target.value)
                      }
                    />

                    <span className="workflow-copy">
                      <strong>{workflowOption.name}</strong>
                      <small>
                        {workflowOption.description}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              className="primary-button"
              type="submit"
              disabled={isGenerating || !specificationId}
            >
              <span>
                {isGenerating
                  ? "Running pipeline"
                  : "Run AQuA pipeline"}
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          {isGenerating && (
            <p className="information-message" role="status">
              AQuA is generating and evaluating the application.
              This may take several minutes.
            </p>
          )}

          {error && (
            <div className="error-message" role="alert">
              <strong>Generation failed</strong>
              <p>{error}</p>
            </div>
          )}
        </section>

        <section className="panel result-panel">
          <div className="result-header">
            <div className="result-title">
              <div>
                <p className="section-label">Run workspace</p>
                <h2>Generated application</h2>

                {run ? (
                  <p className="run-summary">
                    {run.specification.name} · {run.workflow} ·{" "}
                    {run.model}
                  </p>
                ) : (
                  <p className="run-summary">
                    Preview, source and quality evidence will appear
                    here.
                  </p>
                )}
              </div>
            </div>

            <div
              className="result-view-buttons"
              aria-label="Result view"
            >
              {[
                ["preview", "Preview"],
                ["code", "Source"],
                ["quality", "Quality"],
              ].map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  className={
                    activeResultView === view
                      ? "view-button view-button--active"
                      : "view-button"
                  }
                  onClick={() => setActiveResultView(view)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {refinementIterations.length > 0 && (
            <div className="iteration-selector">
              <label htmlFor="iteration">
                Refinement iteration
              </label>

              <select
                id="iteration"
                value={selectedIteration ?? ""}
                onChange={(event) => {
                  const iterationNumber = Number(
                    event.target.value,
                  );

                  const selected =
                    refinementIterations.find(
                      (item) =>
                        item.iteration === iterationNumber,
                    );

                  if (!selected) {
                    return;
                  }

                  setSelectedIteration(iterationNumber);
                  setApplication(selected.application);
                  setGenerationMetrics(
                    selected.generationMetrics ?? null,
                  );
                  setQualityReport(selected.qualityReport);
                  setRuntimeReport(selected.runtimeReport);
                  setAccessibilityReport(
                    selected.accessibilityReport ??
                      selected.runtimeReport?.accessibility ??
                      null,
                  );
                  setFunctionalReport(
                    selected.functionalReport ?? null,
                  );
                }}
              >
                {refinementIterations.map((item) => (
                  <option
                    key={item.iteration}
                    value={item.iteration}
                  >
                    {item.iteration === 0
                      ? "Iteration 0 — Initial generation"
                      : `Iteration ${item.iteration} — Refinement`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeResultView === "preview" && (
            <ApplicationPreview application={application} />
          )}

          {activeResultView === "code" && (
            <CodeViewer application={application} />
          )}

          {activeResultView === "quality" && (
            <>
              {!application ? (
                <div className="empty-state">
                  Generate an application to display its quality
                  report.
                </div>
              ) : (
                <>
                  <ExperimentMetrics
                    metrics={run?.experimentMetrics}
                    workflow={run?.workflow}
                  />
                  <QualityReport report={qualityReport} />
                  <RuntimeReport report={runtimeReport} />
                  <AccessibilityReport
                    report={accessibilityReport}
                  />
                  <FunctionalReport
                    report={functionalReport}
                  />
                </>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;