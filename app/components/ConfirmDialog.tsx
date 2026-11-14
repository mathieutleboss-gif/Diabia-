"use client";
import { useEffect, useId, useRef } from "react";
export default function ConfirmDialog({title,description,confirmLabel,onConfirm,onCancel}: {
  title: string; description?: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  const ref=useRef<HTMLDialogElement>(null);
  const titleId=useId(), descriptionId=useId();
  useEffect(() => {
    const dialog=ref.current, precedent=document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const overflow=document.body.style.overflow; document.body.style.overflow="hidden";
    return () => {dialog?.close();document.body.style.overflow=overflow;precedent?.focus();};
  },[]);
  return <dialog ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={event=>{event.preventDefault();onCancel();}} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm">
    <h2 id={titleId} className="text-lg font-semibold text-slate-950">{title}</h2>
    {description && <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" autoFocus onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button><button type="button" onClick={onConfirm} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{confirmLabel}</button></div>
  </dialog>;
}
