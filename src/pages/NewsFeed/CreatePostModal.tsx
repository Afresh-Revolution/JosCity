import React, { useState, useRef } from "react";
import { Loader2, X, Image as ImageIcon, Video, Mic } from "lucide-react";
import Avatar from "../../components/Avatar";
import { compressImage } from "../../utils/imageCompression";

export type Offer = { cost: string; location: string; contact: string };

export const emptyOffer = (): Offer => ({ cost: "", location: "", contact: "" });

export function offerPayload(
  o: Offer
): { cost: string; location: string; contact: string } | null {
  const cost = o.cost.trim();
  const location = o.location.trim();
  const contact = o.contact.trim();
  if (!cost && !location && !contact) return null;
  return { cost, location, contact };
}


export function BusinessOfferRow({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Offer;
  onChange: (next: Offer) => void;
}) {
  return (
    <div className="business-offer-fields">
      <div className="business-offer-fields__title">{title}</div>
      <div className="business-offer-fields__inputs">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Price"
          value={value.cost}
          onChange={(e) => onChange({ ...value, cost: e.target.value })}
          aria-label={`${title} price`}
        />
        <input
          type="text"
          placeholder="Location"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          aria-label={`${title} location`}
        />
        <input
          type="tel"
          placeholder="Contact number"
          value={value.contact}
          onChange={(e) => onChange({ ...value, contact: e.target.value })}
          aria-label={`${title} contact`}
        />
      </div>
    </div>
  );
}

