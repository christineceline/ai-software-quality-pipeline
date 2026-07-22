import { useState } from "react";

const tabs = [
  {
    id: "html",
    label: "HTML",
  },
  {
    id: "css",
    label: "CSS",
  },
  {
    id: "javascript",
    label: "JavaScript",
  },
];

function CodeViewer({ application }) {
  const [activeTab, setActiveTab] = useState("html");

  if (!application) {
    return (
      <div className="empty-state">
        Generated source code will appear here.
      </div>
    );
  }

  return (
    <section>
      <div
        className="code-tabs"
        role="tablist"
        aria-label="Generated source files"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={
              activeTab === tab.id
                ? "code-tab code-tab--active"
                : "code-tab"
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <pre className="code-output">
        <code>{application[activeTab]}</code>
      </pre>
    </section>
  );
}

export default CodeViewer;