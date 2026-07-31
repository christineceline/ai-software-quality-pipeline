const quizSpecification = {
  id: "quiz",
  name: "Multiple-choice Quiz",

  description:
    "A small browser-based quiz application containing exactly three multiple-choice questions.",

  functionalRequirements: [
    "Include exactly three multiple-choice questions, with at least two answer options for each question.",

    "Display all three questions and their answer options on a single page without requiring navigation between questions.",

    "Allow the user to select exactly one answer for each question.",

    "Provide a visible control for submitting the completed quiz.",

    "After the quiz is submitted, display a final numeric score between 0 and 3.",

    "Repeated submission, if the application still permits it, must not accumulate or otherwise change the score unless the selected answers change.",

    "Keep quiz selections and results in page memory only. Refreshing or reopening the page must reset the quiz state.",

    "Do not send quiz data to an external service.",
  ],

  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
  ],
};

export default quizSpecification;