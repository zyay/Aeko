import { termsText } from "@/legal";
import { LegalPage } from "@/components/ui-primitives";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>{termsText}</p>
    </LegalPage>
  );
}
