const bookingSpecification = {
  id: "booking",
  name: "Appointment Booking Form",
  description:
    "A small browser-based application for creating and viewing mock appointment bookings.",
  functionalRequirements: [
    "Include fields for customer name, email address, appointment date and appointment time.",
    "Include a selectable appointment type.",
    "Validate all required fields before accepting a booking.",
    "Validate the email address using browser-side validation.",
    "Prevent dates in the past from being selected.",
    "Display a confirmation message after a valid booking.",
    "Display submitted bookings in a visible list.",
    "Allow a submitted booking to be cancelled.",
    "Do not send data to an external service.",
  ],
};

export default bookingSpecification;