import { Link } from "react-router-dom";
import Scene3D from "../../components/3D/Scene3D";
import "./About.css";

const About = () => {
  return (
    <div className="about-page">
      <section className="hero-section h-svh">
        <div className="hero-3d">
          <Scene3D subject="math" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="text-glow">About Global Olympiad</span>
          </h1>
          <p className="hero-subtitle">Academic competitions for everyone</p>
        </div>
      </section>

      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="physics" />
        </div>
        <div className="about-content">
          <h2>Our Mission</h2>
          <p>
            Global Olympiad is the premier online platform for academic competitions
            across Mathematics, Physics, Chemistry, English, and Science. We
            bring together students from around the world to compete, learn, and
            excel in their chosen fields.
          </p>
          <p>
            We provide a fair, secure, and engaging environment for students to
            showcase their knowledge and skills through test-based and essay
            olympiads, with advanced proctoring and instant results.
          </p>
          <h2>Get Started</h2>
          <p>
            <Link to="/auth" className="about-link">
              Sign in
            </Link>{" "}
            or{" "}
            <Link to="/" className="about-link">
              explore the platform
            </Link>{" "}
            to join the next competition.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
