import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Scene3D from "../../components/3D/Scene3D";
import "./About.css";

const About = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section h-svh ">
        <div className="hero-3d">
          <Scene3D subject="math" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="text-glow">About Global Olympiad</span>
          </h1>
          <p className="hero-subtitle">Empowering Students Worldwide</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="physics" />
        </div>
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">Our Mission</h2>
            <div className="section-body">
              <p>
                Global Olympiad is dedicated to providing a world-class platform
                for academic excellence and competition. We believe that every
                student deserves the opportunity to showcase their knowledge,
                challenge themselves, and compete on a global stage.
              </p>
              <p>
                Our mission is to create a fair, secure, and engaging environment
                where students from around the world can participate in academic
                competitions across multiple subjects, track their progress, and
                achieve their full potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="chemistry" />
        </div>
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">Our Vision</h2>
            <div className="section-body">
              <p>
                We envision a future where academic competitions are accessible to
                all students, regardless of their location or background. Through
                innovative technology and a commitment to excellence, we aim to
                become the leading platform for online academic competitions
                worldwide.
              </p>
              <p>
                Our platform combines cutting-edge proctoring technology, real-time
                leaderboards, and comprehensive assessment tools to ensure a
                seamless and fair competition experience for all participants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="english" />
        </div>
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <h3>Integrity</h3>
                <p>
                  We maintain the highest standards of academic integrity through
                  advanced proctoring and security measures.
                </p>
              </div>
              <div className="value-card">
                <h3>Excellence</h3>
                <p>
                  We strive for excellence in every aspect of our platform, from
                  user experience to competition quality.
                </p>
              </div>
              <div className="value-card">
                <h3>Accessibility</h3>
                <p>
                  We believe education and competition should be accessible to all,
                  regardless of geographical or economic barriers.
                </p>
              </div>
              <div className="value-card">
                <h3>Innovation</h3>
                <p>
                  We continuously innovate to provide the best possible experience
                  for students, teachers, and administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="info-section">
          <div className="section-3d">
            <Scene3D subject="science" />
          </div>
          <div className="section-content">
            <div className="container">
              <h2 className="section-title">Join Us Today</h2>
              <div className="section-body">
                <p className="get-started-text">
                  Ready to be part of the Global Olympiad community? Sign up now
                  and start your journey towards academic excellence!
                </p>
                <div className="cta-buttons">
                  <Link to="/auth" className="cta-button primary">
                    Sign Up Now
                  </Link>
                  <Link to="/auth" className="cta-button secondary">
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>&copy; 2024 Global Olympiad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;

