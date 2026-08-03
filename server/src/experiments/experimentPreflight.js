import {
  access,
  readFile,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { specifications } from "../specifications/index.js";
import {
  EXPERIMENT_WORKFLOWS,
} from "./experimentConfig.js";

const currentFilePath =
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFilePath);

const serverRoot =
  path.resolve(
    currentDirectory,
    "../..",
  );

const requiredFiles = [
  "src/prompts/buildPrompt.js",
  "src/services/generationService.js",
  "src/services/refinementService.js",
  "src/services/runtimeValidationService.js",
  "src/services/functionalValidationService.js",
  "src/services/runStorageService.js",
  "src/utils/responseParser.js",
  "src/quality/qualityAnalyzer.js",
  "src/specifications/index.js",
  "src/specifications/todo.js",
  "src/specifications/quiz.js",
  "src/specifications/booking.js",
  "src/routes/generationRoutes.js",
];

const fingerprintTargets = [
  "src/prompts",
  "src/specifications",
  "src/quality",
  "src/services/generationService.js",
  "src/services/refinementService.js",
  "src/services/runtimeValidationService.js",
  "src/services/functionalValidationService.js",
  "src/utils/responseParser.js",
  "src/routes/generationRoutes.js",
];

async function exists(
  targetPath,
) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(
  targetPath,
) {
  const absolutePath =
    path.resolve(
      serverRoot,
      targetPath,
    );

  const stats =
    await import("node:fs/promises")
      .then(({ stat }) =>
        stat(absolutePath),
      );

  if (stats.isFile()) {
    return [
      {
        absolutePath,
        relativePath:
          targetPath
            .split(path.sep)
            .join("/"),
      },
    ];
  }

  const entries =
    await readdir(
      absolutePath,
      {
        withFileTypes: true,
      },
    );

  const files = [];

  for (
    const entry of entries
      .sort(
        (left, right) =>
          left.name.localeCompare(
            right.name,
          ),
      )
  ) {
    const relativePath =
      path.join(
        targetPath,
        entry.name,
      );

    if (entry.isDirectory()) {
      files.push(
        ...await collectFiles(
          relativePath,
        ),
      );
    } else if (entry.isFile()) {
      files.push({
        absolutePath:
          path.resolve(
            serverRoot,
            relativePath,
          ),

        relativePath:
          relativePath
            .split(path.sep)
            .join("/"),
      });
    }
  }

  return files;
}

async function hashFile(
  absolutePath,
) {
  const contents =
    await readFile(
      absolutePath,
    );

  return createHash("sha256")
    .update(contents)
    .digest("hex");
}

async function buildFingerprint() {
  const collectedFiles = [];

  for (
    const target of
    fingerprintTargets
  ) {
    const absoluteTarget =
      path.resolve(
        serverRoot,
        target,
      );

    if (!(await exists(
      absoluteTarget,
    ))) {
      continue;
    }

    collectedFiles.push(
      ...await collectFiles(
        target,
      ),
    );
  }

  const uniqueFiles =
    Array.from(
      new Map(
        collectedFiles.map(
          (file) => [
            file.relativePath,
            file,
          ],
        ),
      ).values(),
    ).sort(
      (left, right) =>
        left.relativePath.localeCompare(
          right.relativePath,
        ),
    );

  const files = [];

  for (const file of uniqueFiles) {
    files.push({
      path: file.relativePath,
      sha256:
        await hashFile(
          file.absolutePath,
        ),
    });
  }

  const combinedHash =
    createHash("sha256");

  for (const file of files) {
    combinedHash.update(
      `${file.path}:${file.sha256}\n`,
    );
  }

  return {
    algorithm: "sha256",
    combinedSha256:
      combinedHash.digest("hex"),
    fileCount: files.length,
    files,
  };
}

function addCheck(
  checks,
  {
    id,
    passed,
    details,
    blocking = true,
  },
) {
  checks.push({
    id,
    passed,
    blocking,
    details,
  });
}

