/**
 * Device Fingerprinting
 * 
 * Generates device fingerprint on client side for anti-cheat validation.
 */

/**
 * Generate device fingerprint data
 * @returns {Promise<Object>} - Device fingerprint object
 */
export async function generateDeviceFingerprint() {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenColorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };

  // WebGL fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        fingerprint.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        fingerprint.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      
      // Additional WebGL parameters
      fingerprint.webglVersion = gl.getParameter(gl.VERSION);
      fingerprint.webglShadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    }
  } catch (error) {
    console.warn('WebGL fingerprinting failed:', error);
  }

  // Canvas fingerprinting
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    fingerprint.canvasFingerprint = canvas.toDataURL().substring(0, 100); // First 100 chars
  } catch (error) {
    console.warn('Canvas fingerprinting failed:', error);
  }

  // Audio context fingerprinting (simplified)
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    fingerprint.audioSampleRate = audioContext.sampleRate;
    audioContext.close();
  } catch (error) {
    console.warn('Audio fingerprinting failed:', error);
  }

  // Check for touch support
  fingerprint.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check for plugins
  if (navigator.plugins && navigator.plugins.length > 0) {
    fingerprint.plugins = Array.from(navigator.plugins).map(p => p.name).slice(0, 5);
  }

  return fingerprint;
}
