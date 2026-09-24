"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export default function AdminActionsMenu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!position) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      setPosition(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  const toggle = () => {
    if (position) return setPosition(null);
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const width = 152;
    const height = 150;
    const gap = 7;
    setPosition({
      top:
        window.innerHeight - trigger.bottom > height
          ? trigger.bottom + gap
          : Math.max(gap, trigger.top - height - gap),
      left: Math.max(
        gap,
        Math.min(trigger.right - width, window.innerWidth - width - gap)
      ),
    });
  };

  return (
    <div
      className="admin-actions-menu"
      onClick={event => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="admin-actions-trigger"
        onClick={toggle}
        aria-label={label}
        aria-expanded={!!position}
        aria-haspopup="menu"
      >
        <MoreVertical aria-hidden="true" />
      </button>
      {position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="menu"
            className="admin-actions-popup"
          style={{ ...position, zIndex: 2147483647 }}
            onPointerDown={event => event.stopPropagation()}
            onClick={() => setPosition(null)}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  );
}
