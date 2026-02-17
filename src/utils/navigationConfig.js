import { USER_ROLES } from "./constants";

/**
 * Navigation configuration mapping roles to their allowed menu items
 * Each menu item has: { label, path }
 * 
 * Note: Backend uses "school-admin" and "school-teacher" (hyphens),
 * but constants use "school_admin" and "school_teacher" (underscores).
 * We handle both formats.
 */
export const ROLE_NAVIGATION_CONFIG = {
  // 🟢 STUDENT
  [USER_ROLES.STUDENT]: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Portfolio (Beta)", path: "/dashboard/portfolio" },
    { label: "Results", path: "/results" },
    { label: "Profile", path: "/profile" },
  ],

  // 🟡 SCHOOL-TEACHER / SCHOOL-ADMIN
  [USER_ROLES.SCHOOL_TEACHER]: [
    { label: "Dashboard (School)", path: "/dashboard" },
    { label: "Students", path: "/school-teacher" },
    { label: "Results", path: "/results" },
    { label: "Profile", path: "/profile" },
  ],
  "school-teacher": [ // Backend format
    { label: "Dashboard (School)", path: "/dashboard" },
    { label: "Students", path: "/school-teacher" },
    { label: "Results", path: "/results" },
    { label: "Profile", path: "/profile" },
  ],

  [USER_ROLES.SCHOOL_ADMIN]: [
    { label: "Dashboard (School)", path: "/dashboard" },
    { label: "Students", path: "/dashboard" },
    { label: "Results", path: "/results" },
    { label: "Profile", path: "/profile" },
  ],
  "school-admin": [ // Backend format
    { label: "Dashboard (School)", path: "/dashboard" },
    { label: "Students", path: "/dashboard" },
    { label: "Results", path: "/results" },
    { label: "Profile", path: "/profile" },
  ],

  // 🔵 UNIVERSITY
  [USER_ROLES.UNIVERSITY]: [
    { label: "Dashboard (University)", path: "/university" },
    { label: "Students Portfolios", path: "/university-panel" },
    { label: "Buy Coins", path: "/buy-coins" },
    { label: "Profile", path: "/profile" },
  ],

  // 🟣 RESOLTER
  [USER_ROLES.RESOLTER]: [
    { label: "Dashboard (Results)", path: "/resolter" },
    { label: "Published Results", path: "/results" },
  ],

  // 🔴 ADMIN
  [USER_ROLES.ADMIN]: [
    { label: "Dashboard (Admin)", path: "/admin" },
    { label: "Universities", path: "/universities" },
    { label: "Schools", path: "/schools" },
    { label: "Results", path: "/results" },
    { label: "Profile", path: "/profile" },
  ],

  // ⚫ OWNER
  [USER_ROLES.OWNER]: [
    { label: "Dashboard (Owner)", path: "/owner" },
    { label: "Olympiads", path: "/admin" },
    { label: "Universities", path: "/universities" },
    { label: "Schools", path: "/schools" },
    { label: "Results", path: "/results" },
    { label: "Settings", path: "/settings" },
  ],

  // ⚫ CHECKER
  [USER_ROLES.CHECKER]: [
    { label: "Verification Panel", path: "/checker" },
    { label: "Profile", path: "/profile" },
  ],
};

/**
 * Get navigation items for a specific role
 * @param {string} role - User role (can be from constants or backend format)
 * @returns {Array} Array of navigation items (deduplicated by path)
 */
export const getNavigationItems = (role) => {
  if (!role) return [];
  
  let items = [];
  
  // Try exact match first
  if (ROLE_NAVIGATION_CONFIG[role]) {
    items = ROLE_NAVIGATION_CONFIG[role];
  } else {
    // Handle role format variations (underscore vs hyphen)
    // Backend uses "school-admin" and "school-teacher" with hyphens
    // Constants use "school_admin" and "school_teacher" with underscores
    const normalizedRole = role.replace(/_/g, "-");
    if (ROLE_NAVIGATION_CONFIG[normalizedRole]) {
      items = ROLE_NAVIGATION_CONFIG[normalizedRole];
    } else {
      // Try reverse (hyphen to underscore)
      const reverseNormalized = role.replace(/-/g, "_");
      if (ROLE_NAVIGATION_CONFIG[reverseNormalized]) {
        items = ROLE_NAVIGATION_CONFIG[reverseNormalized];
      }
    }
  }
  
  // Deduplicate by path + label combination (allow same path with different labels)
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.path}:${item.label}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Check if a path is active (matches current location)
 * Handles partial matches for nested routes
 */
export const isActiveRoute = (menuPath, currentPath) => {
  if (menuPath === currentPath) return true;
  
  // Handle portfolio route
  if (menuPath === "/dashboard/portfolio" && currentPath.startsWith("/dashboard/portfolio")) {
    return true;
  }
  
  // Handle dashboard and nested routes
  if (menuPath === "/dashboard" && currentPath.startsWith("/dashboard")) {
    // Exclude portfolio from dashboard active state
    if (currentPath.startsWith("/dashboard/portfolio")) return false;
    return true;
  }
  
  // Handle olympiad routes
  if (menuPath === "/dashboard" && currentPath.startsWith("/olympiad/")) {
    return true;
  }
  
  // Handle university panel routes (check before university to avoid false matches)
  if (menuPath === "/university-panel" && currentPath.startsWith("/university-panel")) {
    return true;
  }

  // Handle university routes (exact match or /university/ but not /university-panel)
  if (menuPath === "/university" && (currentPath === "/university" || (currentPath.startsWith("/university/") && !currentPath.startsWith("/university-panel")))) {
    return true;
  }
  
  // Handle admin panel routes
  if (menuPath === "/admin" && currentPath.startsWith("/admin")) {
    return true;
  }
  
  // Handle owner panel routes
  if (menuPath === "/owner" && currentPath.startsWith("/owner")) {
    return true;
  }
  
  // Handle checker panel routes
  if (menuPath === "/checker" && currentPath.startsWith("/checker")) {
    return true;
  }
  
  // Handle resolter panel routes
  if (menuPath === "/resolter" && currentPath.startsWith("/resolter")) {
    return true;
  }
  
  // Handle school teacher panel routes
  if (menuPath === "/school-teacher" && currentPath.startsWith("/school-teacher")) {
    return true;
  }

  // Handle universities routes
  if (menuPath === "/universities" && currentPath.startsWith("/universities")) {
    return true;
  }

  // Handle schools routes
  if (menuPath === "/schools" && currentPath.startsWith("/schools")) {
    return true;
  }
  
  return false;
};

