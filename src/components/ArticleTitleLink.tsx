import Link from "next/link";

// opens the in-app reader; the reader itself marks the article as read
// and links to the original
export function ArticleTitleLink({
  href,
  title,
  read,
  tourTarget = false,
}: {
  href: string;
  title: string;
  read: boolean;
  tourTarget?: boolean;
}) {
  return (
    <Link
      href={href}
      data-tour={tourTarget ? "article-title" : undefined}
      className={`block font-serif text-lg leading-snug hover:text-signal transition-colors ${
        read ? "text-text-muted" : "text-text"
      }`}
    >
      {title}
    </Link>
  );
}
