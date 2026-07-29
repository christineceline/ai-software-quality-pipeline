import { todoFunctionalTests } from "./todoFunctionalTests.js";
import { quizFunctionalTests } from "./quizFunctionalTests.js";
import { bookingFunctionalTests } from "./bookingFunctionalTests.js";

const functionalTests = {
  todo: todoFunctionalTests,
  quiz: quizFunctionalTests,
  booking: bookingFunctionalTests,
};

export function getFunctionalTests(specificationId) {
  return functionalTests[specificationId] || [];
}