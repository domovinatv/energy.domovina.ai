/** Preuzimanje datoteke iz preglednika (ključ i potvrda o uplati, docs/16). */
export function downloadFile(name: string, data: BlobPart, type = "application/json"): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
