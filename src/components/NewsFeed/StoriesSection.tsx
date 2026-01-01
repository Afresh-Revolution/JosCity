import React from "react";
import { Plus } from "lucide-react";
import LazyImage from "../LazyImage";

interface Story {
  id: number;
  userName: string;
  avatar: string;
  hasNewStory?: boolean;
}

interface StoriesSectionProps {
  stories: Story[];
}

const StoriesSection: React.FC<StoriesSectionProps> = ({ stories }) => {
  return (
    <div className="newsfeed-stories">
      <div className="newsfeed-stories__container">
        {stories.map((story, index) => (
          <div key={story.id} className="newsfeed-stories__item">
            {index === 0 && story.hasNewStory && (
              <div className="newsfeed-stories__add-icon">
                <Plus size={16} />
              </div>
            )}
            <div className="newsfeed-stories__avatar-wrapper">
              <LazyImage
                src={story.avatar || "/placeholder-avatar.png"}
                alt={story.userName}
                className="newsfeed-stories__avatar"
              />
            </div>
            <p className="newsfeed-stories__name">{story.userName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesSection;
