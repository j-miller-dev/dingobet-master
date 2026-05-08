import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faFutbol,
  faBasketballBall,
  faFootballBall,
  faTableTennisPaddleBall,
  faBaseballBall,
  faHockeyPuck,
} from "@fortawesome/free-solid-svg-icons";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const sportIcons: Record<string, IconDefinition> = {
  soccer: faFutbol,
  basketball: faBasketballBall,
  americanfootball: faFootballBall,
  aussierules: faFootballBall,
  tennis: faTableTennisPaddleBall,
  cricket: faBaseballBall,
  rugby: faFootballBall,
  baseball: faBaseballBall,
  icehockey: faHockeyPuck,
  mma: faFootballBall,
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
        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selected === null
            ? "bg-orange-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span className="text-orange-500">
          <FontAwesomeIcon icon={faFutbol} />
        </span>

        <span>All</span>
      </button>

      {sports.map((sport) => {
        const group = sport.id.split("_")[0];
        const icon = sportIcons[group];

        return (
          <button
            key={sport.id}
            onClick={() => onSelect(sport.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected === sport.id
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {icon && (
              <span
                className={
                  selected === sport.id ? "text-orange-200" : "text-orange-500"
                }
              >
                <FontAwesomeIcon icon={icon} />
              </span>
            )}

            <span>{sport.title}</span>
          </button>
        );
      })}
    </div>
  );
}
