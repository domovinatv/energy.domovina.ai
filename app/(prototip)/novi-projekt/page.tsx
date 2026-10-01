import type { Metadata } from "next";
import { NewProjectWizard } from "@/components/new-project-wizard";

export const metadata: Metadata = {
  title: "Novi projekt",
  description:
    "Čarobnjak za novi projekt. Redoslijed pitanja je pravno određen: tip nositelja je prvo pitanje.",
  robots: { index: false, follow: false },
};

/** `/novi-projekt` — čarobnjak (docs/07 §2.7, redoslijed po docs/03 §8). */
export default function NewProjectPage() {
  return <NewProjectWizard />;
}
