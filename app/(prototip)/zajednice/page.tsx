import type { Metadata } from "next";
import { CommunitiesList } from "@/components/communities";

export const metadata: Metadata = {
  title: "Energetske zajednice",
  description:
    "Zajednica je vidljiva i prije nego pravno postoji. Zamisao i priprema su normalna stanja.",
  robots: { index: false, follow: false },
};

/** `/zajednice` — popis zajednica (docs/07 §2.5). */
export default function CommunitiesPage() {
  return <CommunitiesList />;
}
