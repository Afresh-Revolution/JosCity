import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Shield, Zap, User, Info } from "lucide-react";
import { preloadImage } from "../utils/imagePreloader";
import {
  getRegisteredCitizensCount,
  formatCitizenCount,
  getRegisteredCitizensCountWithRefresh,
} from "../utils/citizenCountUtils";
import "../main.css";
// Import images as modules for Vite build compatibility (fallback)
import heroImage1 from "../image/hero-image.png";
import heroImage2 from "../image/jos.jpg";
import heroImage3 from "../image/terminus.png";
import heroImage4 from "../image/discover.jpg";
import aboutImage from "../image/3dwOMAN.png";

interface HeroSlide {
  id: string;
  image_url: string;
  title: string;
  subtitle?: string;
  description?: string;
  slide_order: number;
  is_active: boolean;
}

// Fallback slides if API fails
const fallbackSlides = [
  {
    id: "1",
    image_url: heroImage1,
    title: "Welcome to ",
    subtitle: "Jos Smart City, The-Digital Economy",
    description:
      "Access all municipal services, pay bills, and engage with your city - all in one place.",
    slide_order: 0,
    is_active: true,
  },
  {
    id: "2",
    image_url: heroImage2,
    title: "Join the Community!",
    subtitle: "Get a Job!",
    description:
      "Get a Job through the Smart City Job Portal and enjoy all the benefits of being a member of the Jos Smart City community. ",
    slide_order: 1,
    is_active: true,
  },
  {
    id: "3",
    image_url: heroImage3,
    title: "Shop at",
    subtitle: "Jos Central Market!",
    description:
      "Discover a vibrant shopping experience at Jos Central Market! Browse through a wide variety of fresh produce, local crafts, textiles, and everyday essentials. Support local vendors and enjoy the bustling atmosphere of one of Jos's most iconic marketplaces.",
    slide_order: 2,
    is_active: true,
  },
  {
    id: "4",
    image_url: heroImage4,
    title: "Discover Events &",
    subtitle: "Rich Traditions!",
    description:
      "Explore vibrant cultural events, parties, and community gatherings that bring our city together. Experience the rich heritage and traditions of Jos.",
    slide_order: 3,
    is_active: true,
  },
];

