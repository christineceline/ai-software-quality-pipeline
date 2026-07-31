function getTaskInput(page) {
  return page.getByTestId("task-input");
}

function getAddControl(page) {
  return page.getByTestId("task-add");
}

function getTaskList(page) {
  return page.getByTestId("task-list");
}

function getIncompleteCount(page) {
  return page.getByTestId("incomplete-count");
}

function getTask(page, taskText) {
  return page
    .getByTestId("task")
    .filter({
      has: page
        .getByTestId("task-text")
        .filter({
          hasText: taskText,
        }),
    });
}

async function addTask(page, taskText) {
  const input = getTaskInput(page);
  const addControl = getAddControl(page);

  if (!(await input.isVisible())) {
    throw new Error(
      'Required test hook "task-input" was not visible.',
    );
  }

  if (!(await addControl.isVisible())) {
    throw new Error(
      'Required test hook "task-add" was not visible.',
    );
  }

  await input.fill(taskText);
  await addControl.click();

  const task = getTask(page, taskText);

  try {
    await task.waitFor({
      state: "visible",
      timeout: 3000,
    });
  } catch {
    throw new Error(
      "The submitted task was not displayed in the task list.",
    );
  }

  return task;
}

async function getCompletedState(task) {
  const value =
    await task.getAttribute(
      "data-completed",
    );

  if (
    value !== "true" &&
    value !== "false"
  ) {
    throw new Error(
      'The task does not expose a valid data-completed="true" or data-completed="false" state.',
    );
  }

  return value === "true";
}

async function readIncompleteCount(page) {
  const countElement =
    getIncompleteCount(page);

  if (!(await countElement.isVisible())) {
    throw new Error(
      'Required test hook "incomplete-count" was not visible.',
    );
  }

  const text =
    (await countElement.textContent()) ?? "";

  const match = text.match(/\d+/);

  if (!match) {
    throw new Error(
      "The incomplete-task count did not contain a numeric value.",
    );
  }

  return Number(match[0]);
}

export const todoFunctionalTests = [
  {
    id: "todo-add-task",

    requirement:
      "Allow the user to enter and add a non-empty task, and display the added task in a visible task list.",

    async run(page) {
      const taskText =
        "Functional item alpha";

      await addTask(
        page,
        taskText,
      );
    },
  },

  {
  id: "todo-reject-empty-task",

  requirement:
    "Whitespace-only or empty input must not create a task.",

  async run(page) {
    const taskList =
      getTaskList(page);

    if ((await taskList.count()) !== 1) {
      throw new Error(
        'Required test hook "task-list" was not found.',
      );
    }

    const tasksBefore =
      await page
        .getByTestId("task")
        .count();

    const input =
      getTaskInput(page);

    const addControl =
      getAddControl(page);

    await input.fill("   ");

    try {
      await addControl.click();
    } catch {
      // Native browser validation may block
      // submission. This is valid behaviour.
    }

    await page.waitForTimeout(100);

    const tasksAfter =
      await page
        .getByTestId("task")
        .count();

    if (tasksAfter > tasksBefore) {
      throw new Error(
        "Whitespace-only input created a task.",
      );
    }
  },
},

  {
    id: "todo-complete-task",

    requirement:
      "Allow each task to be marked as completed, with its completed state visibly reflected in the interface.",

    async run(page) {
      const taskText =
        "Functional item beta";

      let task =
        await addTask(
          page,
          taskText,
        );

      if (
        await getCompletedState(task)
      ) {
        throw new Error(
          "A newly created task was already marked as completed.",
        );
      }

      const control =
        task.getByTestId(
          "task-complete",
        );

      if (!(await control.isVisible())) {
        throw new Error(
          'Required test hook "task-complete" was not visible.',
        );
      }

      await control.click();

      /*
       * Re-query because the application may
       * rebuild the task DOM after updating state.
       */
      task = getTask(
        page,
        taskText,
      );

      try {
        await task.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The task disappeared after its completion control was activated.",
        );
      }

      if (
        !(await getCompletedState(task))
      ) {
        throw new Error(
          "The task did not enter the completed state.",
        );
      }
    },
  },

  {
    id: "todo-delete-task",

    requirement:
      "Allow each task to be deleted. After deletion, the deleted task must no longer be displayed in the task list.",

    async run(page) {
      const taskText =
        "Functional item gamma";

      const task =
        await addTask(
          page,
          taskText,
        );

      const control =
        task.getByTestId(
          "task-delete",
        );

      if (!(await control.isVisible())) {
        throw new Error(
          'Required test hook "task-delete" was not visible.',
        );
      }

      /*
       * Accept native confirmation dialogs.
       */
      const dialogHandler = async (
        dialog,
      ) => {
        await dialog.accept();
      };

      page.on(
        "dialog",
        dialogHandler,
      );

      try {
        await control.click();
      } finally {
        page.off(
          "dialog",
          dialogHandler,
        );
      }

      const deletedTask =
        getTask(
          page,
          taskText,
        );

      try {
        await deletedTask.waitFor({
          state: "hidden",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The deleted task remained visible in the task list.",
        );
      }
    },
  },

  {
    id: "todo-incomplete-count",

    requirement:
      "Display the current number of incomplete tasks and update the count when tasks are added, completed or deleted.",

    async run(page) {
      const initialCount =
        await readIncompleteCount(page);

      await addTask(
        page,
        "Count item alpha",
      );

      let count =
        await readIncompleteCount(page);

      if (
        count !== initialCount + 1
      ) {
        throw new Error(
          `The incomplete count should have increased from ${initialCount} to ${initialCount + 1}, but displayed ${count}.`,
        );
      }

      let secondTask =
        await addTask(
          page,
          "Count item beta",
        );

      count =
        await readIncompleteCount(page);

      if (
        count !== initialCount + 2
      ) {
        throw new Error(
          `The incomplete count should be ${initialCount + 2} after adding two tasks, but displayed ${count}.`,
        );
      }

      await secondTask
        .getByTestId(
          "task-complete",
        )
        .click();

      count =
        await readIncompleteCount(page);

      if (
        count !== initialCount + 1
      ) {
        throw new Error(
          `The incomplete count should have decreased to ${initialCount + 1} after completing a task, but displayed ${count}.`,
        );
      }

      const firstTask =
        getTask(
          page,
          "Count item alpha",
        );

      await firstTask
        .getByTestId(
          "task-delete",
        )
        .click();

      count =
        await readIncompleteCount(page);

      if (count !== initialCount) {
        throw new Error(
          `The incomplete count should have returned to ${initialCount} after deleting the remaining incomplete task, but displayed ${count}.`,
        );
      }
    },
  },

  {
    id: "todo-session-memory",

    requirement:
      "Keep task data in page memory only. Refreshing or reopening the page must reset the task list.",

    async run(page) {
      const taskText =
        "Session item alpha";

      await addTask(
        page,
        taskText,
      );

      await page.reload({
        waitUntil: "load",
      });

      const persistedTask =
        getTask(
          page,
          taskText,
        );

      if (
        (await persistedTask.count()) > 0 &&
        (await persistedTask.isVisible())
      ) {
        throw new Error(
          "The task persisted after the page was refreshed.",
        );
      }
    },
  },
];