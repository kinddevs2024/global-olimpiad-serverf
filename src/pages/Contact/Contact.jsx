import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Scene3D from "../../components/3D/Scene3D";
import "./Contact.css";

const Contact = () => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="hero-section h-svh ">
        <div className="hero-3d">
          <Scene3D subject="math" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="text-glow">Contact Us</span>
          </h1>
          <p className="hero-subtitle">We'd love to hear from you</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="physics" />
        </div>
        <div className="section-content">
          <div className="container">
            <div className="contact-container">
              <div className="contact-info">
                <h2 className="section-title">Get in Touch</h2>
                <p className="contact-description">
                  Have questions, suggestions, or need support? We're here to help!
                  Fill out the form below or reach out to us through the contact
                  information provided.
                </p>

                <div className="contact-details">
                  <div className="contact-item">
                    <h3>Email</h3>
                    <p>support@globalolympiad.com</p>
                  </div>
                  <div className="contact-item">
                    <h3>Response Time</h3>
                    <p>We typically respond within 24-48 hours</p>
                  </div>
                  <div className="contact-item">
                    <h3>Support Hours</h3>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM (UTC)</p>
                  </div>
                </div>
              </div>

              <div className="contact-form-container">
                {submitted ? (
                  <div className="success-message">
                    <h3>Thank you for contacting us!</h3>
                    <p>We'll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this regarding?"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="6"
                        placeholder="Your message here..."
                      />
                    </div>

                    <button type="submit" className="submit-button">
                      Send Message
                    </button>
                  </form>
                )}
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
              <h2 className="section-title">Ready to Get Started?</h2>
              <div className="section-body">
                <p className="get-started-text">
                  Join thousands of students competing in Global Olympiad today!
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

export default Contact;

