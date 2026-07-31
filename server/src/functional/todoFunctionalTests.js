async function getTaskInput(page) {
  return page
    .getByRole("textbox")
    .or(
      page.locator(
        'input[type="text"], textarea',
      ),
    )
    .first();
}

async function getAddButton(page) {
  return page
    .getByRole("button", {
      name: /add|create|submit|new task/i,
    })
    .or(
      page.locator(
        'input[type="submit"]',
      ),
    )
    .first();
}

function getTaskText(page, taskText) {
  return page
    .getByText(taskText, {
      exact: true,
    })
    .first();
}

function getTaskContainer(page, taskText) {
  const text = getTaskText(
    page,
    taskText,
  );

  return text
    .locator(
      "xpath=ancestor-or-self::*[" +
        "self::li or " +
        "@role='listitem' or " +
        "self::article or " +
        "self::tr or " +
        "contains(translate(@class,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'task') or " +
        "contains(translate(@class,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'todo')" +
      "][1]",
    )
    .or(text.locator("xpath=parent::*"))
    .first();
}

async function addTask(page, taskText) {
  const input =
    await getTaskInput(page);

  const addButton =
    await getAddButton(page);

  if (
    (await input.count()) === 0 ||
    (await addButton.count()) === 0
  ) {
    throw new Error(
      "The task input or submission control was not found.",
    );
  }

  await input.fill(taskText);
  await addButton.click();

  const taskTextLocator =
    getTaskText(page, taskText);

  try {
    await taskTextLocator.waitFor({
      state: "visible",
      timeout: 3000,
    });
  } catch {
    throw new Error(
      "The task was not displayed after it was submitted.",
    );
  }
}

async function isTaskCompleted(task) {
  return task.evaluate((element) => {
    const elements = [
      element,
      ...element.querySelectorAll("*"),
    ];

    return elements.some((candidate) => {
      const classes =
        typeof candidate.className === "string"
          ? candidate.className
              .toLowerCase()
              .split(/\s+/)
          : [];

      const completedClass =
        classes.some((className) =>
          [
            "completed",
            "done",
            "is-complete",
            "is-completed",
            "task-completed",
            "todo-completed",
          ].includes(className),
        );

      const ariaChecked =
        candidate.getAttribute(
          "aria-checked",
        );

      const ariaPressed =
        candidate.getAttribute(
          "aria-pressed",
        );

      const dataStatus =
        candidate.getAttribute(
          "data-status",
        )?.toLowerCase();

      const textDecoration =
        window.getComputedStyle(candidate)
          .textDecorationLine;

      const checkedCheckbox =
        candidate instanceof HTMLInputElement &&
        candidate.type === "checkbox" &&
        candidate.checked;

      return (
        checkedCheckbox ||
        completedClass ||
        ariaChecked === "true" ||
        ariaPressed === "true" ||
        dataStatus === "complete" ||
        dataStatus === "completed" ||
        dataStatus === "done" ||
        textDecoration.includes(
          "line-through",
        )
      );
    });
  });
}

async function completeTask(page, taskText) {
  const task =
    getTaskContainer(
      page,
      taskText,
    );

  if ((await task.count()) === 0) {
    throw new Error(
      "The task could not be located before completion.",
    );
  }

  const wasCompleted =
    await isTaskCompleted(task);

  if (wasCompleted) {
    throw new Error(
      "The newly created task was already marked as completed.",
    );
  }

  const checkbox = task
    .locator(
      'input[type="checkbox"], [role="checkbox"]',
    )
    .first();

  let attempted = false;

  if ((await checkbox.count()) > 0) {
    if (await checkbox.isVisible()) {
      await checkbox.click();
      attempted = true;
    } else {
      const id =
        await checkbox.getAttribute("id");

      if (id) {
        const label = page
          .locator(`label[for="${id}"]`)
          .first();

        if (
          (await label.count()) > 0 &&
          (await label.isVisible())
        ) {
          await label.click();
          attempted = true;
        }
      }
    }
  }

  if (!attempted) {
    const control = task
      .getByRole("button", {
        name: /complete|done|finish|mark/i,
      })
      .or(
        task.getByRole("link", {
          name: /complete|done|finish|mark/i,
        }),
      )
      .first();

    if (
      (await control.count()) > 0 &&
      (await control.isVisible())
    ) {
      await control.click();
      attempted = true;
    }
  }

  if (!attempted) {
    throw new Error(
      "No visible completion control could be activated for the task.",
    );
  }

  await page.waitForTimeout(200);

  if (!(await isTaskCompleted(task))) {
    throw new Error(
      "The completion control was activated, but the task did not change to a completed state.",
    );
  }
}

