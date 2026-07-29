export const todoFunctionalTests = [
  {
    id: "todo-add-task",
    requirement:
      "Allow the user to add a task using a text input and submit button, and display the added task in a visible list.",

    async run(page) {
      const taskText = "Functional test task";

      const input = page
        .getByRole("textbox")
        .or(page.locator('input[type="text"]'))
        .first();

      const submitButton = page
        .getByRole("button", {
          name: /add|create|submit/i,
        })
        .first();

      await input.fill(taskText);
      await submitButton.click();

      const addedTask = page.getByText(taskText, {
        exact: true,
      });

      await addedTask.waitFor({
        state: "visible",
        timeout: 3000,
      });
    },
  },
];