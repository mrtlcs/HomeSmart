// The time format for every clock and time in the panel: the choice in Settings → Appearance ("24" or
// "12"), or, on "auto", the time format of the person's Home Assistant profile, and else the language's.

let hour12: boolean | undefined;

export function setClockFormat(choice: string | undefined, haFormat: string | undefined): void {
  const format = choice === "24" || choice === "12" ? choice : haFormat;
  hour12 = format === "24" ? false : format === "12" ? true : undefined;
}

/** Spread into Intl.DateTimeFormat options that show the hour. */
export const hourOptions = (): { hour12?: boolean } => (hour12 == null ? {} : { hour12 });
