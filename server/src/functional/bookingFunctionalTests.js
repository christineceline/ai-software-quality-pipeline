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

  await nameInput.fill(name);
  await emailInput.fill(email);
  await dateInput.fill(date);
  await timeInput.fill(time);

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
  const button = page.getByRole("button", {
    name: /book|submit|create|confirm/i,
  }).first();

  if ((await button.count()) === 0) {
    throw new Error("Booking submission control not found.");
  }

  await button.click();
}

export const bookingFunctionalTests = [
  {
    id: "booking-create",
    requirement:
      "Allow the user to create a booking and display it.",

    async run(page) {
      await fillBooking(page);
      await submitBooking(page);

      await page
        .getByText("Test User", { exact: false })
        .first()
        .waitFor({
          state: "visible",
          timeout: 3000,
        });
    },
  },

  {
    id: "booking-required-fields",
    requirement:
      "Prevent a booking from being created when required fields are empty.",

    async run(page) {
      await submitBooking(page);
      await page.waitForTimeout(200);

      const booking = page.getByText("Test User", {
        exact: false,
      });

      if ((await booking.count()) > 0) {
        throw new Error(
          "Booking was created with empty required fields.",
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
        email: "invalid-email",
      });

      await submitBooking(page);
      await page.waitForTimeout(200);

      const invalidEmail = await page
        .locator('input[type="email"]')
        .first()
        .evaluate((element) => !element.validity.valid);

      const validationMessage = page.getByText(
        /invalid|valid email|email address/i,
      );

      if (
        !invalidEmail &&
        (await validationMessage.count()) === 0
      ) {
        throw new Error(
          "Invalid email address was not rejected.",
        );
      }
    },
  },

  {
    id: "booking-past-date",
    requirement:
      "Prevent bookings from being created for dates in the past.",

    async run(page) {
      await fillBooking(page, {
        name: "Past Date User",
        date: "2020-01-01",
      });

      await submitBooking(page);
      await page.waitForTimeout(200);

      const booking = page.getByText(
        "Past Date User",
        { exact: false },
      );

      if ((await booking.count()) > 0) {
        throw new Error(
          "Booking was created for a past date.",
        );
      }
    },
  },

  {
    id: "booking-confirmation",
    requirement:
      "Display a confirmation after a booking is successfully created.",

    async run(page) {
      await fillBooking(page);
      await submitBooking(page);

      const confirmation = page.getByText(
        /confirmed|confirmation|success|booked successfully|booking created/i,
      );

      await confirmation.first().waitFor({
        state: "visible",
        timeout: 3000,
      });
    },
  },

  {
    id: "booking-cancel",
    requirement:
      "Allow each booking to be cancelled.",

    async run(page) {
      await fillBooking(page, {
        name: "Cancel Test User",
      });

      await submitBooking(page);

      const booking = page
        .locator("li, [class*='booking']")
        .filter({
          hasText: "Cancel Test User",
        })
        .first();

      await booking.waitFor({
        state: "visible",
        timeout: 3000,
      });

      const cancelButton = booking
        .getByRole("button", {
          name: /cancel|delete|remove/i,
        })
        .first();

      if ((await cancelButton.count()) === 0) {
        throw new Error(
          "No cancellation control found for booking.",
        );
      }

      await cancelButton.click();

      await booking.waitFor({
        state: "detached",
        timeout: 3000,
      });
    },
  },

  {
    id: "booking-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const name = "Session Test User";

      await fillBooking(page, { name });
      await submitBooking(page);

      await page
        .getByText(name, { exact: false })
        .first()
        .waitFor({
          state: "visible",
          timeout: 3000,
        });

      const browser = page.context().browser();

      if (!browser) {
        throw new Error("Unable to access browser.");
      }

      const freshContext = await browser.newContext();

      try {
        const freshPage = await freshContext.newPage();

        await freshPage.goto(page.url(), {
          waitUntil: "load",
        });

        const persisted = freshPage.getByText(name, {
          exact: false,
        });

        if ((await persisted.count()) > 0) {
          throw new Error(
            "Booking persisted into a fresh browser context.",
          );
        }
      } finally {
        await freshContext.close();
      }
    },
  },
];