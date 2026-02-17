import { createContext, useContext, useState, useEffect } from "react";

const TranslationContext = createContext(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
};

const STORAGE_KEY = "olympiad_auto_translate";
const STORAGE_LANGUAGE_KEY = "olympiad_translate_language";

// Map Google locale to language code for Google Translate
const mapGoogleLocaleToLanguage = (locale) => {
  if (!locale) return "en";
  const localeLower = locale.toLowerCase();
  const langCode = localeLower.split("-")[0];
  
  // Return the language code directly if it's a valid Google Translate code
  // Most common language codes are supported
  const supportedCodes = [
    "en", "es", "fr", "de", "ru", "zh", "ja", "ar", "pt", "it", "ko", "hi",
    "tr", "pl", "nl", "sv", "da", "fi", "no", "cs", "hu", "ro", "bg", "hr",
    "sk", "sl", "et", "lv", "lt", "uk", "el", "he", "th", "vi", "id", "ms",
    "fil", "sw", "af", "sq", "am", "az", "eu", "be", "bn", "bs", "ca", "ceb",
    "ny", "co", "sr", "cy", "eo", "fa", "ga", "gl", "gu", "ht", "ha", "haw",
    "iw", "hmn", "is", "ig", "jw", "ka", "kk", "km", "rw", "ku", "ky", "lo",
    "la", "lb", "mk", "mg", "ml", "mt", "mi", "mr", "mn", "my", "ne", "ps",
    "pa", "sm", "gd", "st", "sn", "sd", "si", "so", "su", "tg", "ta", "tt",
    "te", "ur", "uz", "xh", "yi", "yo", "zu", "hy", "as", "ay", "bm", "bho",
    "br", "dv", "doi", "ee", "tl", "ff", "gn", "gom", "iu", "kn", "ks", "ckb",
    "mni", "lus", "or", "om", "qu", "sa", "nso", "ts", "tk", "ak", "an", "ast",
    "ba", "bi", "brx", "bug", "bua", "cbk", "ce", "ch", "chr", "crs", "csb",
    "cv", "diq", "dsb", "dz", "eml", "ext", "fo", "frp", "fur", "gv", "gil",
    "glk", "gsw", "hak", "hif", "hsb", "hz", "ia", "ie", "ik", "ilo", "io",
    "jv", "kab", "kbd", "kg", "ki", "kj", "kl", "kr", "kv", "kw", "lg", "li",
    "ln", "lu", "mdf", "mh", "min", "mos", "na", "nah", "nap", "nd", "nds",
    "ng", "nn", "nr", "nv", "oc", "oj", "os", "pag", "pam", "pap", "pcd",
    "pdc", "pfl", "pi", "pih", "pms", "pnb", "pnt", "rm", "rmy", "rn", "rue",
    "sah", "sc", "scn", "sco", "se", "sg", "sh", "simple", "srn", "ss", "szl",
    "tet", "ti", "tn", "to", "tpi", "tum", "tw", "ty", "udm", "ug", "ve", "vec",
    "vep", "vls", "vo", "wa", "war", "wo", "wuu", "xal", "xmf", "yue", "za", "zea"
  ];
  
  return supportedCodes.includes(langCode) ? langCode : "en";
};

// Translate text using Google Translate API (free endpoint)
const translateText = async (text, targetLanguage) => {
  if (!text || targetLanguage === "en") return text;
  
  try {
    // Use Google Translate free API endpoint
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return text;
    }
    
    const data = await response.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};

