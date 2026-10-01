import QRCode from "qrcode";
import { BetaPage } from "@/components/beta/beta-page";
import {
  BETA_PROJECTS,
  buildEpcText,
  isPayable,
  remittanceFor,
} from "@/lib/beta-projects";

/**
 * /beta/ — tri prava projekta (docs/15).
 *
 * QR kodovi se rade PRI BUILDU: uputa za uplatu je statična (IBAN + opis
 * plaćanja), pa preglednik ne treba ni biblioteku za QR ni poziv prema railu.
 * Projekt bez Safea ili načina uplate nema QR — vidi `isPayable`.
 */
export default async function Page() {
  const qrBySlug: Record<string, string> = {};
  for (const project of BETA_PROJECTS) {
    if (!isPayable(project)) continue;
    const epc = buildEpcText({
      beneficiaryName: project.payment.beneficiaryName,
      iban: project.payment.iban,
      bic: project.payment.bic,
      remittance: remittanceFor(project),
    });
    // ECC M (ne H — gušća mreža, sitniji moduli) i tiha zona od 4 modula kako
    // EPC069-12 / ISO 18004 traže; uz prikaz ≥ 320 px to čita i Revolut iOS.
    qrBySlug[project.slug] = await QRCode.toString(epc, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 4,
    });
  }
  return <BetaPage qrBySlug={qrBySlug} />;
}
