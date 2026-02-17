/**
 * Detects device information from the browser
 * @returns {Object} Device information object
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Detect device type
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent.toLowerCase());
  const isDesktop = !isMobile && !isTablet;
  
  // Detect OS
  let os = 'Unknown';
  if (/android/i.test(userAgent)) {
    os = 'Android';
    // Try to extract Android version
    const androidVersion = userAgent.match(/Android\s([0-9\.]*)/);
    if (androidVersion) {
      os = `Android ${androidVersion[1]}`;
    }
  } else if (/iPad|iPhone|iPod/.test(userAgent)) {
    os = 'iOS';
    // Try to extract iOS version
    const iosVersion = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (iosVersion) {
      os = `iOS ${iosVersion[1]}.${iosVersion[2]}${iosVersion[3] ? '.' + iosVersion[3] : ''}`;
    }
  } else if (/Windows/.test(userAgent)) {
    os = 'Windows';
    // Try to extract Windows version
    if (/Windows NT 10.0/.test(userAgent)) os = 'Windows 10/11';
    else if (/Windows NT 6.3/.test(userAgent)) os = 'Windows 8.1';
    else if (/Windows NT 6.2/.test(userAgent)) os = 'Windows 8';
    else if (/Windows NT 6.1/.test(userAgent)) os = 'Windows 7';
  } else if (/Mac OS X/.test(userAgent)) {
    os = 'macOS';
    const macVersion = userAgent.match(/Mac OS X (\d+)[._](\d+)[._]?(\d+)?/);
    if (macVersion) {
      os = `macOS ${macVersion[1]}.${macVersion[2]}${macVersion[3] ? '.' + macVersion[3] : ''}`;
    }
  } else if (/Linux/.test(userAgent)) {
    os = 'Linux';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
    const firefoxVersion = userAgent.match(/Firefox\/(\d+)/);
    if (firefoxVersion) browser = `Firefox ${firefoxVersion[1]}`;
  } else if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
    browser = 'Chrome';
    const chromeVersion = userAgent.match(/Chrome\/(\d+)/);
    if (chromeVersion) browser = `Chrome ${chromeVersion[1]}`;
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
    const safariVersion = userAgent.match(/Version\/(\d+)/);
    if (safariVersion) browser = `Safari ${safariVersion[1]}`;
  } else if (/edge|edg/i.test(userAgent)) {
    browser = 'Edge';
    const edgeVersion = userAgent.match(/Edge\/(\d+)/);
    if (edgeVersion) browser = `Edge ${edgeVersion[1]}`;
  }
  
  // Detect device model (for mobile devices)
  let deviceModel = 'Unknown';
  if (/android/i.test(userAgent)) {
    // Try to extract device model from Android user agent
    const modelMatch = userAgent.match(/;\s([^;)]+)\sBuild/i);
    if (modelMatch) {
      deviceModel = modelMatch[1].trim();
    }
  } else if (/iPhone/.test(userAgent)) {
    // Extract iPhone model
    const iphoneMatch = userAgent.match(/iPhone\s?OS\s\d+[._]\d+/);
    if (iphoneMatch) {
      deviceModel = 'iPhone';
      // Try to get more specific model if available
      const modelNumber = userAgent.match(/iPhone(\d+,\d+)/);
      if (modelNumber) {
        deviceModel = `iPhone ${modelNumber[1].replace(',', '.')}`;
      }
    }
  } else if (/iPad/.test(userAgent)) {
    deviceModel = 'iPad';
  }
  
  // Screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  
  // Screen orientation
  const orientation = window.screen.orientation 
    ? window.screen.orientation.type 
    : (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  
  return {
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    os,
    browser,
    deviceModel,
    screenResolution,
    orientation,
    userAgent: userAgent.substring(0, 200), // Limit length
    language: navigator.language || navigator.userLanguage || 'Unknown',
    platform: navigator.platform || 'Unknown',
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
};

