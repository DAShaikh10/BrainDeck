"use client";

import { useState } from "react";

import { useFlashCards } from "@/hooks/useFlashCards";
import { FlashCard } from "@/components/FlashCard";
import { StatsDisplay } from "@/components/StatsDisplay";
import { NotificationSettings } from "@/components/NotificationSettings";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ToastContainer } from "@/components/Toast";

import type { ConfidenceScore } from "@/types/flashcard";

export default function Home() {
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set());
  const [sessionComplete, setSessionComplete] = useState(false);

  const { dueCards, stats, isLoading, isOffline, error, reviewFlashCard, resetDeck, updateCardsFromAPI } =
    useFlashCards();

  // Filter out already reviewed cards from this session
  const sessionCards = dueCards.filter((card) => !reviewedCardIds.has(card.id));
  const currentCard = sessionCards[0];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">Loading your deck...</div>
      </div>
    );
  }

  const handleReview = (confidence: ConfidenceScore) => {
    if (!currentCard) return;

    reviewFlashCard(currentCard.id, confidence);

    // Mark this card as reviewed in the current session
    setReviewedCardIds((prev) => new Set(prev).add(currentCard.id));

    // Check if this was the last card
    if (sessionCards.length <= 1) {
      setSessionComplete(true);
    }
    // Otherwise, the next card will automatically appear at index 0
  };

  const handleRestart = () => {
    setReviewedCardIds(new Set());
    setSessionComplete(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-blue-50 to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black">
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Offline Banner */}
        {isOffline && (
          <div className="mb-6 max-w-2xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📡</span>
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 dark:text-yellow-200">You&apos;re Offline</div>
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  Using cached flashcards. Connect to internet to fetch fresh questions.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-300">{error}</div>
              </div>
              {!isLoading && (
                <button
                  onClick={() => updateCardsFromAPI()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🧠 BrainDeck
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">Master Knowledge with Spaced Repetition</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">Powered by Modified Leitner Algorithm</p>
        </div>

        {/* Statistics */}
        <div className="mb-12">
          <StatsDisplay stats={stats} />
        </div>

        {/* Notification Settings */}
        <div className="max-w-2xl mx-auto mb-12">
          <NotificationSettings />
        </div>

        {/* Study Session */}
        {dueCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">All Caught Up!</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">No cards due for review today. Come back tomorrow!</p>
            <button
              onClick={resetDeck}
              className="px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Reset All Cards (For Testing)
            </button>
          </div>
        ) : sessionComplete ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Session Complete!</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              You&apos;ve reviewed all {reviewedCardIds.size} cards due today.
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Review Again
            </button>
          </div>
        ) : (
          <>
            {/* Progress Indicator */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <span>Progress</span>
                <span>
                  {reviewedCardIds.size + 1} / {dueCards.length}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{
                    width: `${((reviewedCardIds.size + 1) / dueCards.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Current Card */}
            {currentCard && <FlashCard card={currentCard} onReview={handleReview} />}
          </>
        )}

        {/* Algorithm Explanation */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">🎯 How It Works</h3>
            <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <p>
                <strong className="text-zinc-900 dark:text-zinc-50">Modified Leitner System:</strong> Each card has a
                level (0-5) that determines when you&apos;ll see it next.
              </p>
              <p>
                <strong className="text-zinc-900 dark:text-zinc-50">✅ Know it:</strong> Level increases by 1, interval
                doubles (1 day → 3 days → 7 days → 14 days → 30 days)
              </p>
              <p>
                <strong className="text-zinc-900 dark:text-zinc-50">❌ Forgot:</strong> Level resets to 0, you&apos;ll
                see it again today
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
