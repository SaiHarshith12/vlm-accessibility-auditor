"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  FileImage,
  Loader2,
  MonitorSmartphone,
  Presentation,
  TriangleAlert,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";

type Kind = "poster" | "ui_screenshot";
type Phase = "idle" | "uploading" | "analyzing" | "error";

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [kind, setKind] = useState<Kind>("poster");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  const submit = useCallback(
    async (file: File) => {
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
      setPhase("uploading");
      setMessage(file.name);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("kind", kind);
        setPhase("analyzing");
        const res = await fetch("/api/audits", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Analysis pipeline failed");
        router.push(`/audits/${json.id}?fresh=1`);
      } catch (e) {
        setPhase("error");
        setMessage(e instanceof Error ? e.message : "Audit failed to initialize");
      }
    },
    [kind, router],
  );

  const busy = phase === "uploading" || phase === "analyzing";

  return (
    <div className="space-y-3">
      {/* Target artifact mode selector */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-hairline bg-surface-0/90 p-1 font-mono text-[11.5px]">
        {(
          [
            { id: "poster", label: "Campus Poster", Icon: Presentation },
            { id: "ui_screenshot", label: "UI Screenshot", Icon: MonitorSmartphone },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            disabled={busy}
            onClick={() => setKind(id)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 transition ${
              kind === id
                ? "bg-brand text-ink-950 font-bold shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]"
                : "text-inkdim hover:text-white"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Target HUD upload frame */}
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
        className={`group reticle-box relative grid min-h-[200px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed p-6 text-center transition-all ${
          drag
            ? "border-brand bg-brand/[0.08] shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            : "border-hairline bg-surface-0/60 hover:border-brand/50 hover:bg-surface-1/70"
        }`}
      >
        {busy && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="scanner-beam absolute h-12 w-full bg-gradient-to-b from-brand/0 via-brand/20 to-brand/40 border-b border-brand" />
          </div>
        )}

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
            <div className="relative">
              <Loader2 size={32} className="animate-spin text-brand" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu size={14} className="text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[13px] font-bold text-white tracking-wide">
                {phase === "uploading" ? "STAGE 1: BUFFERING PAYLOAD" : "STAGE 2: EXECUTING VISION AUDIT"}
              </p>
              <p className="max-w-[260px] truncate font-mono text-[11px] text-brand-light">
                {message}
              </p>
            </div>
            <span className="rounded bg-white/5 border border-hairline px-2 py-0.5 font-mono text-[10px] text-inkdim">
              Local VLM + Deterministic Pixel Engine
            </span>
          </div>
        ) : phase === "error" ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <TriangleAlert size={20} />
            </div>
            <p className="font-mono text-[12.5px] font-semibold text-rose-400">{message}</p>
            <p className="text-[11px] text-inkdim underline underline-offset-4">Click to select another image</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/30 transition group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <CloudUpload size={22} />
            </div>
            <div>
              <p className="font-mono text-[13.5px] font-bold text-white tracking-tight">
                Drop {kind === "poster" ? "campus poster" : "UI screenshot"} here
              </p>
              <p className="mt-1 text-[11.5px] text-inkdim">
                or <span className="font-medium text-brand-light underline underline-offset-4">browse filesystem</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[10px] text-inkdim/80">
              <span className="rounded bg-surface-2 px-1.5 py-0.5 border border-hairline">PNG</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 border border-hairline">JPG</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 border border-hairline">WEBP</span>
              <span>· Max 12MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Security guarantee pill */}
      <div className="flex items-center justify-between rounded-lg border border-hairline/70 bg-surface-1/50 px-3 py-2 font-mono text-[10.5px] text-inkdim">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck size={13} />
          <span>Local processing only</span>
        </span>
        <span className="text-inkdim/60">Zero cloud egress</span>
      </div>
    </div>
  );
}
