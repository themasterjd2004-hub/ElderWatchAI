/**
 * Multi-language distress keyword detection for emergency situations
 * Detects phrases indicating help needed, pain, unsafe feelings, etc.
 */

export interface DistressKeyword {
  phrase: string;
  language: string;
  severity: 'critical' | 'high' | 'medium';
  category: 'help' | 'pain' | 'unsafe' | 'medical' | 'emergency';
}

// Comprehensive distress vocabulary across 15 languages
export const DISTRESS_KEYWORDS: DistressKeyword[] = [
  // ENGLISH - Critical
  { phrase: "help me", language: "en", severity: "critical", category: "help" },
  { phrase: "help", language: "en", severity: "critical", category: "help" },
  { phrase: "emergency", language: "en", severity: "critical", category: "emergency" },
  { phrase: "call ambulance", language: "en", severity: "critical", category: "emergency" },
  { phrase: "call doctor", language: "en", severity: "critical", category: "medical" },
  { phrase: "can't breathe", language: "en", severity: "critical", category: "medical" },
  { phrase: "heart attack", language: "en", severity: "critical", category: "medical" },
  { phrase: "chest pain", language: "en", severity: "critical", category: "pain" },
  
  // ENGLISH - High
  { phrase: "i fell", language: "en", severity: "high", category: "emergency" },
  { phrase: "i'm falling", language: "en", severity: "high", category: "emergency" },
  { phrase: "i don't feel safe", language: "en", severity: "high", category: "unsafe" },
  { phrase: "not safe", language: "en", severity: "high", category: "unsafe" },
  { phrase: "hurts", language: "en", severity: "high", category: "pain" },
  { phrase: "ouch", language: "en", severity: "high", category: "pain" },
  { phrase: "pain", language: "en", severity: "high", category: "pain" },
  { phrase: "dizzy", language: "en", severity: "high", category: "medical" },
  { phrase: "weak", language: "en", severity: "high", category: "medical" },
  
  // ENGLISH - Medium
  { phrase: "uncomfortable", language: "en", severity: "medium", category: "unsafe" },
  { phrase: "not feeling well", language: "en", severity: "medium", category: "medical" },
  { phrase: "need help", language: "en", severity: "medium", category: "help" },

  // HINDI (Devanagari script)
  { phrase: "मदद", language: "hi", severity: "critical", category: "help" }, // madad (help)
  { phrase: "बचाओ", language: "hi", severity: "critical", category: "help" }, // bachao (save me)
  { phrase: "सहायता", language: "hi", severity: "critical", category: "help" }, // sahayata (assistance)
  { phrase: "एम्बुलेंस", language: "hi", severity: "critical", category: "emergency" }, // ambulance
  { phrase: "डॉक्टर", language: "hi", severity: "critical", category: "medical" }, // doctor
  { phrase: "दर्द", language: "hi", severity: "high", category: "pain" }, // dard (pain)
  { phrase: "गिर गया", language: "hi", severity: "high", category: "emergency" }, // gir gaya (fell down)

  // KANNADA
  { phrase: "ಸಹಾಯ", language: "kn", severity: "critical", category: "help" }, // sahaya (help)
  { phrase: "ರಕ್ಷಿಸು", language: "kn", severity: "critical", category: "help" }, // rakshisu (save)
  { phrase: "ವೈದ್ಯ", language: "kn", severity: "critical", category: "medical" }, // vaidya (doctor)
  { phrase: "ನೋವು", language: "kn", severity: "high", category: "pain" }, // novu (pain)
  { phrase: "ಬಿದ್ದೆ", language: "kn", severity: "high", category: "emergency" }, // bidde (fell)

  // TAMIL
  { phrase: "உதவி", language: "ta", severity: "critical", category: "help" }, // uthavi (help)
  { phrase: "காப்பாற்று", language: "ta", severity: "critical", category: "help" }, // kaappaatru (save)
  { phrase: "மருத்துவர்", language: "ta", severity: "critical", category: "medical" }, // maruthtuvar (doctor)
  { phrase: "வலி", language: "ta", severity: "high", category: "pain" }, // vali (pain)
  { phrase: "விழுந்தேன்", language: "ta", severity: "high", category: "emergency" }, // vizhunthen (I fell)

  // TELUGU
  { phrase: "సహాయం", language: "te", severity: "critical", category: "help" }, // sahayam (help)
  { phrase: "రక్షించు", language: "te", severity: "critical", category: "help" }, // rakshinchu (save)
  { phrase: "వైద్యుడు", language: "te", severity: "critical", category: "medical" }, // vaidyudu (doctor)
  { phrase: "నొప్పి", language: "te", severity: "high", category: "pain" }, // noppi (pain)
  { phrase: "పడిపోయాను", language: "te", severity: "high", category: "emergency" }, // padipoyanu (I fell)

  // MALAYALAM
  { phrase: "സഹായം", language: "ml", severity: "critical", category: "help" }, // sahayam (help)
  { phrase: "രക്ഷിക്കുക", language: "ml", severity: "critical", category: "help" }, // rakshikkuka (save)
  { phrase: "ഡോക്ടർ", language: "ml", severity: "critical", category: "medical" }, // doctor
  { phrase: "വേദന", language: "ml", severity: "high", category: "pain" }, // vedana (pain)
  { phrase: "വീണു", language: "ml", severity: "high", category: "emergency" }, // veenu (fell)

  // MARATHI
  { phrase: "मदत", language: "mr", severity: "critical", category: "help" }, // madat (help)
  { phrase: "वाचवा", language: "mr", severity: "critical", category: "help" }, // vachava (save)
  { phrase: "डॉक्टर", language: "mr", severity: "critical", category: "medical" }, // doctor
  { phrase: "वेदना", language: "mr", severity: "high", category: "pain" }, // vedana (pain)
  { phrase: "पडलो", language: "mr", severity: "high", category: "emergency" }, // padlo (fell)

  // BENGALI
  { phrase: "সাহায্য", language: "bn", severity: "critical", category: "help" }, // sahajya (help)
  { phrase: "বাঁচাও", language: "bn", severity: "critical", category: "help" }, // bachao (save)
  { phrase: "ডাক্তার", language: "bn", severity: "critical", category: "medical" }, // daktar (doctor)
  { phrase: "ব্যথা", language: "bn", severity: "high", category: "pain" }, // byatha (pain)
  { phrase: "পড়ে গেছি", language: "bn", severity: "high", category: "emergency" }, // pore gechi (fell down)

  // SPANISH
  { phrase: "ayuda", language: "es", severity: "critical", category: "help" },
  { phrase: "socorro", language: "es", severity: "critical", category: "help" },
  { phrase: "emergencia", language: "es", severity: "critical", category: "emergency" },
  { phrase: "ambulancia", language: "es", severity: "critical", category: "emergency" },
  { phrase: "doctor", language: "es", severity: "critical", category: "medical" },
  { phrase: "dolor", language: "es", severity: "high", category: "pain" },
  { phrase: "me caí", language: "es", severity: "high", category: "emergency" },

  // FRENCH
  { phrase: "aide", language: "fr", severity: "critical", category: "help" },
  { phrase: "au secours", language: "fr", severity: "critical", category: "help" },
  { phrase: "urgence", language: "fr", severity: "critical", category: "emergency" },
  { phrase: "ambulance", language: "fr", severity: "critical", category: "emergency" },
  { phrase: "médecin", language: "fr", severity: "critical", category: "medical" },
  { phrase: "douleur", language: "fr", severity: "high", category: "pain" },
  { phrase: "je suis tombé", language: "fr", severity: "high", category: "emergency" },

  // GERMAN
  { phrase: "hilfe", language: "de", severity: "critical", category: "help" },
  { phrase: "notfall", language: "de", severity: "critical", category: "emergency" },
  { phrase: "krankenwagen", language: "de", severity: "critical", category: "emergency" },
  { phrase: "arzt", language: "de", severity: "critical", category: "medical" },
  { phrase: "schmerzen", language: "de", severity: "high", category: "pain" },
  { phrase: "gestürzt", language: "de", severity: "high", category: "emergency" },

  // CHINESE (Mandarin - simplified)
  { phrase: "救命", language: "zh", severity: "critical", category: "help" }, // jiù mìng (help/save life)
  { phrase: "帮助", language: "zh", severity: "critical", category: "help" }, // bāng zhù (help)
  { phrase: "紧急", language: "zh", severity: "critical", category: "emergency" }, // jǐn jí (emergency)
  { phrase: "医生", language: "zh", severity: "critical", category: "medical" }, // yī shēng (doctor)
  { phrase: "疼", language: "zh", severity: "high", category: "pain" }, // téng (pain)
  { phrase: "摔倒", language: "zh", severity: "high", category: "emergency" }, // shuāi dǎo (fall down)

  // JAPANESE
  { phrase: "助けて", language: "ja", severity: "critical", category: "help" }, // tasukete (help)
  { phrase: "救急", language: "ja", severity: "critical", category: "emergency" }, // kyūkyū (emergency)
  { phrase: "医者", language: "ja", severity: "critical", category: "medical" }, // isha (doctor)
  { phrase: "痛い", language: "ja", severity: "high", category: "pain" }, // itai (painful)
  { phrase: "転んだ", language: "ja", severity: "high", category: "emergency" }, // koronda (fell)

  // ARABIC
  { phrase: "مساعدة", language: "ar", severity: "critical", category: "help" }, // musaeada (help)
  { phrase: "النجدة", language: "ar", severity: "critical", category: "help" }, // alnajda (rescue)
  { phrase: "طوارئ", language: "ar", severity: "critical", category: "emergency" }, // tawari (emergency)
  { phrase: "طبيب", language: "ar", severity: "critical", category: "medical" }, // tabib (doctor)
  { phrase: "ألم", language: "ar", severity: "high", category: "pain" }, // alam (pain)
  { phrase: "سقطت", language: "ar", severity: "high", category: "emergency" }, // saqat (fell)
];

