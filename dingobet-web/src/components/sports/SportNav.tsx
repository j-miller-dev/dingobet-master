const sportIcons: Record<string, string> = {
  soccer: "⚽",
  basketball: "🏀",
  americanfootball: "🏈",
  aussierules: "🏉",
  tennis: "🎾",
  cricket: "🏏",
  rugby: "🏉",
  baseball: "⚾",
  icehockey: "🏒",
  mma: "🥊",
};

interface Sport {
  id: string;
  title: string;
  group: string | null;
}

interface SportNavProps {
  sports: Sport[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function SportNav({
  sports,
  selected,
  onSelect,
}: SportNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selected === null
            ? "bg-orange-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        🎯 All
      </button>
      {sports.map((sport) => {
        const group = sport.id.split("_")[0];
        const icon = sportIcons[group] ?? "🎯";
        return (
          <button
            key={sport.id}
            onClick={() => onSelect(sport.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected === sport.id
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {icon} {sport.title}
          </button>
        );
      })}
    </div>
  );
}
