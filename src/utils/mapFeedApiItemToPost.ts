/**
 * Map one backend formatPost row to PostCard-shaped post (shared by News Feed + Business feed).
 */

export interface ListingOffer {
  cost?: string;
  location?: string;
  contact?: string;
}

export interface ListingDetails {
  text?: ListingOffer | null;
  byMediaIndex?: Array<ListingOffer | null>;
}

export interface EmbeddedPostShape {
  id: number;
  userId?: number;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  caption?: string;
  image?: string;
  images?: string[];
  video?: string;
  videos?: string[];
  unavailable?: boolean;
}

export interface CardPostShape {
  id: number;
  userId?: number;
  userName: string;
  userAvatar: string;
  action: string;
  timeAgo: string;
  image?: string;
  images?: string[];
  video?: string;
  videos?: string[];
  likes: number;
  comments: number;
  views: number;
  reviews: number;
  caption: string;
  hashtags?: string;
  accountType?: string;
  userReacted?: boolean;
  userShared?: boolean;
  userSaved?: boolean;
  originalPost?: EmbeddedPostShape;
  listingDetails?: ListingDetails | null;
}

interface FeedItem {
  post_id?: number;
  id?: number;
  text?: string;
  author?: {
    id?: number;
    name?: string;
    username?: string;
    picture?: string;
    verified?: boolean;
    type?: string;
    account_type?: string;
  };
  user?: { name?: string; picture?: string };
  user_name?: string;
  user_avatar?: string;
  user_id?: number;
  action?: string;
  time_ago?: string;
  created_at?: string;
  time?: string;
  media?: Array<{ url?: string; type?: string }>;
  media_urls?: string[];
  media_types?: string[];
  image_url?: string;
  image?: string;
  images?: string[];
  video_url?: string;
  video?: string;
  videos?: string[];
  reactions_count?: number;
  likes_count?: number;
  likes?: number;
  user_reacted?: boolean;
  user_shared?: boolean;
  user_saved?: boolean;
  original_post?: {
    id?: number;
    text?: string;
    caption?: string;
    time_ago?: string;
    unavailable?: boolean;
    author?: {
      id?: number;
      name?: string;
      picture?: string;
    };
    media?: Array<{ url?: string; type?: string }>;
    media_urls?: string[];
    media_types?: string[];
  };
  comments_count?: number;
  comments?: number;
  comments_preview?: Array<unknown>;
  views_count?: number;
  views?: number;
  reviews?: number;
  caption?: string;
  hashtags?: string;
  account_type?: string;
  accountType?: string;
  listing_details?: unknown;
}

