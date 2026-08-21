import DOMPurify from "isomorphic-dompurify";

/**
 * Configuration tailored for rich HTML email templates.
 * Preserves layout tables, inline styles, typography, links, and images
 * while strictly stripping malicious scripts, event handlers, iframe injections,
 * and dangerous protocols (e.g. javascript: URLs).
 */
const EMAIL_SANITY_CONFIG = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: [
    "html", "head", "body", "meta", "title", "style",
    "div", "p", "span", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "strike", "small", "big", "sub", "sup",
    "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption", "colgroup", "col",
    "ul", "ol", "li", "dl", "dt", "dd",
    "a", "img", "blockquote", "code", "pre",
    "section", "header", "footer", "article", "aside", "main", "nav",
    "center", "font",
    "svg", "path", "g", "circle", "rect", "line", "polyline", "polygon"
  ],
  ALLOWED_ATTR: [
    "style", "class", "id", "dir", "lang",
    "href", "target", "rel", "title",
    "src", "alt", "width", "height",
    "align", "valign", "bgcolor", "color", "border",
    "cellpadding", "cellspacing", "role", "aria-hidden", "aria-label",
    "face", "size",
    "xmlns", "charset", "http-equiv", "content", "name",
    "viewBox", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d", "r", "cx", "cy", "x", "y", "rx", "ry", "x1", "y1", "x2", "y2"
  ],
  FORBID_TAGS: [
    "script", "iframe", "object", "embed", "applet", "base",
    "form", "input", "button", "textarea", "select", "option", "optgroup"
  ],
  FORBID_ATTR: [
    "onerror", "onload", "onclick", "ondblclick", "onmouseover", "onmouseout",
    "onmousemove", "onmouseenter", "onmouseleave", "onmousedown", "onmouseup",
    "onfocus", "onblur", "onchange", "onsubmit", "onreset", "onkeydown",
    "onkeypress", "onkeyup", "oninput", "formaction"
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

/**
 * Sanitizes arbitrary untrusted HTML content for email templates and previews.
 * Safe for use in both browser environments (client-side preview) and Node.js
 * (server-side boundary before saving or dispatching).
 */
export function sanitizeEmailHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }

  return String(DOMPurify.sanitize(dirtyHtml, EMAIL_SANITY_CONFIG as any));
}
