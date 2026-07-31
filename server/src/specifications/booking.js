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

  qualityRequirements: [
    "Apply CSS to provide a clear, consistent and usable visual presentation.",
  ],
};

export default bookingSpecification;