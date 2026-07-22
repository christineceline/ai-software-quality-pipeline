import bookingSpecification from "./booking.js";
import quizSpecification from "./quiz.js";
import todoSpecification from "./todo.js";

export const specifications = [
  todoSpecification,
  quizSpecification,
  bookingSpecification,
];

export function getSpecificationById(id) {
  return specifications.find((specification) => specification.id === id);
}