export type CreatePostListingPayload = {
  text?: { cost: string; location: string; contact: string };
  byMediaIndex?: Array<{
    cost: string;
    location: string;
    contact: string;
  } | null>;
};

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  /** Business accounts: optional price/location/contact per caption and per media */
  businessListingFields?: boolean;
  /** Shown when businessListingFields (e.g. main feed: business-only visibility) */
  businessFeedNotice?: string;
  onPost?: (
    caption: string,
    images: File[] | null,
    videos: File[] | null,
    listingDetails?: CreatePostListingPayload | null
  ) => void | Promise<void>;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  businessListingFields = false,
  businessFeedNotice,
  onPost,
}) => {
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // For preview
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]); // For preview
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Actual files for upload
  const [videoFiles, setVideoFiles] = useState<File[]>([]); // Actual files for upload
  const [textOffer, setTextOffer] = useState<Offer>(() => emptyOffer());
  const [imageOffers, setImageOffers] = useState<Offer[]>([]);
  const [videoOffers, setVideoOffers] = useState<Offer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB (reduced for faster uploads)
    const MAX_IMAGES = 3; // Maximum 3 images (reduced for faster uploads)
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Filter and validate files
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`File ${index + 1} is not an image file.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Image ${index + 1} size must be less than 10MB.`);
        return;
      }

      if (selectedImages.length + validFiles.length >= MAX_IMAGES) {
        errors.push(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Process all valid files - compress and store both File objects and base64 for preview
    const processFiles = async () => {
      const newImages: string[] = [];
      const newImageFiles: File[] = [];

      for (let index = 0; index < validFiles.length; index++) {
        const file = validFiles[index];
        try {
          // Compress the image before storing - more aggressive compression
          const compressedFile = await compressImage(file, {
            maxWidth: 1200, // Reduced from 1920 for faster upload
            maxHeight: 1200,
            quality: 0.7, // Reduced from 0.8 for smaller files
            maxSizeMB: 1, // Reduced to 1MB max per image for faster uploads
          });
          
          // Store the compressed File object
          newImageFiles.push(compressedFile);
          
          // Create preview using FileReader
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                resolve(reader.result as string);
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = () => reject(new Error("Error reading file"));
            reader.readAsDataURL(compressedFile);
          });
          
          newImages.push(preview);
        } catch (error) {
          console.error(`Error processing image ${index + 1}:`, error);
          // Fallback to original file if compression fails
          newImageFiles.push(file);
          try {
            const preview = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result) {
                  resolve(reader.result as string);
                } else {
                  reject(new Error("Failed to read file"));
                }
              };
              reader.onerror = () => reject(new Error("Error reading file"));
              reader.readAsDataURL(file);
            });
            newImages.push(preview);
          } catch (previewError) {
            console.error(`Error creating preview for image ${index + 1}:`, previewError);
            // Skip this image if both compression and preview fail
            newImageFiles.pop(); // Remove the file we just added
          }
        }
      }

      // Update state with all processed files
      if (newImages.length > 0 && newImageFiles.length > 0) {
        setSelectedImages((prev) => [...prev, ...newImages]);
        setImageFiles((prev) => [...prev, ...newImageFiles]);
        setImageOffers((prev) => [
          ...prev,
          ...newImageFiles.map(() => emptyOffer()),
        ]);
      }
    };

    processFiles().catch((error) => {
      console.error("Error processing images:", error);
      alert("Error processing images. Please try again.");
    });

    // Note: Videos are NOT cleared - allows images + videos posts
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_VIDEOS = 1; // Maximum 1 video (reduced for faster uploads)
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Filter and validate files (video size limits enforced by the API)
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("video/")) {
        errors.push(`File ${index + 1} is not a video file.`);
        return;
      }

      if (selectedVideos.length + validFiles.length >= MAX_VIDEOS) {
        errors.push(`Maximum ${MAX_VIDEOS} videos allowed.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length === 0) {
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    // Process all valid files - store both File objects and base64 for preview
    const newVideos: string[] = [];
    const newVideoFiles: File[] = [];
    let processedCount = 0;

    validFiles.forEach((file, index) => {
      // Store the File object immediately
      newVideoFiles.push(file);
      
      // Create preview using FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        newVideos.push(reader.result as string);
        processedCount++;

        // Update state when all files are processed
        if (processedCount === validFiles.length) {
          setSelectedVideos((prev) => [...prev, ...newVideos]);
          setVideoFiles((prev) => [...prev, ...newVideoFiles]);
          setVideoOffers((prev) => [
            ...prev,
            ...newVideoFiles.map(() => emptyOffer()),
          ]);
        }
      };
      reader.onerror = () => {
        alert(`Error reading video ${index + 1}. Please try again.`);
        processedCount++;
        if (processedCount === validFiles.length && newVideos.length > 0) {
          setSelectedVideos((prev) => [...prev, ...newVideos]);
          setVideoFiles((prev) => [...prev, ...newVideoFiles]);
          setVideoOffers((prev) => [
            ...prev,
            ...newVideoFiles.map(() => emptyOffer()),
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Note: Images are NOT cleared - allows images + videos posts
  };

  const handlePost = async () => {
    if (isSubmitting) return;
    // Validation: Allow posts with:
    // 1. Text only
    // 2. Text + Image(s)
    // 3. Text + Video(s)
    // 4. Text + Image(s) + Video(s) - NEW
    // 5. Image(s) only
    // 6. Video(s) only
    // 7. Image(s) + Video(s) - NEW
    if (
      !caption.trim() &&
      selectedImages.length === 0 &&
      selectedVideos.length === 0
    ) {
      alert("Please add some content to your post (text, image, or video).");
      return;
    }

    // Call the onPost callback if provided
    if (onPost) {
      try {
        setIsSubmitting(true);
        let listingDetails: CreatePostListingPayload | null = null;
        if (businessListingFields) {
          const textP = offerPayload(textOffer);
          const byMediaIndex = [
            ...imageOffers.map(offerPayload),
            ...videoOffers.map(offerPayload),
          ];
          const hasMedia = byMediaIndex.some((x) => x !== null);
          if (textP || hasMedia) {
            listingDetails = {};
            if (textP) listingDetails.text = textP;
            if (hasMedia) listingDetails.byMediaIndex = byMediaIndex;
          }
        }
        await onPost(
          caption.trim(), // Send text (can be empty if only media)
          imageFiles.length > 0 ? imageFiles : null,
          videoFiles.length > 0 ? videoFiles : null,
          listingDetails
        );
      } catch (error) {
        console.error("Error in onPost callback:", error);
        // Don't close modal if there's an error, let user retry
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    // Reset form
    setCaption("");
    setSelectedImages([]);
    setSelectedVideos([]);
    setImageFiles([]);
    setVideoFiles([]);
    setTextOffer(emptyOffer());
    setImageOffers([]);
    setVideoOffers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setCaption("");
    setSelectedImages([]);
    setSelectedVideos([]);
    setImageFiles([]);
    setVideoFiles([]);
    setTextOffer(emptyOffer());
    setImageOffers([]);
    setVideoOffers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageOffers((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoOffers((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="newsfeed-modal-overlay" onClick={handleClose}>
      <div className="newsfeed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newsfeed-modal__header">
          <h2 className="newsfeed-modal__title">Create Post</h2>
          <button className="newsfeed-modal__close" onClick={handleClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <div className="newsfeed-modal__content">
          <div className="newsfeed-modal__user-info">
            <Avatar
              src={userAvatar}
              name={userName}
              size={40}
              className="newsfeed-modal__avatar"
            />
            <span className="newsfeed-modal__user-name">{userName}</span>
          </div>

          {businessListingFields && businessFeedNotice && (
            <p className="business-feed-notice">{businessFeedNotice}</p>
          )}

          <div className="newsfeed-modal__caption-section">
            <textarea
              className="newsfeed-modal__caption"
              placeholder={`What's on your mind, ${userName}?`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          {businessListingFields && (
            <BusinessOfferRow
              title="Listing for caption / description (optional)"
              value={textOffer}
              onChange={setTextOffer}
            />
          )}

          {selectedImages.length > 0 && (
            <div className="newsfeed-modal__media-preview">
              <div className="newsfeed-modal__media-grid">
                {selectedImages.map((image, index) => (
                  <div key={index} className="newsfeed-modal__media-item">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      onError={() => {
                        alert(
                          `Error loading image ${index + 1}. Removing from selection.`
                        );
                        removeImage(index);
                      }}
                    />
                    <button
                      className="newsfeed-modal__remove-media"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={16} />
                    </button>
                    {businessListingFields && (
                      <BusinessOfferRow
                        title={`Image ${index + 1} (optional)`}
                        value={imageOffers[index] ?? emptyOffer()}
                        onChange={(next) =>
                          setImageOffers((prev) => {
                            const copy = [...prev];
                            while (copy.length <= index) copy.push(emptyOffer());
                            copy[index] = next;
                            return copy;
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedVideos.length > 0 && (
            <div className="newsfeed-modal__media-preview">
              <div className="newsfeed-modal__media-grid">
                {selectedVideos.map((video, index) => (
                  <div key={index} className="newsfeed-modal__media-item">
                    <video
                      src={video}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                      }}
                      onError={() => {
                        alert(
                          `Error loading video ${index + 1}. Removing from selection.`
                        );
                        removeVideo(index);
                      }}
                    />
                    <button
                      className="newsfeed-modal__remove-media"
                      onClick={() => removeVideo(index)}
                      aria-label={`Remove video ${index + 1}`}
                    >
                      <X size={16} />
                    </button>
                    {businessListingFields && (
                      <BusinessOfferRow
                        title={`Video ${index + 1} (optional)`}
                        value={videoOffers[index] ?? emptyOffer()}
                        onChange={(next) =>
                          setVideoOffers((prev) => {
                            const copy = [...prev];
                            while (copy.length <= index) copy.push(emptyOffer());
                            copy[index] = next;
                            return copy;
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="newsfeed-modal__actions">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="image-upload"
              multiple
            />
            <label
              htmlFor="image-upload"
              className="newsfeed-modal__action-btn"
            >
              <ImageIcon size={20} />
              <span>Photo</span>
            </label>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoSelect}
              style={{ display: "none" }}
              id="video-upload"
              multiple
            />
            <label
              htmlFor="video-upload"
              className="newsfeed-modal__action-btn"
            >
              <Video size={20} />
              <span>Video</span>
            </label>
            <button className="newsfeed-modal__action-btn" disabled>
              <Mic size={20} />
              <span>Audio</span>
            </button>
          </div>
        </div>

        <div className="newsfeed-modal__footer">
          <button
            className="newsfeed-modal__cancel-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="newsfeed-modal__post-btn"
            onClick={handlePost}
            disabled={
              isSubmitting ||
              !caption.trim() &&
              selectedImages.length === 0 &&
              selectedVideos.length === 0
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="newsfeed-modal__spinner" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
