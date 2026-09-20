"use client";

import { Icon, Icons } from "@/components/icons";

export function RenameModal({
  open,
  title,
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <input className="field" autoFocus value={value} onChange={(e) => onChange(e.target.value)} aria-label="Task name" />
        <div className="modal-actions">
          <button type="button" className="ghostlink" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="blackpill" onClick={onSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function InviteModal({
  open,
  email,
  role,
  onEmail,
  onRole,
  onClose,
  onSubmit,
}: {
  open: boolean;
  email: string;
  role: "member" | "owner";
  onEmail: (v: string) => void;
  onRole: (v: "member" | "owner") => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Invite collaborator">
        <h2>Invite to task</h2>
        <input className="field" value={email} onChange={(e) => onEmail(e.target.value)} placeholder="Email address" />
        <label className="modal-label">
          Role
          <select className="field" value={role} onChange={(e) => onRole(e.target.value as "member" | "owner")}>
            <option value="member">Member</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="ghostlink" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="blackpill" onClick={onSubmit}>
            <Icon icon={Icons.team} size={16} aria-hidden /> Send invite
          </button>
        </div>
      </div>
    </div>
  );
}
