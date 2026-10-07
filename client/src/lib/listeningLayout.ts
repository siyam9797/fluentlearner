/**
 * Listening question layouts.
 *
 * New layouts are rich-text HTML written in the admin editor; answer boxes are stored as
 * `<span data-answer-box>[[n]]</span>`, so the `[[n]]` placeholder stays in the text for
 * numbering and grading. Older layouts use a line format (`## heading`, `| table | row |`,
 * plain lines) and are converted to HTML when opened in the editor.
 */

export function isHtmlLayout(layout: string) {
  return /^\s*</.test(layout);
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Escapes a legacy text run, keeping its **bold**, <br> and [[n]] answer boxes. */
function legacyInline(text: string) {
  return escapeHtml(text)
    .replace(/&lt;br\s*\/?\s*&gt;/gi, "<br>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[\[(\d+)\]\]/g, "<span data-answer-box>[[$1]]</span>");
}

export function legacyLayoutToHtml(layout: string) {
  const lines = layout.split(/\r?\n/);
  const html: string[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h3>${legacyInline(line.slice(3))}</h3>`);
      index += 1;
      continue;
    }
    if (line.includes("|")) {
      const rows: string[] = [];
      let rowIndex = 0;
      while (index < lines.length && lines[index].includes("|")) {
        const cells = lines[index].split("|");
        if (!cells[0].trim()) cells.shift();
        if (!cells.at(-1)?.trim()) cells.pop();
        const tag = rowIndex === 0 ? "th" : "td";
        rows.push(
          `<tr>${cells
            .map(cell => {
              const content = cell.trim().replace(/^\*\*(.*)\*\*$/, "$1");
              return `<${tag}><p>${legacyInline(content)}</p></${tag}>`;
            })
            .join("")}</tr>`
        );
        rowIndex += 1;
        index += 1;
      }
      html.push(`<table><tbody>${rows.join("")}</tbody></table>`);
      continue;
    }
    html.push(`<p>${legacyInline(line)}</p>`);
    index += 1;
  }
  return html.join("");
}

/*
 * A part or passage can hold several completion groups (e.g. notes 1–6, then summary
 * 11–13), each written as its own layout. They are stored one after another in the
 * section's layout as `<div data-layout-group="type" data-instruction="…">…</div>`;
 * a layout without these wrappers is one group.
 */
export type LayoutGroup = {
  /** Question type of new answer boxes, or null for an older single layout. */
  type: string | null;
  /** Instruction kept until the group's first question exists. */
  instruction: string;
  html: string;
};

const GROUP_PATTERN =
  /<div data-layout-group="([a-z_]*)"(?: data-instruction="([^"]*)")?>([\s\S]*?)<\/div>/g;

export function splitLayoutGroups(
  layout: string | null | undefined
): LayoutGroup[] {
  if (!layout?.trim()) return [];
  if (!layout.includes("data-layout-group")) {
    return [{ type: null, instruction: "", html: layout }];
  }
  return Array.from(layout.matchAll(GROUP_PATTERN), match => ({
    type: match[1] || null,
    instruction: match[2] ? decodeURIComponent(match[2]) : "",
    html: match[3],
  }));
}

export function joinLayoutGroups(groups: LayoutGroup[]) {
  // A single older layout stays as it was.
  if (groups.length === 1 && groups[0].type === null && !groups[0].instruction)
    return groups[0].html;
  return groups
    .map(
      group =>
        `<div data-layout-group="${group.type ?? ""}"${
          group.instruction
            ? ` data-instruction="${encodeURIComponent(group.instruction)}"`
            : ""
        }>${toGroupHtml(group.html)}</div>`
    )
    .join("");
}

/** Older line layouts become HTML once they share the field with other groups. */
const toGroupHtml = (html: string) =>
  !html || isHtmlLayout(html) ? html : legacyLayoutToHtml(html);

/** Answer-box numbers in document order. */
export function layoutBoxNumbers(html: string) {
  return Array.from(html.matchAll(/\[\[(\d+)\]\]/g), match => Number(match[1]));
}
