import { signIn } from "@/auth";
import { AuthGateShell } from "@/components/auth-gate-shell";
import { AppFooter } from "@/components/ui-primitives";
import { GoogleMark, Icon, Icons } from "@/components/icons";
import { LockIcon } from "@primer/octicons-react";

const PIXELS: Record<string, string[]> = {
  A: ["01110", "10001", "11111", "10001", "10001"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
};

function PixelWord() {
  const letters = ["A", "E", "K", "O"];
  const cell = 4;
  const gap = 1;
  const letterW = 5 * (cell + gap) - gap;
  const letterGap = 6;
  const width = letters.length * letterW + (letters.length - 1) * letterGap;
  const height = 5 * (cell + gap) - gap;
  return (
    <svg className="pixel-word" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="AEKO">
      {letters.map((letter, index) =>
        PIXELS[letter]!.flatMap((row, y) =>
          [...row].map((bit, x) =>
            bit === "1" ? (
              <rect
                key={`${letter}-${x}-${y}`}
                x={index * (letterW + letterGap) + x * (cell + gap)}
                y={y * (cell + gap)}
                width={cell}
                height={cell}
                fill="currentColor"
              />
            ) : null,
          ),
        ),
      )}
    </svg>
  );
}

export function AuthScreen({
  after,
  error,
}: {
  after: string;
  error?: string;
}) {
  return (
    <AuthGateShell>
      <PixelWord />
      <p className="auth-tag">Intelligence without surveillance.</p>
      <h1>Sign in</h1>
      <p>Pick a provider. Your keys never leave your device — we only verify who you are.</p>
      {error && <p className="flora-error">{signInProblem(error)}</p>}
      <div className="auth-forms">
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: after });
          }}
        >
          <button type="submit">
            <Icon icon={Icons.brand} size={18} aria-hidden />
            Continue with GitHub
          </button>
        </form>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: after });
          }}
        >
          <button className="alt" type="submit">
            <GoogleMark size={18} />
            Continue with Google
          </button>
        </form>
      </div>
      <div className="trust-row" aria-hidden>
        <span>Device</span>
        <i />
        <Icon icon={LockIcon} size={16} />
        <i />
        <span>Device</span>
      </div>
      <p className="tiny auth-foot">We see your name and avatar. Nothing else. Your messages, keys and models stay on your devices — always.</p>
      <a className="auth-back" href="https://www.getaeko.com">New here? Learn more →</a>
      <AppFooter />
    </AuthGateShell>
  );
}

function signInProblem(error?: string) {
  if (error === "Configuration") return "Sign-in is not configured on this server.";
  if (error === "AccessDenied") return "Access was denied.";
  if (error === "OAuthAccountNotLinked") return "This email is already linked to the other provider.";
  return "GitHub or Google could not finish sign-in. Try again.";
}
