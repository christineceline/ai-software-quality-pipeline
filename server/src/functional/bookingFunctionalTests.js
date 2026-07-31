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
    const form = page.locator("form").first();

    if ((await form.count()) === 0) {
      throw new Error(
        "No booking form was found.",
      );
    }

    const requiredFields = form.locator(
      "input[required], select[required], textarea[required]",
    );


    const hasNativeRequiredFields =
      (await requiredFields.count()) > 0;

    let browserRejectsForm = false;

    if (hasNativeRequiredFields) {
      browserRejectsForm = await form.evaluate(
        (element) => !element.checkValidity(),
      );
    }


    const testName =
      "Empty Fields Test User";

    const nameInput = page
      .getByLabel(/name/i)
      .or(page.locator('input[name*="name" i]'))
      .first();

    if ((await nameInput.count()) > 0) {
      await nameInput.fill(testName);
    }


    if (hasNativeRequiredFields) {
      browserRejectsForm = await form.evaluate(
        (element) => !element.checkValidity(),
      );
    }

    await submitBooking(page);
    await page.waitForTimeout(200);


    const createdBooking = getBooking(
      page,
      testName,
    );

    if (
      (await createdBooking.count()) > 0 &&
      (await createdBooking.isVisible())
    ) {
      throw new Error(
        "A booking was created even though required fields were empty.",
      );
    }

  
    if (browserRejectsForm) {
      return;
    }

    return;
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
    const bookingName = "Cancel Test User";

    await createBooking(page, {
      name: bookingName,
    });

    const booking = getBooking(
      page,
      bookingName,
    );

    if (
      (await booking.count()) === 0 ||
      !(await booking.isVisible())
    ) {
      throw new Error(
        "The created booking could not be found before cancellation.",
      );
    }

    const cancelControl = booking
      .getByRole("button", {
        name: /cancel|delete|remove/i,
      })
      .or(
        booking.getByRole("link", {
          name: /cancel|delete|remove/i,
        }),
      )
      .or(
        booking.locator(
          [
            '[role="button"][aria-label*="cancel" i]',
            '[role="button"][aria-label*="delete" i]',
            '[role="button"][aria-label*="remove" i]',
            '[title*="cancel" i]',
            '[title*="delete" i]',
            '[title*="remove" i]',
            'input[type="button"][value*="cancel" i]',
            'input[type="button"][value*="delete" i]',
            'input[type="button"][value*="remove" i]',
          ].join(", "),
        ),
      )
      .first();

    if ((await cancelControl.count()) === 0) {
      throw new Error(
        "No cancellation control was found for the created booking.",
      );
    }

    if (!(await cancelControl.isVisible())) {
      throw new Error(
        "The cancellation control was present but not visible.",
      );
    }

    try {
      await cancelControl.click();
    } catch {
      throw new Error(
        "The booking cancellation control could not be activated.",
      );
    }

    await page.waitForTimeout(200);

    const bookingStillVisible =
      (await booking.count()) > 0 &&
      (await booking.isVisible());

    if (!bookingStillVisible) {
      return;
    }

    const markedCancelled =
      await booking.evaluate(
        (element) => {
          const text =
            element.textContent
              ?.toLowerCase()
              .trim() ?? "";

          const className =
            typeof element.className === "string"
              ? element.className.toLowerCase()
              : "";

          const status =
            element
              .getAttribute("data-status")
              ?.toLowerCase() ?? "";

          const ariaLabel =
            element
              .getAttribute("aria-label")
              ?.toLowerCase() ?? "";

          return (
            text.includes("cancelled") ||
            text.includes("canceled") ||
            className.includes("cancelled") ||
            className.includes("canceled") ||
            status === "cancelled" ||
            status === "canceled" ||
            ariaLabel.includes("cancelled") ||
            ariaLabel.includes("canceled")
          );
        },
      );

    if (markedCancelled) {
      return;
    }

    throw new Error(
      "The booking was neither removed nor marked as cancelled after cancellation was attempted.",
    );
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