/**
 * Emulator Detection Module
 * 
 * Detects mobile emulators using a multi-signal scoring system.
 * Analyzes browser properties, hardware characteristics, and WebGL fingerprints
 * to calculate an emulator probability score (0-100).
 * 
 * Security: Does not collect personal data or device identifiers.
 */

/**
 * Detects if the current environment is likely an emulator
 * @returns {Object} Detection result with score and reasons
 * @property {boolean} isEmulator - True if emulator score >= 60
 * @property {number} emulatorScore - Score from 0 to 100
 * @property {string[]} reasons - Array of detection reasons
 */
export const detectEmulator = () => {
  let score = 0;
  const reasons = [];

  // Signal 1: UserAgent Analysis (Weight: 25 points)
  // Emulators often contain specific keywords in their user agent strings
  const userAgent = navigator.userAgent.toLowerCase();
  const userAgentKeywords = [
    'sdk',           // Android SDK emulator
    'emulator',      // Generic emulator indicator
    'generic',       // Generic device identifier
    'x86',           // x86 architecture on mobile UA (suspicious)
    'vbox',          // VirtualBox
    'genymotion',    // Genymotion emulator
    'bluestacks',    // BlueStacks emulator
    'nox',           // Nox emulator
    'ldplayer',      // LDPlayer emulator
    'mumu',          // MuMu emulator
    'memu',          // MEmu emulator
    'android sdk',   // Android SDK
    'simulator',     // iOS Simulator
  ];

  let userAgentScore = 0;
  userAgentKeywords.forEach(keyword => {
    if (userAgent.includes(keyword)) {
      // Different weights for different keywords
      if (keyword === 'emulator' || keyword === 'sdk' || keyword === 'simulator') {
        userAgentScore += 8;
        reasons.push(`UserAgent содержит "${keyword}"`);
      } else if (keyword === 'x86' && /android/i.test(navigator.userAgent)) {
        // x86 on Android is highly suspicious (real Android devices are ARM)
        userAgentScore += 10;
        reasons.push('Обнаружена архитектура x86 в Android UserAgent');
      } else {
        userAgentScore += 5;
        reasons.push(`UserAgent содержит "${keyword}"`);
      }
    }
  });

  // Check for suspicious patterns: x86 architecture with mobile user agent
  if (/x86/i.test(userAgent) && /android|iphone|ipad/i.test(navigator.userAgent)) {
    userAgentScore += 7;
    reasons.push('Архитектура x86 обнаружена на мобильном устройстве');
  }

  score += Math.min(userAgentScore, 25); // Cap at 25 points

  // Signal 2: Platform Anomalies (Weight: 15 points)
  // Real devices have specific platform strings, emulators may have unusual ones
  const platform = navigator.platform.toLowerCase();
  const platformAnomalies = [
    'linux x86_64',  // Common in Android emulators
    'win32',         // Windows platform with mobile UA
    'macintel',      // macOS with mobile UA
  ];

  let platformScore = 0;
  if (/android/i.test(navigator.userAgent)) {
    // Android should typically have "Linux" platform
    if (platform.includes('win') || platform.includes('mac')) {
      platformScore += 10;
      reasons.push('Несоответствие платформы: Android UA с десктопной платформой');
    }
    if (platform.includes('x86') || platform.includes('x64')) {
      platformScore += 5;
      reasons.push('Платформа содержит x86/x64 (подозрительно для Android)');
    }
  }

  if (/iphone|ipad/i.test(navigator.userAgent)) {
    // iOS should have MacIntel or iPhone/iPad platform
    if (platform.includes('linux') || platform.includes('win')) {
      platformScore += 10;
      reasons.push('Несоответствие платформы: iOS UA с не-iOS платформой');
    }
  }

  score += Math.min(platformScore, 15); // Cap at 15 points

  // Signal 3: Screen Size and DPI Anomalies (Weight: 20 points)
  // Emulators often use common, predictable screen resolutions
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Common emulator resolutions
  const commonEmulatorResolutions = [
    { w: 1080, h: 1920 },  // Common Android emulator default
    { w: 720, h: 1280 },   // Another common default
    { w: 480, h: 800 },    // Low-res emulator default
    { w: 375, h: 667 },    // iPhone 6/7/8 default
    { w: 414, h: 896 },    // iPhone XR/11 default
  ];

  let screenScore = 0;
  const isExactMatch = commonEmulatorResolutions.some(res => 
    (screenWidth === res.w && screenHeight === res.h) ||
    (screenWidth === res.h && screenHeight === res.w) // Account for rotation
  );

  if (isExactMatch) {
    screenScore += 8;
    reasons.push(`Обнаружено типичное разрешение эмулятора: ${screenWidth}x${screenHeight}`);
  }

  // Unusual devicePixelRatio for mobile devices
  // Real devices typically have 1, 2, 3, or 2.5, 3.5
  // Emulators might have unusual values like 1.5, 2.25, etc.
  if (/android|iphone|ipad/i.test(navigator.userAgent)) {
    const validRatios = [1, 1.5, 2, 2.5, 2.75, 3, 3.5, 4];
    const hasValidRatio = validRatios.some(ratio => 
      Math.abs(devicePixelRatio - ratio) < 0.1
    );
    
    if (!hasValidRatio && devicePixelRatio > 0 && devicePixelRatio < 5) {
      screenScore += 6;
      reasons.push(`Необычное значение devicePixelRatio: ${devicePixelRatio}`);
    }

    // Very low or very high DPR is suspicious
    if (devicePixelRatio < 0.5 || devicePixelRatio > 5) {
      screenScore += 6;
      reasons.push(`Крайне необычное значение devicePixelRatio: ${devicePixelRatio}`);
    }
  }

  // Screen size mismatch: mobile UA with desktop-sized screen
  if (/android|iphone|ipad/i.test(navigator.userAgent)) {
    const totalPixels = screenWidth * screenHeight;
    // Real mobile devices rarely exceed 4K (3840x2160 = 8,294,400)
    // But emulators on desktop might report very large screens
    if (totalPixels > 10000000) { // > 10M pixels
      screenScore += 6;
      reasons.push(`Очень большое разрешение экрана для мобильного устройства: ${screenWidth}x${screenHeight}`);
    }
  }

  score += Math.min(screenScore, 20); // Cap at 20 points

  // Signal 4: Hardware Anomalies (Weight: 15 points)
  // Emulators often report unusual CPU core counts or memory values
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;
  const deviceMemory = navigator.deviceMemory || 0;

  let hardwareScore = 0;

  // Check CPU cores - real mobile devices typically have 4-8 cores
  // Emulators might report the host machine's core count (could be 2, 16, etc.)
  if (/android|iphone|ipad/i.test(navigator.userAgent)) {
    if (hardwareConcurrency > 0) {
      // Very low (1-2) or very high (16+) core counts are suspicious for mobile
      if (hardwareConcurrency === 1 || hardwareConcurrency === 2) {
        hardwareScore += 4;
        reasons.push(`Подозрительно малое количество ядер CPU: ${hardwareConcurrency}`);
      } else if (hardwareConcurrency >= 16) {
        hardwareScore += 5;
        reasons.push(`Подозрительно большое количество ядер CPU: ${hardwareConcurrency}`);
      }
    }
  }

  // Check device memory (if available)
  if (deviceMemory > 0) {
    // Real mobile devices typically have 2, 3, 4, 6, 8, 12 GB
    // Emulators might report unusual values
    const validMemoryValues = [2, 3, 4, 6, 8, 12, 16];
    const hasValidMemory = validMemoryValues.some(mem => Math.abs(deviceMemory - mem) < 0.5);
    
    if (!hasValidMemory && deviceMemory > 0 && deviceMemory < 32) {
      hardwareScore += 4;
      reasons.push(`Необычное значение памяти устройства: ${deviceMemory} GB`);
    }

    // Very high memory (>16GB) is suspicious for mobile
    if (deviceMemory > 16) {
      hardwareScore += 6;
      reasons.push(`Очень большой объем памяти для мобильного устройства: ${deviceMemory} GB`);
    }
  }

  score += Math.min(hardwareScore, 15); // Cap at 15 points

  // Signal 5: Touch Support Inconsistencies (Weight: 10 points)
  // Real mobile devices always have touch support, but emulators might not
  // Or they might have inconsistent touch support
  const hasTouchSupport = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 ||
                          (window.DocumentTouch && document instanceof window.DocumentTouch);

  let touchScore = 0;
  if (/android|iphone|ipad/i.test(navigator.userAgent)) {
    if (!hasTouchSupport) {
      touchScore += 10;
      reasons.push('Мобильное устройство без поддержки touch (подозрительно)');
    } else {
      // Check maxTouchPoints - real devices typically support 5-10 touch points
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      if (maxTouchPoints > 0 && maxTouchPoints < 5) {
        touchScore += 3;
        reasons.push(`Малое количество одновременных касаний: ${maxTouchPoints}`);
      }
    }
  } else {
    // Desktop browser with touch support might be emulator
    if (hasTouchSupport && navigator.maxTouchPoints > 0) {
      touchScore += 2;
      // This is less suspicious as some desktops have touch screens
    }
  }

  score += Math.min(touchScore, 10); // Cap at 10 points

  // Signal 6: WebGL Renderer Fingerprinting (Weight: 15 points)
  // Emulators often use virtualized graphics (VirtualBox, VMware, etc.)
  let webglScore = 0;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL).toLowerCase();

        // Check for virtualization indicators
        const virtualizationKeywords = [
          'virtualbox',
          'vmware',
          'qemu',
          'bochs',
          'parallels',
          'virtual',
          'llvmpipe',  // Software rendering (common in VMs)
          'mesa',      // Open source graphics (often in VMs)
        ];

        virtualizationKeywords.forEach(keyword => {
          if (renderer.includes(keyword) || vendor.includes(keyword)) {
            webglScore += 8;
            reasons.push(`WebGL рендерер указывает на виртуализацию: ${keyword}`);
          }
        });

        // Generic renderer names are suspicious
        if (renderer.includes('generic') || renderer.includes('software')) {
          webglScore += 5;
          reasons.push('Обнаружен generic/software WebGL рендерер');
        }

        // Check for unusual renderer patterns
        if (renderer.length < 10 || renderer === 'unknown') {
          webglScore += 3;
          reasons.push('Подозрительно короткое или неизвестное имя WebGL рендерера');
        }
      }
    }
  } catch (e) {
    // WebGL not available or error - not necessarily suspicious
    // Some browsers block WebGL for security
  }

  score += Math.min(webglScore, 15); // Cap at 15 points

  // Final score calculation (0-100)
  const finalScore = Math.min(Math.round(score), 100);
  const isEmulator = finalScore >= 60;

  return {
    isEmulator,
    emulatorScore: finalScore,
    reasons: reasons.length > 0 ? reasons : ['Не обнаружено явных признаков эмулятора'],
  };
};

