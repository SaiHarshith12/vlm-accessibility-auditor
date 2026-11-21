"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  Loader2,
  MonitorSmartphone,
  Presentation,
  TriangleAlert,
  ShieldCheck,
  Cpu,
} from "lucide-react";

type Kind = "poster" | "ui_screenshot";
type Phase = "idle" | "uploading" | "analyzing" | "vlm_prompt" | "error";

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [kind, setKind] = useState<Kind>("poster");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  const submit = useCallback(
    async (file: File, allowFallback = false) => {
      if (!file.type.startsWith("image/")) {
        setPhase("error");
        setMessage("Only image files are supported (PNG, JPG, WebP).");
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        setPhase("error");
        setMessage("Image exceeds 12MB local buffer limit.");
        return;
      }
      pendingFileRef.current = file;
      setPhase("uploading");
      setMessage(file.name);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("kind", kind);
        if (allowFallback) {
          form.append("allowFallback", "true");
        }
        setPhase("analyzing");
        const res = await fetch("/api/audits", { method: "POST", body: form });
        const json = await res.json();
        if (res.status === 424 || json.vlmFailed) {
          setPhase("vlm_prompt");
          setMessage(json.error ?? "Qwen-VL Vision model failed to respond or is currently offline.");
          return;
        }
        if (!res.ok) throw new Error(json.error ?? "Analysis pipeline failed");
        router.push(`/audits/${json.id}?fresh=1`);
      } catch (err: unknown) {
        setPhase("error");
        setMessage(err instanceof Error ? err.message : "Upload or analysis failed");
      }
    },
    [kind, router],
  );

  const busy = phase === "uploading" || phase === "analyzing";

  return (
    <div className="space-y-4 font-sans">
      {/* Segmented selector tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-1 text-[12px]">
        {(
          [
            ["poster", "Campus Poster", Presentation],
            ["ui_screenshot", "UI Screenshot", MonitorSmartphone],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            disabled={busy}
            onClick={() => setKind(k)}
            className={`flex items-center justify-center gap-1.5 rounded-full py-1.5 transition ${
              kind === k
                ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-medium"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Target upload frame */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) void submit(f);
        }}
        className={`group relative grid min-h-[190px] cursor-pointer place-items-center overflow-hidden rounded-[var(--radius-card)] border border-dashed p-6 text-center transition ${
          drag
            ? "border-[var(--color-accent)] bg-[var(--color-paper-3)]"
            : "border-[var(--color-rule-2)] bg-[var(--color-paper-2)] hover:border-[var(--color-accent)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void submit(f);
            e.target.value = "";
          }}
        />

        {busy ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
            <div className="space-y-1">
              <p className="text-[13px] text-[var(--color-ink)]">
                {phase === "uploading" ? "Buffering payload..." : "Executing vision audit..."}
              </p>
              <p className="max-w-[260px] truncate font-mono text-[11px] text-[var(--color-muted)]">
                {message}
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-2.5 py-0.5 text-[10px] text-[var(--color-muted)]">
              Local VLM + Deterministic Pixel Engine
            </span>
          </div>
        ) : phase === "vlm_prompt" ? (
          <div
            className="flex flex-col items-center gap-3 p-2 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-paper-3)] border border-[var(--color-sienna)] text-[var(--color-sienna)]">
              <Cpu size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] text-[var(--color-ink)]">
                Qwen-VL Vision Model Unavailable
              </p>
              <p className="text-[12px] text-[var(--color-muted)] max-w-sm leading-relaxed">
                {message}
              </p>
              <p className="text-[11.5px] text-[var(--color-muted)] pt-0.5">
                Proceed with Deterministic Pixel Engine, or retry Qwen-VL?
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => pendingFileRef.current && void submit(pendingFileRef.current, true)}
                className="btn btn--primary btn--sm"
              >
                Proceed with Pixel Engine →
              </button>
              <button
                type="button"
                onClick={() => pendingFileRef.current && void submit(pendingFileRef.current, false)}
                className="btn btn--line btn--sm"
              >
                Retry Qwen-VL
              </button>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="text-[11.5px] text-[var(--color-muted)] hover:text-[var(--color-ink)] px-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : phase === "error" ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-paper-3)] border border-[var(--color-vermilion)] text-[var(--color-vermilion)]">
              <TriangleAlert size={18} />
            </div>
            <p className="text-[12.5px] text-[var(--color-vermilion)]">{message}</p>
            <p className="text-[11.5px] text-[var(--color-muted)]">Click to select another image</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-paper-3)] text-[var(--color-accent)] border border-[var(--color-rule)]">
              <CloudUpload size={20} />
            </div>
            <div>
              <p className="text-[13.5px] text-[var(--color-ink)]">
                Drop {kind === "poster" ? "campus poster" : "UI screenshot"} here
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                or <span className="text-[var(--color-ink)] underline underline-offset-4">browse filesystem</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10.5px] text-[var(--color-muted)] font-mono">
              <span className="rounded bg-[var(--color-paper-3)] px-1.5 py-0.5 border border-[var(--color-rule)]">PNG</span>
              <span className="rounded bg-[var(--color-paper-3)] px-1.5 py-0.5 border border-[var(--color-rule)]">JPG</span>
              <span className="rounded bg-[var(--color-paper-3)] px-1.5 py-0.5 border border-[var(--color-rule)]">WEBP</span>
              <span>· Max 12MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Security guarantee pill */}
      <div className="flex items-center justify-between rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-4 py-2 text-[11px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
          <ShieldCheck size={13} />
          <span>Local processing only</span>
        </span>
        <span>Zero cloud egress</span>
      </div>
    </div>
  );
}
