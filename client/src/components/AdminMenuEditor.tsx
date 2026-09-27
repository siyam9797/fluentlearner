"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ChevronDown, GripVertical } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { V2_MENU_PAGES, type V2MenuItem } from "@/components/home-v2/content";
import { normalizeMenu } from "@/components/home-v2/useV2Content";
import { V2 } from "@/components/home-v2/routes";

/** Horizontal drag distance that nests or un-nests an item, like WordPress. */
const INDENT = 32;
const MAX_DEPTH = 1;

const inputClass =
  "h-10 w-full border border-[#d9d9d9] bg-white px-3 text-sm outline-none focus:border-[#c76f42]";
const linkButton =
  "text-[#c76f42] hover:underline disabled:text-[#b9bec4] disabled:no-underline";

const newId = () =>
  `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Index just past `i` and all of its sub-items. */
function blockEnd(items: V2MenuItem[], i: number) {
  let j = i + 1;
  while (j < items.length && items[j].depth > items[i].depth) j++;
  return j;
}

/** Moves item `i` with its sub-items to `insertAt` (an index in the original list) and shifts their depth. */
function moveBlock(
  items: V2MenuItem[],
  i: number,
  insertAt: number,
  depth: number
) {
  const end = blockEnd(items, i);
  const delta = depth - items[i].depth;
  const block = items
    .slice(i, end)
    .map(item => ({ ...item, depth: item.depth + delta }));
  const rest = [...items.slice(0, i), ...items.slice(end)];
  rest.splice(insertAt > i ? insertAt - block.length : insertAt, 0, ...block);
  return normalizeMenu(rest, MAX_DEPTH);
}

function previousSibling(items: V2MenuItem[], i: number) {
  for (let j = i - 1; j >= 0; j--) {
    if (items[j].depth === items[i].depth) return j;
    if (items[j].depth < items[i].depth) return -1;
  }
  return -1;
}

function parentOf(items: V2MenuItem[], i: number) {
  for (let j = i - 1; j >= 0; j--)
    if (items[j].depth < items[i].depth) return j;
  return -1;
}

function AddPanel({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#e3e3e3]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between text-sm font-medium text-[#30363d]"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function CheckList({
  options,
  onAdd,
}: {
  options: { label: string; url: string }[];
  onAdd: (picked: { label: string; url: string }[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  if (!options.length)
    return <p className="text-sm text-[#747d87]">Nothing to add yet.</p>;
  return (
    <>
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {options.map(option => (
          <label
            key={option.url}
            className="flex items-center gap-2 text-sm text-[#30363d]"
          >
            <input
              type="checkbox"
              checked={picked.includes(option.url)}
              onChange={event =>
                setPicked(current =>
                  event.target.checked
                    ? [...current, option.url]
                    : current.filter(url => url !== option.url)
                )
              }
              className="accent-[#c76f42]"
            />
            {option.label}
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          disabled={!picked.length}
          onClick={() => {
            onAdd(options.filter(option => picked.includes(option.url)));
            setPicked([]);
          }}
          className="admin-button admin-button-secondary h-9 px-4 text-sm"
        >
          Add to Menu
        </button>
        <button
          type="button"
          onClick={() =>
            setPicked(
              picked.length === options.length ? [] : options.map(o => o.url)
            )
          }
          className={`text-xs ${linkButton}`}
        >
          {picked.length === options.length ? "Clear all" : "Select all"}
        </button>
      </div>
    </>
  );
}

export default function AdminMenuEditor({
  value,
  onChange,
  header,
  footer,
  disabled = false,
}: {
  value: V2MenuItem[];
  onChange: (items: V2MenuItem[]) => void;
  /** Shown above the menu structure, e.g. the menu name and Save button. */
  header?: ReactNode;
  /** Shown below the menu structure, e.g. menu settings and Delete. */
  footer?: ReactNode;
  /** Greys out "Add menu items" until there is a menu to add to. */
  disabled?: boolean;
}) {
  const items = value;
  const [panel, setPanel] = useState<"pages" | "courses" | "custom" | null>(
    "pages"
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("https://");
  const [customLabel, setCustomLabel] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [drop, setDrop] = useState<{
    index: number;
    after: boolean;
    depth: number;
  } | null>(null);
  const dragStartX = useRef(0);
  const { data: courses = [] } = trpc.courses.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const commit = (next: V2MenuItem[]) =>
    onChange(normalizeMenu(next, MAX_DEPTH));
  const add = (entries: { label: string; url: string }[]) =>
    commit([
      ...items,
      ...entries.map(entry => ({
        id: newId(),
        label: entry.label,
        url: entry.url,
        depth: 0,
      })),
    ]);
  const update = (i: number, patch: Partial<V2MenuItem>) =>
    commit(items.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const remove = (i: number) => {
    // Sub-items move up a level, as in WordPress.
    const end = blockEnd(items, i);
    commit([
      ...items.slice(0, i),
      ...items
        .slice(i + 1, end)
        .map(item => ({ ...item, depth: item.depth - 1 })),
      ...items.slice(end),
    ]);
  };

  const courseOptions = courses.map(course => ({
    label: course.nameEn || course.name,
    url: V2.course(course.slug || course.id),
  }));
  const typeOf = (url: string) =>
    V2_MENU_PAGES.some(page => page.url === url)
      ? "Page"
      : url.startsWith(`${V2.courses}/`)
        ? "Course"
        : "Custom Link";

  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (dragIndex === null) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    const shift = Math.round((event.clientX - dragStartX.current) / INDENT);
    const depth = Math.max(
      0,
      Math.min(
        MAX_DEPTH,
        items[index].depth + (after ? shift : Math.min(shift, 0))
      )
    );
    setDrop({ index, after, depth });
  };

  const onDrop = () => {
    if (dragIndex === null || !drop) return;
    const { index, after, depth } = drop;
    const end = blockEnd(items, dragIndex);
    setDragIndex(null);
    setDrop(null);
    if (index >= dragIndex && index < end) return; // onto itself or its own sub-items
    let insertAt = after ? index + 1 : index;
    // Dropped after a parent but kept top level: go below its sub-items, not between them.
    if (after && depth === 0 && blockEnd(items, index) > index + 1)
      insertAt = blockEnd(items, index);
    commit(moveBlock(items, dragIndex, insertAt, depth));
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div
        className={`lg:self-start ${disabled ? "pointer-events-none opacity-50" : ""}`}
        aria-disabled={disabled}
      >
        <p className="border-b border-[#e3e3e3] pb-3 text-sm font-medium text-[#30363d]">
          Add menu items
        </p>
        <AddPanel
          title="Pages"
          open={panel === "pages"}
          onToggle={() => setPanel(panel === "pages" ? null : "pages")}
        >
          <CheckList options={V2_MENU_PAGES} onAdd={add} />
        </AddPanel>
        <AddPanel
          title="Courses"
          open={panel === "courses"}
          onToggle={() => setPanel(panel === "courses" ? null : "courses")}
        >
          <CheckList options={courseOptions} onAdd={add} />
        </AddPanel>
        <AddPanel
          title="Custom Links"
          open={panel === "custom"}
          onToggle={() => setPanel(panel === "custom" ? null : "custom")}
        >
          <form
            onSubmit={event => {
              event.preventDefault();
              if (!customLabel.trim() || !customUrl.trim()) return;
              add([{ label: customLabel.trim(), url: customUrl.trim() }]);
              setCustomLabel("");
              setCustomUrl("https://");
            }}
            className="space-y-3"
          >
            <label className="block text-xs font-medium text-[#30363d]">
              URL
              <input
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-xs font-medium text-[#30363d]">
              Link Text
              <input
                value={customLabel}
                onChange={e => setCustomLabel(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <div className="flex">
              <button
                type="submit"
                disabled={!customLabel.trim() || !customUrl.trim()}
                className="admin-button admin-button-secondary h-9 px-4 text-sm"
              >
                Add to Menu
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-[#747d87]">
            Use # as the URL for a dropdown heading that isn't a link.
          </p>
        </AddPanel>
      </div>

      <div className="min-w-0">
        {header && (
          <div className="border-b border-[#e3e3e3] pb-5">{header}</div>
        )}
        <div className="py-5">
          <p className="mb-1 text-sm font-medium text-[#30363d]">
            Menu structure
          </p>
          <p className="mb-4 text-xs text-[#747d87]">
            Drag items into the order you prefer. Drag an item to the right to
            make it a dropdown item under the one above.
          </p>
          {items.length === 0 && (
            <p className="rounded-[var(--radius-card)] bg-[var(--admin-card)] p-6 text-center text-sm text-[#747d87]">
              The menu is empty. Add items from the left.
            </p>
          )}
          <ol
            className="space-y-2"
            onDragLeave={event =>
              !event.currentTarget.contains(event.relatedTarget as Node) &&
              setDrop(null)
            }
          >
            {items.map((item, i) => {
              const isOpen = expanded === item.id;
              const sibling = previousSibling(items, i);
              const parent = parentOf(items, i);
              const nextSibling =
                blockEnd(items, i) < items.length &&
                items[blockEnd(items, i)].depth === item.depth
                  ? blockEnd(items, i)
                  : -1;
              const moves = [
                {
                  label: "Up one",
                  show: sibling >= 0,
                  run: () => commit(moveBlock(items, i, sibling, item.depth)),
                },
                {
                  label: "Down one",
                  show: nextSibling >= 0,
                  run: () =>
                    commit(
                      moveBlock(
                        items,
                        i,
                        blockEnd(items, nextSibling),
                        item.depth
                      )
                    ),
                },
                {
                  label: `Under ${sibling >= 0 ? items[sibling].label : ""}`,
                  show: sibling >= 0 && item.depth < MAX_DEPTH,
                  run: () => commit(moveBlock(items, i, i, item.depth + 1)),
                },
                {
                  label: `Out from under ${parent >= 0 ? items[parent].label : ""}`,
                  show: parent >= 0,
                  run: () =>
                    commit(
                      moveBlock(
                        items,
                        i,
                        blockEnd(items, parent),
                        item.depth - 1
                      )
                    ),
                },
                {
                  label: "To the top",
                  show: i > 0,
                  run: () => commit(moveBlock(items, i, 0, 0)),
                },
              ].filter(move => move.show);
              const showLine =
                drop &&
                drop.index === i &&
                dragIndex !== null &&
                dragIndex !== i;

              return (
                <li
                  key={item.id}
                  onDragOver={event => onDragOver(event, i)}
                  onDrop={event => {
                    event.preventDefault();
                    onDrop();
                  }}
                  className="relative"
                  style={{ marginLeft: item.depth * INDENT }}
                >
                  {showLine && !drop.after && (
                    <span
                      className="absolute -top-1.5 right-0 h-0.5 bg-[#c76f42]"
                      style={{ left: (drop.depth - item.depth) * INDENT }}
                    />
                  )}
                  <div
                    className={`rounded-[var(--radius-card)] bg-[var(--admin-card)] ${dragIndex === i ? "opacity-40" : ""}`}
                  >
                    <div
                      draggable
                      onDragStart={event => {
                        dragStartX.current = event.clientX;
                        setDragIndex(i);
                        setExpanded(null);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", item.id);
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setDrop(null);
                      }}
                      className="flex h-12 cursor-move items-center gap-3 px-3"
                    >
                      <GripVertical
                        className="h-4 w-4 shrink-0 text-[#9ba0a6]"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#30363d]">
                        {item.label || "(no label)"}
                        {item.depth > 0 && (
                          <span className="ml-2 text-xs font-normal text-[#9ba0a6]">
                            sub item
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-[#747d87]">
                        {typeOf(item.url)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : item.id)}
                        aria-expanded={isOpen}
                        aria-label={`Edit ${item.label}`}
                        className="grid h-8 w-8 shrink-0 place-items-center text-[#6c7580] hover:text-[#30363d]"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="space-y-3 border-t border-[#e3e3e3] p-4">
                        <label className="block text-xs font-medium text-[#30363d]">
                          Navigation Label
                          <input
                            value={item.label}
                            onChange={e => update(i, { label: e.target.value })}
                            className={`${inputClass} mt-2`}
                          />
                        </label>
                        <label className="block text-xs font-medium text-[#30363d]">
                          URL
                          <input
                            value={item.url}
                            onChange={e => update(i, { url: e.target.value })}
                            className={`${inputClass} mt-2`}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#30363d]">
                          <input
                            type="checkbox"
                            checked={Boolean(item.newTab)}
                            onChange={e =>
                              update(i, { newTab: e.target.checked })
                            }
                            className="accent-[#c76f42]"
                          />
                          Open link in a new tab
                        </label>
                        {moves.length > 0 && (
                          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#747d87]">
                            Move
                            {moves.map(move => (
                              <button
                                key={move.label}
                                type="button"
                                onClick={move.run}
                                className={linkButton}
                              >
                                {move.label}
                              </button>
                            ))}
                          </p>
                        )}
                        <p className="flex gap-3 border-t border-[#eeeeee] pt-3 text-sm">
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                          <span className="text-[#d9d9d9]">|</span>
                          <button
                            type="button"
                            onClick={() => setExpanded(null)}
                            className={linkButton}
                          >
                            Close
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                  {showLine && drop.after && (
                    <span
                      className="absolute -bottom-1.5 right-0 h-0.5 bg-[#c76f42]"
                      style={{ left: (drop.depth - item.depth) * INDENT }}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {footer && (
          <div className="border-t border-[#e3e3e3] pt-5">{footer}</div>
        )}
      </div>
    </div>
  );
}
