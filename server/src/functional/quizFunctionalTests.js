async function getQuestionGroups(page) {
  const radios = page.locator('input[type="radio"]');

  return radios.evaluateAll((elements) => [
    ...new Set(
      elements
        .map((element) => element.name)
        .filter(Boolean),
    ),
  ]);
}

async function getThreeQuestions(page) {
  const questionNames =
    await getQuestionGroups(page);

  if (questionNames.length !== 3) {
    throw new Error(
      `The quiz should contain exactly 3 multiple-choice questions, but ${questionNames.length} were found.`,
    );
  }

  return questionNames;
}

async function selectAnswer(page, name) {
  const option = page
    .locator(
      `input[type="radio"][name="${name}"]`,
    )
    .first();

  if ((await option.count()) === 0) {
    throw new Error(
      `No selectable answer was found for question "${name}".`,
    );
  }

  try {
    await option.check();
  } catch {
    throw new Error(
      `An answer could not be selected for question "${name}".`,
    );
  }

  if (!(await option.isChecked())) {
    throw new Error(
      `Selecting an answer for question "${name}" did not update its selected state.`,
    );
  }
}

async function answerAllQuestions(page) {
  const questionNames =
    await getThreeQuestions(page);

  for (const name of questionNames) {
    await selectAnswer(page, name);
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
      const questionNames =
        await getThreeQuestions(page);

      for (const name of questionNames) {
        const options = page.locator(
          `input[type="radio"][name="${name}"]`,
        );

        const optionCount =
          await options.count();

        if (optionCount < 2) {
          throw new Error(
            `Question "${name}" has ${optionCount} answer option(s); at least 2 are required for multiple choice.`,
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
      const questionNames =
        await getThreeQuestions(page);

      for (const name of questionNames) {
        const firstOption = page
          .locator(
            `input[type="radio"][name="${name}"]`,
          )
          .first();

        let visible = false;

        try {
          visible =
            await firstOption.isVisible();
        } catch {
          visible = false;
        }

        if (!visible) {
          throw new Error(
            `Question "${name}" was present but not visible on the page.`,
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
      const questionNames =
        await getThreeQuestions(page);

      for (const name of questionNames) {
        await selectAnswer(page, name);
      }
    },
  },

  {
    id: "quiz-submit",
    requirement:
      "Provide a button to submit the answers.",

    async run(page) {
      const submitButton =
        getSubmitButton(page);

      if ((await submitButton.count()) === 0) {
        throw new Error(
          "No quiz submission button was found.",
        );
      }

      if (!(await submitButton.isVisible())) {
        throw new Error(
          "The quiz submission button was present but not visible.",
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

      const submitButton =
        getSubmitButton(page);

      if ((await submitButton.count()) === 0) {
        throw new Error(
          "No quiz submission button was found.",
        );
      }

      if (!(await submitButton.isEnabled())) {
        throw new Error(
          "The quiz submission button remained disabled after all questions were answered.",
        );
      }

      try {
        await submitButton.click();
      } catch {
        throw new Error(
          "The completed quiz could not be submitted.",
        );
      }

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
          "The final score was not displayed after the completed quiz was submitted.",
        );
      }

      const firstScoreText =
        await score.textContent();

      const firstMatch =
        firstScoreText?.match(
          /(\d+)\s*(?:\/|out of)\s*3/i,
        );

      if (!firstMatch) {
        throw new Error(
          "A score was displayed, but it was not in a recognisable 0–3 format.",
        );
      }

      const firstScore =
        Number(firstMatch[1]);

      if (
        firstScore < 0 ||
        firstScore > 3
      ) {
        throw new Error(
          `The displayed score ${firstScore}/3 is outside the valid range of 0–3.`,
        );
      }

      try {
        await submitButton.click();
      } catch {
        throw new Error(
          "The quiz could not be submitted a second time to verify score stability.",
        );
      }

      await page.waitForTimeout(200);

      const secondScoreText =
        await score.textContent();

      const secondMatch =
        secondScoreText?.match(
          /(\d+)\s*(?:\/|out of)\s*3/i,
        );

      if (!secondMatch) {
        throw new Error(
          "The final score was no longer displayed correctly after repeated submission.",
        );
      }

      const secondScore =
        Number(secondMatch[1]);

      if (secondScore !== firstScore) {
        throw new Error(
          `The score changed from ${firstScore}/3 to ${secondScore}/3 even though the answers did not change.`,
        );
      }
    },
  },

  {
    id: "quiz-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const questionNames =
        await getThreeQuestions(page);

      await selectAnswer(
        page,
        questionNames[0],
      );

      const browser =
        page.context().browser();

      if (!browser) {
        throw new Error(
          "Unable to open a fresh browser session for the storage test.",
        );
      }

      const freshContext =
        await browser.newContext();

      try {
        const freshPage =
          await freshContext.newPage();

        try {
          await freshPage.goto(page.url(), {
            waitUntil: "load",
          });
        } catch {
          throw new Error(
            "The application could not be loaded in a fresh browser session for the storage test.",
          );
        }

        const checkedAnswers =
          freshPage.locator(
            'input[type="radio"]:checked',
          );

        if (
          (await checkedAnswers.count()) > 0
        ) {
          throw new Error(
            "Selected quiz answers persisted into a fresh browser session instead of remaining session-only.",
          );
        }
      } finally {
        await freshContext.close();
      }
    },
  },
];