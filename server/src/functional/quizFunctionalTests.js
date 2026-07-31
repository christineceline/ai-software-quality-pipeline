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
  if (await option.isVisible()) {
    return option;
  }

  const optionId =
    await option.getAttribute("id");

  if (optionId) {
    const label = page
      .locator(`label[for="${optionId}"]`)
      .first();

    if (
      (await label.count()) > 0 &&
      (await label.isVisible())
    ) {
      return label;
    }
  }

  const wrappingLabel = option
    .locator("xpath=ancestor::label[1]")
    .first();

  if (
    (await wrappingLabel.count()) > 0 &&
    (await wrappingLabel.isVisible())
  ) {
    return wrappingLabel;
  }

  return null;
}

async function selectAnswer(page, name) {
  const options = page.locator(
    `input[type="radio"][name="${name}"]`,
  );

  if ((await options.count()) === 0) {
    throw new Error(
      `No selectable answers were found for question "${name}".`,
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
      name: /submit|finish|complete|check answers|check|score/i,
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
    /(?:score|scored|result|correct)[^\d]*(\d+)/i,
    /(\d+)[^\d]*(?:correct)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

async function findScore(page) {
  const candidates = page.getByText(
    /score|scored|result|correct|\d+\s*\/\s*3|\d+\s*out of\s*3/i,
  );

  const count = await candidates.count();

  for (let index = 0; index < count; index++) {
    const candidate =
      candidates.nth(index);

    if (!(await candidate.isVisible())) {
      continue;
    }

    const text =
      await candidate.textContent();

    const score = extractScore(text);

    if (
      score !== null &&
      score >= 0 &&
      score <= 3
    ) {
      return {
        locator: candidate,
        score,
      };
    }
  }

  return null;
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

        if ((await options.count()) < 2) {
          throw new Error(
            `Question "${name}" does not contain at least two answer options.`,
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
        const options = page.locator(
          `input[type="radio"][name="${name}"]`,
        );

        let hasVisibleOption = false;

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
            hasVisibleOption = true;
            break;
          }
        }

        if (!hasVisibleOption) {
          throw new Error(
            `Question "${name}" did not have a visible answer option on the page.`,
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

      if (
        (await submitButton.count()) === 0 ||
        !(await submitButton.isVisible())
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
      "Display the final score on the page when the quiz is completed and submitted.",

    async run(page) {
      await answerAllQuestions(page);

      const submitButton =
        getSubmitButton(page);

      if (
        (await submitButton.count()) === 0 ||
        !(await submitButton.isEnabled())
      ) {
        throw new Error(
          "The completed quiz could not be submitted.",
        );
      }

      await submitButton.click();

      await page.waitForTimeout(200);

      const firstResult =
        await findScore(page);

      if (!firstResult) {
        throw new Error(
          "A valid final score between 0 and 3 was not displayed after submission.",
        );
      }

      const submitStillAvailable =
        (await submitButton.count()) > 0 &&
        await submitButton
          .isVisible()
          .catch(() => false) &&
        await submitButton
          .isEnabled()
          .catch(() => false);

      if (!submitStillAvailable) {
        return;
      }

      await submitButton.click();

      await page.waitForTimeout(200);

      const secondResult =
        await findScore(page);

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
          `The score changed from ${firstResult.score}/3 to ${secondResult.score}/3 when the quiz was submitted again.`,
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
          "Selected answers persisted after the page was reloaded.",
        );
      }
    },
  },
];