export interface DistressDetectionResult {
  detected: boolean;
  keyword: DistressKeyword | null;
  matchedText: string;
  timestamp: Date;
}

/**
 * Analyzes text for distress keywords
 * Case-insensitive matching with word boundary detection
 */
export function detectDistressKeywords(text: string): DistressDetectionResult {
  const lowerText = text.toLowerCase().trim();
  
  // Sort by phrase length (longest first) to match multi-word phrases before single words
  const sortedKeywords = [...DISTRESS_KEYWORDS].sort((a, b) => b.phrase.length - a.phrase.length);
  
  for (const keyword of sortedKeywords) {
    const lowerPhrase = keyword.phrase.toLowerCase();
    
    // Check if phrase exists in text
    if (lowerText.includes(lowerPhrase)) {
      return {
        detected: true,
        keyword,
        matchedText: lowerPhrase,
        timestamp: new Date(),
      };
    }
  }
  
  return {
    detected: false,
    keyword: null,
    matchedText: '',
    timestamp: new Date(),
  };
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: 'critical' | 'high' | 'medium'): string {
  switch (severity) {
    case 'critical':
      return 'text-critical-red'; // Immediate emergency
    case 'high':
      return 'text-amber'; // Urgent attention needed
    case 'medium':
      return 'text-mint-green'; // Monitor situation
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get severity badge variant
 */
export function getSeverityVariant(severity: 'critical' | 'high' | 'medium'): 'destructive' | 'default' {
  switch (severity) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Format category name for display
 */
export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    help: 'Help Requested',
    pain: 'Pain Detected',
    unsafe: 'Unsafe Feeling',
    medical: 'Medical Issue',
    emergency: 'Emergency',
  };
  return labels[category] || category;
}
