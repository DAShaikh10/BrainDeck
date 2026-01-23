import type { DeckStats } from "@/types/flashcard";

interface StatsDisplayProps {
  stats: DeckStats;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
      <StatCard label="Total Cards" value={stats.totalCards} icon="📚" color="blue" />
      <StatCard label="Due Today" value={stats.cardsToReview} icon="⏰" color="orange" />
      <StatCard label="Mastered" value={stats.masteredCards} icon="🏆" color="green" />
      <StatCard label="Avg Level" value={stats.averageLevel.toFixed(1)} icon="📊" color="purple" />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: "blue" | "orange" | "green" | "purple";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    orange: "from-orange-500 to-red-500",
    green: "from-green-500 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`text-3xl font-bold bg-linear-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
          {value}
        </div>
      </div>
      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</div>
    </div>
  );
}
