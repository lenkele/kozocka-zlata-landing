import { DEMO_SHOW } from './demo';
import { MARITA_SHOW } from './marita';
import { ZLATA_SHOW } from './zlata';
import { type ShowConfig, type ShowSlug } from './types';

export const SHOWS: Record<ShowSlug, ShowConfig> = {
  zlata: ZLATA_SHOW,
  marita: MARITA_SHOW,
  demo: DEMO_SHOW,
};

export const SHOW_SLUGS = Object.keys(SHOWS) as ShowSlug[];

export const DEFAULT_SHOW_SLUG: ShowSlug = 'zlata';

export function isShowSlug(candidate: string): candidate is ShowSlug {
  return SHOW_SLUGS.includes(candidate as ShowSlug);
}
