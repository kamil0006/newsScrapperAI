import { ReadTrackingLink } from "@/components/ReadTrackingLink";

export function ArticleTitleLink({
  articleId,
  url,
  title,
  read,
}: {
  articleId: string;
  url: string;
  title: string;
  read: boolean;
}) {
  return (
    <ReadTrackingLink
      articleId={articleId}
      url={url}
      read={read}
      className={`block font-serif text-lg leading-snug hover:text-white transition-colors ${
        read ? "text-text-muted" : "text-text"
      }`}
    >
      {title}
    </ReadTrackingLink>
  );
}
