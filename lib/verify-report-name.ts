/** Ime izvještaja o provjeri (PDF i JSON); zaseban modul da ga stranica uzme bez pdf-lib/fontkita. */
export const verifyReportFileName = (sid: string | null, ext: "pdf" | "json") =>
  `provjera-potvrde-${sid ?? "nepoznato"}.${ext}`;
