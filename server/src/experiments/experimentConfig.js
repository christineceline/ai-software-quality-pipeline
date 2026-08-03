import { randomUUID } from "node:crypto";
import { specifications } from "../specifications/index.js";

export const EXPERIMENT_WORKFLOWS = [
  "one-shot",
  "quality-focused",
  "automated-refinement",
];

function parsePositiveInteger(value, name) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `${name} must be an integer greater than or equal to 1.`,
    );
  }

  return parsed;
}

function parseNonNegativeInteger(value, name) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `${name} must be a non-negative integer.`,
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
    const exactIndex = args.indexOf(name);

    if (exactIndex !== -1) {
      const value = args[exactIndex + 1];

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

    const prefix = `${name}=`;
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
  return (
    args.find(
      (argument) =>
        !argument.startsWith("-"),
    ) ?? null
  );
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let value = state;

    value =
      Math.imul(
        value ^ (value >>> 15),
        value | 1,
      );

    value ^=
      value +
      Math.imul(
        value ^ (value >>> 7),
        value | 61,
      );

    return (
      (value ^ (value >>> 14)) >>> 0
    ) / 4294967296;
  };
}

function shuffleRuns(runs, seed) {
  const random = createSeededRandom(seed);
  const shuffled = [...runs];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const replacementIndex =
      Math.floor(
        random() * (index + 1),
      );

    [
      shuffled[index],
      shuffled[replacementIndex],
    ] = [
      shuffled[replacementIndex],
      shuffled[index],
    ];
  }

  return shuffled.map(
    (run, index) => ({
      ...run,
      sequence: index + 1,
    }),
  );
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

  const seedValue =
    getArgumentValue(
      args,
      "--seed",
    ) ??
    process.env.EXPERIMENT_SEED ??
    "77077";

  return {
    help:
      args.includes("--help") ||
      args.includes("-h"),

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

    seed:
      parseNonNegativeInteger(
        seedValue,
        "seed",
      ),

    retryFailed:
      args.includes(
        "--retry-failed",
      ),
  };
}

export function buildExperimentConfiguration({
  experimentId,
  repetitions,
  baseUrl,
  temperature,
  seed,
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
    runOrder: "seeded-random",
    randomSeed: seed,
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

          sequence: null,
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
      }
    }
  }

  return shuffleRuns(
    runs,
    configuration.randomSeed,
  );
}

export function printExperimentHelp() {
  console.log(`
Usage:
  npm run experiment -- 1
  npm run experiment -- --repetitions=1
  npm run experiment -- --repetitions=10 --seed=77077
  npm run experiment -- --experiment-id=EXISTING_ID
  npm run experiment -- --experiment-id=EXISTING_ID --retry-failed

Options:
  --repetitions, -n
      Number of repetitions for each specification/workflow combination.

  --seed
      Integer seed used to randomise run order reproducibly.
      Default: 77077

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
