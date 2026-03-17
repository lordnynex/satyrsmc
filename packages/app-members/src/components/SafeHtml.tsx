import DOMPurify from "dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  return (
    // eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml -- sanitized by DOMPurify
    <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
  );
}
