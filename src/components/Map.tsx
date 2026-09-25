import React, { useMemo } from 'react';
import styles from '../css/Map.module.css';
import { WORLD_MAP_DOT_GROUPS, WORLD_MAP_HEIGHT, WORLD_MAP_MARKERS, WORLD_MAP_WIDTH } from '../data/worldMapDots';

type WorldMapProps = {
  width: number;
  height: number;

  highlightedCountries?: Array<string | number>;
  /** Kept as an alias for existing callers. */
  highlightedIds?: Array<string | number>;
  candidateCountries?: Array<string | number>;
  defaultFill?: string;
  candidateFill?: string;
  highlightFill?: string;
  dotRadius?: number;
  highlightedDotRadius?: number;
};

const EMPTY_HIGHLIGHTS: Array<string | number> = [];

const normalizeCountry = (value: string | number) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/unitedstatesofamerica/g, 'unitedstates');

// Round caps turn zero-length segments into dots; stroke width controls their diameter.
const coordinatePath = (coordinates: readonly number[]) => {
  let path = '';
  for (let index = 0; index < coordinates.length; index += 2) {
    path += `M${coordinates[index]},${coordinates[index + 1]}h0`;
  }
  return path;
};

const countriesWithDots = new Set(WORLD_MAP_DOT_GROUPS.map(([country]) => normalizeCountry(country)));
const dotPaths = [
  ...WORLD_MAP_DOT_GROUPS.map(([country, countryId, coordinates]) => ({
    country: normalizeCountry(country),
    countryId,
    path: coordinatePath(coordinates),
    marker: false,
  })),
  ...Object.entries(WORLD_MAP_MARKERS)
    .filter(([country]) => !countriesWithDots.has(country))
    .map(([country, coordinates]) => ({
      country,
      countryId: country,
      path: coordinatePath(coordinates),
      marker: true,
    })),
];

export const WorldMap = React.memo(function WorldMap({
  width,
  height,
  highlightedCountries = EMPTY_HIGHLIGHTS,
  highlightedIds = EMPTY_HIGHLIGHTS,
  candidateCountries = EMPTY_HIGHLIGHTS,
  defaultFill = 'var(--gray-125)',
  candidateFill = 'var(--gray-300)',
  highlightFill = 'var(--haven-green)',
  dotRadius = 2,
  highlightedDotRadius = 3.6,
}: WorldMapProps) {
  const highlighted = useMemo(() => new Set([...highlightedCountries, ...highlightedIds].map(normalizeCountry)), [highlightedCountries, highlightedIds]);
  const candidates = useMemo(() => new Set(candidateCountries.map(normalizeCountry)), [candidateCountries]);

  return (
    <svg
      role="img"
      aria-label={`Dot matrix world map${highlighted.size ? ` highlighting ${highlightedCountries.join(', ')}` : ''}`}
      viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
      width={width}
      height={height}
      style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
    >
      {dotPaths.map(({ country, countryId, path, marker }) => {
        const active = highlighted.has(country) || highlighted.has(countryId);
        const candidate = candidates.has(country) || candidates.has(countryId);
        const visible = !marker || active || candidate;
        return (
          <path
            key={country}
            className={styles.dots}
            d={path}
            fill="none"
            strokeLinecap="round"
            stroke={active ? highlightFill : candidate ? candidateFill : defaultFill}
            strokeWidth={visible ? 2 * (active ? highlightedDotRadius : dotRadius) : 0}
            opacity={visible ? 1 : 0}
          />
        );
      })}
    </svg>
  );
});
