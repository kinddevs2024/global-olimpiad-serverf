/**
 * Verification Helper Utilities
 * Calculates verification statuses at different levels
 */

/**
 * Calculate section verification status from items
 * @param {Array} items - Array of items (certificates, achievements, etc.)
 * @returns {Object} Section verification status
 */
export const calculateSectionStatus = (items) => {
  if (!items || items.length === 0) {
    return {
      status: "unverified",
      verifiedCount: 0,
      totalCount: 0,
    };
  }

  const verified = items.filter(
    (item) => item.verification?.status === "verified"
  ).length;
  const pending = items.filter(
    (item) => item.verification?.status === "pending"
  ).length;
  const rejected = items.filter(
    (item) => item.verification?.status === "rejected"
  ).length;
  const unverified = items.filter(
    (item) => !item.verification || item.verification?.status === "unverified"
  ).length;

  const totalCount = items.length;

  if (verified === totalCount) {
    return {
      status: "verified",
      verifiedCount: verified,
      totalCount,
      pendingCount: 0,
      rejectedCount: 0,
      unverifiedCount: 0,
    };
  }

  if (verified > 0 || pending > 0) {
    return {
      status: "partially_verified",
      verifiedCount: verified,
      totalCount,
      pendingCount: pending,
      rejectedCount: rejected,
      unverifiedCount: unverified,
    };
  }

  return {
    status: "unverified",
    verifiedCount: 0,
    totalCount,
    pendingCount: pending,
    rejectedCount: rejected,
    unverifiedCount: unverified,
  };
};

/**
 * Calculate portfolio verification status from sections
 * @param {Array} sections - Array of portfolio sections
 * @returns {Object} Portfolio verification status
 */
export const calculatePortfolioStatus = (sections) => {
  if (!sections || sections.length === 0) {
    return {
      status: "unverified",
      verifiedSections: 0,
      totalSections: 0,
      verifiedItems: 0,
      totalItems: 0,
    };
  }

  // Sections that can be verified
  const verifiableSectionTypes = [
    "certificates",
    "achievements",
    "skills",
    "projects",
    "education",
  ];

  const verifiableSections = sections.filter((section) =>
    verifiableSectionTypes.includes(section.type)
  );

  if (verifiableSections.length === 0) {
    return {
      status: "unverified",
      verifiedSections: 0,
      totalSections: 0,
      verifiedItems: 0,
      totalItems: 0,
    };
  }

  let verifiedSections = 0;
  let verifiedItems = 0;
  let totalItems = 0;

  verifiableSections.forEach((section) => {
    const items = getSectionItems(section);
    const sectionStatus = calculateSectionStatus(items);

    if (sectionStatus.status === "verified") {
      verifiedSections++;
    }

    verifiedItems += sectionStatus.verifiedCount;
    totalItems += sectionStatus.totalCount;
  });

  const totalSections = verifiableSections.length;

  if (verifiedSections === totalSections && totalSections > 0) {
    return {
      status: "verified",
      verifiedSections,
      totalSections,
      verifiedItems,
      totalItems,
    };
  }

  if (verifiedSections > 0 || verifiedItems > 0) {
    return {
      status: "partially_verified",
      verifiedSections,
      totalSections,
      verifiedItems,
      totalItems,
    };
  }

  return {
    status: "unverified",
    verifiedSections: 0,
    totalSections,
    verifiedItems: 0,
    totalItems,
  };
};

/**
 * Get items from a section based on section type
 * @param {Object} section - Portfolio section
 * @returns {Array} Array of items
 */
export const getSectionItems = (section) => {
  if (!section || !section.content) return [];

  const content = section.content;
  const sectionType = section.type;

  // Try different possible keys
  if (content[sectionType] && Array.isArray(content[sectionType])) {
    return content[sectionType];
  }

  const pluralKey = sectionType + "s";
  if (content[pluralKey] && Array.isArray(content[pluralKey])) {
    return content[pluralKey];
  }

  if (content.items && Array.isArray(content.items)) {
    return content.items;
  }

  return [];
};

/**
 * Get verification status for an item
 * @param {Object} item - Portfolio item (certificate, achievement, etc.)
 * @returns {string} Verification status
 */
export const getItemVerificationStatus = (item) => {
  if (!item || !item.verification) {
    return "unverified";
  }
  return item.verification.status || "unverified";
};

/**
 * Check if item can be submitted for verification
 * @param {Object} item - Portfolio item
 * @returns {boolean} Whether item can be submitted
 */
export const canSubmitForVerification = (item) => {
  const status = getItemVerificationStatus(item);
  return status === "unverified" || status === "rejected";
};

/**
 * Get verification status label
 * @param {string} status - Verification status
 * @returns {string} Human-readable label
 */
export const getVerificationLabel = (status) => {
  const labels = {
    unverified: "Not Verified",
    pending: "Pending Verification",
    verified: "Verified",
    rejected: "Rejected",
    partially_verified: "Partially Verified",
  };
  return labels[status] || "Unknown";
};

/**
 * Get verification status color
 * @param {string} status - Verification status
 * @returns {string} CSS color class
 */
export const getVerificationColor = (status) => {
  const colors = {
    unverified: "gray",
    pending: "yellow",
    verified: "green",
    rejected: "red",
    partially_verified: "yellow",
  };
  return colors[status] || "gray";
};

/**
 * Get verification status icon
 * @param {string} status - Verification status
 * @returns {string} Icon character/emoji
 */
export const getVerificationIcon = (status) => {
  const icons = {
    unverified: "○",
    pending: "⏳",
    verified: "✓",
    rejected: "✗",
    partially_verified: "◐",
  };
  return icons[status] || "○";
};

