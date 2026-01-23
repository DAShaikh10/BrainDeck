"use client";

import { useState, useEffect, useCallback } from "react";
import type { FlashCard, ConfidenceScore } from "@/types/flashcard";
import { reviewCard, getDueCards, calculateDeckStats, createNewCard } from "@/lib/leitner";
import { fetchFlashcards, clearFlashcardCache } from "@/lib/flashcardApi";
import { debug } from "@/lib/debug";

const STORAGE_KEY = "braindeck-cards";

/**
 * Custom hook for managing flashcards with API fetching and offline support
 * Implements offline-first state management with localStorage persistence
 */
export function useFlashCards() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update cards from API - only replaces if we have no cards yet
  const updateCardsFromAPI = useCallback(async () => {
    try {
      const { cards: fetchedCards, isOffline: offline, fromCache } = await fetchFlashcards(8);

      if (fetchedCards.length > 0) {
        // Only update if we don't have cards yet (initial load)
        setCards((prevCards) => {
          // If we already have cards, keep them and don't overwrite with API results
          if (prevCards.length > 0) {
            // Just update offline/error state, don't touch the cards
            return prevCards;
          }
          // Only use new API cards if we have nothing yet
          return fetchedCards;
        });

        setIsOffline(offline);
        // Only save to localStorage if we didn't already have cards
        setCards((prevCards) => {
          if (prevCards.length === 0 && fetchedCards.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedCards));
          }
          return prevCards;
        });

        if (fromCache) {
          setError("Using cached flashcards - refresh when online for new cards");
        } else {
          setError(null);
        }
      } else if (!offline) {
        setError("Failed to fetch flashcards. Using demo data.");
        const demoCards = initializeSampleCards();
        setCards(demoCards);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoCards));
      }
    } catch (err) {
      debug.error("Failed to update cards from API:", err);
      setError("Failed to fetch flashcards");

      // Fall back to stored or demo cards only if we have no cards
      setCards((prevCards) => {
        if (prevCards.length > 0) return prevCards;
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : initializeSampleCards();
      });
    }
  }, []);

  // Load cards from localStorage and API on mount
  useEffect(() => {
    const initializeCards = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First check if we have cards in storage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsedCards = JSON.parse(stored) as FlashCard[];
            setCards(parsedCards);
            setIsLoading(false);
            // Try to fetch fresh cards in background
            await updateCardsFromAPI();
            return;
          } catch (error) {
            debug.error("Failed to parse stored cards:", error);
          }
        }

        // No stored cards, fetch from API
        await updateCardsFromAPI();
      } finally {
        setIsLoading(false);
      }
    };

    initializeCards();

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateCardsFromAPI]);

  // Persist to localStorage whenever cards change
  const persistCards = useCallback((updatedCards: FlashCard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
      setCards(updatedCards);
    } catch (error) {
      debug.error("Failed to persist cards:", error);
    }
  }, []);

  // Add a new card
  const addCard = useCallback(
    (question: string, answer: string) => {
      const newCard = createNewCard(question, answer);
      const updatedCards = [...cards, newCard];
      persistCards(updatedCards);
      return newCard;
    },
    [cards, persistCards]
  );

  // Review a card (core Leitner algorithm application)
  const reviewFlashCard = useCallback(
    (cardId: string, confidence: ConfidenceScore) => {
      const cardIndex = cards.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return null;

      const result = reviewCard(cards[cardIndex], confidence);
      const updatedCards = [...cards];
      updatedCards[cardIndex] = result.card;
      persistCards(updatedCards);

      return result;
    },
    [cards, persistCards]
  );

  // Delete a card
  const deleteCard = useCallback(
    (cardId: string) => {
      const updatedCards = cards.filter((c) => c.id !== cardId);
      persistCards(updatedCards);
    },
    [cards, persistCards]
  );

  // Get due cards
  const dueCards = getDueCards(cards);

  // Get statistics
  const stats = calculateDeckStats(cards);

  // Reset all cards (for testing)
  const resetDeck = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const resetCards = cards.map((card) => ({
      ...card,
      level: 0 as const,
      nextReviewDate: now.toISOString(),
      lastReviewDate: null,
      reviewCount: 0,
    }));
    persistCards(resetCards);
  }, [cards, persistCards]);

  return {
    cards,
    dueCards,
    stats,
    isLoading,
    isOffline,
    error,
    addCard,
    reviewFlashCard,
    deleteCard,
    resetDeck,
    updateCardsFromAPI,
    clearCache: clearFlashcardCache,
  };
}

/**
 * Initialize with sample flashcards for demonstration
 */
function initializeSampleCards(): FlashCard[] {
  const sampleData = [
    {
      question: "What is the time complexity of binary search?",
      answer: "O(log n) - Binary search divides the search space in half with each iteration.",
    },
    {
      question: "What is a closure in JavaScript?",
      answer:
        "A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.",
    },
    {
      question: "What does REST stand for?",
      answer: "Representational State Transfer - An architectural style for designing networked applications.",
    },
    {
      question: "What is the difference between var, let, and const?",
      answer:
        "var is function-scoped and hoisted; let is block-scoped; const is block-scoped and cannot be reassigned.",
    },
    {
      question: "What is the Virtual DOM?",
      answer:
        "A lightweight copy of the actual DOM kept in memory, used by React to optimize rendering by comparing changes before updating the real DOM.",
    },
    {
      question: "Explain SQL JOIN types",
      answer:
        "INNER JOIN: matching rows only; LEFT JOIN: all left + matches; RIGHT JOIN: all right + matches; FULL OUTER JOIN: all rows from both tables.",
    },
    {
      question: "What is Big O notation?",
      answer:
        "A mathematical notation that describes the limiting behavior of a function when the argument tends towards infinity, used to classify algorithms by their time/space complexity.",
    },
    {
      question: "What is a Promise in JavaScript?",
      answer:
        "An object representing the eventual completion or failure of an asynchronous operation, with .then(), .catch(), and .finally() methods.",
    },
  ];

  return sampleData.map(({ question, answer }) => createNewCard(question, answer));
}
