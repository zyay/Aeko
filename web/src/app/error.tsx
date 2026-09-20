"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="primer-body">
        <main className="aeko-root onboard">
          <div className="auth-shell">
            <h1>Something went wrong</h1>
            <p>{error.message || "Unexpected error"}</p>
            <button type="button" className="blackpill" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
