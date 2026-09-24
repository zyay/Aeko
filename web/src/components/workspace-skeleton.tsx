"use client";

import { Mascot } from "@/components/mascot";

export function WorkspaceSkeleton() {
  return (
    <div className="flora" data-theme="dark" aria-busy="true">
      <div className="flora-stage">
        <div className="flora-center plain">
          <Mascot size={48} label="Aeko" />
        </div>
      </div>
    </div>
  );
}