/**
 * Initializes emulator detection and blocks access if emulator is detected
 * This function should be called before React renders
 * @returns {boolean} True if access should be blocked, false otherwise
 */
export const init = () => {
  const detection = detectEmulator();
  
  if (detection.isEmulator) {
    // Block access by rendering blocking overlay directly to DOM
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div id="emulator-block-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #ffffff;
        ">
          <div style="
            background: #0a0a0a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
          ">
            <div style="
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 20px;
              color: #ffffff;
            ">
              Похоже, сайт открыт через эмулятор.
            </div>
            <div style="
              font-size: 16px;
              line-height: 1.6;
              color: #a0a0a0;
              margin-bottom: 10px;
            ">
              Пожалуйста, откройте сайт на вашем реальном устройстве или на компьютере, используя ваш личный браузер.
            </div>
            <div style="
              font-size: 16px;
              line-height: 1.6;
              color: #a0a0a0;
            ">
              Для продолжения работы закройте эмулятор и перезайдите на сайт.
            </div>
          </div>
        </div>
      `;
      
      // Prevent any interaction with the page
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
      document.getElementById('emulator-block-overlay').style.pointerEvents = 'auto';
      
      // Prevent keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
      
      // Prevent context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      }, true);
    }
    
    return true; // Access blocked
  }
  
  return false; // Access allowed
};




