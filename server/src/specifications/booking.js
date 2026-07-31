const bookingSpecification = {
  id: "booking",
  name: "Appointment Booking Form",

  description:
    "A small browser-based application for creating and managing mock appointment bookings.",

  functionalRequirements: [
    "Include fields for customer name, email address, appointment date and appointment time.",

    "Include a selectable appointment type.",

    "Prevent a booking from being created when required information is missing.",

    "Reject an email address that is not in a valid email format using browser-side validation.",

    "Prevent a booking from being created for a date in the past.",

    "After a valid booking is submitted, display the booking in a visible list or booking area.",

    "Display a visible confirmation after a valid booking is successfully created.",

    "Allow each booking to be cancelled. Cancellation may either remove the booking from the active list or clearly mark it as cancelled.",

    "Keep booking data in page memory only. Refreshing or reopening the page must reset the booking data.",

    "Do not send booking data to an external service.",
  ],

  testabilityContract: {
    description:
      "The following data-testid attributes are required only to support consistent automated experimental evaluation. They must not affect application behaviour or visual presentation.",

    hooks: [
      {
        testId: "booking-name",
        requirement:
          "Apply to the customer name input.",
      },
      {
        testId: "booking-email",
        requirement:
          "Apply to the email address input.",
      },
      {
        testId: "booking-date",
        requirement:
          "Apply to the appointment date input.",
      },
      {
        testId: "booking-time",
        requirement:
          "Apply to the appointment time input.",
      },
      {
        testId: "booking-type",
        requirement:
          "Apply to the control used to select the appointment type.",
      },
      {
        testId: "booking-submit",
        requirement:
          "Apply to the control used to submit the booking.",
      },
      {
        testId: "booking-list",
        requirement:
          "Apply to the container displaying created bookings.",
      },
      {
        testId: "booking",
        requirement:
          "Apply to each individual booking container. This test ID may appear multiple times.",
      },
      {
        testId: "booking-name-display",
        requirement:
          "Apply to the element displaying the customer name within each created booking.",
      },
      {
        testId: "booking-cancel",
        requirement:
          "Apply to the control used to cancel each booking.",
      },
      {
        testId: "booking-confirmation",
        requirement:
          "Apply to the confirmation displayed after a booking is successfully created.",
      },
    ],

    stateAttributes: [
      {
        attribute: "data-status",
        appliesTo: "booking",
        requirement:
          'If a cancelled booking remains displayed, its data-testid="booking" container must expose data-status="cancelled". Active bookings may use data-status="active".',
      },
    ],
  },

  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
  ],
};

export default bookingSpecification;