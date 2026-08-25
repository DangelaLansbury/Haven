import React, { useMemo } from 'react';
import { geoContains, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';

type WorldMapProps = {
  width: number;
  height: number;

  highlightedCountries?: Array<string | number>;
  /** Kept as an alias for existing callers. */
  highlightedIds?: Array<string | number>;
  defaultFill?: string;
  highlightFill?: string;
  dotRadius?: number;
  highlightedDotRadius?: number;
  gap?: number;
};

type MapFeature = any;
type Dot = { x: number; y: number; country: string; countryId?: string; key: string };
const EMPTY_HIGHLIGHTS: Array<string | number> = [];

// Tiny jurisdictions omitted from the 110m atlas still need a visible map marker.
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  australia: [133.78, -25.27],
  barbados: [-59.54, 13.19],
  caymanislands: [-81.25, 19.31],
  cyprus: [33.43, 35.13],
  germany: [10.45, 51.17],
  hungary: [19.5, 47.16],
  ireland: [-8.24, 53.41],
  japan: [138.25, 36.2],
  luxembourg: [6.13, 49.82],
  netherlands: [5.29, 52.13],
  singapore: [103.82, 1.35],
  switzerland: [8.23, 46.82],
  unitedkingdom: [-3.44, 55.38],
  unitedstates: [-98.58, 39.83],
};

const normalizeCountry = (value: string | number) =>
  String(value)
    .toLowerCase()
    .replace(/unitedstatesofamerica/g, 'unitedstates')
    .replace(/[^a-z0-9]/g, '');

export const WorldMap = React.memo(function WorldMap({
  width,
  height,
  highlightedCountries = EMPTY_HIGHLIGHTS,
  highlightedIds = EMPTY_HIGHLIGHTS,
  defaultFill = '#d1d5db',
  highlightFill = '#f59e0b',
  dotRadius = 1.8,
  highlightedDotRadius = 3.2,
  gap = 8,
}: WorldMapProps) {
  const countries = useMemo(() => {
    const collection = feature(world as any, (world as any).objects.countries) as any;
    return collection.features as MapFeature[];
  }, []);
  const highlighted = useMemo(() => new Set([...highlightedCountries, ...highlightedIds].map(normalizeCountry)), [highlightedCountries, highlightedIds]);

  const { dots, projection } = useMemo(() => {
    const padding = Math.max(highlightedDotRadius + 2, gap / 2);
    const nextProjection = geoNaturalEarth1().fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      { type: 'FeatureCollection', features: countries },
    );
    const nextDots: Dot[] = [];

    for (let y = padding; y <= height - padding; y += gap) {
      for (let x = padding; x <= width - padding; x += gap) {
        const coordinates = nextProjection.invert?.([x, y]);
        if (!coordinates) continue;
        const owner = countries.find((country) => geoContains(country, coordinates));
        if (!owner) continue;
        const name = normalizeCountry(owner.properties?.name ?? '');
        const id = normalizeCountry(owner.id ?? '');
        nextDots.push({ x, y, country: name, countryId: id, key: `${x}-${y}` });
      }
    }
    return { dots: nextDots, projection: nextProjection };
  }, [countries, gap, height, highlightedDotRadius, width]);

  const fallbackDots = useMemo(
    () => Object.entries(COUNTRY_COORDINATES).flatMap(([country, coordinates]) => {
      if (!highlighted.has(country) || dots.some((dot) => dot.country === country)) return [];
      const point = projection(coordinates);
      return point ? [{ x: point[0], y: point[1], country, key: `fallback-${country}` }] : [];
    }),
    [dots, highlighted, projection],
  );

  return (
    <svg role="img" aria-label={`Dot matrix world map${highlighted.size ? ` highlighting ${highlightedCountries.join(', ')}` : ''}`} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
      <title>World map with highlighted optimization jurisdictions</title>
      {[...dots, ...fallbackDots].map((dot) => {
        const isHighlighted = highlighted.has(dot.country) || (dot.countryId !== undefined && highlighted.has(dot.countryId));
        return <circle key={dot.key} cx={dot.x} cy={dot.y} r={isHighlighted ? highlightedDotRadius : dotRadius} fill={isHighlighted ? highlightFill : defaultFill} style={{ transition: 'fill 180ms ease, r 180ms ease' }} />;
      })}
    </svg>
  );
});
