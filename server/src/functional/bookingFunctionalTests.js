function futureDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);

  return date
    .toISOString()
    .slice(0, 10);
}

function pastDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  return date
    .toISOString()
    .slice(0, 10);
}

function getNameInput(page) {
  return page
    .getByLabel(/name/i)
    .or(
      page.locator(
        'input[name*="name" i]',
      ),
    )
    .first();
}

function getEmailInput(page) {
  return page
    .getByLabel(/email/i)
    .or(
      page.locator(
        'input[type="email"], input[name*="email" i]',
      ),
    )
    .first();
}

function getDateInput(page) {
  return page
    .getByLabel(/date/i)
    .or(
      page.locator(
        'input[type="date"]',
      ),
    )
    .first();
}

function getTimeInput(page) {
  return page
    .getByLabel(/time/i)
    .or(
      page.locator(
        'input[type="time"]',
      ),
    )
    .first();
}

async function fillBooking(
  page,
  {
    name = "Test User",
    email = "test@example.com",
    date = futureDate(),
    time = "12:00",
  } = {},
) {
  const fields = [
    [getNameInput(page), name],
    [getEmailInput(page), email],
    [getDateInput(page), date],
    [getTimeInput(page), time],
  ];

  for (const [field, value] of fields) {
    if ((await field.count()) === 0) {
      throw new Error(
        "A required booking field could not be found.",
      );
    }

    try {
      await field.fill(value);
    } catch {
      throw new Error(
        "The booking form could not be completed using the required fields.",
      );
    }
  }

  const select = page
    .getByLabel(/type|service/i)
    .or(page.locator("select"))
    .first();

  if ((await select.count()) > 0) {
    const options = await select
      .locator("option")
      .evaluateAll((elements) =>
        elements
          .map((element) => element.value)
          .filter(Boolean),
      );

    if (options.length > 0) {
      await select.selectOption(
        options[0],
      );
    }
  }
}

function getSubmitControl(page) {
  return page
    .getByRole("button", {
      name: /book|submit|create|confirm|save/i,
    })
    .or(
      page.locator(
        'input[type="submit"]',
      ),
    )
    .first();
}

async function submitBooking(page) {
  const control =
    getSubmitControl(page);

  if (
    (await control.count()) === 0 ||
    !(await control.isVisible())
  ) {
    throw new Error(
      "No visible booking submission control was found.",
    );
  }

  try {
    await control.click();
  } catch {
    throw new Error(
      "The booking submission control could not be activated.",
    );
  }
}

function getBookingText(
  page,
  name,
) {
  return page
    .getByText(name, {
      exact: true,
    })
    .first();
}

function getBookingContainer(
  page,
  name,
) {
  const text =
    getBookingText(
      page,
      name,
    );

  return text
    .locator(
      "xpath=ancestor-or-self::*[" +
        "self::li or " +
        "@role='listitem' or " +
        "self::article or " +
        "self::tr or " +
        "contains(translate(@class,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'booking') or " +
        "contains(translate(@class,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'appointment')" +
      "][1]",
    )
    .or(text.locator("xpath=parent::*"))
    .first();
}

async function createBooking(
  page,
  options = {},
) {
  const name =
    options.name ?? "Test User";

  await fillBooking(
    page,
    options,
  );

  await submitBooking(page);

  const booking =
    getBookingText(
      page,
      name,
    );

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

  return getBookingContainer(
    page,
    name,
  );
}

function getCancelControl(booking) {
  return booking
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
          '[aria-label*="cancel" i]',
          '[aria-label*="delete" i]',
          '[aria-label*="remove" i]',
          '[title*="cancel" i]',
          '[title*="delete" i]',
          '[title*="remove" i]',
          'input[type="button"][value*="cancel" i]',
          'input[type="button"][value*="delete" i]',
          'input[type="button"][value*="remove" i]',
          "button",
        ].join(", "),
      ).filter({
        hasText: /^(×|x|✕)$/i,
      }),
    )
    .first();
}

