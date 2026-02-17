import { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';
import './Settings.css';

const Settings = () => {
  const {
    currentTheme,
    customTheme,
    itemsPerPage,
    changeTheme,
    updateCustomTheme,
    updateItemsPerPage,
    resetCustomTheme,
    availableThemes,
  } = useTheme();

  const [localCustomTheme, setLocalCustomTheme] = useState(customTheme);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
  const [languageSearch, setLanguageSearch] = useState('');
  
  const {
    autoTranslate,
    targetLanguage,
    isTranslating,
    toggleAutoTranslate,
    changeLanguage,
    availableLanguages,
  } = useTranslation();
  
  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return availableLanguages;
    const searchLower = languageSearch.toLowerCase();
    return availableLanguages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(searchLower) ||
        lang.code.toLowerCase().includes(searchLower)
    );
  }, [availableLanguages, languageSearch]);

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
  };

  const handleCustomColorChange = (key, value) => {
    const updated = { ...localCustomTheme, [key]: value };
    setLocalCustomTheme(updated);
    updateCustomTheme(updated);
  };

  const handleItemsPerPageChange = (value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setLocalItemsPerPage(num);
      updateItemsPerPage(num);
    }
  };

  const handleResetCustomTheme = () => {
    resetCustomTheme();
    setLocalCustomTheme({
      name: 'custom',
      bgPrimary: '#1a1a2e',
      bgSecondary: '#16213e',
      bgTertiary: '#0f3460',
      textPrimary: '#e94560',
      textSecondary: '#c4c4c4',
      textTertiary: '#8b8b8b',
      accent: '#e94560',
      border: 'rgba(233, 69, 96, 0.2)',
      borderHover: 'rgba(233, 69, 96, 0.4)',
      glow: 'rgba(233, 69, 96, 0.3)',
      glowStrong: 'rgba(233, 69, 96, 0.5)',
      success: '#00ff88',
      error: '#ff4444',
      warning: '#ffaa00',
    });
  };

  const colorFields = [
    { key: 'bgPrimary', label: 'Background Primary', description: 'Main background color' },
    { key: 'bgSecondary', label: 'Background Secondary', description: 'Secondary background color' },
    { key: 'bgTertiary', label: 'Background Tertiary', description: 'Tertiary background color' },
    { key: 'textPrimary', label: 'Text Primary', description: 'Main text color' },
    { key: 'textSecondary', label: 'Text Secondary', description: 'Secondary text color' },
    { key: 'textTertiary', label: 'Text Tertiary', description: 'Tertiary text color' },
    { key: 'accent', label: 'Accent', description: 'Accent color for highlights' },
    { key: 'border', label: 'Border', description: 'Border color (supports rgba)' },
    { key: 'borderHover', label: 'Border Hover', description: 'Border color on hover' },
    { key: 'glow', label: 'Glow', description: 'Glow effect color' },
    { key: 'glowStrong', label: 'Glow Strong', description: 'Strong glow effect color' },
    { key: 'success', label: 'Success', description: 'Success message color' },
    { key: 'error', label: 'Error', description: 'Error message color' },
    { key: 'warning', label: 'Warning', description: 'Warning message color' },
  ];

  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <h1 className="settings-title text-glow">Settings</h1>
          <p className="settings-subtitle">Customize your experience</p>
        </div>

        <div className="settings-content">
          {/* Translation Settings */}
          <div className="settings-section card">
            <h2 className="section-title">🌐 Auto Translation</h2>
            <p className="section-description">
              Automatically translate all text to your preferred language using Google Translate
            </p>
            
            <div className="translation-settings">
              <div className="settings-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoTranslate}
                    onChange={(e) => toggleAutoTranslate(e.target.checked)}
                    className="toggle-input"
                    data-translate="false"
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {autoTranslate ? "Auto Translation Enabled" : "Auto Translation Disabled"}
                  </span>
                </label>
              </div>
              
              {autoTranslate && (
                <div className="language-selector" data-translate="false">
                  <label className="settings-label" data-translate="false">
                    Target Language ({availableLanguages.length} languages available)
                    <input
                      type="text"
                      placeholder="Search languages..."
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      className="language-search-input"
                      data-translate="false"
                    />
                    <select
                      value={targetLanguage}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newLang = e.target.value;
                        if (newLang && newLang !== targetLanguage) {
                          changeLanguage(newLang);
                        }
                      }}
                      className="settings-select"
                      disabled={isTranslating}
                      data-translate="false"
                    >
                      {filteredLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code} data-translate="false">
                          {lang.name} ({lang.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  {isTranslating && (
                    <p className="settings-hint" data-translate="false">Translating page...</p>
                  )}
                  <p className="settings-hint" data-translate="false">
                    All text on the page will be automatically translated to the selected language.
                    The default language is detected from your Google account.
                    {languageSearch && ` Showing ${filteredLanguages.length} of ${availableLanguages.length} languages.`}
                    <br />
                    <strong>Note:</strong> Changing language will reload the page to apply the translation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="settings-section card">
            <h2 className="section-title">🎨 Theme</h2>
            <p className="section-description">Choose your preferred theme</p>
            
            <div className="theme-selector">
              {availableThemes.map((theme) => {
                // Get theme preview colors
                let bgGradient, textColor, displayName;
                
                if (theme === 'custom') {
                  bgGradient = `linear-gradient(135deg, ${localCustomTheme.bgPrimary} 0%, ${localCustomTheme.bgSecondary} 100%)`;
                  textColor = localCustomTheme.textPrimary;
                  displayName = 'Custom';
                } else if (theme === 'kid-friendly') {
                  bgGradient = 'linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%)';
                  textColor = '#1565C0';
                  displayName = 'Kid-Friendly';
                } else if (theme === 'system') {
                  // Show system theme based on current OS preference
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  bgGradient = isDark 
                    ? 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)';
                  textColor = isDark ? '#ffffff' : '#000000';
                  displayName = 'System';
                } else {
                  bgGradient = 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)';
                  textColor = '#000000';
                  displayName = theme.charAt(0).toUpperCase() + theme.slice(1);
                }

                return (
                  <button
                    key={theme}
                    className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme)}
                  >
                    <div className="theme-preview">
                      <div
                        className="theme-preview-bg"
                        style={{
                          background: bgGradient,
                        }}
                      >
                        <div
                          className="theme-preview-text"
                          style={{
                            color: textColor,
                          }}
                        >
                          Aa
                        </div>
                      </div>
                    </div>
                    <span className="theme-name">{displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Theme Colors */}
          {currentTheme === 'custom' && (
            <div className="settings-section card">
              <div className="section-header-row">
                <div>
                  <h2 className="section-title">🎨 Custom Theme Colors</h2>
                  <p className="section-description">Customize your theme colors</p>
                </div>
                <button
                  className="button-secondary"
                  onClick={handleResetCustomTheme}
                >
                  Reset to Default
                </button>
              </div>

              <div className="color-grid">
                {colorFields.map((field) => (
                  <div key={field.key} className="color-field">
                    <label className="color-label">
                      <span className="color-label-text">{field.label}</span>
                      <span className="color-label-desc">{field.description}</span>
                    </label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={
                          localCustomTheme[field.key]?.startsWith('rgba')
                            ? '#000000'
                            : localCustomTheme[field.key] || '#000000'
                        }
                        onChange={(e) => {
                          // Convert hex to rgba for border colors if needed
                          if (field.key.includes('border') || field.key.includes('glow')) {
                            const hex = e.target.value;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            const alpha = field.key.includes('Hover') ? '0.4' : '0.2';
                            handleCustomColorChange(field.key, `rgba(${r}, ${g}, ${b}, ${alpha})`);
                          } else {
                            handleCustomColorChange(field.key, e.target.value);
                          }
                        }}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        value={localCustomTheme[field.key] || ''}
                        onChange={(e) => handleCustomColorChange(field.key, e.target.value)}
                        placeholder="Color value"
                        className="color-text-input"
                      />
                    </div>
                    <div
                      className="color-preview"
                      style={{ backgroundColor: localCustomTheme[field.key] || '#000000' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination Settings */}
          <div className="settings-section card">
            <h2 className="section-title">📄 Pagination</h2>
            <p className="section-description">
              Set how many Olympiads to display per page
            </p>

            <div className="pagination-settings">
              <label className="settings-label">
                Items per page
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={localItemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="settings-input"
                />
              </label>
              <p className="settings-hint">
                Choose between 1 and 50 items per page. Current: {itemsPerPage} items
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

