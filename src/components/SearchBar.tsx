import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Hash, User } from "lucide-react";
import LazyImage from "./LazyImage";

export interface SearchResult {
  type: "person" | "hashtag" | "post" | "event";
  id: string | number;
  title: string;
  subtitle?: string;
  avatar?: string;
  postCount?: number;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
  searchData?: {
    people?: Array<{ id: string | number; name: string; avatar?: string }>;
    hashtags?: string[];
    posts?: Array<{ id: number; caption?: string; hashtags?: string; userName?: string }>;
    events?: Array<{ id: number; title: string; description?: string }>;
  };
  className?: string;
  variant?: "default" | "hero";
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  onResultClick,
  searchData,
  className = "",
  variant = "default",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Perform search
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const queryLower = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      if (searchData) {
        // Search people
        if (searchData.people) {
          searchData.people.forEach((person) => {
            if (person.name.toLowerCase().includes(queryLower)) {
              results.push({
                type: "person",
                id: person.id,
                title: person.name,
                subtitle: "User",
                avatar: person.avatar,
              });
            }
          });
        }

        // Search hashtags
        if (searchData.hashtags) {
          searchData.hashtags.forEach((hashtag) => {
            if (hashtag.toLowerCase().includes(queryLower)) {
              const postCount = searchData.posts?.filter(
                (p) => p.hashtags && p.hashtags.includes(hashtag)
              ).length || 0;
              results.push({
                type: "hashtag",
                id: hashtag,
                title: hashtag,
                subtitle: `${postCount} post${postCount !== 1 ? "s" : ""}`,
                postCount,
              });
            }
          });
        }

        // Search posts
        if (searchData.posts) {
          searchData.posts.forEach((post) => {
            const matchesCaption = post.caption?.toLowerCase().includes(queryLower);
            const matchesHashtag = post.hashtags?.toLowerCase().includes(queryLower);
            if (matchesCaption || matchesHashtag) {
              results.push({
                type: "post",
                id: post.id,
                title: post.caption || "Post",
                subtitle: `By ${post.userName || "Unknown"}`,
              });
            }
          });
        }

        // Search events
        if (searchData.events) {
          searchData.events.forEach((event) => {
            const matchesTitle = event.title.toLowerCase().includes(queryLower);
            const matchesDescription = event.description?.toLowerCase().includes(queryLower);
            if (matchesTitle || matchesDescription) {
              results.push({
                type: "event",
                id: event.id,
                title: event.title,
                subtitle: event.description,
              });
            }
          });
        }
      }

      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(query);
      }

      // Limit results to 10
      setSearchResults(results.slice(0, 10));
    },
    [searchData, onSearch]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
    if (onResultClick) {
      onResultClick(result);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchFocused]);

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "person":
        return <User size={16} />;
      case "hashtag":
        return <Hash size={16} />;
      case "event":
        return <Search size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  if (variant === "hero") {
    return (
      <div className={`searchbar searchbar--hero ${className}`} ref={searchRef}>
        <div className="searchbar__wrapper searchbar__wrapper--hero">
          <input
            type="text"
            className="searchbar__input searchbar__input--hero"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
          />
          <Search className="searchbar__icon searchbar__icon--hero" size={20} />
        </div>
        {isSearchFocused && searchQuery && searchResults.length > 0 && (
          <div className="searchbar__results searchbar__results--hero">
            {searchResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="searchbar__result"
                onClick={() => handleResultClick(result)}
              >
                <div className="searchbar__result-icon">
                  {getResultIcon(result.type)}
                </div>
                {result.avatar && (
                  <LazyImage
                    src={result.avatar}
                    alt={result.title}
                    className="searchbar__result-avatar"
                  />
                )}
                <div className="searchbar__result-content">
                  <div className="searchbar__result-title">{result.title}</div>
                  {result.subtitle && (
                    <div className="searchbar__result-subtitle">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {isSearchFocused && searchQuery && searchResults.length === 0 && (
          <div className="searchbar__results searchbar__results--hero">
            <div className="searchbar__result searchbar__result--empty">
              <div className="searchbar__result-content">
                <div className="searchbar__result-title">No results found</div>
                <div className="searchbar__result-subtitle">
                  Try searching for a different keyword
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`searchbar ${className}`} ref={searchRef}>
      <div className="searchbar__wrapper">
        <Search className="searchbar__icon" size={20} />
        <input
          type="text"
          className="searchbar__input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
        />
      </div>
      {isSearchFocused && searchQuery && searchResults.length > 0 && (
        <div className="searchbar__results">
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="searchbar__result"
              onClick={() => handleResultClick(result)}
            >
              <div className="searchbar__result-icon">
                {getResultIcon(result.type)}
              </div>
              {result.avatar && (
                <LazyImage
                  src={result.avatar}
                  alt={result.title}
                  className="searchbar__result-avatar"
                />
              )}
              <div className="searchbar__result-content">
                <div className="searchbar__result-title">{result.title}</div>
                {result.subtitle && (
                  <div className="searchbar__result-subtitle">
                    {result.subtitle}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {isSearchFocused && searchQuery && searchResults.length === 0 && (
        <div className="searchbar__results">
          <div className="searchbar__result searchbar__result--empty">
            <div className="searchbar__result-content">
              <div className="searchbar__result-title">No results found</div>
              <div className="searchbar__result-subtitle">
                Try searching for a different keyword
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