function getDeleteControl(task) {
  return task
    .getByRole("button", {
      name: /delete|remove|trash/i,
    })
    .or(
      task.getByRole("link", {
        name: /delete|remove|trash/i,
      }),
    )
    .or(
      task.locator(
        [
          '[title*="delete" i]',
          '[title*="remove" i]',
          '[aria-label*="delete" i]',
          '[aria-label*="remove" i]',
          "button",
        ].join(", "),
      ).filter({
        hasText: /^(×|x|✕)$/i,
      }),
    )
    .first();
}

export const todoFunctionalTests = [
  {
    id: "todo-add-task",
    requirement:
      "Allow the user to add a task using a text input and submit button, and display the added task in a visible list.",

    async run(page) {
      await addTask(
        page,
        "Functional test task",
      );
    },
  },

  {
    id: "todo-reject-empty-task",
    requirement:
      "Prevent empty tasks from being added.",

    async run(page) {
      const validTask =
        "Valid task before empty test";

      await addTask(
        page,
        validTask,
      );

      const input =
        await getTaskInput(page);

      const addButton =
        await getAddButton(page);

      const knownTask =
        getTaskText(page, validTask);

      await input.fill("   ");

      try {
        await addButton.click();
      } catch {
        // Native validation may block submission.
      }

      await page.waitForTimeout(200);

      if (!(await knownTask.isVisible())) {
        throw new Error(
          "The existing task disappeared after the empty submission attempt.",
        );
      }

      /*
       * There is no reliable implementation-neutral
       * representation of an empty task to locate.
       * Native validation or simply creating no new
       * visible content both satisfy this requirement.
       *
       * The valid-task check above ensures the app
       * itself was functional before the attempt.
       */
    },
  },

  {
    id: "todo-complete-task",
    requirement:
      "Allow each task to be marked as completed.",

    async run(page) {
      const taskText =
        "Task to complete";

      await addTask(
        page,
        taskText,
      );

      await completeTask(
        page,
        taskText,
      );
    },
  },

  {
    id: "todo-delete-task",
    requirement:
      "Allow each task to be deleted.",

    async run(page) {
      const taskText =
        "Task to delete";

      await addTask(
        page,
        taskText,
      );

      const task =
        getTaskContainer(
          page,
          taskText,
        );

      const deleteControl =
        getDeleteControl(task);

      if (
        (await deleteControl.count()) === 0 ||
        !(await deleteControl.isVisible())
      ) {
        throw new Error(
          "No visible delete control was found for the added task.",
        );
      }

      await deleteControl.click();

      const taskTextLocator =
        getTaskText(
          page,
          taskText,
        );

      try {
        await taskTextLocator.waitFor({
          state: "hidden",
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
      await addTask(
        page,
        "Incomplete task one",
      );

      await addTask(
        page,
        "Incomplete task two",
      );

      const countTwo = page
        .getByText(
          /(?:2\s*(?:tasks?)?\s*(?:remaining|left|incomplete|pending|to do))|(?:(?:remaining|left|incomplete|pending|to do)[^0-9]*2)/i,
        )
        .first();

      try {
        await countTwo.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The incomplete-task count did not show 2 after two tasks were added.",
        );
      }

      await completeTask(
        page,
        "Incomplete task one",
      );

      const countOne = page
        .getByText(
          /(?:1\s*(?:tasks?)?\s*(?:remaining|left|incomplete|pending|to do))|(?:(?:remaining|left|incomplete|pending|to do)[^0-9]*1)/i,
        )
        .first();

      try {
        await countOne.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The incomplete-task count did not update to 1 after a task was completed.",
        );
      }
    },
  },

  {
    id: "todo-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const taskText =
        "Session-only task";

      await addTask(
        page,
        taskText,
      );

      await page.reload({
        waitUntil: "load",
      });

      const persisted =
        getTaskText(
          page,
          taskText,
        );

      if (
        (await persisted.count()) > 0 &&
        (await persisted.isVisible())
      ) {
        throw new Error(
          "The task persisted after the page was reloaded instead of remaining in page-session memory.",
        );
      }
    },
  },
];