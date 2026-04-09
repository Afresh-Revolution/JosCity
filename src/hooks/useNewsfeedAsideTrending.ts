import { useState, useEffect, useMemo } from "react";
import { feedApi } from "../services/feedApi";
import { getUserAccountType } from "../utils/userUtils";
import {
  calculateTrendingFromPosts,
  type PostLikeForTrending,
  type TrendingHashtagRow,
} from "../utils/trendingHashtags";

export type { TrendingHashtagRow };

export function useNewsfeedAsideTrending(
  fallbackPosts: PostLikeForTrending[]
): TrendingHashtagRow[] {
  const [apiTrending, setApiTrending] = useState<TrendingHashtagRow[]>([]);
  const isBusinessAccount =
    getUserAccountType().toLowerCase() === "business";

  useEffect(() => {
    let cancelled = false;
    feedApi
      .getTrendingHashtags(10)
      .then((res) => {
        if (!cancelled && res?.success && Array.isArray(res.data)) {
          setApiTrending(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiTrending([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const localFallback = useMemo(
    () => calculateTrendingFromPosts(fallbackPosts, { isBusinessAccount }),
    [fallbackPosts, isBusinessAccount]
  );

  return apiTrending.length > 0 ? apiTrending : localFallback;
}
