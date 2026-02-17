import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "../../context/AuthContext";
import Scene3D from "../../components/3D/Scene3D";
import VirtualAssistant from "../../components/VirtualAssistant/VirtualAssistant";
import "./Home.css";

const Home = () => {
  const { isAuthenticated } = useAuth();
  
  // Refs for GSAP animations
  const heroContentRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroDescriptionRef = useRef(null);
  const heroCtaRef = useRef(null);
  const featureCardsRef = useRef(null);
  const subjectCardsRef = useRef(null);
  const stepsRef = useRef(null);
  const ctaButtonsRef = useRef(null);
  const floatingShapesRef = useRef(null);

  const sections = [
    {
      id: "about",
      title: "About Global Olympiad",
      subject: "math",
      content: (
        <>
          <p>
            Welcome to Global Olympiad, the premier online platform for
            academic competitions across multiple subjects. Our platform brings
            together students from around the world to compete, learn, and excel
            in their chosen fields.
          </p>
          <p>
            Whether you're passionate about Mathematics, Physics, Chemistry,
            English, or Science, we provide a fair, secure, and engaging
            environment for you to showcase your knowledge and skills.
          </p>
        </>
      ),
    },
    {
      id: "features",
      title: "Platform Features",
      subject: "physics",
      content: (
        <>
          <div className="features-grid" ref={featureCardsRef}>
            <div className="feature-card">
              <h3>🎯 Multiple Olympiad Types</h3>
              <p>
                Test-based and Essay formats to suit different learning styles
                and assessment methods.
              </p>
            </div>
            <div className="feature-card">
              <h3>📹 Advanced Proctoring</h3>
              <p>
                Real-time camera and screen monitoring to ensure fair
                competition and academic integrity.
              </p>
            </div>
            <div className="feature-card">
              <h3>⏱️ Timer System</h3>
              <p>
                Countdown timer with auto-submit functionality to manage your
                time effectively.
              </p>
            </div>
            <div className="feature-card">
              <h3>📊 Real-time Leaderboard</h3>
              <p>
                Live rankings via Socket.io to track your progress and see how
                you rank among participants.
              </p>
            </div>
            <div className="feature-card">
              <h3>👥 Role-based Access</h3>
              <p>
                Student, Admin, Owner, Resolter, and School Teacher roles with
                appropriate permissions.
              </p>
            </div>
            <div className="feature-card">
              <h3>🎨 Modern UI</h3>
              <p>
                Beautiful, colorful design with smooth animations perfect for
                young learners.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "subjects",
      title: "Available Subjects",
      subject: "chemistry",
      content: (
        <>
          <div className="subjects-grid" ref={subjectCardsRef}>
            <div className="subject-card">
              <h3>Mathematics</h3>
              <p>
                Challenge yourself with complex problems, equations, and
                mathematical reasoning.
              </p>
            </div>
            <div className="subject-card">
              <h3>Physics</h3>
              <p>
                Explore the laws of nature, mechanics, thermodynamics, and
                quantum physics.
              </p>
            </div>
            <div className="subject-card">
              <h3>Chemistry</h3>
              <p>
                Dive into molecular structures, reactions, and chemical
                processes.
              </p>
            </div>
            <div className="subject-card">
              <h3>English</h3>
              <p>
                Test your language skills, comprehension, and writing abilities.
              </p>
            </div>
            <div className="subject-card">
              <h3>Science</h3>
              <p>
                Comprehensive scientific knowledge covering biology, astronomy,
                and more.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "how-it-works",
      title: "How It Works",
      subject: "english",
      content: (
        <>
          <div className="steps-container" ref={stepsRef}>
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Sign Up & Complete Profile</h3>
                <p>
                  Create your account and complete your profile to get started.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Browse Available Olympiads</h3>
                <p>
                  Explore upcoming and active olympiads in your preferred
                  subjects.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Start & Complete</h3>
                <p>
                  Begin the olympiad, answer questions, and submit your
                  responses before time runs out.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>View Results & Leaderboard</h3>
                <p>
                  Check your results, see your ranking, and compare with other
                  participants.
                </p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "get-started",
      title: "Get Started Today",
      subject: "science",
      content: (
        <>
          <p className="get-started-text">
            Ready to test your knowledge and compete with students worldwide?
            Join Global Olympiad today and embark on your academic journey!
          </p>
          <div className="cta-buttons" ref={ctaButtonsRef}>
            {!isAuthenticated ? (
              <>
                <Link to="/auth" className="cta-button primary">
                  Sign Up Now
                </Link>
                <Link to="/auth" className="cta-button secondary">
                  Log In
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="cta-button primary">
                  Go to Dashboard
                </Link>
                <Link to="/results" className="cta-button secondary">
                  View Results
                </Link>
              </>
            )}
          </div>
        </>
      ),
    },
  ];

  // GSAP Animations on mount
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return; // Skip animations if user prefers reduced motion
    }

    // Create main timeline
    const tl = gsap.timeline();

    // Hero section animations - fade + slide up
    if (heroContentRef.current) {
      gsap.set(heroContentRef.current, { opacity: 0, y: 50 });
      tl.to(heroContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }

    // Stagger hero elements
    if (heroTitleRef.current) {
      gsap.set(heroTitleRef.current, { opacity: 0, y: 30 });
      tl.to(
        heroTitleRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      );
    }

    if (heroSubtitleRef.current) {
      gsap.set(heroSubtitleRef.current, { opacity: 0, y: 20 });
      tl.to(
        heroSubtitleRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.3"
      );
    }

    if (heroDescriptionRef.current) {
      gsap.set(heroDescriptionRef.current, { opacity: 0, y: 20 });
      tl.to(
        heroDescriptionRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      );
    }

    if (heroCtaRef.current) {
      gsap.set(heroCtaRef.current, { opacity: 0, scale: 0.8 });
      tl.to(
        heroCtaRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.2"
      );
    }

    // Animate floating shapes
    if (floatingShapesRef.current) {
      const shapes = floatingShapesRef.current.children;
      Array.from(shapes).forEach((shape, index) => {
        gsap.to(shape, {
          y: `+=${30 + index * 10}`,
          x: `+=${20 + index * 5}`,
          rotation: 360,
          duration: 15 + index * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }

    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;

          // Feature cards stagger
          if (target.classList.contains("features-grid")) {
            const cards = target.children;
            gsap.fromTo(
              cards,
              {
                opacity: 0,
                y: 40,
                scale: 0.9,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
              }
            );
          }

          // Subject cards stagger
          if (target.classList.contains("subjects-grid")) {
            const cards = target.children;
            gsap.fromTo(
              cards,
              {
                opacity: 0,
                y: 40,
                scale: 0.9,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
              }
            );
          }

          // Steps stagger
          if (target.classList.contains("steps-container")) {
            const steps = target.children;
            gsap.fromTo(
              steps,
              {
                opacity: 0,
                x: -40,
              },
              {
                opacity: 1,
                x: 0,
                duration: 0.6,
                stagger: 0.15,
                ease: "power2.out",
              }
            );
          }

          // Section titles
          if (target.classList.contains("section-title")) {
            gsap.fromTo(
              target,
              {
                opacity: 0,
                y: 30,
              },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
              }
            );
          }

          observer.unobserve(target);
        }
      });
    }, observerOptions);

    // Observe elements for scroll animations
    if (featureCardsRef.current) {
      observer.observe(featureCardsRef.current);
    }
    if (subjectCardsRef.current) {
      observer.observe(subjectCardsRef.current);
    }
    if (stepsRef.current) {
      observer.observe(stepsRef.current);
    }

    // Observe all section titles
    const sectionTitles = document.querySelectorAll(".section-title");
    sectionTitles.forEach((title) => {
      observer.observe(title);
    });

    // Button hover animations using GSAP
    const setupButtonHovers = () => {
      const buttons = document.querySelectorAll(".hero-cta, .cta-button");
      buttons.forEach((button) => {
        button.addEventListener("mouseenter", () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        button.addEventListener("mouseleave", () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });
    };

    setupButtonHovers();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="home-page">
      {/* Floating Decorative Shapes */}
      <div className="floating-shapes" ref={floatingShapesRef}>
        <div className="floating-shape circle-1"></div>
        <div className="floating-shape circle-2"></div>
        <div className="floating-shape circle-3"></div>
        <div className="floating-shape blob-1"></div>
        <div className="floating-shape blob-2"></div>
      </div>

      {/* Virtual Assistant */}
      <VirtualAssistant />
      {/* Hero Section */}
      <section className="hero-section h-svh ">
        <div className="hero-3d">
          <Scene3D subject="math" />
        </div>
        <div className="hero-content" ref={heroContentRef}>
          <h1 className="hero-title" ref={heroTitleRef}>
            <span className="text-glow">Global Olympiad</span>
          </h1>
          <p className="hero-subtitle" ref={heroSubtitleRef}>Compete, Learn, Excel</p>
          <p className="hero-description" ref={heroDescriptionRef}>
            The premier online platform for academic competitions across
            Mathematics, Physics, Chemistry, English, and Science.
          </p>
          {!isAuthenticated && (
            <Link to="/auth" className="hero-cta" ref={heroCtaRef}>
              Get Started
            </Link>
          )}
        </div>
      </section>

      {/* Informative Sections */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          className={`info-section ${section.id}-section`}
        >
          <div className="section-3d">
            <Scene3D subject={section.subject} />
          </div>
          <div className="section-content">
            <div className="container">
              <h2 className="section-title">{section.title}</h2>
              <div className="section-body">{section.content}</div>
            </div>
          </div>
        </section>
      ))}

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>&copy; 2024 Global Olympiad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
