import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getNavigationItems, isActiveRoute } from "../utils/navigationConfig";
import { getImageUrl } from "../utils/helpers";
import BalanceDisplay from "./BalanceDisplay/BalanceDisplay";
import "./Navbar.css";

const Navbar = () => {
  const logoPath = `${import.meta.env.BASE_URL}logo.png`;
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  // Show navbar on public pages even if not authenticated
  const publicPages = ["/", "/about", "/contact", "/services", "/auth"];
  const isPublicPage = publicPages.includes(location.pathname);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navigationItems = useMemo(() => {
    if (!isAuthenticated || !user?.role) return [];
    return getNavigationItems(user.role);
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated && !isPublicPage) {
    return null;
  }

  const renderPublicLinks = () => (
    <>
      <Link to="/" className="navbar-link">
        Home
      </Link>
      <Link to="/about" className="navbar-link">
        About
      </Link>
      <Link to="/services" className="navbar-link">
        Services
      </Link>
      <Link to="/contact" className="navbar-link">
        Contact
      </Link>
    </>
  );

  const renderAuthLinks = () => (
    <>
      {navigationItems.map((item, index) => (
        <Link
          key={`${item.path}-${item.label}-${index}`}
          to={item.path}
          className={`navbar-link ${
            isActiveRoute(item.path, location.pathname) ? "active" : ""
          }`}
        >
          {item.label}
        </Link>
      ))}

      <div className="navbar-account-group">
        <BalanceDisplay />

        <Link to="/profile" className="navbar-user">
          {user?.userLogo ? (
            <img
              src={getImageUrl(user.userLogo)}
              alt="Profile"
              className="navbar-user-avatar"
            />
          ) : (
            <div className="navbar-user-avatar-placeholder">
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
          )}
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="button-secondary navbar-logout"
      >
        Logout
      </button>
    </>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          <img src={logoPath} alt="Global Olympiad logo" className="navbar-logo-image" />
          <span className="navbar-logo-text" aria-label="Global Olympiad">
            lobal Olympiad
          </span>
        </Link>

        <div className="navbar-menu navbar-menu-desktop">
          {!isAuthenticated && renderPublicLinks()}

          {isAuthenticated ? (
            renderAuthLinks()
          ) : (
            <Link to="/auth" className="navbar-login">
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`navbar-mobile-toggle ${mobileMenuOpen ? "open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className="navbar-mobile-toggle-icon">
            <span className="navbar-mobile-toggle-dots">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          </span>
        </button>
      </div>

      <div
        className={`navbar-mobile-backdrop ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <div className={`navbar-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        {!isAuthenticated && renderPublicLinks()}

        {isAuthenticated ? (
          renderAuthLinks()
        ) : (
          <Link to="/auth" className="navbar-login">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
