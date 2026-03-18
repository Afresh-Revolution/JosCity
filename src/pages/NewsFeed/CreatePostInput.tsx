import React, { useState } from "react";
import { Image, Video, Mic } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import Avatar from "../../components/Avatar";

interface CreatePostInputProps {
  userName: string;
  userAvatar?: string;
  onPost?: (
    caption: string,
    images: File[] | null,
    videos: File[] | null
  ) => void | Promise<void>;
}

const CreatePostInput: React.FC<CreatePostInputProps> = ({
  userName,
  userAvatar,
  onPost,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="newsfeed-create-post">
        <div className="newsfeed-create-post__avatar">
          <Avatar 
            src={userAvatar} 
            name={userName} 
            size={40}
            className="newsfeed-create-post__avatar-img"
          />
        </div>
        <div className="newsfeed-create-post__input-wrapper">
          <input
            type="text"
            className="newsfeed-create-post__input"
            placeholder={`What is on your mind, ${userName}? #hashtag @mention.link`}
            onClick={() => setIsModalOpen(true)}
            readOnly
          />
        </div>
        <div className="newsfeed-create-post__actions">
          <button
            className="newsfeed-create-post__action-btn"
            onClick={handleImageClick}
            title="Add Photo"
          >
            <Image size={20} />
          </button>
          <button
            className="newsfeed-create-post__action-btn"
            onClick={handleVideoClick}
            title="Add Video"
          >
            <Video size={20} />
          </button>
          <button
            className="newsfeed-create-post__action-btn"
            onClick={() => setIsModalOpen(true)}
            title="Add Audio"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userName={userName}
        userAvatar={userAvatar}
        onPost={onPost}
      />
    </>
  );
};

export default CreatePostInput;
