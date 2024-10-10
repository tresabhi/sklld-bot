import { RatingPlayer } from '../statistics';

export const LEAGUES = [
  { name: 'diamond', minScore: 5000, index: 0 },
  { name: 'platinum', minScore: 4000, index: 1 },
  { name: 'gold', minScore: 3000, index: 2 },
  { name: 'silver', minScore: 2000, index: 3 },
  { name: 'bronze', minScore: -Infinity, index: 4 },
];
export type RatingInfo =
  | {
      detail: undefined;

      title: string;
      icon: string | null;
      start_at: string;
      finish_at: string;
      current_season: number;
      updated_at: string;
      count: number;

      rewards: RatingReward[];
      leagues: RatingLeague[];
    }
  | { detail: { error: string } };
export interface RatingNeighbors {
  neighbors: RatingPlayer[];
}
export const FIRST_COMPREHENSIVE1_ARCHIVED_RATING_SEASON = 53;
export const FIRST_MINIMAL_ARCHIVED_RATING_SEASON = 49;
export interface LeagueTop {
  result: RatingPlayer[];
}
export interface RatingLeague {
  title: string;
  small_icon: string;
  big_icon: string;
  background: string;
  index: number;
  percentile: number;
}
export type RatingReward = {
  from_position: number;
  to_position: number;
  count: number;
} & (
  | {
      type: 'vehicle';

      vehicle: {
        id: number;
        name: string;
        nation: string;
        subnation: string;
        use_subnation_flag: boolean;
        type_slug: string;
        level: number;
        roman_level: string;
        user_string: string;
        image_url: string;
        preview_image_url: string;
        is_premium: boolean;
        is_collectible: boolean;
      };
    }
  | {
      type: 'stuff';

      stuff: {
        name: string;
        count: number;
        title: string;
        image_url: string;
        type: string;

        sizes: {};
      };
    }
);