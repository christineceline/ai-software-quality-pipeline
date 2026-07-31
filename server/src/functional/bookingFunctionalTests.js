function futureDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);

  return date.toISOString().slice(0, 10);
}

function pastDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  return date.toISOString().slice(0, 10);
}

function getNameInput(page) {
  return page.getByTestId("booking-name");
}

function getEmailInput(page) {
  return page.getByTestId("booking-email");
}

function getDateInput(page) {
  return page.getByTestId("booking-date");
}

function getTimeInput(page) {
  return page.getByTestId("booking-time");
}

function getTypeControl(page) {
  return page.getByTestId("booking-type");
}

function getSubmitControl(page) {
  return page.getByTestId("booking-submit");
}

function getBookingList(page) {
  return page.getByTestId("booking-list");
}

function getConfirmation(page) {
  return page.getByTestId(
    "booking-confirmation",
  );
}

function getBooking(page, name) {
  return page
    .getByTestId("booking")
    .filter({
      has: page
        .getByTestId(
          "booking-name-display",
        )
        .filter({
          hasText: name,
        }),
    });
}

async function selectBookingType(page) {
  const control =
    getTypeControl(page);

  if (!(await control.isVisible())) {
    throw new Error(
      'Required test hook "booking-type" was not visible.',
    );
  }

  const tagName =
    await control.evaluate(
      (element) =>
        element.tagName.toLowerCase(),
    );

  if (tagName === "select") {
    const values =
      await control
        .locator("option")
        .evaluateAll((options) =>
          options
            .filter(
              (option) =>
                option.value &&
                !option.disabled,
            )
            .map(
              (option) =>
                option.value,
            ),
        );

    if (values.length === 0) {
      throw new Error(
        "No selectable appointment type was available.",
      );
    }

    await control.selectOption(
      values[0],
    );

    return;
  }

  /*
   * The contract does not require a <select>.
   * For another type of visible selector, activate it.
   */
  await control.click();
}

async function fillBooking(
  page,
  {
    name = "Booking Test Alpha",
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
    if (
      (await field.count()) !== 1 ||
      !(await field.isVisible())
    ) {
      throw new Error(
        `Required booking ${label} input was not available.`,
      );
    }

    await field.fill(value);
  }

  await selectBookingType(page);
}

async function submitBooking(page) {
  const control =
    getSubmitControl(page);

  if (
    (await control.count()) !== 1 ||
    !(await control.isVisible())
  ) {
    throw new Error(
      'Required test hook "booking-submit" was not visible.',
    );
  }

  await control.click();
}

async function createBooking(
  page,
  options = {},
) {
  const name =
    options.name ??
    "Booking Test Alpha";

  await fillBooking(
    page,
    {
      ...options,
      name,
    },
  );

  await submitBooking(page);

  const booking =
    getBooking(page, name);

  try {
    await booking.waitFor({
      state: "visible",
      timeout: 3000,
    });
  } catch {
    throw new Error(
      "The valid booking was not displayed after submission.",
    );
  }

  return booking;
}

export const bookingFunctionalTests = [
  {
    id: "booking-fields",

    requirement:
      "Include fields for customer name, email address, appointment date and appointment time.",

    async run(page) {
      const fields = [
        ["booking-name", getNameInput(page)],
        ["booking-email", getEmailInput(page)],
        ["booking-date", getDateInput(page)],
        ["booking-time", getTimeInput(page)],
      ];

      for (
        const [testId, field]
        of fields
      ) {
        if (
          (await field.count()) !== 1 ||
          !(await field.isVisible())
        ) {
          throw new Error(
            `Required test hook "${testId}" was not visible.`,
          );
        }
      }
    },
  },

  {
    id: "booking-type",

    requirement:
      "Include a selectable appointment type.",

    async run(page) {
      await selectBookingType(page);
    },
  },

  {
    id: "booking-required-fields",

    requirement:
      "Prevent a booking from being created when required information is missing.",

    async run(page) {
      const before =
        await page
          .getByTestId("booking")
          .count();

      await getNameInput(page).fill(
        "Booking Test Beta",
      );

      try {
        await submitBooking(page);
      } catch {
        /*
         * Native browser validation may prevent
         * submission. That is valid behaviour.
         */
      }

      await page.waitForTimeout(100);

      const after =
        await page
          .getByTestId("booking")
          .count();

      if (after > before) {
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
        "Booking Test Gamma";

      await fillBooking(page, {
        name,
        email: "invalid-email",
      });

      await submitBooking(page);

      await page.waitForTimeout(100);

      const invalidBooking =
        getBooking(page, name);

      if (
        (await invalidBooking.count()) >
          0 &&
        (await invalidBooking.isVisible())
      ) {
        throw new Error(
          "A booking was created using an invalid email address.",
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
        "Booking Test Delta";

      await fillBooking(page, {
        name,
        date: pastDate(),
      });

      await submitBooking(page);

      await page.waitForTimeout(100);

      const invalidBooking =
        getBooking(page, name);

      if (
        (await invalidBooking.count()) >
          0 &&
        (await invalidBooking.isVisible())
      ) {
        throw new Error(
          "A booking was created for a date in the past.",
        );
      }
    },
  },

  {
    id: "booking-create",

    requirement:
      "After a valid booking is submitted, display the booking in a visible list or booking area.",

    async run(page) {
      const list =
        getBookingList(page);

      if (!(await list.isVisible())) {
        throw new Error(
          'Required test hook "booking-list" was not visible.',
        );
      }

      await createBooking(page, {
        name:
          "Booking Test Epsilon",
      });
    },
  },

  {
    id: "booking-confirmation",

    requirement:
      "Display a visible confirmation after a valid booking is successfully created.",

    async run(page) {
      await createBooking(page, {
        name:
          "Booking Test Zeta",
      });

      const confirmation =
        getConfirmation(page);

      if (
        (await confirmation.count()) !==
          1 ||
        !(await confirmation.isVisible())
      ) {
        throw new Error(
          "No visible booking confirmation was displayed after successful creation.",
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
        "Booking Test Eta";

      let booking =
        await createBooking(
          page,
          { name },
        );

      const cancelControl =
        booking.getByTestId(
          "booking-cancel",
        );

      if (
        (await cancelControl.count()) !==
          1 ||
        !(await cancelControl.isVisible())
      ) {
        throw new Error(
          'Required test hook "booking-cancel" was not visible.',
        );
      }

      const dialogHandler = async (
        dialog,
      ) => {
        await dialog.accept();
      };

      page.on(
        "dialog",
        dialogHandler,
      );

      try {
        await cancelControl.click();
      } finally {
        page.off(
          "dialog",
          dialogHandler,
        );
      }

      /*
       * Re-query because cancellation may rebuild
       * or remove the booking.
       */
      booking =
        getBooking(page, name);

      if (
        (await booking.count()) === 0
      ) {
        return;
      }

      if (
        !(await booking.isVisible())
      ) {
        return;
      }

      const status =
        await booking.getAttribute(
          "data-status",
        );

      if (status !== "cancelled") {
        throw new Error(
          'The booking remained visible after cancellation without data-status="cancelled".',
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
        "Booking Test Theta";

      await createBooking(
        page,
        { name },
      );

      await page.reload({
        waitUntil: "load",
      });

      const persisted =
        getBooking(
          page,
          name,
        );

      if (
        (await persisted.count()) > 0 &&
        (await persisted.isVisible())
      ) {
        throw new Error(
          "The booking persisted after the page was refreshed.",
        );
      }
    },
  },
];