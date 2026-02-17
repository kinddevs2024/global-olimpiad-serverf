// Client-side keyword extraction for text-to-portfolio
// This provides preview/validation before sending to backend

const LAYOUT_KEYWORDS = {
  "single-page": ["single page", "single-page", "one page", "onepage"],
  "multi-page": ["multi-page", "multi page", "multiple pages", "separate pages"],
};

const THEME_KEYWORDS = {
  minimal: ["minimal", "minimalist", "simple", "clean"],
  modern: ["modern", "contemporary", "sleek"],
  dark: ["dark", "black", "night", "dark mode"],
  colorful: ["colorful", "bright", "vibrant", "color"],
  professional: ["professional", "corporate", "business"],
};

const COLOR_KEYWORDS = {
  blue: ["blue", "navy", "azure"],
  red: ["red", "crimson", "scarlet"],
  green: ["green", "emerald", "lime"],
  white: ["white", "light"],
  black: ["black", "dark"],
  purple: ["purple", "violet", "lavender"],
  orange: ["orange", "amber"],
  yellow: ["yellow", "gold"],
};

const SECTION_KEYWORDS = {
  achievements: ["achievements", "achievement", "awards", "award", "results", "olympiad results"],
  skills: ["skills", "skill", "abilities", "competencies"],
  projects: ["projects", "project", "work", "portfolio projects"],
  certificates: ["certificates", "certificate", "certifications", "certification"],
  interests: ["interests", "interest", "hobbies", "hobby"],
  education: ["education", "school", "university", "academic"],
  about: ["about", "bio", "biography", "introduction", "intro"],
};

// Extract layout from text
export const extractLayout = (text) => {
  const lowerText = text.toLowerCase();
  
  for (const [layout, keywords] of Object.entries(LAYOUT_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return layout;
    }
  }
  
  return "single-page"; // default
};

// Extract theme from text
export const extractTheme = (text) => {
  const lowerText = text.toLowerCase();
  
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return theme;
    }
  }
  
  return "minimal"; // default
};

// Extract color preference from text
export const extractColor = (text) => {
  const lowerText = text.toLowerCase();
  
  for (const [color, keywords] of Object.entries(COLOR_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return color;
    }
  }
  
  return null;
};

// Extract section order from text
export const extractSectionOrder = (text) => {
  const lowerText = text.toLowerCase();
  const sections = [];
  
  // Look for explicit ordering words
  const orderWords = ["start with", "begin with", "first", "then", "after", "next", "followed by"];
  
  // Extract mentioned sections
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      sections.push(section);
    }
  }
  
  // Try to determine order from text structure
  const orderedSections = [];
  const textParts = lowerText.split(/[.,;]/);
  
  for (const part of textParts) {
    for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
      if (keywords.some((keyword) => part.includes(keyword)) && !orderedSections.includes(section)) {
        orderedSections.push(section);
      }
    }
  }
  
  // If we found ordered sections, use them; otherwise use all mentioned sections
  return orderedSections.length > 0 ? orderedSections : sections;
};

// Parse text and return preview structure
export const parseTextPreview = (text) => {
  if (!text || text.trim().length === 0) {
    return null;
  }
  
  const layout = extractLayout(text);
  const theme = extractTheme(text);
  const color = extractColor(text);
  const sections = extractSectionOrder(text);
  
  return {
    layout,
    theme,
    color,
    sections: sections.length > 0 ? sections : ["about", "achievements", "skills"],
  };
};

// Validate text input
export const validateTextInput = (text) => {
  if (!text || text.trim().length < 10) {
    return {
      valid: false,
      error: "Please provide at least 10 characters describing your portfolio.",
    };
  }
  
  return {
    valid: true,
    error: null,
  };
};

