import { describe, expect, it, vi } from "vitest";
import { DriveUnavailableError, fileNameFrom, streamDriveFile } from "./driveProxy";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const FILE = `https://drive.google.com/file/d/${ID}/view`;

const upstream = (body: string, headers: Record<string, string>, status = 200) =>
  vi.fn(async () => new Response(body, { status, headers })) as unknown as typeof fetch;

describe("streamDriveFile", () => {
  it("streams a Drive file without exposing the Drive link", async () => {
    const fetcher = upstream("%PDF-1.7", {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="Reading notes.pdf"',
      "content-length": "8",
    });
    const response = await streamDriveFile(FILE, "Notes", new Request("http://x/"), fetcher);
    expect(vi.mocked(fetcher).mock.calls[0][0]).toBe(
      `https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t`
    );
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toMatch(/^inline; filename="Reading notes.pdf"/);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("location")).toBeNull();
    expect(await response.text()).toBe("%PDF-1.7");
  });

  it("exports Google Docs as PDF and passes Range on for seeking", async () => {
    const fetcher = upstream("x", { "content-type": "application/pdf" }, 206);
    const request = new Request("http://x/", { headers: { range: "bytes=0-10" } });
    const response = await streamDriveFile(
      `https://docs.google.com/document/d/${ID}/edit`, "Essay tips", request, fetcher
    );
    const [url, init] = vi.mocked(fetcher).mock.calls[0];
    expect(url).toBe(`https://docs.google.com/document/d/${ID}/export?format=pdf`);
    expect((init as RequestInit).headers).toEqual({ Range: "bytes=0-10" });
    expect(response.status).toBe(206);
    expect(response.headers.get("content-disposition")).toContain('filename="Essay tips.pdf"');
  });

  it("downloads types a browser shouldn't show", async () => {
    const response = await streamDriveFile(
      FILE, "Pack", new Request("http://x/"),
      upstream("zip", { "content-type": "application/zip" })
    );
    expect(response.headers.get("content-disposition")).toMatch(/^attachment/);
  });

  it("fails when Drive answers with a sign-in or access page", async () => {
    await expect(
      streamDriveFile(FILE, "x", new Request("http://x/"), upstream("<html>", { "content-type": "text/html; charset=utf-8" }))
    ).rejects.toBeInstanceOf(DriveUnavailableError);
    await expect(
      streamDriveFile(FILE, "x", new Request("http://x/"), upstream("", {}, 404))
    ).rejects.toBeInstanceOf(DriveUnavailableError);
    await expect(
      streamDriveFile(`https://drive.google.com/drive/folders/${ID}`, "x", new Request("http://x/"), upstream("", {}))
    ).rejects.toBeInstanceOf(DriveUnavailableError);
  });

  it("reads UTF-8 file names", () => {
    expect(fileNameFrom("attachment; filename*=UTF-8''%E0%A6%95.pdf", "t", "application/pdf")).toBe("ক.pdf");
  });
});
