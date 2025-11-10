export interface SignDefinition {
  gesture: string;
  meaning: string;
  category: "basic" | "emergency" | "daily" | "emotion";
  description?: string;
}

export const SIGN_VOCABULARY: Record<string, SignDefinition> = {
  // MediaPipe built-in gestures
  "Thumb_Up": {
    gesture: "Thumb_Up",
    meaning: "Yes / Good / Okay",
    category: "basic",
    description: "Thumbs up gesture indicating approval"
  },
  "Thumb_Down": {
    gesture: "Thumb_Down",
    meaning: "No / Bad / Disagree",
    category: "basic",
    description: "Thumbs down gesture indicating disapproval"
  },
  "Victory": {
    gesture: "Victory",
    meaning: "Peace / Victory / Two",
    category: "basic",
    description: "V-sign with index and middle finger"
  },
  "Open_Palm": {
    gesture: "Open_Palm",
    meaning: "Stop / Wait / Hello",
    category: "basic",
    description: "Open palm facing forward"
  },
  "Closed_Fist": {
    gesture: "Closed_Fist",
    meaning: "Strong / Urgent / Number Zero",
    category: "basic",
    description: "Closed fist gesture"
  },
  "Pointing_Up": {
    gesture: "Pointing_Up",
    meaning: "Attention / One / Look",
    category: "basic",
    description: "Index finger pointing upward"
  },
  "ILoveYou": {
    gesture: "ILoveYou",
    meaning: "I Love You",
    category: "emotion",
    description: "ASL sign for 'I Love You'"
  }
};

export const EMERGENCY_KEYWORDS = ["help", "emergency", "urgent", "pain", "fall"];

export function getSignMeaning(gesture: string): string {
  const sign = SIGN_VOCABULARY[gesture];
  return sign ? sign.meaning : gesture;
}

export function isEmergencySign(gesture: string): boolean {
  const meaning = getSignMeaning(gesture).toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => meaning.includes(keyword));
}

export function formatGestureForDisplay(gesture: string, handedness: string): string {
  const meaning = getSignMeaning(gesture);
  return `[${handedness} Hand] ${meaning}`;
}
