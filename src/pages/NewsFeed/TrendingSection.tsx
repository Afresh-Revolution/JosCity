import React from "react";
import { Flame } from "lucide-react";

interface Trending {
  hashtag: string;
  posts: number;
}

interface TrendingSectionProps {
  trending: Trending[];
  onHashtagClick?: (hashtag: string) => void;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({
  trending,
  onHashtagClick,
}) => {
  // Only show top 2 hashtags
  const topHashtags = trending.slice(0, 2);

  return (
    <div className="newsfeed-trending">
      <h3 className="newsfeed-trending__title">
        <Flame size={20} />
        <span>Trending</span>
      </h3>
      <div className="newsfeed-trending__list">
        {topHashtags.length > 0 ? (
          topHashtags.map((item, index) => (
            <button
              key={index}
              className="newsfeed-trending__item newsfeed-trending__item--clickable"
              onClick={() => onHashtagClick?.(item.hashtag)}
              aria-label={`View posts for ${item.hashtag}`}
            >
              <span className="newsfeed-trending__hashtag">{item.hashtag}</span>
              <span className="newsfeed-trending__count">
                ({item.posts} Post{item.posts !== 1 ? "s" : ""})
              </span>
            </button>
          ))
        ) : (
          <div className="newsfeed-trending__empty">
            <p>No trending hashtags yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingSection;
