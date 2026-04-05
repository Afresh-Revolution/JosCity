export type TrendingHashtagRow = { hashtag: string; posts: number };

export type PostLikeForTrending = {
  hashtags?: string;
  caption?: string;
  accountType?: string;
};

function extractHashtagsFromPost(post: PostLikeForTrending): string[] {
  const set = new Set<string>();
  if (post.hashtags) {
    post.hashtags
      .split(/\s+/)
      .filter((tag) => tag.startsWith("#") && tag.length > 1)
      .forEach((tag) => set.add(tag));
  }
  if (post.caption) {
    const re = /#[\p{L}\p{N}_]+/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(post.caption)) !== null) {
      if (m[0].length > 1) set.add(m[0]);
    }
  }
  return [...set];
}

/** Local fallback when the trending API returns nothing (matches News Feed behavior). */
export function calculateTrendingFromPosts(
  posts: PostLikeForTrending[],
  options?: { isBusinessAccount?: boolean }
): TrendingHashtagRow[] {
  const isBusinessAccount = options?.isBusinessAccount === true;
  const postsToAnalyze = isBusinessAccount
    ? posts.filter(
        (post) => post.accountType?.toLowerCase() === "business"
      )
    : posts;

  const hashtagCounts: Record<string, number> = {};
  postsToAnalyze.forEach((post) => {
    extractHashtagsFromPost(post).forEach((hashtag) => {
      hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
    });
  });

  return Object.entries(hashtagCounts)
    .map(([hashtag, count]) => ({ hashtag, posts: count }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 3);
}
