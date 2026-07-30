async function getQuestionGroups(page) {
  const radios = page.locator('input[type="radio"]');

  const names = await radios.evaluateAll((elements) => [
    ...new Set(
      elements
        .map((element) => element.name)
        .filter(Boolean),
    ),
  ]);

  return names;
}

async function answerAllQuestions(page) {
  const questionNames = await getQuestionGroups(page);

  for (const name of questionNames) {
    await page
      .locator(`input[type="radio"][name="${name}"]`)
      .first()
      .check();
  }
}

function getSubmitButton(page) {
  return page
    .getByRole("button", {
      name: /submit|finish|complete|check answers/i,
    })
    .first();
}

export const quizFunctionalTests = [
  {
    id: "quiz-question-count",
    requirement:
      "Include three multiple-choice questions.",

    async run(page) {
      const questionNames = await getQuestionGroups(page);

      if (questionNames.length !== 3) {
        throw new Error(
          `Expected 3 questions but found ${questionNames.length}.`,
        );
      }

      for (const name of questionNames) {
        const options = page.locator(
          `input[type="radio"][name="${name}"]`,
        );

        if ((await options.count()) < 2) {
          throw new Error(
            `Question "${name}" does not contain multiple answer choices.`,
          );
        }
      }
    },
  },

  {
    id: "quiz-single-page",
    requirement:
      "Display all questions on a single page.",

    async run(page) {
      const questionNames = await getQuestionGroups(page);

      if (questionNames.length !== 3) {
        throw new Error(
          `Expected all 3 questions to be present, but found ${questionNames.length}.`,
        );
      }

      for (const name of questionNames) {
        const firstOption = page
          .locator(`input[type="radio"][name="${name}"]`)
          .first();

        if (!(await firstOption.isVisible())) {
          throw new Error(
            `Question "${name}" is not visible on the page.`,
          );
        }
      }
    },
  },

  {
    id: "quiz-select-answers",
    requirement:
      "Allow the user to select one answer for each question.",

    async run(page) {
      const questionNames = await getQuestionGroups(page);

      if (questionNames.length !== 3) {
        throw new Error(
          `Expected 3 questions but found ${questionNames.length}.`,
        );
      }

      for (const name of questionNames) {
        const option = page
          .locator(`input[type="radio"][name="${name}"]`)
          .first();

        await option.check();

        if (!(await option.isChecked())) {
          throw new Error(
            `Unable to select an answer for question "${name}".`,
          );
        }
      }
    },
  },

  {
    id: "quiz-submit",
    requirement:
      "Provide a button to submit the answers.",

    async run(page) {
      const submitButton = getSubmitButton(page);

      if (
        (await submitButton.count()) === 0 ||
        !(await submitButton.isVisible())
      ) {
        throw new Error(
          "Visible quiz submission button was not found.",
        );
      }
    },
  },

  {
    id: "quiz-final-score",
    requirement:
      "Display the final score on the page when the quiz is completed and submitted.",

    async run(page) {
      await answerAllQuestions(page);

      const submitButton = getSubmitButton(page);

      if ((await submitButton.count()) === 0) {
        throw new Error(
          "Quiz submission button was not found.",
        );
      }

      if (!(await submitButton.isEnabled())) {
        throw new Error(
          "The quiz submission button remained disabled after answers were selected.",
        );
      }

      await submitButton.click();

      const score = page
        .getByText(
          /(?:score|result|correct).*(?:\d+)|(?:\d+).*(?:score|correct)|\d+\s*(?:\/|out of)\s*3/i,
        )
        .first();

      try {
        await score.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The final score was not displayed on the page after the completed quiz was submitted.",
        );
      }
    },
  },

  {
    id: "quiz-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const questionNames = await getQuestionGroups(page);

      if (questionNames.length === 0) {
        throw new Error(
          "No quiz questions were found.",
        );
      }

      const firstOption = page
        .locator(
          `input[type="radio"][name="${questionNames[0]}"]`,
        )
        .first();

      await firstOption.check();

      const browser = page.context().browser();

      if (!browser) {
        throw new Error(
          "Unable to access browser for session-memory test.",
        );
      }

      const freshContext = await browser.newContext();

      try {
        const freshPage = await freshContext.newPage();

        await freshPage.goto(page.url(), {
          waitUntil: "load",
        });

        const checkedAnswers = freshPage.locator(
          'input[type="radio"]:checked',
        );

        if ((await checkedAnswers.count()) > 0) {
          throw new Error(
            "Quiz answer state persisted into a fresh browser context.",
          );
        }
      } finally {
        await freshContext.close();
      }
    },
  },
];