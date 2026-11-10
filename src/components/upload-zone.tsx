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
        setMessage("Only image files are supported (PNG / JPG / WebP).");
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        setPhase("error");
        setMessage("Image exceeds the 12MB limit.");
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
        if (!res.ok) throw new Error(json.error ?? "Analysis failed");
        router.push(`/audits/${json.id}?fresh=1`);
      } catch (e) {
        setPhase("error");
        setMessage(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [kind, router],
  );

  const busy = phase === "uploading" || phase === "analyzing";

  return (
    <div>
      {/* kind switch */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-hairline bg-ink p-1">
        {(
          [
            { id: "poster", label: "Campus poster", Icon: Presentation },
            { id: "ui_screenshot", label: "UI screenshot", Icon: MonitorSmartphone },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            disabled={busy}
            onClick={() => setKind(id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition ${
              kind === id
                ? "bg-brand/15 text-brand ring-1 ring-brand/30"
                : "text-inkdim hover:text-white"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

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
        className={`group relative grid min-h-[190px] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed px-5 py-8 text-center transition ${
          drag
            ? "border-brand/70 bg-brand/[0.06]"
            : "border-white/15 bg-white/[0.02] hover:border-brand/40 hover:bg-white/[0.03]"
        }`}
      >
        {busy && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="scanline absolute h-px w-full bg-gradient-to-r from-transparent via-brand to-transparent" />
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
            <Loader2 size={26} className="animate-spin text-brand" />
            <p className="text-[13px] font-medium text-white">
              {phase === "uploading" ? "Uploading image…" : "Running accessibility analysis…"}
            </p>
            <p className="max-w-[280px] truncate text-[11px] text-inkdim">{message}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-inkdim">
              Qwen-VL first · heuristic fallback
            </p>
          </div>
        ) : phase === "error" ? (
          <div className="flex flex-col items-center gap-3">
            <TriangleAlert size={24} className="text-fail" />
            <p className="text-[13px] font-medium text-fail">{message}</p>
            <p className="text-[11px] text-inkdim">Click to try again</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/25 transition group-hover:scale-105">
              <CloudUpload size={20} />
            </span>
            <p className="text-[13px] font-medium text-white">
              Drop a {kind === "poster" ? "poster" : "screenshot"} here, or{" "}
              <span className="text-brand underline underline-offset-4">browse</span>
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-inkdim">
              <FileImage size={12} /> PNG, JPG or WebP up to 12MB — analyzed locally, never leaves this machine
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
