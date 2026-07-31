async function getQuestionGroups(page) {
  const radios = page.locator(
    'input[type="radio"][name]',
  );

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

async function getVisibleOptionControl(
  page,
  option,
) {
  /*
   * Directly visible radio input.
   */
  if (await option.isVisible()) {
    return option;
  }

  /*
   * Visually hidden radio controlled by
   * label[for="..."].
   */
  const optionId =
    await option.getAttribute("id");

  if (optionId) {
    const associatedLabel = page
      .locator(
        `label[for="${optionId}"]`,
      )
      .first();

    if (
      (await associatedLabel.count()) > 0 &&
      (await associatedLabel.isVisible())
    ) {
      return associatedLabel;
    }
  }

  /*
   * Radio nested inside a visible label.
   */
  const wrappingLabel = option
    .locator(
      "xpath=ancestor::label[1]",
    )
    .first();

  if (
    (await wrappingLabel.count()) > 0 &&
    (await wrappingLabel.isVisible())
  ) {
    return wrappingLabel;
  }

  return null;
}

async function selectAnswer(
  page,
  name,
) {
  const options = page.locator(
    `input[type="radio"][name="${name}"]`,
  );

  if ((await options.count()) < 2) {
    throw new Error(
      `Question "${name}" does not contain at least two selectable answer options.`,
    );
  }

  const option = options.first();

  const visibleControl =
    await getVisibleOptionControl(
      page,
      option,
    );

  if (!visibleControl) {
    throw new Error(
      `No visible answer control was found for question "${name}".`,
    );
  }

  try {
    if (await option.isVisible()) {
      await option.check();
    } else {
      await visibleControl.click();
    }
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

  /*
   * Verify that selecting one answer does not
   * result in multiple answers being selected
   * within the same question.
   */
  const checkedOptions = page.locator(
    `input[type="radio"][name="${name}"]:checked`,
  );

  if ((await checkedOptions.count()) !== 1) {
    throw new Error(
      `Question "${name}" did not maintain exactly one selected answer.`,
    );
  }
}

async function answerAllQuestions(page) {
  const questionNames =
    await getThreeQuestions(page);

  for (const name of questionNames) {
    await selectAnswer(
      page,
      name,
    );
  }
}

function getSubmitControl(page) {
  return page
    .getByRole("button", {
      name:
        /submit|finish|complete|check answers|check|score|show result/i,
    })
    .or(
      page.locator(
        'input[type="submit"]',
      ),
    )
    .first();
}

function extractScore(text) {
  if (!text) {
    return null;
  }

  const patterns = [
    /(\d+)\s*\/\s*3/i,
    /(\d+)\s*out of\s*3/i,

    /(?:score|scored|result)[^\d]*(\d+)/i,

    /(\d+)[^\d]*(?:correct)/i,

    /(?:correct)[^\d]*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match =
      text.match(pattern);

    if (!match) {
      continue;
    }

    const score =
      Number(match[1]);

    if (
      Number.isInteger(score) &&
      score >= 0 &&
      score <= 3
    ) {
      return score;
    }
  }

  return null;
}

async function findDisplayedScore(page) {
  /*
   * Search visible page content rather than requiring
   * a particular result element/class/id.
   */
  const candidates = page.locator(
    "body *",
  );

  const count =
    await candidates.count();

  for (
    let index = 0;
    index < count;
    index++
  ) {
    const candidate =
      candidates.nth(index);

    if (!(await candidate.isVisible())) {
      continue;
    }

    /*
     * Only inspect leaf-ish elements to avoid
     * repeatedly matching the whole page/container.
     */
    if (
      (await candidate.locator(
        ":scope > *",
      ).count()) > 0
    ) {
      continue;
    }

    const text =
      (await candidate.textContent())
        ?.trim();

    const score =
      extractScore(text);

    if (score !== null) {
      return {
        locator: candidate,
        score,
        text,
      };
    }
  }

  return null;
}

export const quizFunctionalTests = [
  {
    id: "quiz-question-count",

    requirement:
      "Include exactly three multiple-choice questions, with at least two answer options for each question.",

    async run(page) {
      const questionNames =
        await getThreeQuestions(page);

      for (
        const name of questionNames
      ) {
        const options = page.locator(
          `input[type="radio"][name="${name}"]`,
        );

        const optionCount =
          await options.count();

        if (optionCount < 2) {
          throw new Error(
            `Question "${name}" contains ${optionCount} answer option(s); at least 2 are required.`,
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
      const questionNames =
        await getThreeQuestions(page);

      for (
        const name of questionNames
      ) {
        const options = page.locator(
          `input[type="radio"][name="${name}"]`,
        );

        let visibleOptionCount = 0;

        for (
          let index = 0;
          index < await options.count();
          index++
        ) {
          const control =
            await getVisibleOptionControl(
              page,
              options.nth(index),
            );

          if (control) {
            visibleOptionCount += 1;
          }
        }

        if (visibleOptionCount < 2) {
          throw new Error(
            `Question "${name}" did not display at least two visible answer options on the page.`,
          );
        }
      }
    },
  },

  {
    id: "quiz-select-answers",

    requirement:
      "Allow the user to select exactly one answer for each question.",

    async run(page) {
      const questionNames =
        await getThreeQuestions(page);

      for (
        const name of questionNames
      ) {
        await selectAnswer(
          page,
          name,
        );
      }

      const totalChecked =
        await page
          .locator(
            'input[type="radio"]:checked',
          )
          .count();

      if (totalChecked !== 3) {
        throw new Error(
          `Expected one selected answer for each of 3 questions, but ${totalChecked} selected answers were found.`,
        );
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
        (await submitControl.count()) ===
          0 ||
        !(await submitControl.isVisible())
      ) {
        throw new Error(
          "No visible quiz submission control was found.",
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

      const submitControl =
        getSubmitControl(page);

      if (
        (await submitControl.count()) ===
        0
      ) {
        throw new Error(
          "No quiz submission control was found.",
        );
      }

      if (
        !(await submitControl.isVisible())
      ) {
        throw new Error(
          "The quiz submission control was not visible.",
        );
      }

      if (
        !(await submitControl.isEnabled())
      ) {
        throw new Error(
          "The quiz submission control remained disabled after all questions were answered.",
        );
      }

      try {
        await submitControl.click();
      } catch {
        throw new Error(
          "The completed quiz could not be submitted.",
        );
      }

      await page.waitForTimeout(200);

      const firstResult =
        await findDisplayedScore(page);

      if (!firstResult) {
        throw new Error(
          "A valid final score between 0 and 3 was not displayed after the completed quiz was submitted.",
        );
      }
    },
  },

  {
    id: "quiz-score-stability",

    requirement:
      "Repeated submission, if the application still permits it, must not accumulate or otherwise change the score unless the selected answers change.",

    async run(page) {
      await answerAllQuestions(page);

      const submitControl =
        getSubmitControl(page);

      if (
        (await submitControl.count()) ===
          0 ||
        !(await submitControl.isVisible()) ||
        !(await submitControl.isEnabled())
      ) {
        throw new Error(
          "The completed quiz could not be submitted for the score-stability test.",
        );
      }

      await submitControl.click();

      await page.waitForTimeout(200);

      const firstResult =
        await findDisplayedScore(page);

      if (!firstResult) {
        throw new Error(
          "No valid score was displayed after the first submission.",
        );
      }

      /*
       * Re-query because the application may replace
       * or remove the original submission control.
       */
      const secondSubmitControl =
        getSubmitControl(page);

      const canSubmitAgain =
        (await secondSubmitControl.count()) >
          0 &&
        await secondSubmitControl
          .isVisible()
          .catch(() => false) &&
        await secondSubmitControl
          .isEnabled()
          .catch(() => false);

      /*
       * Removing, hiding or disabling the submission
       * control is a valid way to prevent accidental
       * repeated submission.
       */
      if (!canSubmitAgain) {
        return;
      }

      try {
        await secondSubmitControl.click();
      } catch {
        throw new Error(
          "The submission control remained visible and enabled but could not be activated a second time.",
        );
      }

      await page.waitForTimeout(200);

      const secondResult =
        await findDisplayedScore(page);

      if (!secondResult) {
        throw new Error(
          "The final score was no longer displayed correctly after repeated submission.",
        );
      }

      if (
        secondResult.score !==
        firstResult.score
      ) {
        throw new Error(
          `The score changed from ${firstResult.score}/3 to ${secondResult.score}/3 even though the selected answers did not change.`,
        );
      }
    },
  },

  {
    id: "quiz-session-memory",

    requirement:
      "Keep quiz selections and results in page memory only. Refreshing or reopening the page must reset the quiz state.",

    async run(page) {
      const questionNames =
        await getThreeQuestions(page);

      await selectAnswer(
        page,
        questionNames[0],
      );

      /*
       * Reload in the same browser context so
       * localStorage/sessionStorage persistence is
       * detected rather than hidden by creating an
       * entirely new context.
       */
      await page.reload({
        waitUntil: "load",
      });

      const checkedAnswers =
        page.locator(
          'input[type="radio"]:checked',
        );

      if (
        (await checkedAnswers.count()) > 0
      ) {
        throw new Error(
          "Selected quiz answers persisted after the page was refreshed instead of being kept only in page memory.",
        );
      }

      /*
       * A previous final result should not remain
       * visible after reload either.
       */
      const resultAfterReload =
        await findDisplayedScore(page);

      if (resultAfterReload) {
        throw new Error(
          "A quiz result remained visible after the page was refreshed instead of resetting.",
        );
      }
    },
  },
];