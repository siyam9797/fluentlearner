/**
 * Speaking answer recorder: optional preparation countdown, timed recording, upload.
 * Where the browser supports it (Chrome, Edge), speech is also transcribed live; the transcript is what AI marking reads.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { fileToBase64 } from "@/lib/fileToBase64";
import { HvActionButton } from "@/components/home-v2/primitives";

type Phase =
  | "idle"
  | "requesting"
  | "preparing"
  | "recording"
  | "uploading"
  | "done"
  | "error";

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ].find(t => MediaRecorder.isTypeSupported(t));
}

/** Minimal typing for the Web Speech API, which TypeScript's DOM library doesn't include. */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function createRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (
      window as unknown as Record<
        string,
        (new () => SpeechRecognitionLike) | undefined
      >
    ).SpeechRecognition ??
    (
      window as unknown as Record<
        string,
        (new () => SpeechRecognitionLike) | undefined
      >
    ).webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = "en-GB";
  recognition.continuous = true;
  recognition.interimResults = false;
  return recognition;
}

const speechToTextSupported = () => createRecognition() !== null;

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
  onUploaded: (url: string, transcript: string | null) => void;
}) {
  const [phase, setPhase] = useState<Phase>(audioUrl ? "done" : "idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const upload = trpc.student.uploadRecording.useMutation();
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const transcript = useRef<string[]>([]);
  const listening = useRef(false);
  const [canTranscribe] = useState(speechToTextSupported);

  const startTranscribing = () => {
    transcript.current = [];
    const rec = createRecognition();
    if (!rec) return;
    recognition.current = rec;
    listening.current = true;
    rec.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal)
          transcript.current.push(result[0].transcript.trim());
      }
    };
    // Chrome ends recognition after a pause; keep it going for as long as we're recording.
    rec.onend = () => {
      if (listening.current) {
        try {
          rec.start();
        } catch {
          // already restarting
        }
      }
    };
    rec.onerror = event => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      )
        listening.current = false;
    };
    try {
      rec.start();
    } catch {
      listening.current = false;
    }
  };
  const stopTranscribing = () => {
    listening.current = false;
    recognition.current?.stop();
  };

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

  useEffect(
    () => () => {
      clearTimer();
      listening.current = false;
      recognition.current?.stop();
      stream.current?.getTracks().forEach(t => t.stop());
    },
    []
  );

  const stop = () => {
    clearTimer();
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const record = async () => {
    const mimeType = pickMimeType();
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(
      stream.current!,
      mimeType ? { mimeType } : undefined
    );
    recorder.current = rec;
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stopTranscribing();
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      setPhase("uploading");
      // Give the recogniser a moment to deliver the last phrase.
      await new Promise(resolve => setTimeout(resolve, 600));
      const text = canTranscribe ? transcript.current.join(" ").trim() : null;
      try {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const { url } = await upload.mutateAsync({
          attemptId,
          questionId,
          base64: await fileToBase64(blob),
          contentType: blob.type.split(";")[0] || "audio/webm",
          transcript: text,
        });
        onUploaded(url, text);
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPhase("error");
      }
    };
    rec.start();
    startTranscribing();
    setPhase("recording");
    if (responseSeconds) countdown(responseSeconds, stop);
  };

  const begin = async () => {
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "This browser can't record audio. Please use an up-to-date Chrome, Edge, Firefox or Safari."
      );
      setPhase("error");
      return;
    }
    setPhase("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch {
      setError(
        "Microphone access was blocked. Allow the microphone in your browser settings and try again."
      );
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
    <div className="mt-4 rounded-[var(--radius-control)] bg-white p-4 ring-1 ring-ink/8">
      {!canTranscribe && (phase === "idle" || phase === "done") && (
        <p className="mb-3 text-sm text-ink/60">
          Tip: open this test in Chrome or Edge to get instant AI feedback on
          your speaking. In this browser your recording is saved for your mentor
          to mark.
        </p>
      )}
      {phase === "idle" && (
        <HvActionButton
          onClick={begin}
          variant="red"
          size="sm"
          className="rounded-full"
          icon={<Mic className="h-4 w-4" aria-hidden="true" />}
        >
          {prepSeconds
            ? `Start (${prepSeconds}s preparation)`
            : "Start recording"}
        </HvActionButton>
      )}

      {phase === "requesting" && (
        <p role="status">Allow microphone access in your browser to start…</p>
      )}

      {phase === "preparing" && (
        <div className="flex flex-wrap items-center gap-4" role="status">
          <span className="text-lg">
            Preparation time{" "}
            <strong className="font-mono">{clock(secondsLeft)}</strong>
          </span>
          <HvActionButton
            onClick={() => {
              clearTimer();
              record();
            }}
            variant="outline"
            size="xs"
            className="rounded-full"
          >
            Start speaking now
          </HvActionButton>
        </div>
      )}

      {phase === "recording" && (
        <div className="flex flex-wrap items-center gap-4" role="status">
          <span className="flex items-center gap-2 text-lg">
            <span
              className="h-3 w-3 animate-pulse rounded-full bg-brand-red"
              aria-hidden="true"
            />
            Recording
            {responseSeconds ? (
              <>
                {" "}
                · <strong className="font-mono">
                  {clock(secondsLeft)}
                </strong>{" "}
                left
              </>
            ) : null}
          </span>
          <HvActionButton
            onClick={stop}
            size="xs"
            className="rounded-full"
            icon={<Square className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Stop
          </HvActionButton>
        </div>
      )}

      {phase === "uploading" && <p role="status">Saving your recording…</p>}

      {phase === "done" && audioUrl && (
        <div className="flex flex-col gap-3">
          <audio controls src={audioUrl} className="w-full" />
          <HvActionButton
            onClick={begin}
            variant="outline"
            size="xs"
            className="self-start rounded-full"
            icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Record again
          </HvActionButton>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-brand-red" role="alert">
            {error}
          </p>
          <HvActionButton
            onClick={begin}
            variant="outline"
            size="xs"
            className="self-start rounded-full"
          >
            Try again
          </HvActionButton>
        </div>
      )}
    </div>
  );
}