async function bookingIsCancelled(
  booking,
) {
  if (
    (await booking.count()) === 0 ||
    !(await booking.isVisible())
  ) {
    return true;
  }

  return booking.evaluate(
    (element) => {
      const text =
        element.textContent
          ?.toLowerCase() ?? "";

      const classes =
        typeof element.className === "string"
          ? element.className
              .toLowerCase()
              .split(/\s+/)
          : [];

      const status =
        element
          .getAttribute("data-status")
          ?.toLowerCase();

      return (
        text.includes("cancelled") ||
        text.includes("canceled") ||
        classes.includes("cancelled") ||
        classes.includes("canceled") ||
        classes.includes("is-cancelled") ||
        classes.includes("is-canceled") ||
        status === "cancelled" ||
        status === "canceled"
      );
    },
  );
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
      const testName =
        "Empty Fields Test User";

      const name =
        getNameInput(page);

      if ((await name.count()) > 0) {
        await name.fill(testName);
      }

      await submitBooking(page);

      await page.waitForTimeout(200);

      const created =
        getBookingText(
          page,
          testName,
        );

      if (
        (await created.count()) > 0 &&
        (await created.isVisible())
      ) {
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
      const name =
        "Invalid Email User";

      await fillBooking(page, {
        name,
        email: "invalid-email",
      });

      const email =
        getEmailInput(page);

      const nativeInvalid =
        await email.evaluate(
          (element) =>
            !element.validity.valid,
        );

      await submitBooking(page);

      await page.waitForTimeout(200);

      const booking =
        getBookingText(
          page,
          name,
        );

      if (
        (await booking.count()) > 0 &&
        (await booking.isVisible())
      ) {
        throw new Error(
          "A booking was created using an invalid email address.",
        );
      }

      if (nativeInvalid) {
        return;
      }

      const message = page
        .getByText(
          /invalid email|valid email|email.*invalid|enter.*email/i,
        )
        .first();

      if (
        (await message.count()) === 0 ||
        !(await message.isVisible())
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
      const name =
        "Past Date User";

      await fillBooking(page, {
        name,
        date: pastDate(),
      });

      await submitBooking(page);

      await page.waitForTimeout(200);

      const booking =
        getBookingText(
          page,
          name,
        );

      if (
        (await booking.count()) > 0 &&
        (await booking.isVisible())
      ) {
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
      const name =
        "Confirmation Test User";

      const confirmation =
        page.getByText(
          /confirmed|confirmation|success|booked successfully|booking created/i,
        );

      const visibleBefore =
        await confirmation
          .evaluateAll(
            (elements) =>
              elements.filter((element) => {
                const style =
                  window.getComputedStyle(
                    element,
                  );

                return (
                  style.display !== "none" &&
                  style.visibility !== "hidden"
                );
              }).length,
          );

      await fillBooking(page, {
        name,
      });

      await submitBooking(page);

      const booking =
        getBookingText(
          page,
          name,
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

      await page.waitForTimeout(200);

      const visibleAfter =
        await confirmation
          .evaluateAll(
            (elements) =>
              elements.filter((element) => {
                const style =
                  window.getComputedStyle(
                    element,
                  );

                return (
                  style.display !== "none" &&
                  style.visibility !== "hidden"
                );
              }).length,
          );

      if (
        visibleAfter <= visibleBefore
      ) {
        throw new Error(
          "No new confirmation was displayed after the booking was successfully created.",
        );
      }
    },
  },

  {
    id: "booking-cancel",
    requirement:
      "Allow each booking to be cancelled.",

    async run(page) {
      const name =
        "Cancel Test User";

      const booking =
        await createBooking(page, {
          name,
        });

      const control =
        getCancelControl(
          booking,
        );

      if (
        (await control.count()) === 0 ||
        !(await control.isVisible())
      ) {
        throw new Error(
          "No visible cancellation control was found for the created booking.",
        );
      }

      await control.click();

      await page.waitForTimeout(200);

      if (
        !await bookingIsCancelled(
          booking,
        )
      ) {
        throw new Error(
          "The booking was neither removed nor marked as cancelled after cancellation was attempted.",
        );
      }
    },
  },

  {
    id: "booking-session-memory",
    requirement:
      "Store data only in browser memory for the current page session.",

    async run(page) {
      const name =
        "Session Test User";

      await createBooking(
        page,
        { name },
      );

      await page.reload({
        waitUntil: "load",
      });

      const persisted =
        getBookingText(
          page,
          name,
        );

      if (
        (await persisted.count()) > 0 &&
        (await persisted.isVisible())
      ) {
        throw new Error(
          "The booking persisted after the page was reloaded instead of remaining in page-session memory.",
        );
      }
    },
  },
];