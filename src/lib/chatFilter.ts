// Chat content filter for inappropriate content
// This filter works with a database-backed banned words list

export interface FilterResult {
  isClean: boolean;
  reason?: string;
}

// Additional patterns that bypass word lists
const INAPPROPRIATE_PATTERNS = [
  /\b(n+[i1]+[g6]+[e3]*r+s*|n+[i1]+[g6]+[a@]+s*)\b/i,
  /\b(f+[a@]+[g6]+[o0]+t+s*|f+[a@]+[g6]+s*)\b/i,
  /\b(r+[e3]+t+[a@]+r+d+s*)\b/i,
  /\b(k+[i1]+l+l*\s*(yo)?u?r?\s*s+[e3]+l+f+)\b/i,
  /\b(k+y+s+)\b/i,
];

export function filterContent(content: string, bannedWords: string[] = []): FilterResult {
  if (!content || content.trim().length === 0) {
    return { isClean: false, reason: "Message cannot be empty" };
  }

  const lowerContent = content.toLowerCase();

  // Check against database-backed word list
  for (const word of bannedWords) {
    if (lowerContent.includes(word.toLowerCase())) {
      return { 
        isClean: false, 
        reason: "Message contains inappropriate content" 
      };
    }
  }

  // Check against patterns (for variations/leetspeak)
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(content)) {
      return { 
        isClean: false, 
        reason: "Message contains inappropriate content" 
      };
    }
  }

  // Check for excessive caps (spam indicator)
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 10 && capsCount / letterCount > 0.7) {
    return { 
      isClean: false, 
      reason: "Please don't use excessive capital letters" 
    };
  }

  // Check for repeated characters (spam indicator)
  if (/(.)\1{5,}/i.test(content)) {
    return { 
      isClean: false, 
      reason: "Please don't use excessive repeated characters" 
    };
  }

  return { isClean: true };
}

export function sanitizeContent(content: string): string {
  // Basic sanitization - remove potential XSS
  return content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
}
