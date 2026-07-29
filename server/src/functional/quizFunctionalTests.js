async function selectAnswer(page) {
  const radio = page
    .getByRole("radio")
    .first();

  if ((await radio.count()) > 0) {
    await radio.check();
    return;
  }

  const answerButton = page
    .getByRole("button")
    .filter({
      hasNotText: /next|submit|restart|start again/i,
    })
    .first();

  if ((await answerButton.count()) === 0) {
    throw new Error("No selectable answer found.");
  }

  await answerButton.click();
}

async function getNextButton(page) {
  return page
    .getByRole("button", {
      name: /next|submit|continue/i,
    })
    .first();
}

export const quizFunctionalTests = [
  {
    id: "quiz-answer-question",
    requirement:
      "Allow the user to select one answer for each question.",

    async run(page) {
      await selectAnswer(page);
    },
  },

  {
    id: "quiz-complete-and-score",
    requirement:
      "Display the final score after all questions have been answered.",

    async run(page) {
      for (let question = 0; question < 10; question += 1) {
        const score = page.getByText(
          /score|result|you scored/i,
        );

        if ((await score.count()) > 0) {
          return;
        }

        await selectAnswer(page);

        const nextButton = await getNextButton(page);

        if ((await nextButton.count()) === 0) {
          throw new Error(
            "Quiz could not progress to completion.",
          );
        }

        await nextButton.click();
        await page.waitForTimeout(100);
      }

      throw new Error(
        "Final score was not displayed after completing the quiz.",
      );
    },
  },

  {
    id: "quiz-restart",
    requirement:
      "Allow the user to restart the quiz after completion.",

    async run(page) {
      for (let question = 0; question < 10; question += 1) {
        const restartButton = page.getByRole("button", {
          name: /restart|start again|try again/i,
        });

        if ((await restartButton.count()) > 0) {
          await restartButton.click();

          const score = page.getByText(
            /score|result|you scored/i,
          );

          if (
            (await score.count()) > 0 &&
            await score.first().isVisible()
          ) {
            throw new Error(
              "Quiz remained on the result screen after restart.",
            );
          }

          return;
        }

        await selectAnswer(page);

        const nextButton = await getNextButton(page);

        if ((await nextButton.count()) === 0) {
          throw new Error(
            "Quiz could not reach the restart state.",
          );
        }

        await nextButton.click();
        await page.waitForTimeout(100);
      }

      throw new Error("Restart control was not found.");
    },
  },

  {
    id: "quiz-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      await selectAnswer(page);

      const nextButton = await getNextButton(page);

      if ((await nextButton.count()) > 0) {
        await nextButton.click();
      }

      const browser = page.context().browser();

      if (!browser) {
        throw new Error("Unable to access browser.");
      }

      const freshContext = await browser.newContext();

      try {
        const freshPage = await freshContext.newPage();

        await freshPage.goto(page.url(), {
          waitUntil: "load",
        });

        const result = freshPage.getByText(
          /score|result|you scored/i,
        );

        if (
          (await result.count()) > 0 &&
          await result.first().isVisible()
        ) {
          throw new Error(
            "Quiz state persisted into a fresh browser context.",
          );
        }
      } finally {
        await freshContext.close();
      }
    },
  },
];