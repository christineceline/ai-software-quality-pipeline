export const runtimeRequirements = {
  todo: [
    {
      id: "task-input",
      label: "Task input",
      candidates: [
        {
          type: "css",
          selector:
            'input[type="text"], input:not([type]), textarea',
        },
      ],
    },
    {
      id: "add-task-control",
      label: "Add-task control",
      candidates: [
        {
          type: "role",
          role: "button",
          name: /add|create|save|submit/i,
        },
        {
          type: "css",
          selector: 'button[type="submit"], input[type="submit"]',
        },
      ],
    },
  ],

  quiz: [
    {
      id: "answer-control",
      label: "Answer control",
      candidates: [
        {
          type: "css",
          selector:
            'input[type="radio"], input[type="checkbox"], select, button',
        },
      ],
    },
    {
      id: "quiz-action-control",
      label: "Submit or next control",
      candidates: [
        {
          type: "role",
          role: "button",
          name: /submit|next|check|answer|finish|start/i,
        },
        {
          type: "css",
          selector: 'button[type="submit"], input[type="submit"]',
        },
      ],
    },
  ],

  booking: [
    {
      id: "booking-date-control",
      label: "Booking date control",
      candidates: [
        {
          type: "css",
          selector:
            'input[type="date"], input[type="datetime-local"], input[name*="date" i]',
        },
      ],
    },
    {
      id: "booking-action-control",
      label: "Booking submission control",
      candidates: [
        {
          type: "role",
          role: "button",
          name: /book|reserve|confirm|submit|save/i,
        },
        {
          type: "css",
          selector: 'button[type="submit"], input[type="submit"]',
        },
      ],
    },
  ],
};

export function getRuntimeRequirements(specificationId) {
  return runtimeRequirements[specificationId] ?? [];
}