"use client";

import { useState } from "react";
import type { FlashCard as FlashCardType } from "@/types/flashcard";

interface FlashCardProps {
  card: FlashCardType;
  onReview: (confidence: "know" | "forgot") => void;
}

export function FlashCard({ card, onReview }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = (confidence: "know" | "forgot") => {
    onReview(confidence);
    setIsFlipped(false); // Reset for next card
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card Container */}
      <div className="relative w-full h-80 cursor-pointer perspective-1000" onClick={handleFlip}>
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of Card (Question) */}
          <div
            className={`absolute w-full h-full backface-hidden bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center ${
              isFlipped ? "invisible" : ""
            }`}
          >
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">QUESTION</div>
            <p className="text-2xl font-semibold text-center text-zinc-900 dark:text-zinc-50">{card.question}</p>
            <div className="absolute bottom-6 text-sm text-zinc-400 dark:text-zinc-600">Click to reveal answer</div>
          </div>

          {/* Back of Card (Answer) */}
          <div
            className={`absolute w-full h-full backface-hidden bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center rotate-y-180 ${
              !isFlipped ? "invisible" : ""
            }`}
          >
            <div className="text-sm font-medium text-white/80 mb-4">ANSWER</div>
            <p className="text-xl text-center text-white leading-relaxed">{card.answer}</p>
          </div>
        </div>
      </div>

      {/* Level Indicator */}
      <div className="flex items-center justify-center gap-2 mt-6 mb-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Level:</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-full transition-colors ${
                level <= card.level ? "bg-linear-to-r from-blue-500 to-purple-600" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{card.level}/5</span>
      </div>

      {/* Review Buttons */}
      {isFlipped && (
        <div className="flex gap-4 mt-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReview("forgot");
            }}
            className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            ❌ I Forgot
            <div className="text-xs opacity-80 mt-1">Reset to Level 0</div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReview("know");
            }}
            className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            ✅ I Know This
            <div className="text-xs opacity-80 mt-1">
              {card.level === 5 ? "Mastered!" : `Progress to Level ${card.level + 1}`}
            </div>
          </button>
        </div>
      )}

      {/* Review Count & Stats */}
      <div className="flex justify-center gap-6 mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        <div>
          <span className="font-medium">Reviews:</span> {card.reviewCount}
        </div>
        {card.lastReviewDate && (
          <div>
            <span className="font-medium">Last Review:</span> {new Date(card.lastReviewDate).toLocaleDateString()}
          </div>
        )}
        <div>
          <span className="font-medium">Next Review:</span> {new Date(card.nextReviewDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