async function checkServerHealth(
  baseUrl,
) {
  try {
    const response =
      await fetch(
        `${baseUrl}/api/health`,
      );

    if (!response.ok) {
      return {
        passed: false,
        details:
          `Health endpoint returned HTTP ${response.status}.`,
      };
    }

    const body =
      await response.json();

    return {
      passed:
        body?.status === "ok",
      details:
        body?.status === "ok"
          ? `Connected to ${baseUrl}.`
          : "Health response did not report status=ok.",
    };
  } catch (error) {
    return {
      passed: false,
      details:
        `Cannot connect to ${baseUrl}: ${error.message}`,
    };
  }
}

export async function runExperimentPreflight({
  baseUrl,
  temperature,
  requireOpenAI = true,
}) {
  const checks = [];

  addCheck(
    checks,
    {
      id: "provider",
      passed:
        requireOpenAI
          ? process.env.AI_PROVIDER ===
            "openai"
          : Boolean(
              process.env.AI_PROVIDER,
            ),
      details:
        `AI_PROVIDER=${process.env.AI_PROVIDER ?? "<unset>"}`,
    },
  );

  addCheck(
    checks,
    {
      id: "model",
      passed:
        Boolean(
          process.env.OPENAI_MODEL ??
          process.env.GEMINI_MODEL ??
          process.env.OLLAMA_MODEL,
        ),
      details:
        `Model=${
          process.env.OPENAI_MODEL ??
          process.env.GEMINI_MODEL ??
          process.env.OLLAMA_MODEL ??
          "<unset>"
        }`,
    },
  );

  addCheck(
    checks,
    {
      id: "temperature",
      passed:
        Number.isFinite(
          Number(temperature),
        ),
      details:
        `temperature=${temperature}`,
    },
  );

  addCheck(
    checks,
    {
      id: "specification-count",
      passed:
        specifications.length === 3,
      details:
        `Found ${specifications.length} specifications: ${specifications.map(
          (specification) =>
            specification.id,
        ).join(", ")}`,
    },
  );

  addCheck(
    checks,
    {
      id: "workflow-count",
      passed:
        EXPERIMENT_WORKFLOWS
          .length === 3,
      details:
        `Found ${EXPERIMENT_WORKFLOWS.length} workflows: ${EXPERIMENT_WORKFLOWS.join(", ")}`,
    },
  );

  for (const relativePath of requiredFiles) {
    const absolutePath =
      path.resolve(
        serverRoot,
        relativePath,
      );

    addCheck(
      checks,
      {
        id:
          `file:${relativePath}`,
        passed:
          await exists(
            absolutePath,
          ),
        details:
          relativePath,
      },
    );
  }

  const health =
    await checkServerHealth(
      baseUrl,
    );

  addCheck(
    checks,
    {
      id: "server-health",
      ...health,
    },
  );

  const fingerprint =
    await buildFingerprint();

  addCheck(
    checks,
    {
      id:
        "reproducibility-fingerprint",
      passed:
        fingerprint.fileCount > 0,
      details:
        `${fingerprint.fileCount} files; ${fingerprint.combinedSha256}`,
    },
  );

  const blockingFailures =
    checks.filter(
      (check) =>
        check.blocking &&
        !check.passed,
    );

  return {
    checkedAt:
      new Date().toISOString(),
    passed:
      blockingFailures.length === 0,
    blockingFailureCount:
      blockingFailures.length,
    checks,
    fingerprint,
  };
}

export function printPreflightReport(
  report,
) {
  console.log(
    `Preflight: ${
      report.passed
        ? "PASSED"
        : "FAILED"
    }`,
  );

  for (const check of report.checks) {
    console.log(
      `${check.passed ? "PASS" : "FAIL"}  ${check.id} — ${check.details}`,
    );
  }

  console.log(
    `Fingerprint: ${report.fingerprint.combinedSha256}`,
  );
}
