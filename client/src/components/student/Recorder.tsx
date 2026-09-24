/**
 * Speaking answer recorder: optional preparation countdown, timed recording, upload.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { fileToBase64 } from "@/lib/fileToBase64";

type Phase = "idle" | "requesting" | "preparing" | "recording" | "uploading" | "done" | "error";

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(t => MediaRecorder.isTypeSupported(t));
}

function clock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Recorder({
  attemptId,
  questionId,
  prepSeconds,
  responseSeconds,
  audioUrl,
  onUploaded,
}: {
  attemptId: number;
  questionId: number;
  prepSeconds: number | null;
  responseSeconds: number | null;
  audioUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>(audioUrl ? "done" : "idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const upload = trpc.student.uploadRecording.useMutation();

  const clearTimer = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };
  const countdown = (seconds: number, onDone: () => void) => {
    clearTimer();
    const end = Date.now() + seconds * 1000;
    setSecondsLeft(seconds);
    timer.current = window.setInterval(() => {
      const left = (end - Date.now()) / 1000;
      setSecondsLeft(left);
      if (left <= 0) {
        clearTimer();
        onDone();
      }
    }, 250);
  };

  useEffect(() => () => {
    clearTimer();
    stream.current?.getTracks().forEach(t => t.stop());
  }, []);

  const stop = () => {
    clearTimer();
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const record = async () => {
    const mimeType = pickMimeType();
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream.current!, mimeType ? { mimeType } : undefined);
    recorder.current = rec;
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      setPhase("uploading");
      try {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const { url } = await upload.mutateAsync({
          attemptId,
          questionId,
          base64: await fileToBase64(blob),
          contentType: blob.type.split(";")[0] || "audio/webm",
        });
        onUploaded(url);
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPhase("error");
      }
    };
    rec.start();
    setPhase("recording");
    if (responseSeconds) countdown(responseSeconds, stop);
  };

  const begin = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can't record audio. Please use an up-to-date Chrome, Edge, Firefox or Safari.");
      setPhase("error");
      return;
    }
    setPhase("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow the microphone in your browser settings and try again.");
      setPhase("error");
      return;
    }
    if (prepSeconds) {
      setPhase("preparing");
      countdown(prepSeconds, record);
    } else {
      record();
    }
  };

  return (
    <div className="mt-4 rounded-[5px] border border-ink/15 bg-white p-4">
      {phase === "idle" && (
        <button type="button" onClick={begin} className="flex items-center gap-2 rounded-full bg-brand-red px-5 py-3 font-medium text-white transition-colors hover:bg-ink">
          <Mic className="h-4 w-4" aria-hidden="true" />
          {prepSeconds ? `Start (${prepSeconds}s preparation)` : "Start recording"}
        </button>
      )}

      {phase === "requesting" && (
        <p role="status">Allow microphone access in your browser to start…</p>
      )}

      {phase === "preparing" && (
        <div className="flex flex-wrap items-center gap-4" role="status">
          <span className="text-lg">Preparation time <strong className="font-mono">{clock(secondsLeft)}</strong></span>
          <button type="button" onClick={() => { clearTimer(); record(); }} className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink">
            Start speaking now
          </button>
        </div>
      )}

      {phase === "recording" && (
        <div className="flex flex-wrap items-center gap-4" role="status">
          <span className="flex items-center gap-2 text-lg">
            <span className="h-3 w-3 animate-pulse rounded-full bg-brand-red" aria-hidden="true" />
            Recording{responseSeconds ? <> · <strong className="font-mono">{clock(secondsLeft)}</strong> left</> : null}
          </span>
          <button type="button" onClick={stop} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white">
            <Square className="h-3.5 w-3.5" aria-hidden="true" />Stop
          </button>
        </div>
      )}

      {phase === "uploading" && <p role="status">Saving your recording…</p>}

      {phase === "done" && audioUrl && (
        <div className="flex flex-col gap-3">
          <audio controls src={audioUrl} className="w-full" />
          <button type="button" onClick={begin} className="flex items-center gap-2 self-start text-sm text-ink/70 underline">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Record again
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-brand-red" role="alert">{error}</p>
          <button type="button" onClick={begin} className="self-start rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink">Try again</button>
        </div>
      )}
    </div>
  );
}
