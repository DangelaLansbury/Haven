import React, { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

type WorldMapProps = {
  width: number;
  height: number;

  // Pass either numeric ids or strings, depending on your dataset.
  highlightedIds?: Array<string | number>;

  // Optional styling hooks
  defaultFill?: string;
  highlightFill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export function WorldMap({ width, height, highlightedIds = [], defaultFill = '#e5e7eb', highlightFill = '#f59e0b', stroke = '#111827', strokeWidth = 0.5 }: WorldMapProps) {
  const [countries, setCountries] = useState<any[]>([]);
  const highlighted = useMemo(() => new Set(highlightedIds.map(String)), [highlightedIds]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Replace with your hosted topojson URL
      const res = await fetch('/data/world-110m.json');
      if (!res.ok) throw new Error(`Failed to load map: ${res.status}`);
      const topo = await res.json();

      // Common object name is topo.objects.countries, but verify your file
      const countriesGeo = feature(topo, topo.objects.countries) as any;
      if (!cancelled) setCountries(countriesGeo.features);
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  const projection = useMemo(() => geoNaturalEarth1(), []);
  const path = useMemo(() => geoPath(projection), [projection]);

  // Fit projection when size or data changes
  useEffect(() => {
    if (!countries.length) return;
    projection.fitSize([width, height], { type: 'FeatureCollection', features: countries } as any);
  }, [projection, countries, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g>
        {countries.map((f) => {
          // Use a stable key and matching id strategy:
          // Here we assume f.id exists. Adjust to f.properties.iso_a3 or name as needed.
          const id = f.id ?? f.properties?.iso_a3 ?? f.properties?.name;
          const isHighlighted = highlighted.has(String(id));

          return (
            <path key={String(id)} d={path(f) ?? undefined} fill={isHighlighted ? highlightFill : defaultFill} stroke={stroke} strokeWidth={strokeWidth} opacity={isHighlighted ? 1 : 0.9}>
              <title>{f.properties?.name ?? String(id)}</title>
            </path>
          );
        })}
      </g>
    </svg>
  );
}
