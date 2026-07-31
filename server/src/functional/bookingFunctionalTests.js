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
        'input[type="date"], input[name*="date" i]',
      ),
    )
    .first();
}

function getTimeInput(page) {
  return page
    .getByLabel(/time/i)
    .or(
      page.locator(
        'input[type="time"], input[name*="time" i]',
      ),
    )
    .first();
}

function getTypeSelect(page) {
  return page
    .getByLabel(/type|service|appointment/i)
    .or(page.locator("select"))
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
    [getNameInput(page), name, "name"],
    [getEmailInput(page), email, "email"],
    [getDateInput(page), date, "date"],
    [getTimeInput(page), time, "time"],
  ];

  for (
    const [field, value, label]
    of fields
  ) {
    if ((await field.count()) === 0) {
      throw new Error(
        `The booking ${label} field could not be found.`,
      );
    }

    if (!(await field.isVisible())) {
      throw new Error(
        `The booking ${label} field was not visible.`,
      );
    }

    try {
      await field.fill(value);
    } catch {
      throw new Error(
        `The booking ${label} field could not be completed.`,
      );
    }
  }

  const typeSelect =
    getTypeSelect(page);

  if ((await typeSelect.count()) > 0) {
    const options = await typeSelect
      .locator("option")
      .evaluateAll((elements) =>
        elements
          .map((element) => ({
            value: element.value,
            disabled: element.disabled,
          }))
          .filter(
            (option) =>
              option.value &&
              !option.disabled,
          ),
      );

    if (options.length > 0) {
      try {
        await typeSelect.selectOption(
          options[0].value,
        );
      } catch {
        throw new Error(
          "The appointment type could not be selected.",
        );
      }
    }
  }
}

