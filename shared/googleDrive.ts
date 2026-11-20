/**
 * Google Drive links for learning resources. Resource files live in Google Drive; admins paste a
 * share link and students open it there. Shared by the admin form, the server check and the
 * student Resources page.
 */

export type DriveKind =
  | "file"
  | "folder"
  | "document"
  | "spreadsheets"
  | "presentation"
  | "forms";

export type DriveLink = {
  id: string;
  kind: DriveKind;
  /** The link students open: the file's Drive (or Docs) page. */
  url: string;
  /** Google's type for the item, stored as the resource's mimeType (for its icon). */
  mimeType: string;
  /** e.g. "Google Drive file", "Google Docs". */
  label: string;
};

const LABELS: Record<DriveKind, string> = {
  file: "Google Drive file",
  folder: "Google Drive folder",
  document: "Google Docs",
  spreadsheets: "Google Sheets",
  presentation: "Google Slides",
  forms: "Google Forms",
};

const MIME_TYPES: Record<DriveKind, string> = {
  file: "application/vnd.google-apps.file",
  folder: "application/vnd.google-apps.folder",
  document: "application/vnd.google-apps.document",
  spreadsheets: "application/vnd.google-apps.spreadsheet",
  presentation: "application/vnd.google-apps.presentation",
  forms: "application/vnd.google-apps.form",
};

const ID = /^[\w-]{10,}$/;

/**
 * Reads a Google Drive or Google Docs share link, or returns null when it isn't one.
 * Accepts drive.google.com/file/d/ID, /open?id=ID, /uc?id=ID, /drive/folders/ID and
 * docs.google.com/{document,spreadsheets,presentation,forms}/d/ID links.
 */
export function parseDriveLink(value: string): DriveLink | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  // Strip a "/u/0" account segment, which Drive adds for people signed in to several accounts.
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .filter((part, index, all) => !(part === "u" || all[index - 1] === "u"));

  let kind: DriveKind | null = null;
  let id: string | null = null;
  if (host === "drive.google.com") {
    const at = (name: string) => parts.indexOf(name);
    if (at("file") >= 0 && parts[at("file") + 1] === "d") {
      kind = "file";
      id = parts[at("file") + 2] ?? null;
    } else if (at("folders") >= 0) {
      kind = "folder";
      id = parts[at("folders") + 1] ?? null;
    } else if (parts[0] === "open" || parts[0] === "uc") {
      kind = "file";
      id = url.searchParams.get("id");
    }
  } else if (host === "docs.google.com") {
    const type = parts[0] as DriveKind;
    if (
      ["document", "spreadsheets", "presentation", "forms"].includes(type) &&
      parts[1] === "d"
    ) {
      kind = type;
      // Published forms look like /forms/d/e/ID/viewform.
      id = (parts[2] === "e" ? parts[3] : parts[2]) ?? null;
    }
  }
  if (!kind || !id || !ID.test(id)) return null;

  const published = kind === "forms" && parts[2] === "e";
  const pageUrl =
    kind === "file"
      ? `https://drive.google.com/file/d/${id}/view`
      : kind === "folder"
        ? `https://drive.google.com/drive/folders/${id}`
        : kind === "forms"
          ? `https://docs.google.com/forms/d/${published ? "e/" : ""}${id}/viewform`
          : `https://docs.google.com/${kind}/d/${id}/edit`;
  return {
    id,
    kind,
    url: pageUrl,
    mimeType: MIME_TYPES[kind],
    label: LABELS[kind],
  };
}

/** Whether a stored resource URL points to Google Drive (older resources may be uploads). */
export const isDriveLink = (value: string | null | undefined) =>
  !!value && parseDriveLink(value) !== null;

/** A direct download link for a Drive file, or null for folders and Google Docs files. */
export function driveDownloadUrl(value: string) {
  const link = parseDriveLink(value);
  return link?.kind === "file"
    ? `https://drive.google.com/uc?export=download&id=${link.id}`
    : null;
}
