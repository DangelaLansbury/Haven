import React, { useId, useMemo } from 'react';
import styles from '../css/Map.module.css';
import { WORLD_MAP_DOT_GROUPS, WORLD_MAP_HEIGHT, WORLD_MAP_MARKERS, WORLD_MAP_WIDTH } from '../data/worldMapDots';
import type { JurisdictionFlow } from '../types';

type WorldMapProps = {
  width: number;
  height: number;

  highlightedCountries?: Array<string | number>;
  /** Kept as an alias for existing callers. */
  highlightedIds?: Array<string | number>;
  candidateCountries?: Array<string | number>;
  flows?: JurisdictionFlow[];
  defaultFill?: string;
  candidateFill?: string;
  highlightFill?: string;
  dotRadius?: number;
  highlightedDotRadius?: number;
};

const EMPTY_HIGHLIGHTS: Array<string | number> = [];
const EMPTY_FLOWS: JurisdictionFlow[] = [];

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

const flowAnchors: Readonly<Record<string, readonly [number, number]>> = {
  ...WORLD_MAP_MARKERS,
  canada: [173, 68],
  china: [485, 90],
  india: [455, 114],
  mexico: [150, 114],
};

const createFlowPath = (from: readonly [number, number], to: readonly [number, number], destinationRadius: number) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return null;
  const bend = Math.min(24, distance * 0.14);
  const controlX = (x1 + x2) / 2 - (dy / distance) * bend;
  const controlY = (y1 + y2) / 2 + (dx / distance) * bend;
  // Stop the arrowhead before the destination dot, along the curve's end tangent.
  const gap = Math.min(destinationRadius + 1, distance / 3);
  const tangentLength = Math.hypot(x2 - controlX, y2 - controlY);
  const endX = x2 - ((x2 - controlX) / tangentLength) * gap;
  const endY = y2 - ((y2 - controlY) / tangentLength) * gap;
  return `M${x1},${y1} Q${controlX},${controlY} ${endX},${endY}`;
};

export const WorldMap = React.memo(function WorldMap({
  width,
  height,
  highlightedCountries = EMPTY_HIGHLIGHTS,
  highlightedIds = EMPTY_HIGHLIGHTS,
  candidateCountries = EMPTY_HIGHLIGHTS,
  flows = EMPTY_FLOWS,
  defaultFill = 'var(--gray-125)',
  candidateFill = 'var(--gray-300)',
  highlightFill = 'var(--haven-green)',
  dotRadius = 2,
  highlightedDotRadius = 3.6,
}: WorldMapProps) {
  const markerId = `profit-flow-arrow-${useId()}`;
  const descriptionId = `${markerId}-description`;
  const highlighted = useMemo(() => new Set([...highlightedCountries, ...highlightedIds].map(normalizeCountry)), [highlightedCountries, highlightedIds]);
  const candidates = useMemo(() => new Set(candidateCountries.map(normalizeCountry)), [candidateCountries]);
  const flowPaths = useMemo(
    () =>
      flows.flatMap(({ from, to }) => {
        const normalizedFrom = normalizeCountry(from);
        const normalizedTo = normalizeCountry(to);
        const fromPoint = flowAnchors[normalizedFrom];
        const toPoint = flowAnchors[normalizedTo];
        if (!fromPoint || !toPoint) return [];
        const destinationRadius = highlighted.has(normalizedTo) ? highlightedDotRadius : dotRadius;
        const path = createFlowPath(fromPoint, toPoint, destinationRadius);
        return path ? [{ key: `${normalizedFrom}-${normalizedTo}`, path, title: `${from} to ${to}` }] : [];
      }),
    [flows, highlighted, highlightedDotRadius, dotRadius],
  );

  return (
    <svg
      className={styles.map}
      role="img"
      aria-label={`Dot matrix world map${highlighted.size ? ` highlighting ${[...new Set([...highlightedCountries, ...highlightedIds])].join(', ')}` : ''}${flowPaths.length ? ` with ${flowPaths.length} illustrative profit flows` : ''}`}
      aria-describedby={flowPaths.length ? descriptionId : undefined}
      viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
      width={width}
      height={height}
    >
      {flowPaths.length > 0 && <desc id={descriptionId}>Illustrative profit flows: {flowPaths.map(({ title }) => title).join('; ')}.</desc>}
      <defs>
        <marker id={markerId} viewBox="0 0 6 6" refX="6" refY="3" markerWidth="5" markerHeight="5" orient="auto">
          <path className={styles.flowArrow} d="M0,0 L6,3 L0,6 Z" />
        </marker>
      </defs>
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
      {flowPaths.map(({ key, path, title }) => (
        <path key={key} className={styles.flow} d={path} markerEnd={`url(#${markerId})`}>
          <title>{title}</title>
        </path>
      ))}
    </svg>
  );
});
