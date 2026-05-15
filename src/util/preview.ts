import DOMPurify from "dompurify";

export const sanitizePreviewHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script"],
  });
};

export const sanitizePreviewCss = (css: string) => {
  return css.replace(/<\/style/gi, "<\\/style");
};
