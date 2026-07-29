const todoSpecification = {
  id: "todo",
  name: "To-do List",
  description:
    "A small browser-based application for creating and managing a list of tasks.",
  functionalRequirements: [
    "Allow the user to add a task using a text input and submit button.",
    "Prevent empty tasks from being added.",
    "Display all added tasks in a visible list.",
    "Allow each task to be marked as completed.",
    "Allow each task to be deleted.",
    "Display the number of incomplete tasks.",
    "Tasks must not persist after the application is opened in a fresh browser context.",
  ],
  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
],
};

export default todoSpecification;