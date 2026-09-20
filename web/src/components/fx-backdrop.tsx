"use client";

export function FxBackdrop() {
  return (
    <div className="fx-backdrop" aria-hidden>
      <div className="fx-aurora fx-aurora-a" />
      <div className="fx-aurora fx-aurora-b" />
      <div className="fx-aurora fx-aurora-c" />
      <div className="fx-grid" />
      <div className="fx-noise" />
      <div className="fx-vignette" />
    </div>
  );
}
