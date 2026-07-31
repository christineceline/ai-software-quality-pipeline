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

  testabilityContract: {
    description:
      "The following data-testid attributes are required only to support consistent automated experimental evaluation. They must not affect application behaviour or visual presentation.",

    hooks: [
      {
        testId: "quiz-question",
        requirement:
          "Apply to each individual question container. This test ID must appear exactly three times.",
      },
      {
         testId: "quiz-option",
        requirement:
          "Apply to the visible user-activatable control for each answer option. If a radio input is visually represented by a clickable label or wrapper, apply this test ID to that visible label or wrapper rather than the underlying radio input. Each question must contain at least two.",
      },
      {
        testId: "quiz-submit",
        requirement:
          "Apply to the control used to submit the completed quiz.",
      },
      {
        testId: "quiz-score",
        requirement:
          "Apply to the element displaying the final numeric score after submission.",
      },
    ],

    stateAttributes: [
      {
        attribute: "data-score",
        appliesTo: "quiz-score",
        requirement:
          'After submission, the element with data-testid="quiz-score" must expose the numeric score using data-score="0", "1", "2" or "3".',
      },
    ],
  },

  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
  ],
};

export default quizSpecification;