export function mapFeedApiItemToPost(feed: unknown): CardPostShape | null {
  const f = feed as FeedItem;
  if (f.post_id === undefined && f.id === undefined) {
    return null;
  }

  const author = f.author || f.user;
  const userName = author?.name || f.user_name || "Unknown User";
  const userAvatar = author?.picture ?? f.user_avatar ?? "";

  let image = f.image_url || f.image || "";
  let images = f.images;
  let video = f.video_url || f.video || "";
  let videos = f.videos;
  let originalPost: EmbeddedPostShape | undefined;

  if (f.media && Array.isArray(f.media) && f.media.length > 0) {
    const photoUrls = f.media
      .filter(
        (m) =>
          (m.type || "").toLowerCase().startsWith("image") ||
          (m.type || "").toLowerCase() === "photo"
      )
      .map((m) => m.url)
      .filter((url): url is string => Boolean(url));
    const videoUrls = f.media
      .filter((m) => (m.type || "").toLowerCase().startsWith("video"))
      .map((m) => m.url)
      .filter((url): url is string => Boolean(url));
    if (photoUrls.length > 0) {
      image = photoUrls[0];
      if (photoUrls.length > 1) images = photoUrls;
    }
    if (videoUrls.length > 0) {
      video = videoUrls[0];
      if (videoUrls.length > 1) videos = videoUrls;
    }
  } else if (
    (f.media_urls && f.media_urls.length > 0) ||
    (f.media_types && f.media_types.length > 0)
  ) {
    const urls = f.media_urls || [];
    const types = f.media_types || [];
    const photoUrls = urls.filter((_, i) => {
      const t = (types[i] || "").toLowerCase();
      return t.startsWith("image") || t === "photo";
    });
    const videoUrls = urls.filter((_, i) => {
      const t = (types[i] || "").toLowerCase();
      return t.startsWith("video");
    });
    if (photoUrls.length > 0) {
      image = photoUrls[0];
      if (photoUrls.length > 1) images = photoUrls;
    }
    if (videoUrls.length > 0) {
      video = videoUrls[0];
      if (videoUrls.length > 1) videos = videoUrls;
    }
  }

  if (f.original_post && typeof f.original_post === "object") {
    const om = Array.isArray(f.original_post.media) ? f.original_post.media : [];
    let originalImage = "";
    let originalImages: string[] | undefined;
    let originalVideo = "";
    let originalVideos: string[] | undefined;

    if (om.length > 0) {
      const originalPhotoUrls = om
        .filter(
          (item) =>
            (item.type || "").toLowerCase().startsWith("image") ||
            (item.type || "").toLowerCase() === "photo"
        )
        .map((item) => item.url)
        .filter((url): url is string => Boolean(url));
      const originalVideoUrls = om
        .filter((item) => (item.type || "").toLowerCase().startsWith("video"))
        .map((item) => item.url)
        .filter((url): url is string => Boolean(url));

      if (originalPhotoUrls.length > 0) {
        originalImage = originalPhotoUrls[0];
        if (originalPhotoUrls.length > 1) originalImages = originalPhotoUrls;
      }
      if (originalVideoUrls.length > 0) {
        originalVideo = originalVideoUrls[0];
        if (originalVideoUrls.length > 1) originalVideos = originalVideoUrls;
      }
    } else if (
      (f.original_post.media_urls && f.original_post.media_urls.length > 0) ||
      (f.original_post.media_types && f.original_post.media_types.length > 0)
    ) {
      const originalUrls = f.original_post.media_urls || [];
      const originalTypes = f.original_post.media_types || [];
      const originalPhotoUrls = originalUrls.filter((_, index) => {
        const mediaType = (originalTypes[index] || "").toLowerCase();
        return mediaType.startsWith("image") || mediaType === "photo";
      });
      const originalVideoUrls = originalUrls.filter((_, index) => {
        const mediaType = (originalTypes[index] || "").toLowerCase();
        return mediaType.startsWith("video");
      });

      if (originalPhotoUrls.length > 0) {
        originalImage = originalPhotoUrls[0];
        if (originalPhotoUrls.length > 1) originalImages = originalPhotoUrls;
      }
      if (originalVideoUrls.length > 0) {
        originalVideo = originalVideoUrls[0];
        if (originalVideoUrls.length > 1) originalVideos = originalVideoUrls;
      }
    }

    originalPost = {
      id: f.original_post.id ?? 0,
      userId: f.original_post.author?.id,
      userName: f.original_post.author?.name || "Unknown User",
      userAvatar: f.original_post.author?.picture || "",
      timeAgo: f.original_post.time_ago || "Just now",
      caption:
        f.original_post.text || f.original_post.caption || "",
      image: originalImage,
      images: originalImages,
      video: originalVideo,
      videos: originalVideos,
      unavailable: Boolean(f.original_post.unavailable),
    };
  }

  const likes = f.reactions_count ?? f.likes_count ?? f.likes ?? 0;
  const comments =
    f.comments_count ??
    f.comments ??
    (Array.isArray(f.comments_preview) ? f.comments_preview.length : 0) ??
    0;

  const authorId =
    (author as { id?: number })?.id ?? f.user_id;
  const acctFromAuthor =
    typeof f.author?.account_type === "string"
      ? f.author.account_type
      : undefined;

  let listingDetails: ListingDetails | null = null;
  if (f.listing_details && typeof f.listing_details === "object") {
    listingDetails = f.listing_details as ListingDetails;
  }

  return {
    id: f.post_id ?? f.id ?? 0,
    userId:
      authorId !== undefined && authorId !== null
        ? Number(authorId)
        : undefined,
    userName,
    userAvatar,
    action: f.action || "",
    timeAgo: f.time_ago || f.time || f.created_at || "Just now",
    image,
    images: images || undefined,
    video,
    videos: videos || undefined,
    likes,
    comments,
    views: f.views_count ?? f.views ?? 0,
    reviews: f.reviews ?? 0,
    caption: f.text ?? f.caption ?? "",
    hashtags: f.hashtags || "",
    accountType:
      acctFromAuthor ||
      (typeof f.account_type === "string"
        ? f.account_type
        : typeof f.accountType === "string"
          ? f.accountType
          : undefined),
    userReacted: Boolean(f.user_reacted),
    userShared: Boolean(f.user_shared),
    userSaved: Boolean(f.user_saved),
    originalPost,
    listingDetails: listingDetails || undefined,
  };
}
