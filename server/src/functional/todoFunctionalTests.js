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

async function getAddControl(page) {
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

async function getTaskContainer(
  page,
  taskText,
) {
  const text = getTaskText(
    page,
    taskText,
  );

  if ((await text.count()) === 0) {
    return null;
  }

  /*
   * Prefer common structural containers without
   * depending on arbitrary AI-generated class names.
   */
  const structuralContainer = text
    .locator(
      "xpath=ancestor::*[" +
        "self::li or " +
        "@role='listitem' or " +
        "self::article or " +
        "self::tr" +
      "][1]",
    );

  if (
    (await structuralContainer.count()) > 0
  ) {
    return structuralContainer;
  }

  /*
   * If semantic structure was not used, fall back to
   * the nearest parent containing the task text.
   */
  return text
    .locator("xpath=parent::*")
    .first();
}

async function addTask(page, taskText) {
  const input =
    await getTaskInput(page);

  const addControl =
    await getAddControl(page);

  if ((await input.count()) === 0) {
    throw new Error(
      "No task input was found.",
    );
  }

  if ((await addControl.count()) === 0) {
    throw new Error(
      "No task submission control was found.",
    );
  }

  if (!(await input.isVisible())) {
    throw new Error(
      "The task input was not visible.",
    );
  }

  if (!(await addControl.isVisible())) {
    throw new Error(
      "The task submission control was not visible.",
    );
  }

  try {
    await input.fill(taskText);
    await addControl.click();
  } catch {
    throw new Error(
      "The task could not be submitted.",
    );
  }

  const task =
    getTaskText(
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
      "The task was not displayed after it was submitted.",
    );
  }
}

