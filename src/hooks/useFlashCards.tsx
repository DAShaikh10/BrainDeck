"use client";

import { useState, useEffect, useCallback } from "react";
import type { FlashCard, ConfidenceScore } from "@/types/flashcard";
import { reviewCard, getDueCards, calculateDeckStats, createNewCard } from "@/lib/leitner";

const STORAGE_KEY = "braindeck-cards";

/**
 * Custom hook for managing flashcards with localStorage persistence
 * Implements offline-first state management
 */
export function useFlashCards() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedCards = JSON.parse(stored) as FlashCard[];
        setCards(parsedCards);
      } else {
        // Initialize with sample cards for demo
        const sampleCards = initializeSampleCards();
        setCards(sampleCards);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleCards));
      }
    } catch (error) {
      console.error("Failed to load cards:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist to localStorage whenever cards change
  const persistCards = useCallback((updatedCards: FlashCard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
      setCards(updatedCards);
    } catch (error) {
      console.error("Failed to persist cards:", error);
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
      const cardIndex = cards.findIndex((c) => c.id === cardId);
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
    now.setHours(0, 0, 0, 0); // Reset to midnight
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
    addCard,
    reviewFlashCard,
    deleteCard,
    resetDeck,
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
