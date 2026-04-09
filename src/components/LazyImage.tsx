import React, { useState, useRef, useEffect, forwardRef } from "react";

interface LazyImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "fetchpriority" | "fetchPriority"> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  /** Maps to DOM `fetchpriority` (React 18 expects lowercase on `img`). */
  fetchpriority?: "high" | "low" | "auto";
}

const LazyImage = forwardRef<HTMLDivElement, LazyImageProps>(
  (
    {
      src,
      alt,
      placeholder,
      className = "",
      onLoad,
      onError,
      fetchpriority,
      style,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Use forwarded ref or internal ref
    const containerRef = ref && typeof ref !== "function" ? ref : wrapperRef;

    useEffect(() => {
      // For critical images or if already in viewport, load immediately
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isInViewport =
          rect.top < window.innerHeight + 100 &&
          rect.bottom > -100 &&
          rect.left < window.innerWidth + 100 &&
          rect.right > -100;

        if (isInViewport) {
          setIsInView(true);
          return;
        }
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        {
          threshold: 0.01,
          rootMargin: "100px", // Increased from 50px for earlier loading
        }
      );

      const element = containerRef.current;
      if (element) {
        observer.observe(element);
      }

      return () => {
        observer.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLoad = () => {
      setIsLoaded(true);
      if (onLoad) {
        onLoad();
      }
    };

    const handleError = () => {
      setHasError(true);
      if (onError) {
        onError();
      }
    };

    return (
      <div
        ref={containerRef}
        className={`lazy-image-wrapper ${className}`}
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: placeholder ? "transparent" : "#f0f0f0",
        }}
      >
        {isInView && (
          <>
            {!isLoaded && !hasError && (
              <div
                className="lazy-image-placeholder"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: placeholder
                    ? `url(${placeholder}) center/cover`
                    : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                  backgroundSize: placeholder ? "cover" : "200% 100%",
                  animation: placeholder ? "none" : "shimmer 1.5s infinite",
                }}
              />
            )}
            <img
              src={src}
              alt={alt}
              className={`lazy-image ${
                isLoaded ? "lazy-image-loaded" : "lazy-image-loading"
              }`}
              onLoad={handleLoad}
              onError={handleError}
              loading="lazy"
              decoding="async"
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
                width: "100%",
                height: "100%",
                objectFit: style?.objectFit ?? "cover",
                ...style,
              }}
              {...props}
              // React 18 warns on camelCase `fetchPriority`; DOM uses `fetchpriority`.
              {...({
                fetchpriority: fetchpriority ?? "auto",
              } as React.ImgHTMLAttributes<HTMLImageElement>)}
            />
          </>
        )}
        {hasError && (
          <div
            className="lazy-image-error"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              color: "#999",
              fontSize: "14px",
            }}
          >
            Failed to load image
          </div>
        )}
        <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      </div>
    );
  }
);

LazyImage.displayName = "LazyImage";

export default LazyImage;
