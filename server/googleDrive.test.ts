import { describe, expect, it } from "vitest";
import { driveDownloadUrl, parseDriveLink } from "@shared/googleDrive";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";

describe("parseDriveLink", () => {
  it("reads Drive file share links", () => {
    for (const url of [
      `https://drive.google.com/file/d/${ID}/view?usp=sharing`,
      `https://drive.google.com/file/u/0/d/${ID}/view`,
      `https://drive.google.com/open?id=${ID}`,
      `https://drive.google.com/uc?export=download&id=${ID}`,
    ])
      expect(parseDriveLink(url)).toMatchObject({
        id: ID,
        kind: "file",
        url: `https://drive.google.com/file/d/${ID}/view`,
      });
    expect(driveDownloadUrl(`https://drive.google.com/file/d/${ID}/view`)).toBe(
      `https://drive.google.com/uc?export=download&id=${ID}`
    );
  });

  it("reads folders and Google Docs, Sheets, Slides and Forms", () => {
    expect(
      parseDriveLink(`https://drive.google.com/drive/folders/${ID}?usp=sharing`)
    ).toMatchObject({ kind: "folder", label: "Google Drive folder" });
    expect(
      parseDriveLink(`https://drive.google.com/drive/u/1/folders/${ID}`)
    ).toMatchObject({ kind: "folder", id: ID });
    expect(
      parseDriveLink(`https://docs.google.com/presentation/d/${ID}/edit#slide=id.p`)
    ).toMatchObject({
      kind: "presentation",
      url: `https://docs.google.com/presentation/d/${ID}/edit`,
    });
    expect(
      parseDriveLink(`https://docs.google.com/forms/d/e/${ID}/viewform`)
    ).toMatchObject({
      kind: "forms",
      url: `https://docs.google.com/forms/d/e/${ID}/viewform`,
    });
  });

  it("rejects anything that isn't a Drive link", () => {
    for (const url of [
      "",
      "not a url",
      `https://example.com/file/d/${ID}/view`,
      `https://drive.google.com.evil.com/file/d/${ID}/view`,
      "https://drive.google.com/file/d/short/view",
      `javascript://drive.google.com/file/d/${ID}`,
      "/uploads/resources/notes.pdf",
    ])
      expect(parseDriveLink(url)).toBeNull();
  });
});
