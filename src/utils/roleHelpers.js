import { USER_ROLES } from "./constants";

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  return user.role === role;
};

/**
 * Check if user can view portfolio lists
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canViewPortfolioList = (user) => {
  if (!user || !user.role) return false;
  return [
    USER_ROLES.CHECKER,
    USER_ROLES.UNIVERSITY,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER,
  ].includes(user.role);
};

/**
 * Check if user can verify portfolios (checker role)
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canVerifyPortfolio = (user) => {
  if (!user || !user.role) return false;
  return user.role === USER_ROLES.CHECKER;
};

/**
 * Check if user can access university dashboard
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canViewUniversityDashboard = (user) => {
  if (!user || !user.role) return false;
  return user.role === USER_ROLES.UNIVERSITY;
};

/**
 * Check if user can view student contact information
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canViewStudentContacts = (user) => {
  if (!user || !user.role) return false;
  return [
    USER_ROLES.UNIVERSITY,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER,
  ].includes(user.role);
};

/**
 * Check if user is admin or owner (has admin privileges)
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isAdminOrOwner = (user) => {
  if (!user || !user.role) return false;
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.OWNER;
};

