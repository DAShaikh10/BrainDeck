/**
 * Flashcard API Service
 * Fetches flashcards from online sources with offline caching
 */

import type { FlashCard } from "@/types/flashcard";
import { createNewCard } from "./leitner";
import { debug } from "./debug";

const CACHE_KEY = "braindeck-api-cache";
const CACHE_EXPIRY_KEY = "braindeck-cache-expiry";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface FlashcardSource {
  name: string;
  url: string;
  category?: string;
}

/**
 * Fetch flashcards from Open Trivia Database
 */
async function fetchFromOpenTrivia(amount: number = 5): Promise<FlashCard[]> {
  try {
    const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.response_code !== 0) {
      throw new Error("Failed to fetch trivia questions");
    }

    // Convert trivia to flashcards
    return data.results.map((item: { question: string; correct_answer: string; incorrect_answers: string[] }) => {
      return createNewCard(
        decodeHTML(item.question),
        `Correct: ${decodeHTML(item.correct_answer)}\n\nOther options:\n${item.incorrect_answers
          .map((a) => `- ${decodeHTML(a)}`)
          .join("\n")}`
      );
    });
  } catch (error) {
    debug.error("Failed to fetch from Open Trivia:", error);
    throw error;
  }
}

/**
 * Decode HTML entities
 */
function decodeHTML(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  if (typeof window === "undefined") return false;

  const cached = localStorage.getItem(CACHE_EXPIRY_KEY);
  if (!cached) return false;

  const expiryTime = parseInt(cached);
  return Date.now() < expiryTime;
}

/**
 * Get cached flashcards
 */
function getCachedFlashcards(): FlashCard[] | null {
  if (typeof window === "undefined") return null;

  if (!isCacheValid()) {
    // Cache expired, clear it
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    return null;
  }

  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Cache flashcards in localStorage
 */
function cacheFlashcards(cards: FlashCard[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cards));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (error) {
    debug.warn("Failed to cache flashcards:", error);
  }
}

/**
 * Check if user is online
 */
function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Fetch flashcards with offline fallback
 */
export async function fetchFlashcards(amount: number = 5): Promise<{
  cards: FlashCard[];
  isOffline: boolean;
  fromCache: boolean;
}> {
  // Try to fetch from API if online
  if (isOnline()) {
    try {
      debug.log("Fetching flashcards from API...");
      const cards = await fetchFromOpenTrivia(amount);
      cacheFlashcards(cards);
      return { cards, isOffline: false, fromCache: false };
    } catch (error) {
      debug.warn("Failed to fetch from API, checking cache...", error);
      // Fall through to cache check
    }
  }

  // Try to use cached data
  const cachedCards = getCachedFlashcards();
  if (cachedCards) {
    debug.log("Using cached flashcards");
    return {
      cards: cachedCards,
      isOffline: !isOnline(),
      fromCache: true,
    };
  }

  // No cache and offline - this shouldn't happen in normal usage
  debug.warn("No flashcards available and offline");
  return { cards: [], isOffline: true, fromCache: false };
}

/**
 * Clear cache manually
 */
export function clearFlashcardCache(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_EXPIRY_KEY);
  debug.log("Flashcard cache cleared");
}
