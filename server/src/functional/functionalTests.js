import { todoFunctionalTests } from "./todoFunctionalTests.js";

export function getFunctionalTests(specificationId) {
  switch (specificationId) {
    case "todo":
      return todoFunctionalTests;

    default:
      return [];
  }
}