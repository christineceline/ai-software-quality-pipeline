import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking API...");

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await fetch("/api/health");

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        setApiStatus(`${data.service}: ${data.status}`);
      } catch (error) {
        setApiStatus(`API unavailable: ${error.message}`);
      }
    }

    checkApi();
  }, []);

  return (
    <main>
      <h1>AI Software Quality Pipeline</h1>
      <p>{apiStatus}</p>
    </main>
  );
}

export default App;