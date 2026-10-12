import type { Metadata } from "next";
import { VerifyPage } from "@/components/beta/verify-page";

export const metadata: Metadata = {
  title: "Provjera potvrde o uplati",
  description: "Neovisna provjera potvrde o uplati korak po korak, u pregledniku: sid, ključ, Merkle dokazi, sidro, Bitcoin i Gnosis Chain.",
};

/** `/beta/provjera/` — provjera potvrde iz PDF-a ili JSON-a (docs/16 §7). */
export default function Page() {
  return <VerifyPage />;
}
