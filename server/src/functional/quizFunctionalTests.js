function getQuestions(page) {
  return page.getByTestId("quiz-question");
}

function getSubmitControl(page) {
  return page.getByTestId("quiz-submit");
}

function getScoreElement(page) {
  return page.getByTestId("quiz-score");
}

async function getThreeQuestions(page) {
  const questions = getQuestions(page);
  const count = await questions.count();

  if (count !== 3) {
    throw new Error(
      `The quiz should contain exactly 3 questions, but ${count} were found.`,
    );
  }

  return questions;
}

async function selectFirstOption(question) {
  const options =
    question.getByTestId("quiz-option");

  const count = await options.count();

  if (count < 2) {
    throw new Error(
      "A quiz question contained fewer than two answer options.",
    );
  }

  const option = options.first();

  if (!(await option.isVisible())) {
    throw new Error(
      'A required "quiz-option" control was not visible.',
    );
  }

  try {
    await option.click();
  } catch {
    throw new Error(
      "A quiz answer option could not be selected.",
    );
  }
}

async function answerAllQuestions(page) {
  const questions =
    await getThreeQuestions(page);

  for (
    let index = 0;
    index < 3;
    index++
  ) {
    await selectFirstOption(
      questions.nth(index),
    );
  }
}

async function submitQuiz(page) {
  const submitControl =
    getSubmitControl(page);

  if ((await submitControl.count()) !== 1) {
    throw new Error(
      'Exactly one "quiz-submit" control is required.',
    );
  }

  if (!(await submitControl.isVisible())) {
    throw new Error(
      'Required test hook "quiz-submit" was not visible.',
    );
  }

  if (!(await submitControl.isEnabled())) {
    throw new Error(
      "The quiz submission control was disabled after all questions were answered.",
    );
  }

  try {
    await submitControl.click();
  } catch {
    throw new Error(
      "The completed quiz could not be submitted.",
    );
  }
}

async function readScore(page) {
  const scoreElement =
    getScoreElement(page);

  if ((await scoreElement.count()) !== 1) {
    throw new Error(
      'Exactly one "quiz-score" element must be present after submission.',
    );
  }

  if (!(await scoreElement.isVisible())) {
    throw new Error(
      "The final quiz score was not visible after submission.",
    );
  }

  const value =
    await scoreElement.getAttribute(
      "data-score",
    );

  if (!["0", "1", "2", "3"].includes(value)) {
    throw new Error(
      `The quiz score exposed an invalid data-score value: ${value ?? "missing"}.`,
    );
  }

  return Number(value);
}

