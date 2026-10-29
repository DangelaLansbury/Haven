import { useEffect, useId, useRef, useState } from 'react';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldAtlas from 'world-atlas/countries-110m.json';
import { places, routes, type StoryStep } from './steps';

// Same D3 projection and Natural Earth geometry as components/Map.tsx.
// A separate renderer allows a controlled camera without changing its drag/zoom behavior.
const topology = worldAtlas as unknown as Topology<{ countries: GeometryCollection }>;
const countries = (feature(topology, topology.objects.countries) as FeatureCollection<Geometry>).features;
const graticule = geoGraticule10();
type Rotation = [number, number, number];

function useCamera(target: Rotation) {
  const [rotation, setRotation] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = [...current.current] as Rotation;
    const startedAt = performance.now();
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      current.current = target;
      setRotation(target);
    };
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / 850, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start.map((value, axis) => value + (target[axis] - value) * eased) as Rotation;
      current.current = next;
      setRotation(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    if (preference.matches) finish();
    else frame = requestAnimationFrame(animate);
    preference.addEventListener('change', finish);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', finish); };
  }, [target]);
  return rotation;
}

export default function StoryGlobe({ scene }: { scene: StoryStep['scene'] }) {
  const id = useId();
  const rotation = useCamera(scene.rotation);
  const projection = geoOrthographic().translate([320, 300]).scale(258).rotate(rotation).clipAngle(90).precision(0.4);
  const path = geoPath(projection);
  const center: [number, number] = [-rotation[0], -rotation[1]];

  return (
    <svg className="story-globe" viewBox="0 0 640 600" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>{scene.label}</title>
      <desc id={`${id}-description`}>{scene.routes.map(route => routes[route].label).join('. ') || 'A globe introduces the jurisdictions in the story.'}</desc>
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <path className="globe-sphere" d={path({ type: 'Sphere' }) ?? ''} />
      <path className="globe-grid" d={path(graticule) ?? ''} />
      {countries.map(country => (
        <path key={country.id} className={`globe-country ${scene.countries.includes(String(country.id)) ? 'is-highlighted' : ''}`} d={path(country) ?? ''} />
      ))}
      {scene.routes.map(routeId => {
        const route = routes[routeId];
        const coordinates = [places[route.from].coordinates, places[route.to].coordinates];
        return <path key={routeId} className={`globe-route route-${routeId}`} pathLength={1} d={path({ type: 'LineString', coordinates }) ?? ''} markerEnd={`url(#${id}-arrow)`} />;
      })}
      {scene.places.map(placeId => {
        const place = places[placeId];
        const point = projection(place.coordinates);
        if (!point || geoDistance(center, place.coordinates) >= Math.PI / 2) return null;
        return (
          <g key={placeId} className="globe-place" transform={`translate(${point[0]},${point[1]})`}>
            <circle className="globe-pin-halo" r="9" />
            <circle className="globe-pin" r="3.5" />
            <text x={place.offset[0]} y={place.offset[1]} textAnchor={place.offset[0] < 0 ? 'end' : 'start'}>{place.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
