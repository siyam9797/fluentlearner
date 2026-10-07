import { Fragment, type ReactNode } from "react";

/** Only images the platform serves (uploads, media library) or plain http(s) links. */
const safeImageSrc = (src: string | null) =>
  src && /^(https?:\/\/|\/(?!\/))/i.test(src) ? src : null;

/**
 * Rebuilds admin-written rich-text HTML as React from an allow-list of tags, so the
 * content can't inject markup. `renderText` turns each text run into nodes (e.g. to make
 * [[n]] placeholders live answer inputs).
 */
export function renderRichHtml(
  html: string,
  renderText: (text: string) => ReactNode = text => text
): ReactNode[] | null {
  if (typeof DOMParser === "undefined") return null;

  const renderNodes = (
    nodes: NodeListOf<ChildNode>,
    path: string
  ): ReactNode[] =>
    Array.from(nodes).map((node, index) => {
      const key = `${path}-${index}`;
      if (node.nodeType === 3) {
        return (
          <Fragment key={key}>{renderText(node.textContent ?? "")}</Fragment>
        );
      }
      if (node.nodeType !== 1) return null;
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();
      if (tag === "img") {
        const src = safeImageSrc(element.getAttribute("src"));
        return src ? (
          <img key={key} src={src} alt={element.getAttribute("alt") ?? ""} />
        ) : null;
      }
      const children = renderNodes(element.childNodes, key);
      switch (tag) {
        case "p":
          return <p key={key}>{children}</p>;
        case "h1":
        case "h2":
          return <h2 key={key}>{children}</h2>;
        case "h3":
        case "h4":
          return <h3 key={key}>{children}</h3>;
        case "strong":
        case "b":
          return <strong key={key}>{children}</strong>;
        case "em":
        case "i":
          return <em key={key}>{children}</em>;
        case "u":
          return <u key={key}>{children}</u>;
        case "s":
          return <s key={key}>{children}</s>;
        case "ul":
          return <ul key={key}>{children}</ul>;
        case "ol":
          return <ol key={key}>{children}</ol>;
        case "li":
          return <li key={key}>{children}</li>;
        case "br":
          return <br key={key} />;
        case "table":
          return (
            <div key={key} className="overflow-x-auto">
              <table>{children}</table>
            </div>
          );
        case "thead":
          return <thead key={key}>{children}</thead>;
        case "tbody":
          return <tbody key={key}>{children}</tbody>;
        case "tr":
          return <tr key={key}>{children}</tr>;
        case "th":
        case "td": {
          const Cell = tag;
          return (
            <Cell
              key={key}
              colSpan={Number(element.getAttribute("colspan")) || undefined}
              rowSpan={Number(element.getAttribute("rowspan")) || undefined}
            >
              {children}
            </Cell>
          );
        }
        case "colgroup":
        case "col":
          return null;
        default:
          return <Fragment key={key}>{children}</Fragment>;
      }
    });

  return renderNodes(
    new DOMParser().parseFromString(html, "text/html").body.childNodes,
    "rich"
  );
}
