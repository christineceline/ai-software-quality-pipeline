async function fillBooking(page, {
  name = "Test User",
  email = "test@example.com",
  date = "2030-06-15",
  time = "12:00",
} = {}) {
  const nameInput = page
    .getByLabel(/name/i)
    .or(page.locator('input[name*="name" i]'))
    .first();

  const emailInput = page
    .getByLabel(/email/i)
    .or(page.locator('input[type="email"]'))
    .first();

  const dateInput = page
    .getByLabel(/date/i)
    .or(page.locator('input[type="date"]'))
    .first();

  const timeInput = page
    .getByLabel(/time/i)
    .or(page.locator('input[type="time"]'))
    .first();

  try {
    await nameInput.fill(name);
    await emailInput.fill(email);
    await dateInput.fill(date);
    await timeInput.fill(time);
  } catch {
    throw new Error(
      "The booking form could not be completed using the required fields.",
    );
  }

  const typeSelect = page
    .getByLabel(/type|service/i)
    .or(page.locator("select"))
    .first();

  if ((await typeSelect.count()) > 0) {
    const options = await typeSelect
      .locator("option")
      .evaluateAll((elements) =>
        elements
          .map((element) => element.value)
          .filter(Boolean),
      );

    if (options.length > 0) {
      await typeSelect.selectOption(options[0]);
    }
  }
}

async function submitBooking(page) {
  const button = page
    .getByRole("button", {
      name: /book|submit|create|confirm/i,
    })
    .first();

  if ((await button.count()) === 0) {
    throw new Error(
      "No booking submission button was found.",
    );
  }

  if (!(await button.isVisible())) {
    throw new Error(
      "The booking submission button was not visible.",
    );
  }

  try {
    await button.click();
  } catch {
    throw new Error(
      "The booking submission button could not be activated.",
    );
  }
}

function getBooking(page, name) {
  return page
    .locator("li, [class*='booking'], [class*='appointment']")
    .filter({
      hasText: name,
    })
    .first();
}

async function createBooking(page, {
  name = "Test User",
  email = "test@example.com",
  date = "2030-06-15",
  time = "12:00",
} = {}) {
  await fillBooking(page, {
    name,
    email,
    date,
    time,
  });

  await submitBooking(page);

  const booking = getBooking(page, name);

  try {
    await booking.waitFor({
      state: "visible",
      timeout: 3000,
    });
  } catch {
    throw new Error(
      "The booking was not displayed after the form was submitted.",
    );
  }

  return booking;
}

export const bookingFunctionalTests = [
  {
    id: "booking-create",
    requirement:
      "Allow the user to create a booking and display it.",

    async run(page) {
      await createBooking(page);
    },
  },

  {
    id: "booking-required-fields",
    requirement:
      "Prevent a booking from being created when required fields are empty.",

    async run(page) {
      // Prove booking creation works before testing rejection.
      await createBooking(page, {
        name: "Valid Booking User",
      });

      await page.goto(page.url(), {
        waitUntil: "load",
      });

      await submitBooking(page);
      await page.waitForTimeout(200);

      const bookingItems = page.locator(
        "li, [class*='booking'], [class*='appointment']",
      );

      const text = await bookingItems.allTextContents();

      const unexpectedCreatedBooking = text.some(
        (value) =>
          value.trim() !== "" &&
          !value.includes("Valid Booking User"),
      );

      if (unexpectedCreatedBooking) {
        throw new Error(
          "A booking was created even though required fields were empty.",
        );
      }
    },
  },

  {
    id: "booking-email-validation",
    requirement:
      "Validate that the email address is in a valid format.",

    async run(page) {
      await fillBooking(page, {
        name: "Invalid Email User",
        email: "invalid-email",
      });

      const emailInput = page
        .getByLabel(/email/i)
        .or(page.locator('input[type="email"]'))
        .first();

      const browserRejectsEmail =
        await emailInput.evaluate(
          (element) => !element.validity.valid,
        );

      await submitBooking(page);
      await page.waitForTimeout(200);

      const invalidBooking = getBooking(
        page,
        "Invalid Email User",
      );

      if ((await invalidBooking.count()) > 0) {
        throw new Error(
          "A booking was created using an invalid email address.",
        );
      }

      const validationMessage = page.getByText(
        /invalid|valid email|email address/i,
      );

      if (
        !browserRejectsEmail &&
        (await validationMessage.count()) === 0
      ) {
        throw new Error(
          "The invalid email address was not rejected or identified as invalid.",
        );
      }
    },
  },

  {
    id: "booking-past-date",
    requirement:
      "Prevent bookings from being created for dates in the past.",

    async run(page) {
      // Prove normal booking creation works first.
      await createBooking(page, {
        name: "Valid Date User",
      });

      await page.goto(page.url(), {
        waitUntil: "load",
      });

      await fillBooking(page, {
        name: "Past Date User",
        date: "2020-01-01",
      });

      await submitBooking(page);
      await page.waitForTimeout(200);

      const booking = getBooking(
        page,
        "Past Date User",
      );

      if ((await booking.count()) > 0) {
        throw new Error(
          "A booking was created for a date in the past.",
        );
      }
    },
  },

  {
    id: "booking-confirmation",
    requirement:
      "Display a confirmation after a booking is successfully created.",

    async run(page) {
      await fillBooking(page, {
        name: "Confirmation Test User",
      });

      await submitBooking(page);

      const booking = getBooking(
        page,
        "Confirmation Test User",
      );

      try {
        await booking.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The booking was not successfully created, so confirmation could not be verified.",
        );
      }

      const confirmation = page
        .getByText(
          /confirmed|confirmation|success|booked successfully|booking created/i,
        )
        .first();

      try {
        await confirmation.waitFor({
          state: "visible",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "No confirmation was displayed after the booking was successfully created.",
        );
      }
    },
  },

  {
    id: "booking-cancel",
    requirement:
      "Allow each booking to be cancelled.",

    async run(page) {
      const booking = await createBooking(page, {
        name: "Cancel Test User",
      });

      const cancelButton = booking
        .getByRole("button", {
          name: /cancel|delete|remove/i,
        })
        .first();

      if ((await cancelButton.count()) === 0) {
        throw new Error(
          "No cancellation control was found for the created booking.",
        );
      }

      try {
        await cancelButton.click();
      } catch {
        throw new Error(
          "The booking cancellation control could not be activated.",
        );
      }

      try {
        await booking.waitFor({
          state: "detached",
          timeout: 3000,
        });
      } catch {
        throw new Error(
          "The booking remained on the page after cancellation was attempted.",
        );
      }
    },
  },

  {
    id: "booking-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const name = "Session Test User";

      await createBooking(page, { name });

      const browser = page.context().browser();

      if (!browser) {
        throw new Error(
          "Unable to open a fresh browser session for the storage test.",
        );
      }

      const freshContext =
        await browser.newContext();

      try {
        const freshPage =
          await freshContext.newPage();

        await freshPage.goto(page.url(), {
          waitUntil: "load",
        });

        const persisted =
          freshPage.getByText(name, {
            exact: false,
          });

        if ((await persisted.count()) > 0) {
          throw new Error(
            "The booking persisted into a fresh browser session instead of remaining session-only.",
          );
        }
      } finally {
        await freshContext.close();
      }
    },
  },
];