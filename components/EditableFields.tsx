"use client";

import { useState } from "react";

type EditableFieldProps = {
  label: string;
  value: string;
  onSave: (value: string) => void;
  emptyText?: string;
  required?: boolean;
};

const buttonClassName =
  "rounded-md border border-line bg-white px-2.5 py-1.5 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf";

const inputClassName = "mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf";

export function EditableText({ label, value, onSave, emptyText = "Not set", required = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function save() {
    if (required && !draft.trim()) {
      return;
    }

    onSave(draft.trim());
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div>
        <label className="block">
          <span className="text-sm font-medium">{label}</span>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} className={inputClassName} />
        </label>
        <EditActions onSave={save} onCancel={() => setIsEditing(false)} disabled={required && !draft.trim()} />
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink/60">{label}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink/70">{value || emptyText}</p>
        </div>
        <button type="button" onClick={startEditing} className={buttonClassName}>
          Edit
        </button>
      </div>
    </div>
  );
}

export function EditableTextarea({ label, value, onSave, emptyText = "Not set", required = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function save() {
    if (required && !draft.trim()) {
      return;
    }

    onSave(draft.trim());
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div>
        <label className="block">
          <span className="text-sm font-medium">{label}</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            className={inputClassName}
          />
        </label>
        <EditActions onSave={save} onCancel={() => setIsEditing(false)} disabled={required && !draft.trim()} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink/60">{label}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink/70">{value || emptyText}</p>
        </div>
        <button type="button" onClick={startEditing} className={buttonClassName}>
          Edit
        </button>
      </div>
    </div>
  );
}

export function EditableDate({ label, value, onSave, required = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function save() {
    if (required && !draft) {
      return;
    }

    onSave(draft);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div>
        <label className="block">
          <span className="text-sm font-medium">{label}</span>
          <input
            type="date"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={inputClassName}
          />
        </label>
        <EditActions onSave={save} onCancel={() => setIsEditing(false)} disabled={required && !draft} />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-ink/60">{label}</p>
        <p className="mt-1 text-sm leading-6 text-ink/70">{value}</p>
      </div>
      <button type="button" onClick={startEditing} className={buttonClassName}>
        Edit
      </button>
    </div>
  );
}

function EditActions({
  onSave,
  onCancel,
  disabled
}: {
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="rounded-md bg-leaf px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
      >
        Save
      </button>
      <button type="button" onClick={onCancel} className={buttonClassName}>
        Cancel
      </button>
    </div>
  );
}
