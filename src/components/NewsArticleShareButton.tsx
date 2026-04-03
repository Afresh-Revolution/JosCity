import { useCallback, useState } from "react";
import { Share2 } from "lucide-react";
import { shareNewsArticle } from "../utils/newsShare";

type Props = {
  articleId: number;
  title: string;
  className?: string;
  iconSize?: number;
};

export default function NewsArticleShareButton({
  articleId,
  title,
  className,
  iconSize = 18,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const result = await shareNewsArticle({ id: articleId, title });
      if (result === "copied") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    },
    [articleId, title]
  );

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-label={copied ? "Article link copied" : "Share link to this story"}
      title={copied ? "Link copied" : "Share link"}
    >
      <Share2 size={iconSize} strokeWidth={2} aria-hidden />
    </button>
  );
}