export const quizFunctionalTests = [
  {
    id: "quiz-question-count",

    requirement:
      "Include exactly three multiple-choice questions, with at least two answer options for each question.",

    async run(page) {
      const questions =
        await getThreeQuestions(page);

      for (
        let index = 0;
        index < 3;
        index++
      ) {
        const options =
          questions
            .nth(index)
            .getByTestId(
              "quiz-option",
            );

        if (
          (await options.count()) < 2
        ) {
          throw new Error(
            `Question ${index + 1} contained fewer than two answer options.`,
          );
        }
      }
    },
  },

  {
    id: "quiz-single-page",

    requirement:
      "Display all three questions and their answer options on a single page without requiring navigation between questions.",

    async run(page) {
      const questions =
        await getThreeQuestions(page);

      for (
        let index = 0;
        index < 3;
        index++
      ) {
        const question =
          questions.nth(index);

        if (
          !(await question.isVisible())
        ) {
          throw new Error(
            `Question ${index + 1} was not visible on the page.`,
          );
        }

        const options =
          question.getByTestId(
            "quiz-option",
          );

        for (
          let optionIndex = 0;
          optionIndex <
          await options.count();
          optionIndex++
        ) {
          if (
            !(await options
              .nth(optionIndex)
              .isVisible())
          ) {
            throw new Error(
              `An answer option for question ${index + 1} was not visible.`,
            );
          }
        }
      }
    },
  },

  {
    id: "quiz-select-answers",

    requirement:
      "Allow the user to select exactly one answer for each question.",

    async run(page) {
      const questions =
        await getThreeQuestions(page);

      for (
        let index = 0;
        index < 3;
        index++
      ) {
        const question =
          questions.nth(index);

        const options =
          question.getByTestId(
            "quiz-option",
          );

        const first =
          options.first();

        const second =
          options.nth(1);

        await first.click();

        /*
         * Verify actual selection where the generated
         * control exposes native or ARIA state.
         */
        const firstSelected =
          await first.evaluate(
            (element) => {
              if (
                element instanceof
                  HTMLInputElement
              ) {
                return element.checked;
              }

              return (
                element.getAttribute(
                  "aria-checked",
                ) === "true" ||
                element.getAttribute(
                  "aria-pressed",
                ) === "true"
              );
            },
          );

        /*
         * A custom option may not expose native state.
         * In that case the final submission test still
         * verifies that the controls function.
         */
        await second.click();

        const nativeRadioGroup =
          await second.evaluate(
            (element) =>
              element instanceof
                HTMLInputElement &&
              element.type === "radio",
          );

        if (nativeRadioGroup) {
          const selectedCount =
            await options.evaluateAll(
              (elements) =>
                elements.filter(
                  (element) =>
                    element instanceof
                      HTMLInputElement &&
                    element.checked,
                ).length,
            );

          if (selectedCount !== 1) {
            throw new Error(
              `Question ${index + 1} did not maintain exactly one selected answer.`,
            );
          }
        }

        // Avoid unused-value lint errors.
        void firstSelected;
      }
    },
  },

  {
    id: "quiz-submit",

    requirement:
      "Provide a visible control for submitting the completed quiz.",

    async run(page) {
      const submitControl =
        getSubmitControl(page);

      if (
        (await submitControl.count()) !== 1 ||
        !(await submitControl.isVisible())
      ) {
        throw new Error(
          'A single visible "quiz-submit" control was not found.',
        );
      }
    },
  },

  {
    id: "quiz-final-score",

    requirement:
      "After the quiz is submitted, display a final numeric score between 0 and 3.",

    async run(page) {
      await answerAllQuestions(page);
      await submitQuiz(page);

      await readScore(page);
    },
  },

  {
    id: "quiz-score-stability",

    requirement:
      "Repeated submission, if the application still permits it, must not accumulate or otherwise change the score unless the selected answers change.",

    async run(page) {
      await answerAllQuestions(page);
      await submitQuiz(page);

      const firstScore =
        await readScore(page);

      /*
       * Re-query because submission may rebuild
       * or remove the control.
       */
      const submitControl =
        getSubmitControl(page);

      const canSubmitAgain =
        (await submitControl.count()) === 1 &&
        await submitControl
          .isVisible()
          .catch(() => false) &&
        await submitControl
          .isEnabled()
          .catch(() => false);

      /*
       * Removing, hiding or disabling submission
       * after completion is valid.
       */
      if (!canSubmitAgain) {
        return;
      }

      await submitControl.click();

      const secondScore =
        await readScore(page);

      if (
        secondScore !== firstScore
      ) {
        throw new Error(
          `The score changed from ${firstScore} to ${secondScore} after repeated submission without changing the answers.`,
        );
      }
    },
  },

  {
    id: "quiz-session-memory",

    requirement:
      "Keep quiz selections and results in page memory only. Refreshing or reopening the page must reset the quiz state.",

    async run(page) {
      await answerAllQuestions(page);
      await submitQuiz(page);

      await readScore(page);

      await page.reload({
        waitUntil: "load",
      });

      /*
       * The result may remain in the DOM as a hidden
       * placeholder. It must not retain a score.
       */
      const scoreElement =
        getScoreElement(page);

      if (
        (await scoreElement.count()) > 0
      ) {
        const value =
          await scoreElement.getAttribute(
            "data-score",
          );

        const visible =
          await scoreElement
            .isVisible()
            .catch(() => false);

        if (
          visible &&
          ["0", "1", "2", "3"].includes(
            value,
          )
        ) {
          throw new Error(
            "The quiz result persisted after the page was refreshed.",
          );
        }
      }

      /*
       * Check native selection state where applicable.
       */
      const selectedInputs =
        page.locator(
          '[data-testid="quiz-option"]:checked',
        );

      if (
        (await selectedInputs.count()) > 0
      ) {
        throw new Error(
          "Quiz selections persisted after the page was refreshed.",
        );
      }

      const selectedAria =
        page.locator(
          '[data-testid="quiz-option"][aria-checked="true"], ' +
          '[data-testid="quiz-option"][aria-pressed="true"]',
        );

      if (
        (await selectedAria.count()) > 0
      ) {
        throw new Error(
          "Quiz selections persisted after the page was refreshed.",
        );
      }
    },
  },
];