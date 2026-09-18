import { privacyText } from "@/legal";
import { LegalPage } from "@/components/ui-primitives";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>{privacyText}</p>
    </LegalPage>
  );
}