function getSubmitControl(page) {
  return page
    .getByRole("button", {
      name:
        /book|submit|create|confirm|save|schedule/i,
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

  if ((await control.count()) === 0) {
    throw new Error(
      "No booking submission control was found.",
    );
  }

  if (!(await control.isVisible())) {
    throw new Error(
      "The booking submission control was not visible.",
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

async function getBookingContainer(
  page,
  name,
) {
  const text =
    getBookingText(
      page,
      name,
    );

  if ((await text.count()) === 0) {
    return null;
  }

  /*
   * Prefer structural containers without
   * depending on generated class names.
   */
  const structuralContainer = text
    .locator(
      "xpath=ancestor::*[" +
        "self::li or " +
        "@role='listitem' or " +
        "self::article or " +
        "self::tr" +
      "][1]",
    );

  if (
    (await structuralContainer.count()) > 0
  ) {
    return structuralContainer;
  }

  return text
    .locator("xpath=parent::*")
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

  const bookingText =
    getBookingText(
      page,
      name,
    );

  try {
    await bookingText.waitFor({
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
      name:
        /cancel|delete|remove/i,
    })
    .or(
      booking.getByRole("link", {
        name:
          /cancel|delete|remove/i,
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
        ].join(", "),
      ),
    )
    .first();
}

async function bookingIsCancelled(
  booking,
) {
  if (!booking) {
    return true;
  }

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
        typeof element.className ===
        "string"
          ? element.className
              .toLowerCase()
              .split(/\s+/)
          : [];

      const status =
        element
          .getAttribute("data-status")
          ?.toLowerCase();

      const ariaLabel =
        element
          .getAttribute("aria-label")
          ?.toLowerCase() ?? "";

      return (
        text.includes("cancelled") ||
        text.includes("canceled") ||
        classes.includes("cancelled") ||
        classes.includes("canceled") ||
        classes.includes("is-cancelled") ||
        classes.includes("is-canceled") ||
        status === "cancelled" ||
        status === "canceled" ||
        ariaLabel.includes("cancelled") ||
        ariaLabel.includes("canceled")
      );
    },
  );
}

async function acceptHtmlConfirmation(
  page,
) {
  const dialog = page
    .getByRole("dialog")
    .filter({
      hasText:
        /cancel|delete|remove|are you sure|confirm/i,
    })
    .first();

  if (
    (await dialog.count()) === 0 ||
    !(await dialog.isVisible())
  ) {
    return;
  }

  const confirmControl = dialog
    .getByRole("button", {
      name:
        /confirm|yes|cancel booking|delete|remove/i,
    })
    .or(
      dialog.getByRole("link", {
        name:
          /confirm|yes|cancel booking|delete|remove/i,
      }),
    )
    .first();

  if (
    (await confirmControl.count()) > 0 &&
    (await confirmControl.isVisible())
  ) {
    await confirmControl.click();
  }
}

async function countVisibleConfirmations(
  page,
) {
  const candidates = page.getByText(
    /confirmed|confirmation|success|successfully booked|booking created|appointment booked|booking successful/i,
  );

  let visibleCount = 0;

  for (
    let index = 0;
    index < await candidates.count();
    index++
  ) {
    if (
      await candidates
        .nth(index)
        .isVisible()
        .catch(() => false)
    ) {
      visibleCount += 1;
    }
  }

  return visibleCount;
}

export const bookingFunctionalTests = [
  {
    id: "booking-create",

    requirement:
      "After a valid booking is submitted, display the booking in a visible list or booking area.",

    async run(page) {
      await createBooking(page);
    },
  },

  {
    id: "booking-required-fields",

    requirement:
      "Prevent a booking from being created when required information is missing.",

    async run(page) {
      const testName =
        "Missing Fields Test User";

      const name =
        getNameInput(page);

      if ((await name.count()) > 0) {
        await name.fill(
          testName,
        );
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
          "A booking was created even though required information was missing.",
        );
      }
    },
  },

  {
    id: "booking-email-validation",

    requirement:
      "Reject an email address that is not in a valid email format using browser-side validation.",

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

      const validationMessage = page
        .getByText(
          /invalid email|valid email|email.*invalid|enter.*valid.*email/i,
        )
        .first();

      if (
        (await validationMessage.count()) ===
          0 ||
        !(await validationMessage.isVisible())
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
      "Prevent a booking from being created for a date in the past.",

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
      "Display a visible confirmation after a valid booking is successfully created.",

    async run(page) {
      const confirmationBefore =
        await countVisibleConfirmations(
          page,
        );

      const name =
        "Confirmation Test User";

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

      const confirmationAfter =
        await countVisibleConfirmations(
          page,
        );

      if (
        confirmationAfter <=
        confirmationBefore
      ) {
        throw new Error(
          "No new visible confirmation was displayed after the booking was successfully created.",
        );
      }
    },
  },

  {
    id: "booking-cancel",

    requirement:
      "Allow each booking to be cancelled. Cancellation may either remove the booking from the active list or clearly mark it as cancelled.",

    async run(page) {
      const name =
        "Cancel Test User";

      let booking =
        await createBooking(
          page,
          { name },
        );

      if (!booking) {
        throw new Error(
          "The created booking could not be located before cancellation.",
        );
      }

      const control =
        getCancelControl(
          booking,
        );

      if (
        (await control.count()) ===
          0 ||
        !(await control.isVisible())
      ) {
        throw new Error(
          "No visible cancellation control was found for the created booking.",
        );
      }

      const dialogHandler = async (
        dialog,
      ) => {
        try {
          await dialog.accept();
        } catch {
          // Already handled.
        }
      };

      page.on(
        "dialog",
        dialogHandler,
      );

      try {
        await control.click();

        await page.waitForTimeout(100);

        booking =
          await getBookingContainer(
            page,
            name,
          );

        if (
          !await bookingIsCancelled(
            booking,
          )
        ) {
          await acceptHtmlConfirmation(
            page,
          );

          await page.waitForTimeout(
            200,
          );
        }
      } finally {
        page.off(
          "dialog",
          dialogHandler,
        );
      }

      booking =
        await getBookingContainer(
          page,
          name,
        );

      if (
        !await bookingIsCancelled(
          booking,
        )
      ) {
        throw new Error(
          "The booking was neither removed nor clearly marked as cancelled after cancellation was attempted.",
        );
      }
    },
  },

  {
    id: "booking-session-memory",

    requirement:
      "Keep booking data in page memory only. Refreshing or reopening the page must reset the booking data.",

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
          "The booking persisted after the page was refreshed instead of being kept only in page memory.",
        );
      }
    },
  },
];