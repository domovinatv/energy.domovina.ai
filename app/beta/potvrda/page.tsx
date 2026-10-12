import type { Metadata } from "next";
import { ReceiptPage } from "@/components/beta/receipt-page";

export const metadata: Metadata = {
  title: "Potvrda o uplati",
  description: "Potvrda o uplati vezana uz ključ uplatitelja, sidrena na Bitcoinu (OpenTimestamps).",
};

/**
 * `/beta/potvrda/?sid=r1…` — potvrda o uplati (docs/16 §4 #7). Statički export,
 * pa je `sid` u upitu, a ne u ruti; sve se dohvaća u pregledniku.
 */
export default function Page() {
  return <ReceiptPage />;
}
