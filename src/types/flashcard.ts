/**
 * Represents the Leitner System level for a flashcard
 * Level 0: New/Failed card (review today)
 * Level 1-5: Successfully reviewed cards with increasing intervals
 */
export type LeitnerLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * User's confidence in knowing the card
 */
export type ConfidenceScore = "forgot" | "know";

/**
 * Flashcard entity with Leitner System properties
 */
export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  level: LeitnerLevel;
  nextReviewDate: string; // ISO date string
  lastReviewDate: string | null;
  createdAt: string;
  reviewCount: number;
}

/**
 * Statistics for the deck
 */
export interface DeckStats {
  totalCards: number;
  cardsToReview: number;
  masteredCards: number; // Level 5 cards
  averageLevel: number;
}

/**
 * Result of a review action
 */
export interface ReviewResult {
  card: FlashCard;
  previousLevel: LeitnerLevel;
  newLevel: LeitnerLevel;
  nextReviewDate: string;
}