// Translate all text nodes in an element
const translateElement = async (element, targetLanguage) => {
  if (!element || targetLanguage === "en") return;
  
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    // Skip if parent has data-translate="false"
    if (node.parentElement?.getAttribute("data-translate") === "false") {
      continue;
    }
    
    // Skip script and style tags
    const parentTag = node.parentElement?.tagName?.toLowerCase();
    if (parentTag === "script" || parentTag === "style") {
      continue;
    }
    
    const text = node.textContent.trim();
    if (text && text.length > 0 && text.length < 500) {
      textNodes.push({ node, text });
    }
  }
  
  // Translate text nodes in batches
  for (const { node, text } of textNodes) {
    try {
      const translated = await translateText(text, targetLanguage);
      if (translated && translated !== text) {
        node.textContent = translated;
      }
    } catch (error) {
      console.error("Error translating text:", error);
    }
  }
  
  // Translate attributes
  const elementsWithAttributes = element.querySelectorAll("[data-translate-attr]");
  for (const el of elementsWithAttributes) {
    const attrs = el.getAttribute("data-translate-attr").split(",");
    for (const attr of attrs) {
      const value = el.getAttribute(attr.trim());
      if (value) {
        try {
          const translated = await translateText(value, targetLanguage);
          if (translated && translated !== value) {
            el.setAttribute(attr.trim(), translated);
          }
        } catch (error) {
          console.error("Error translating attribute:", error);
        }
      }
    }
  }
};

