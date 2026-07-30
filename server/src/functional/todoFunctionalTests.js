async function getTaskInput(page) {
  return page
    .getByRole("textbox")
    .or(page.locator('input[type="text"]'))
    .first();
}

async function getAddButton(page) {
  return page
    .getByRole("button", {
      name: /add|create|submit/i,
    })
    .first();
}

async function addTask(page, taskText) {
  const input = await getTaskInput(page);
  const addButton = await getAddButton(page);

  await input.fill(taskText);
  await addButton.click();

    const task = getTaskContainer(page, taskText);

    try {
      await task.waitFor({
        state: "visible",
        timeout: 3000,
      });
    } catch {
      throw new Error(
        "The task was not displayed after it was submitted.",
      );
    }
}

function getTaskContainer(page, taskText) {
  return page
    .locator("li")
    .filter({
      hasText: taskText,
    })
    .or(
      page
        .locator('[class*="task"], [class*="todo"]')
        .filter({
          hasText: taskText,
        }),
    )
    .first();
}

async function isTaskCompleted(task) {
  return task.evaluate((element) => {
    const elements = [
      element,
      ...element.querySelectorAll("*"),
    ];

    return elements.some((candidate) => {
      const className =
        typeof candidate.className === "string"
          ? candidate.className.toLowerCase()
          : "";

      const ariaChecked =
        candidate.getAttribute("aria-checked");

      const ariaPressed =
        candidate.getAttribute("aria-pressed");

      const textDecoration =
        window.getComputedStyle(candidate)
          .textDecorationLine;

      const isCheckedCheckbox =
        candidate instanceof HTMLInputElement &&
        candidate.type === "checkbox" &&
        candidate.checked;

      return (
        isCheckedCheckbox ||
        className.includes("completed") ||
        className.includes("complete") ||
        className.includes("done") ||
        ariaChecked === "true" ||
        ariaPressed === "true" ||
        textDecoration.includes("line-through")
      );
    });
  });
}

async function completeTask(page, taskText) {
  const task = getTaskContainer(page, taskText);

  const checkbox = task
    .getByRole("checkbox")
    .or(task.locator('input[type="checkbox"]'))
    .first();

  if ((await checkbox.count()) > 0) {
    await checkbox.click();
  } else {
    const completeButton = task
      .getByRole("button", {
        name: /complete|done|finish/i,
      })
      .first();

    if ((await completeButton.count()) > 0) {
      await completeButton.click();
    } else {
      const taskTextElement = task
        .getByText(taskText, {
          exact: true,
        })
        .first();

      if ((await taskTextElement.count()) === 0) {
        throw new Error(
          "No usable way to interact with the task for completion.",
        );
      }

      await taskTextElement.click();
    }
  }

  await page.waitForTimeout(100);

  if (!(await isTaskCompleted(task))) {
    throw new Error(
      "The task did not expose a completed state after completion was attempted.",
    );
  }
}

export const todoFunctionalTests = [
  {
    id: "todo-add-task",
    requirement:
      "Allow the user to add a task using a text input and submit button, and display the added task in a visible list.",

    async run(page) {
      const taskText = "Functional test task";

      await addTask(page, taskText);
    },
  },

  {
    id: "todo-reject-empty-task",
    requirement:
      "Prevent empty tasks from being added.",

    async run(page) {
      const input = await getTaskInput(page);
      const addButton = await getAddButton(page);

      const countBefore = await page.locator("li").count();

      await input.fill("   ");
      await addButton.click();

      await page.waitForTimeout(200);

      const countAfter = await page.locator("li").count();

      if (countAfter !== countBefore) {
        throw new Error(
          `Empty task was added. Task count changed from ${countBefore} to ${countAfter}.`,
        );
      }
    },
  },

  {
    id: "todo-complete-task",
    requirement:
      "Allow each task to be marked as completed.",

    async run(page) {
      const taskText = "Task to complete";

      await addTask(page, taskText);
      await completeTask(page, taskText);
    },
  },

  {
    id: "todo-delete-task",
    requirement:
      "Allow each task to be deleted.",

    async run(page) {
      const taskText = "Task to delete";

      await addTask(page, taskText);

      const task = getTaskContainer(page, taskText);

      const deleteButton = task
        .getByRole("button", {
          name: /delete|remove/i,
        })
        .first();

      if ((await deleteButton.count()) === 0) {
        throw new Error(
          "No delete control found for the added task.",
        );
      }

      await deleteButton.click();

      try {
        await task.waitFor({
          state: "detached",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The task remained visible after the delete control was activated.",
        );
      }
    },
  },

  {
    id: "todo-incomplete-count",
    requirement:
      "Display the number of incomplete tasks.",

    async run(page) {
      await addTask(page, "Incomplete task one");
      await addTask(page, "Incomplete task two");

      const countText = page
        .getByText(
          /2\s*(tasks?)?\s*(remaining|left|incomplete|pending)|(?:remaining|left|incomplete|pending).*2/i,
        )
        .first();

      await countText.waitFor({
        state: "visible",
        timeout: 3000,
      });

    await completeTask(
      page,
      "Incomplete task one",
    );

      const updatedCountText = page
        .getByText(
          /1\s*(tasks?)?\s*(remaining|left|incomplete|pending)|(?:remaining|left|incomplete|pending).*1/i,
        )
        .first();

      await updatedCountText.waitFor({
        state: "visible",
        timeout: 3000,
      });
    },
  },

  {
    id: "todo-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const taskText = "Session-only task";

      await addTask(page, taskText);

      const browser = page.context().browser();

      if (!browser) {
        throw new Error(
          "Unable to access browser for session-memory test.",
        );
      }

      const freshContext =
        await browser.newContext();

      try {
        const freshPage =
          await freshContext.newPage();

        await freshPage.goto(page.url(), {
          waitUntil: "load",
        });

        const persistedTask =
          freshPage.getByText(taskText, {
            exact: true,
          });

        if ((await persistedTask.count()) > 0) {
          throw new Error(
            "Task persisted into a fresh browser context.",
          );
        }
      } finally {
        await freshContext.close();
      }
    },
  },
];