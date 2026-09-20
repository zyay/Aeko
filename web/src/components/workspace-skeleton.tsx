"use client";

export function WorkspaceSkeleton() {
  return (
    <div className="aeko-root workspace-skeleton" aria-busy="true">
      <div className="skeleton-sidebar" />
      <div className="skeleton-main">
        <div className="skeleton-bar" />
        <div className="skeleton-block" />
        <div className="skeleton-block short" />
      </div>
    </div>
  );
}