function Hero() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Use fallback slides (no API calls)
  useEffect(() => {
    setHeroSlides(fallbackSlides);
  }, []);

  // Preload all hero images on mount for better performance
  useEffect(() => {
    if (heroSlides.length === 0) return;

    // Preload all slide images upfront
    const imageUrls = heroSlides
      .map((slide) => slide.image_url)
      .filter((url) => url); // Filter out empty URLs

    imageUrls.forEach((url) => {
      // Preload all images (both local module imports and external URLs)
      // Vite converts module imports to URLs, and external URLs work directly
      if (typeof url === "string") {
        preloadImage(url).catch(() => {
          // Silently handle errors - image will show placeholder
        });
      }
    });
  }, [heroSlides]);

  // Preload next slide image when current slide changes
  useEffect(() => {
    if (heroSlides.length === 0) return;

    // Preload next slide image for smooth transition
    const nextIndex = (currentSlide + 1) % heroSlides.length;
    const nextSlideData = heroSlides[nextIndex];
    if (nextSlideData && nextSlideData.image_url) {
      preloadImage(nextSlideData.image_url).catch(() => {
        // Silently handle errors
      });
    }
  }, [currentSlide, heroSlides]);

  useEffect(() => {
    if (heroSlides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Reset fade-in on slide change with different directions
  useEffect(() => {
    // Remove fade-in classes first to trigger animation
    setVisibleElements(new Set());

    // Re-add fade-in classes with delay for staggered effect
    const timer = setTimeout(() => {
      setVisibleElements(
        new Set([
          "hero-badge",
          "hero-title",
          "hero-subtitle",
          "hero-description",
          "hero-buttons",
        ])
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  useEffect(() => {
    // Trigger fade-in immediately for hero section (at top of page)
    const timer = setTimeout(() => {
      setVisibleElements(
        new Set([
          "hero-badge",
          "hero-title",
          "hero-subtitle",
          "hero-description",
          "hero-buttons",
        ])
      );
    }, 100);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.id;

          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(elementId));
          } else {
            // Remove from visible when scrolling out
            setVisibleElements((prev) => {
              const newSet = new Set(prev);
              newSet.delete(elementId);
              return newSet;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = [
      badgeRef.current,
      titleRef.current,
      subtitleRef.current,
      descriptionRef.current,
      buttonsRef.current,
    ];

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      clearTimeout(timer);
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleGetStarted = () => {
    navigate("/welcome");
  };

  const handleLearnMore = () => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <>
      <div id="home" className="hero">
        {heroSlides.map((slide, index) => {
          // Always show real image (no gradients)
          const imageUrl = slide.image_url;
          const isCurrentSlide = index === currentSlide;

          return (
            <div
              key={slide.id}
              className={`hero__slide ${isCurrentSlide ? "active" : ""}`}
              style={{
                backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="hero__overlay"></div>
            </div>
          );
        })}

        <div className="hero__content">
          <div
            ref={badgeRef}
            id="hero-badge"
            className={`hero__badge ${
              visibleElements.has("hero-badge") ? "fade-in" : ""
            }`}
            onClick={() => navigate("https://cbrilliance.io/")}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/admin/login");
              }
            }}
            aria-label="Go to a dmin panel"
          >
            <Lightbulb size={20} />
            <span>Powered by Cbrilliance AI tech LTD</span>
          </div>

          <h1
            ref={titleRef}
            id="hero-title"
            className={`hero__title ${
              visibleElements.has("hero-title") ? "fade-in" : ""
            }`}
          >
            <span className="hero__title-text">
              {heroSlides[currentSlide].title}
            </span>
          </h1>
          <h2
            ref={subtitleRef}
            id="hero-subtitle"
            className={`hero__subtitle ${
              visibleElements.has("hero-subtitle") ? "fade-in" : ""
            }`}
          >
            {heroSlides[currentSlide].subtitle}
          </h2>
          <p
            ref={descriptionRef}
            id="hero-description"
            className={`hero__description ${
              visibleElements.has("hero-description") ? "fade-in" : ""
            }`}
          >
            {heroSlides[currentSlide].description}
          </p>

          <div
            ref={buttonsRef}
            id="hero-buttons"
            className={`hero__buttons ${
              visibleElements.has("hero-buttons") ? "fade-in" : ""
            }`}
          >
            <button
              className="hero__button hero__button--primary"
              onClick={handleGetStarted}
            >
              Get Started <span>&gt;</span>
            </button>
            <button
              className="hero__button hero__button--secondary"
              onClick={handleLearnMore}
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="hero__pagination">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`hero__pagination-dot ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <AboutSection />
    </>
  );
}

function AboutSection() {
  const [visibleStats, setVisibleStats] = useState<Set<number>>(new Set());
  const [visibleAbout, setVisibleAbout] = useState(false);
  const [registeredCitizensCount, setRegisteredCitizensCount] =
    useState<string>("0");
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  // Load count from API and listen for updates
  useEffect(() => {
    const loadCount = async () => {
      // Fetch from API (with cache fallback)
      const count = await getRegisteredCitizensCountWithRefresh();
      setRegisteredCitizensCount(formatCitizenCount(count));
    };

    // Load initial count from API
    loadCount();

    // Refresh count every 5 minutes
    const refreshInterval = setInterval(loadCount, 5 * 60 * 1000);

    // Listen for storage changes (when count is updated in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "registeredCitizensCount") {
        const count = getRegisteredCitizensCount();
        setRegisteredCitizensCount(formatCitizenCount(count));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom event for same-tab updates
    const handleCountUpdate = () => {
      loadCount(); // Refresh from API when updated
    };

    window.addEventListener("citizenCountUpdated", handleCountUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("citizenCountUpdated", handleCountUpdate);
    };
  }, []);

  useEffect(() => {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate stats one by one
            [0, 1, 2, 3].forEach((index) => {
              setTimeout(() => {
                setVisibleStats((prev) => new Set(prev).add(index));
              }, index * 150);
            });
          } else {
            // Remove stats when scrolling out
            [0, 1, 2, 3].forEach((index) => {
              setVisibleStats((prev) => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
              });
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    const aboutObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleAbout(true);
          } else {
            // Fade out when scrolling out
            setVisibleAbout(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    const statsElement = statsRef.current;
    const aboutElement = aboutRef.current;

    if (statsElement) {
      statsObserver.observe(statsElement);
    }
    if (aboutElement) {
      aboutObserver.observe(aboutElement);
    }

    return () => {
      if (statsElement) statsObserver.unobserve(statsElement);
      if (aboutElement) aboutObserver.unobserve(aboutElement);
    };
  }, []);

  const stats = [
    { number: registeredCitizensCount, label: "Registered Citizens" },
    { number: "12+", label: "Digital Services" },
    { number: "24/7", label: "Support Available" },
    { number: "PND", label: "Satisfaction Rate" },
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security for all transactions and data",
    },
    {
      icon: Zap,
      title: "Fast & Efficient",
      description: "Quick processing and instant confirmations",
    },
    {
      icon: User,
      title: "User-Friendly",
      description: "Designed with citizens in mind",
    },
  ];

  return (
    <section id="about" className="about-section">
      <div className="about-section__stats" ref={statsRef}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`about-section__stat ${
              visibleStats.has(index) ? "fade-in-up" : ""
            }`}
            style={{ transitionDelay: `${index * 0.15}s` }}
          >
            <div className="about-section__stat-number">{stat.number}</div>
            <div className="about-section__stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="about-section__content" ref={aboutRef}>
        <div className="about-section__text">
          <div
            className={`about-section__tag ${
              visibleAbout ? "fade-in-left" : ""
            }`}
          >
            <Info size={16} />
            <span>About Jos Smart City</span>
          </div>
          <h2
            className={`about-section__heading ${
              visibleAbout ? "fade-in-left" : ""
            }`}
            style={{ transitionDelay: "0.1s" }}
          >
            Building a Smarter, Connected City.
          </h2>
          <div
            className={`about-section__description ${
              visibleAbout ? "fade-in-left" : ""
            }`}
            style={{ transitionDelay: "0.2s" }}
          >
            <p>
              Jos Smart City is a membership-driven digital ecosystem that
              connects residents, businesses, and visitors. Residents enjoy
              discounted services, while vendors benefit from verified customers
              and secure payments.
            </p>
            <p>
              With cutting-edge technology and a user-friendly design, our
              platform makes it easy to pay bills, access services, shop
              locally, and engage with your community.
            </p>
            <p>
              Key features include JosCity Wallet & Points System, Digital
              Membership ID, Vendor Dashboard, and Referral & Rewards Program.
            </p>
            <p>
              We're redefining how urban life works — bringing together your
              city's marketplace, membership, and wallet — all in one place.
            </p>
          </div>
          <div
            className={`about-section__features ${
              visibleAbout ? "fade-in-left" : ""
            }`}
            style={{ transitionDelay: "0.3s" }}
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="about-section__feature">
                  <div className="about-section__feature-icon">
                    <IconComponent size={24} />
                  </div>
                  <div className="about-section__feature-content">
                    <h3 className="about-section__feature-title">
                      {feature.title}
                    </h3>
                    <p className="about-section__feature-description">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          className={`about-section__image-wrapper ${
            visibleAbout ? "fade-in-right" : ""
          }`}
          style={{ transitionDelay: "0.4s" }}
        >
          <img
            src={aboutImage}
            alt="3D illustration of a woman with smartphone"
            className="about-section__image"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
