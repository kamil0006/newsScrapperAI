import Link from "next/link";

// opens the in-app reader; the reader itself marks the article as read
// and links to the original
export function ArticleTitleLink({
  href,
  title,
  read,
}: {
  href: string;
  title: string;
  read: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block font-serif text-lg leading-snug hover:text-white transition-colors ${
        read ? "text-text-muted" : "text-text"
      }`}
    >
      {title}
    </Link>
  );
}
