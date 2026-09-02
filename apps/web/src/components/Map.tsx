import React, { useMemo } from 'react';
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

const coordinatePath = (coordinates: readonly number[], radius: number) => {
  let path = '';
  for (let index = 0; index < coordinates.length; index += 2) {
    const x = coordinates[index];
    const y = coordinates[index + 1];
    path += `M${x - radius},${y}a${radius},${radius} 0 1,0 ${radius * 2},0a${radius},${radius} 0 1,0 -${radius * 2},0`;
  }
  return path;
};

export const WorldMap = React.memo(function WorldMap({
  width,
  height,
  highlightedCountries = EMPTY_HIGHLIGHTS,
  highlightedIds = EMPTY_HIGHLIGHTS,
  candidateCountries = EMPTY_HIGHLIGHTS,
  defaultFill = '#d1d5db',
  candidateFill = '#6b7280',
  highlightFill = '#f59e0b',
  dotRadius = 1.8,
  highlightedDotRadius = 3.2,
}: WorldMapProps) {
  const highlighted = useMemo(() => new Set([...highlightedCountries, ...highlightedIds].map(normalizeCountry)), [highlightedCountries, highlightedIds]);
  const candidates = useMemo(() => new Set(candidateCountries.map(normalizeCountry)), [candidateCountries]);

  const { defaultPath, candidatePath, highlightedPath } = useMemo(() => {
    let normal = '';
    let candidate = '';
    let active = '';
    const countriesWithDots = new Set<string>();

    WORLD_MAP_DOT_GROUPS.forEach(([country, countryId, coordinates]) => {
      const canonicalCountry = normalizeCountry(country);
      countriesWithDots.add(canonicalCountry);
      if (highlighted.has(canonicalCountry) || highlighted.has(countryId)) active += coordinatePath(coordinates, highlightedDotRadius);
      else if (candidates.has(canonicalCountry) || candidates.has(countryId)) candidate += coordinatePath(coordinates, dotRadius);
      else normal += coordinatePath(coordinates, dotRadius);
    });

    highlighted.forEach((country) => {
      const marker = WORLD_MAP_MARKERS[country];
      if (!marker || countriesWithDots.has(country)) return;
      active += coordinatePath(marker, highlightedDotRadius);
    });

    candidates.forEach((country) => {
      if (highlighted.has(country)) return;
      const marker = WORLD_MAP_MARKERS[country];
      if (!marker || countriesWithDots.has(country)) return;
      candidate += coordinatePath(marker, dotRadius);
    });

    return { defaultPath: normal, candidatePath: candidate, highlightedPath: active };
  }, [candidates, dotRadius, highlighted, highlightedDotRadius]);

  return (
    <svg role="img" aria-label={`Dot matrix world map${highlighted.size ? ` highlighting ${highlightedCountries.join(', ')}` : ''}`} viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`} width={width} height={height} style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
      <title>World map with excluded candidate jurisdictions in dark grey and optimized jurisdictions highlighted</title>
      <path d={defaultPath} fill={defaultFill} />
      <path d={candidatePath} fill={candidateFill} />
      <path d={highlightedPath} fill={highlightFill} />
    </svg>
  );
});