export const TranslationProvider = ({ children }) => {
  const [autoTranslate, setAutoTranslate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? saved === "true" : true; // Default: enabled
  });
  
  const [targetLanguage, setTargetLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_LANGUAGE_KEY);
    if (saved) return saved;
    
    // Fallback to browser language
    const browserLang = navigator.language || navigator.userLanguage;
    return mapGoogleLocaleToLanguage(browserLang);
  });
  
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize from Google user locale
  const initializeFromGoogleLocale = (googleLocale) => {
    if (googleLocale && !localStorage.getItem(STORAGE_LANGUAGE_KEY)) {
      const mappedLang = mapGoogleLocaleToLanguage(googleLocale);
      setTargetLanguage(mappedLang);
      localStorage.setItem(STORAGE_LANGUAGE_KEY, mappedLang);
    }
  };

  // Toggle auto-translate
  const toggleAutoTranslate = (enabled) => {
    setAutoTranslate(enabled);
    localStorage.setItem(STORAGE_KEY, enabled.toString());
    
    if (enabled) {
      translatePage(targetLanguage);
    } else {
      // Reload page to show original text
      window.location.reload();
    }
  };

  // Change target language
  const changeLanguage = (lang) => {
    if (lang === targetLanguage) return; // Don't change if same language
    
    setTargetLanguage(lang);
    localStorage.setItem(STORAGE_LANGUAGE_KEY, lang);
    
    if (autoTranslate) {
      if (lang === "en") {
        // If switching to English, just reload to show original
        window.location.reload();
      } else {
        // For other languages, reload first to reset, then translate
        // The useEffect will handle translation after reload
        window.location.reload();
      }
    } else {
      // If auto-translate is off, just save the preference
      // User can enable it later
    }
  };

  // Translate the entire page
  const translatePage = async (lang) => {
    if (!lang || lang === "en") return;
    
    setIsTranslating(true);
    try {
      // Translate navbar
      const navbar = document.querySelector(".navbar");
      if (navbar) {
        await translateElement(navbar, lang);
      }
      
      // Translate main content
      const mainContent = document.querySelector(".main-content") || document.body;
      await translateElement(mainContent, lang);
    } catch (error) {
      console.error("Error translating page:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-translate on mount if enabled
  useEffect(() => {
    if (autoTranslate && targetLanguage !== "en") {
      // Wait for page to load
      const timer = setTimeout(() => {
        translatePage(targetLanguage);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTranslate, targetLanguage]);

  // Translate new content when route changes
  useEffect(() => {
    if (autoTranslate && targetLanguage !== "en") {
      let timeoutId;
      const observer = new MutationObserver(() => {
        if (!isTranslating) {
          // Debounce translation to avoid too many API calls
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            translatePage(targetLanguage);
          }, 500);
        }
      });
      
      // Observe both navbar and main content
      const navbar = document.querySelector(".navbar");
      const mainContent = document.querySelector(".main-content") || document.body;
      
      if (navbar) {
        observer.observe(navbar, {
          childList: true,
          subtree: true,
        });
      }
      
      if (mainContent) {
        observer.observe(mainContent, {
          childList: true,
          subtree: true,
        });
      }
      
      return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTranslate, targetLanguage, isTranslating]);

  const value = {
    autoTranslate,
    targetLanguage,
    isTranslating,
    toggleAutoTranslate,
    changeLanguage,
    translatePage,
    initializeFromGoogleLocale,
    availableLanguages: [
      { code: "en", name: "English" },
      { code: "es", name: "Español" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
      { code: "ru", name: "Русский" },
      { code: "zh", name: "中文" },
      { code: "ja", name: "日本語" },
      { code: "ar", name: "العربية" },
      { code: "pt", name: "Português" },
      { code: "it", name: "Italiano" },
      { code: "ko", name: "한국어" },
      { code: "hi", name: "हिन्दी" },
      { code: "tr", name: "Türkçe" },
      { code: "uz", name: "Oʻzbek" },
      { code: "pl", name: "Polski" },
      { code: "nl", name: "Nederlands" },
      { code: "sv", name: "Svenska" },
      { code: "da", name: "Dansk" },
      { code: "fi", name: "Suomi" },
      { code: "no", name: "Norsk" },
      { code: "cs", name: "Čeština" },
      { code: "hu", name: "Magyar" },
      { code: "ro", name: "Română" },
      { code: "bg", name: "Български" },
      { code: "hr", name: "Hrvatski" },
      { code: "sk", name: "Slovenčina" },
      { code: "sl", name: "Slovenščina" },
      { code: "et", name: "Eesti" },
      { code: "lv", name: "Latviešu" },
      { code: "lt", name: "Lietuvių" },
      { code: "uk", name: "Українська" },
      { code: "el", name: "Ελληνικά" },
      { code: "he", name: "עברית" },
      { code: "th", name: "ไทย" },
      { code: "vi", name: "Tiếng Việt" },
      { code: "id", name: "Bahasa Indonesia" },
      { code: "ms", name: "Bahasa Melayu" },
      { code: "fil", name: "Filipino" },
      { code: "sw", name: "Kiswahili" },
      { code: "af", name: "Afrikaans" },
      { code: "sq", name: "Shqip" },
      { code: "am", name: "አማርኛ" },
      { code: "az", name: "Azərbaycan" },
      { code: "eu", name: "Euskara" },
      { code: "be", name: "Беларуская" },
      { code: "bn", name: "বাংলা" },
      { code: "bs", name: "Bosanski" },
      { code: "ca", name: "Català" },
      { code: "ceb", name: "Cebuano" },
      { code: "ny", name: "Chichewa" },
      { code: "co", name: "Corsu" },
      { code: "sr", name: "Српски" },
      { code: "cy", name: "Cymraeg" },
      { code: "eo", name: "Esperanto" },
      { code: "fa", name: "فارسی" },
      { code: "ga", name: "Gaeilge" },
      { code: "gl", name: "Galego" },
      { code: "gu", name: "ગુજરાતી" },
      { code: "ht", name: "Kreyòl Ayisyen" },
      { code: "ha", name: "Hausa" },
      { code: "haw", name: "ʻŌlelo Hawaiʻi" },
      { code: "iw", name: "עברית" },
      { code: "hmn", name: "Hmong" },
      { code: "is", name: "Íslenska" },
      { code: "ig", name: "Igbo" },
      { code: "jw", name: "Jawa" },
      { code: "ka", name: "ქართული" },
      { code: "kk", name: "Қазақ" },
      { code: "km", name: "ខ្មែរ" },
      { code: "rw", name: "Kinyarwanda" },
      { code: "ku", name: "Kurdî" },
      { code: "ky", name: "Кыргызча" },
      { code: "lo", name: "ລາວ" },
      { code: "la", name: "Latina" },
      { code: "lb", name: "Lëtzebuergesch" },
      { code: "mk", name: "Македонски" },
      { code: "mg", name: "Malagasy" },
      { code: "ml", name: "മലയാളം" },
      { code: "mt", name: "Malti" },
      { code: "mi", name: "Te Reo Māori" },
      { code: "mr", name: "मराठी" },
      { code: "mn", name: "Монгол" },
      { code: "my", name: "မြန်မာ" },
      { code: "ne", name: "नेपाली" },
      { code: "ps", name: "پښتو" },
      { code: "pa", name: "ਪੰਜਾਬੀ" },
      { code: "sm", name: "Gagana Samoa" },
      { code: "gd", name: "Gàidhlig" },
      { code: "st", name: "Sesotho" },
      { code: "sn", name: "Shona" },
      { code: "sd", name: "سنڌي" },
      { code: "si", name: "සිංහල" },
      { code: "so", name: "Soomaali" },
      { code: "su", name: "Sundanese" },
      { code: "tg", name: "Тоҷикӣ" },
      { code: "ta", name: "தமிழ்" },
      { code: "tt", name: "Татар" },
      { code: "te", name: "తెలుగు" },
      { code: "ur", name: "اردو" },
      { code: "xh", name: "isiXhosa" },
      { code: "yi", name: "ייִדיש" },
      { code: "yo", name: "Yorùbá" },
      { code: "zu", name: "isiZulu" },
      { code: "hy", name: "Հայերեն" },
      { code: "as", name: "অসমীয়া" },
      { code: "ay", name: "Aymar" },
      { code: "bm", name: "Bamanankan" },
      { code: "bho", name: "भोजपुरी" },
      { code: "br", name: "Brezhoneg" },
      { code: "dv", name: "ދިވެހި" },
      { code: "doi", name: "डोगरी" },
      { code: "ee", name: "Eʋegbe" },
      { code: "tl", name: "Tagalog" },
      { code: "ff", name: "Fulfulde" },
      { code: "gn", name: "Avañe'ẽ" },
      { code: "gom", name: "कोंकणी" },
      { code: "iu", name: "ᐃᓄᒃᑎᑐᑦ" },
      { code: "kn", name: "ಕನ್ನಡ" },
      { code: "ks", name: "कॉशुर" },
      { code: "ckb", name: "کوردی" },
      { code: "mni", name: "ꯃꯤꯇꯩꯂꯣꯟ" },
      { code: "lus", name: "Mizo" },
      { code: "or", name: "ଓଡ଼ିଆ" },
      { code: "om", name: "Oromoo" },
      { code: "qu", name: "Runa Simi" },
      { code: "sa", name: "संस्कृतम्" },
      { code: "nso", name: "Sesotho sa Leboa" },
      { code: "ts", name: "Xitsonga" },
      { code: "tk", name: "Türkmen" },
      { code: "ak", name: "Akan" },
      { code: "an", name: "Aragonés" },
      { code: "ast", name: "Asturianu" },
      { code: "ba", name: "Башҡорт" },
      { code: "bi", name: "Bislama" },
      { code: "brx", name: "बड़ो" },
      { code: "bug", name: "ᨅᨔ ᨕᨘᨁᨗ" },
      { code: "bua", name: "Буряад" },
      { code: "cbk", name: "Chavacano" },
      { code: "ce", name: "Нохчийн" },
      { code: "ch", name: "Chamoru" },
      { code: "chr", name: "ᏣᎳᎩ" },
      { code: "crs", name: "Seselwa" },
      { code: "csb", name: "Kaszëbsczi" },
      { code: "cv", name: "Чăваш" },
      { code: "diq", name: "Zazaki" },
      { code: "dsb", name: "Dolnoserbšćina" },
      { code: "dz", name: "རྫོང་ཁ" },
      { code: "eml", name: "Emiliàn" },
      { code: "ext", name: "Estremeñu" },
      { code: "fo", name: "Føroyskt" },
      { code: "frp", name: "Arpitan" },
      { code: "fur", name: "Furlan" },
      { code: "gv", name: "Gaelg" },
      { code: "gil", name: "Taetae ni Kiribati" },
      { code: "glk", name: "گیلکی" },
      { code: "gsw", name: "Alemannisch" },
      { code: "hak", name: "客家語" },
      { code: "haw", name: "ʻŌlelo Hawaiʻi" },
      { code: "hif", name: "Fiji Hindi" },
      { code: "hsb", name: "Hornjoserbšćina" },
      { code: "hz", name: "Otjiherero" },
      { code: "ia", name: "Interlingua" },
      { code: "ie", name: "Interlingue" },
      { code: "ik", name: "Iñupiaq" },
      { code: "ilo", name: "Iloko" },
      { code: "io", name: "Ido" },
      { code: "jv", name: "Basa Jawa" },
      { code: "kab", name: "Taqbaylit" },
      { code: "kbd", name: "Адыгэбзэ" },
      { code: "kg", name: "Kikongo" },
      { code: "ki", name: "Gĩkũyũ" },
      { code: "kj", name: "Kwanyama" },
      { code: "kl", name: "Kalaallisut" },
      { code: "kr", name: "Kanuri" },
      { code: "ks", name: "कॉशुर" },
      { code: "kv", name: "Коми" },
      { code: "kw", name: "Kernewek" },
      { code: "lg", name: "Luganda" },
      { code: "li", name: "Limburgs" },
      { code: "ln", name: "Lingála" },
      { code: "lu", name: "Tshiluba" },
      { code: "mdf", name: "Мокшень" },
      { code: "mh", name: "Kajin M̧ajeļ" },
      { code: "min", name: "Baso Minangkabau" },
      { code: "mni", name: "ꯃꯤꯇꯩꯂꯣꯟ" },
      { code: "mos", name: "Mòoré" },
      { code: "mr", name: "मराठी" },
      { code: "ms", name: "Bahasa Melayu" },
      { code: "mt", name: "Malti" },
      { code: "my", name: "မြန်မာ" },
      { code: "na", name: "Dorerin Naoero" },
      { code: "nah", name: "Nāhuatl" },
      { code: "nap", name: "Nnapulitano" },
      { code: "nd", name: "isiNdebele" },
      { code: "nds", name: "Plattdüütsch" },
      { code: "ng", name: "Owambo" },
      { code: "nn", name: "Norsk nynorsk" },
      { code: "nr", name: "isiNdebele" },
      { code: "nv", name: "Diné bizaad" },
      { code: "oc", name: "Occitan" },
      { code: "oj", name: "ᐊᓂᔑᓈᐯᒧᐎᓐ" },
      { code: "os", name: "Ирон" },
      { code: "pag", name: "Pangasinan" },
      { code: "pam", name: "Kapampangan" },
      { code: "pap", name: "Papiamentu" },
      { code: "pcd", name: "Picard" },
      { code: "pdc", name: "Deitsch" },
      { code: "pfl", name: "Pfälzisch" },
      { code: "pi", name: "पालि" },
      { code: "pih", name: "Norfuk" },
      { code: "pl", name: "Polski" },
      { code: "pms", name: "Piemontèis" },
      { code: "pnb", name: "پنجابی" },
      { code: "pnt", name: "Ποντιακά" },
      { code: "rm", name: "Rumantsch" },
      { code: "rmy", name: "Romani" },
      { code: "rn", name: "Kirundi" },
      { code: "rue", name: "Русиньскый" },
      { code: "sah", name: "Саха" },
      { code: "sc", name: "Sardu" },
      { code: "scn", name: "Sicilianu" },
      { code: "sco", name: "Scots" },
      { code: "se", name: "Davvisámegiella" },
      { code: "sg", name: "Sängö" },
      { code: "sh", name: "Srpskohrvatski" },
      { code: "simple", name: "Simple English" },
      { code: "srn", name: "Sranantongo" },
      { code: "ss", name: "SiSwati" },
      { code: "szl", name: "Ślůnski" },
      { code: "tet", name: "Tetun" },
      { code: "ti", name: "ትግርኛ" },
      { code: "tn", name: "Setswana" },
      { code: "to", name: "Lea faka-Tonga" },
      { code: "tpi", name: "Tok Pisin" },
      { code: "tum", name: "chiTumbuka" },
      { code: "tw", name: "Twi" },
      { code: "ty", name: "Reo Tahiti" },
      { code: "udm", name: "Удмурт" },
      { code: "ug", name: "ئۇيغۇرچە" },
      { code: "ve", name: "Tshivenḓa" },
      { code: "vec", name: "Vèneto" },
      { code: "vep", name: "Vepsän" },
      { code: "vls", name: "West-Vlams" },
      { code: "vo", name: "Volapük" },
      { code: "wa", name: "Walon" },
      { code: "war", name: "Winaray" },
      { code: "wo", name: "Wolof" },
      { code: "wuu", name: "吴语" },
      { code: "xal", name: "Хальмг" },
      { code: "xmf", name: "მარგალური" },
      { code: "yue", name: "粵語" },
      { code: "za", name: "Vahcuengh" },
      { code: "zea", name: "Zeêuws" },
    ],
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

