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

  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
  ],
};

export default todoSpecification;