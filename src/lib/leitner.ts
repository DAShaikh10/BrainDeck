import type { FlashCard, LeitnerLevel, ConfidenceScore, ReviewResult } from "@/types/flashcard";

/**
 * Leitner System - Interval calculation
 * Modified Leitner algorithm with exponential growth
 *
 * Level 0: 0 days (review immediately)
 * Level 1: 1 day
 * Level 2: 3 days
 * Level 3: 7 days
 * Level 4: 14 days
 * Level 5: 30 days (mastered)
 */
const LEITNER_INTERVALS: Record<LeitnerLevel, number> = {
  0: 0, // Failed/New - review today
  1: 1, // 1 day
  2: 3, // 3 days
  3: 7, // 7 days
  4: 14, // 14 days
  5: 30, // 30 days (mastered)
};

/**
 * Calculate the next review date based on the Leitner level
 * This is the core of the spaced repetition algorithm
 */
export function calculateNextReviewDate(level: LeitnerLevel, fromDate: Date = new Date()): string {
  const interval = LEITNER_INTERVALS[level];
  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + interval);
  nextDate.setHours(0, 0, 0, 0); // Reset to start of day
  return nextDate.toISOString();
}

/**
 * Determine the new level based on user confidence
 * Success: Level increases by 1 (capped at 5)
 * Failure: Level resets to 0
 */
export function calculateNewLevel(currentLevel: LeitnerLevel, confidence: ConfidenceScore): LeitnerLevel {
  if (confidence === "forgot") {
    return 0; // Reset to beginning
  }

  // Success - increase level (max is 5)
  return Math.min(currentLevel + 1, 5) as LeitnerLevel;
}

/**
 * Process a card review and return the updated card
 * This is the main algorithm that interviewers want to see
 */
export function reviewCard(card: FlashCard, confidence: ConfidenceScore): ReviewResult {
  const previousLevel = card.level;
  const newLevel = calculateNewLevel(previousLevel, confidence);
  const nextReviewDate = calculateNextReviewDate(newLevel);

  const updatedCard: FlashCard = {
    ...card,
    level: newLevel,
    nextReviewDate,
    lastReviewDate: new Date().toISOString(),
    reviewCount: card.reviewCount + 1,
  };

  return {
    card: updatedCard,
    previousLevel,
    newLevel,
    nextReviewDate,
  };
}

/**
 * Check if a card is due for review
 * A card is due if its nextReviewDate is today or in the past
 */
export function isCardDue(card: FlashCard): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const reviewDate = new Date(card.nextReviewDate);
  return reviewDate <= now;
}

/**
 * Filter cards that are due for review today
 */
export function getDueCards(cards: FlashCard[]): FlashCard[] {
  return cards.filter(isCardDue);
}

/**
 * Calculate statistics for the deck
 * Useful for showing progress to the user
 */
export function calculateDeckStats(cards: FlashCard[]): {
  totalCards: number;
  cardsToReview: number;
  masteredCards: number;
  averageLevel: number;
} {
  const totalCards = cards.length;
  const cardsToReview = getDueCards(cards).length;
  const masteredCards = cards.filter((card) => card.level === 5).length;
  const averageLevel = totalCards > 0 ? cards.reduce((sum, card) => sum + card.level, 0) / totalCards : 0;

  return {
    totalCards,
    cardsToReview,
    masteredCards,
    averageLevel: Math.round(averageLevel * 10) / 10,
  };
}

/**
 * Create a new flashcard with initial Leitner properties
 */
export function createNewCard(question: string, answer: string): FlashCard {
  const now = new Date();
  const todayAtMidnight = new Date(now);
  todayAtMidnight.setHours(0, 0, 0, 0);

  return {
    id: crypto.randomUUID(),
    question,
    answer,
    level: 0,
    nextReviewDate: todayAtMidnight.toISOString(), // Due today at midnight
    lastReviewDate: null,
    createdAt: now.toISOString(),
    reviewCount: 0,
  };
}