async function isTaskCompleted(task) {
  return task.evaluate((element) => {
    const candidates = [
      element,
      ...element.querySelectorAll("*"),
    ];

    return candidates.some(
      (candidate) => {
        const classes =
          typeof candidate.className ===
          "string"
            ? candidate.className
                .toLowerCase()
                .split(/\s+/)
            : [];

        /*
         * Match state classes only.
         *
         * Do not use substring checks such as
         * className.includes("complete"), because
         * "complete-button" would cause a false pass.
         */
        const completedClass =
          classes.some((className) =>
            [
              "completed",
              "done",
              "is-complete",
              "is-completed",
              "task-completed",
              "todo-completed",
              "checked",
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
          candidate
            .getAttribute("data-status")
            ?.toLowerCase();

        const checkedCheckbox =
          candidate instanceof
            HTMLInputElement &&
          candidate.type === "checkbox" &&
          candidate.checked;

        const textDecoration =
          window.getComputedStyle(
            candidate,
          ).textDecorationLine;

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
      },
    );
  });
}

async function activateHiddenCheckbox(
  page,
  checkbox,
) {
  if (await checkbox.isVisible()) {
    await checkbox.click();
    return true;
  }

  const checkboxId =
    await checkbox.getAttribute("id");

  if (checkboxId) {
    const label = page
      .locator(
        `label[for="${checkboxId}"]`,
      )
      .first();

    if (
      (await label.count()) > 0 &&
      (await label.isVisible())
    ) {
      await label.click();
      return true;
    }
  }

  const wrappingLabel = checkbox
    .locator(
      "xpath=ancestor::label[1]",
    )
    .first();

  if (
    (await wrappingLabel.count()) > 0 &&
    (await wrappingLabel.isVisible())
  ) {
    await wrappingLabel.click();
    return true;
  }

  return false;
}

async function completeTask(
  page,
  taskText,
) {
  let task =
    await getTaskContainer(
      page,
      taskText,
    );

  if (!task) {
    throw new Error(
      "The task could not be located before completion.",
    );
  }

  if (await isTaskCompleted(task)) {
    throw new Error(
      "The newly added task was already marked as completed.",
    );
  }

  let attempted = false;

  const checkbox = task
    .locator(
      'input[type="checkbox"], [role="checkbox"]',
    )
    .first();

  if ((await checkbox.count()) > 0) {
    try {
      attempted =
        await activateHiddenCheckbox(
          page,
          checkbox,
        );
    } catch {
      attempted = false;
    }
  }

  if (!attempted) {
    const completionControl = task
      .getByRole("button", {
        name:
          /complete|done|finish|mark.*complete/i,
      })
      .or(
        task.getByRole("link", {
          name:
            /complete|done|finish|mark.*complete/i,
        }),
      )
      .or(
        task.locator(
          [
            '[aria-label*="complete" i]',
            '[aria-label*="done" i]',
            '[title*="complete" i]',
            '[title*="done" i]',
          ].join(", "),
        ),
      )
      .first();

    if (
      (await completionControl.count()) >
        0 &&
      (await completionControl.isVisible())
    ) {
      try {
        await completionControl.click();
        attempted = true;
      } catch {
        attempted = false;
      }
    }
  }

  if (!attempted) {
    throw new Error(
      "No visible completion control could be activated for the task.",
    );
  }

  await page.waitForTimeout(200);

  /*
   * Re-locate the task because many applications
   * rebuild the task list after state changes.
   */
  task =
    await getTaskContainer(
      page,
      taskText,
    );

  if (!task) {
    throw new Error(
      "The task disappeared when it was marked as completed.",
    );
  }

  if (!(await isTaskCompleted(task))) {
    throw new Error(
      "The completion control was activated, but the task did not visibly change to a completed state.",
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
          '[aria-label*="delete" i]',
          '[aria-label*="remove" i]',
          '[aria-label*="trash" i]',
          '[title*="delete" i]',
          '[title*="remove" i]',
          '[title*="trash" i]',
          'input[type="button"][value*="delete" i]',
          'input[type="button"][value*="remove" i]',
        ].join(", "),
      ),
    )
    .first();
}

async function acceptHtmlConfirmation(
  page,
) {
  const dialog = page
    .getByRole("dialog")
    .filter({
      hasText:
        /delete|remove|are you sure|confirm/i,
    })
    .first();

  if (
    (await dialog.count()) === 0 ||
    !(await dialog.isVisible())
  ) {
    return;
  }

  const confirmControl = dialog
    .getByRole("button", {
      name:
        /confirm|yes|delete|remove/i,
    })
    .or(
      dialog.getByRole("link", {
        name:
          /confirm|yes|delete|remove/i,
      }),
    )
    .first();

  if (
    (await confirmControl.count()) > 0 &&
    (await confirmControl.isVisible())
  ) {
    await confirmControl.click();
  }
}

function findIncompleteCount(page, value) {
  return page
    .getByText(
      new RegExp(
        `(?:${value}\\s*(?:tasks?)?\\s*(?:remaining|left|incomplete|pending|to do))|` +
        `(?:(?:remaining|left|incomplete|pending|to do)[^0-9]*${value})`,
        "i",
      ),
    )
    .first();
}

export const todoFunctionalTests = [
  {
    id: "todo-add-task",

    requirement:
      "Allow the user to enter and add a non-empty task, and display the added task in a visible task list.",

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
      "Whitespace-only or empty input must not create a task.",

    async run(page) {
      const validTaskText =
        "Valid task before empty test";

      await addTask(
        page,
        validTaskText,
      );

      const taskContainer =
        await getTaskContainer(
          page,
          validTaskText,
        );

      if (!taskContainer) {
        throw new Error(
          "A known valid task could not be located before testing empty input.",
        );
      }

      /*
       * Derive the task-list container from a task
       * known to have been successfully created.
       * This avoids assuming <ul>, <li>, or specific
       * class names.
       */
      const listContainer =
        taskContainer.locator(
          "xpath=parent::*",
        );

      const childrenBefore =
        await listContainer
          .locator(":scope > *")
          .count();

      const input =
        await getTaskInput(page);

      const addControl =
        await getAddControl(page);

      await input.fill("   ");

      try {
        await addControl.click();
      } catch {
        /*
         * Native browser constraint validation may
         * legitimately prevent the click/submission.
         */
      }

      await page.waitForTimeout(200);

      const childrenAfter =
        await listContainer
          .locator(":scope > *")
          .count();

      if (
        childrenAfter > childrenBefore
      ) {
        throw new Error(
          "Whitespace-only input created an additional visible task.",
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
      "Allow each task to be deleted. After deletion, the deleted task must no longer be displayed in the task list.",

    async run(page) {
      const taskText =
        "Task to delete";

      await addTask(
        page,
        taskText,
      );

      const task =
        await getTaskContainer(
          page,
          taskText,
        );

      if (!task) {
        throw new Error(
          "The added task could not be located before deletion.",
        );
      }

      const deleteControl =
        getDeleteControl(task);

      if (
        (await deleteControl.count()) ===
          0 ||
        !(await deleteControl.isVisible())
      ) {
        throw new Error(
          "No visible delete control was found for the added task.",
        );
      }

      /*
       * Automatically accept native confirm()
       * dialogs if the application uses one.
       */
      const dialogHandler = async (
        dialog,
      ) => {
        try {
          await dialog.accept();
        } catch {
          // Dialog was already handled.
        }
      };

      page.on(
        "dialog",
        dialogHandler,
      );

      try {
        await deleteControl.click();

        await page.waitForTimeout(100);

        /*
         * Also support an application-rendered
         * confirmation dialog.
         */
        if (
          (await getTaskText(
            page,
            taskText,
          ).count()) > 0
        ) {
          await acceptHtmlConfirmation(
            page,
          );
        }
      } finally {
        page.off(
          "dialog",
          dialogHandler,
        );
      }

      const deletedTask =
        getTaskText(
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
      await addTask(
        page,
        "Incomplete task one",
      );

      await addTask(
        page,
        "Incomplete task two",
      );

      const countTwo =
        findIncompleteCount(
          page,
          2,
        );

      try {
        await countTwo.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The incomplete-task count did not show 2 after two incomplete tasks were added.",
        );
      }

      await completeTask(
        page,
        "Incomplete task one",
      );

      const countOne =
        findIncompleteCount(
          page,
          1,
        );

      try {
        await countOne.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The incomplete-task count did not update to 1 after one task was completed.",
        );
      }

      const secondTask =
        await getTaskContainer(
          page,
          "Incomplete task two",
        );

      if (!secondTask) {
        throw new Error(
          "The second task could not be found before testing the count after deletion.",
        );
      }

      const deleteControl =
        getDeleteControl(
          secondTask,
        );

      if (
        (await deleteControl.count()) ===
          0 ||
        !(await deleteControl.isVisible())
      ) {
        throw new Error(
          "The second task had no usable delete control.",
        );
      }

      const dialogHandler = async (
        dialog,
      ) => {
        try {
          await dialog.accept();
        } catch {
          // Already handled.
        }
      };

      page.on(
        "dialog",
        dialogHandler,
      );

      try {
        await deleteControl.click();
        await page.waitForTimeout(100);

        await acceptHtmlConfirmation(
          page,
        );
      } finally {
        page.off(
          "dialog",
          dialogHandler,
        );
      }

      const countZero =
        findIncompleteCount(
          page,
          0,
        );

      try {
        await countZero.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The incomplete-task count did not update to 0 after the remaining incomplete task was deleted.",
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
          "The task persisted after the page was refreshed instead of being kept only in page memory.",
        );
      }
    },
  },
];