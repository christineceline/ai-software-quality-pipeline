import { randomUUID } from "node:crypto";
import { specifications } from "../specifications/index.js";

export const EXPERIMENT_WORKFLOWS = [
  "one-shot",
  "quality-focused",
  "automated-refinement",
];

function parsePositiveInteger(value, name) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    throw new Error(
      `${name} must be an integer greater than or equal to 1.`,
    );
  }

  return parsed;
}

function parseTemperature(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      "temperature must be a finite number.",
    );
  }

  return parsed;
}

function getArgumentValue(args, ...names) {
  for (const name of names) {
    const exactIndex =
      args.indexOf(name);

    if (exactIndex !== -1) {
      const value =
        args[exactIndex + 1];

      if (
        value === undefined ||
        value.startsWith("--")
      ) {
        throw new Error(
          `${name} requires a value.`,
        );
      }

      return value;
    }

    const prefix =
      `${name}=`;

    const inlineArgument =
      args.find((argument) =>
        argument.startsWith(prefix),
      );

    if (inlineArgument) {
      return inlineArgument.slice(
        prefix.length,
      );
    }
  }

  return null;
}

function getPositionalRepetitions(args) {
  const positionalArgument =
    args.find(
      (argument) =>
        !argument.startsWith("-"),
    );

  return positionalArgument ?? null;
}

export function createExperimentId() {
  const timestamp = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");

  return (
    `experiment-${timestamp}-` +
    randomUUID().slice(0, 8)
  );
}

export function parseExperimentArguments(
  args = process.argv.slice(2),
) {
  const repetitionsValue =
    getArgumentValue(
      args,
      "--repetitions",
      "-n",
    ) ??
    getPositionalRepetitions(args);

  const experimentId =
    getArgumentValue(
      args,
      "--experiment-id",
    );

  const baseUrl =
    getArgumentValue(
      args,
      "--base-url",
    ) ??
    `http://localhost:${
      process.env.PORT || 3001
    }`;

  const temperatureValue =
    getArgumentValue(
      args,
      "--temperature",
    ) ??
    "0";

  const retryFailed =
    args.includes(
      "--retry-failed",
    );

  const help =
    args.includes("--help") ||
    args.includes("-h");

  return {
    help,

    repetitions:
      repetitionsValue === null
        ? null
        : parsePositiveInteger(
            repetitionsValue,
            "repetitions",
          ),

    experimentId,

    baseUrl:
      baseUrl.replace(/\/+$/, ""),

    temperature:
      parseTemperature(
        temperatureValue,
      ),

    retryFailed,
  };
}

export function buildExperimentConfiguration({
  experimentId,
  repetitions,
  baseUrl,
  temperature,
}) {
  if (specifications.length !== 3) {
    throw new Error(
      "The formal experiment requires " +
      "exactly 3 specifications; " +
      `found ${specifications.length}.`,
    );
  }

  return {
    experimentId,
    createdAt:
      new Date().toISOString(),
    repetitions,
    sequential: true,
    baseUrl,
    temperature,

    provider:
      process.env.AI_PROVIDER ??
      null,

    model:
      process.env.OPENAI_MODEL ??
      process.env.GEMINI_MODEL ??
      process.env.OLLAMA_MODEL ??
      null,

    promptVersion: "1.0.0",
    maxRefinementIterations: 3,

    specifications:
      specifications.map(
        (specification) => ({
          id: specification.id,
          name: specification.name,
        }),
      ),

    workflows: [
      ...EXPERIMENT_WORKFLOWS,
    ],
  };
}

export function buildRunPlan(
  configuration,
) {
  const runs = [];
  let sequence = 1;

  for (
    let repetition = 1;
    repetition <=
    configuration.repetitions;
    repetition += 1
  ) {
    for (
      const specification of
      configuration.specifications
    ) {
      for (
        const workflow of
        configuration.workflows
      ) {
        runs.push({
          experimentRunId:
            `${specification.id}__` +
            `${workflow}__` +
            `${repetition}`,

          sequence,
          specification,
          workflow,
          repetition,

          status: "pending",
          attemptCount: 0,

          startedAt: null,
          completedAt: null,

          runId: null,

          resultClassification:
            null,

          failureType: null,
          failureStage: null,
          error: null,

          responseFile: null,
        });

        sequence += 1;
      }
    }
  }

  return runs;
}

export function printExperimentHelp() {
  console.log(`
Usage:
  npm run experiment -- 1
  npm run experiment -- --repetitions=1
  npm run experiment -- --experiment-id=EXISTING_ID
  npm run experiment -- --experiment-id=EXISTING_ID --retry-failed

Options:
  --repetitions, -n
      Number of repetitions for each specification/workflow combination.

  --experiment-id
      Resume an existing experiment.

  --base-url
      Server URL. Default: http://localhost:<PORT or 3001>

  --temperature
      Generation temperature. Default: 0

  --retry-failed
      Reset failed runs to pending before resuming.

  --help, -h
      Show this help.

The Express server must already be running because runtime and functional
validation load generated applications through its static /generated-apps route.
`.trim());
}