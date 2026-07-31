const todoSpecification = {
  id: "todo",
  name: "To-do List",

  description:
    "A small browser-based application for creating and managing a list of tasks.",

  functionalRequirements: [
    "Allow the user to enter and add a non-empty task, and display the added task in a visible task list.",

    "Whitespace-only or empty input must not create a task.",

    "Allow each task to be marked as completed, with its completed state visibly reflected in the interface.",

    "Allow each task to be deleted. After deletion, the deleted task must no longer be displayed in the task list.",

    "Display the current number of incomplete tasks and update the count when tasks are added, completed or deleted.",

    "Keep task data in page memory only. Refreshing or reopening the page must reset the task list.",

    "Do not send task data to an external service.",
  ],

  testabilityContract: {
    description:
      "The following data-testid attributes are required only to support consistent automated experimental evaluation. They must not affect application behaviour or visual presentation.",

    hooks: [
      {
        testId: "task-input",
        requirement:
          "Apply to the control used to enter a new task.",
      },
      {
        testId: "task-add",
        requirement:
          "Apply to the control used to add the entered task.",
      },
      {
        testId: "task-list",
        requirement:
          "Apply to the container that displays the current tasks.",
      },
      {
        testId: "task",
        requirement:
          "Apply to each individual task container. This test ID may appear multiple times.",
      },
      {
        testId: "task-text",
        requirement:
          "Apply to the element displaying the text of each task.",
      },
      {
        testId: "task-complete",
        requirement:
          "Apply to the control used to toggle the completed state of each task.",
      },
      {
        testId: "task-delete",
        requirement:
          "Apply to the control used to delete each task.",
      },
      {
        testId: "incomplete-count",
        requirement:
          "Apply to the element displaying the current number of incomplete tasks.",
      },
    ],

    stateAttributes: [
      {
        attribute: "data-completed",
        appliesTo: "task",
        requirement:
          'Each element with data-testid="task" must expose data-completed="true" when completed and data-completed="false" when incomplete.',
      },
    ],
  },

  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
  ],
};

export default todoSpecification;