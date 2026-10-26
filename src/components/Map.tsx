import React, { useId, useMemo, useReducer, useRef, useState } from 'react';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from 'd3';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import versor from 'versor';
import worldAtlas from 'world-atlas/countries-110m.json';
import styles from '../css/Map.module.css';

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

type CountryProperties = GeoJsonProperties & { name?: string };
type CountryFeature = Feature<Geometry, CountryProperties>;
type Rotation = [number, number, number];
type Cartesian = [number, number, number];
type Quaternion = [number, number, number, number];

type DragGesture = {
  pointerId: number;
  startVector: Cartesian;
  startQuaternion: Quaternion;
  startRotation: Rotation;
};

type PinchGesture = {
  startDistance: number;
  startScale: number;
};

type CountryMarker = {
  country: string;
  label: string;
  coordinates: [number, number];
};

const EMPTY_HIGHLIGHTS: Array<string | number> = [];
const INITIAL_ROTATION: Rotation = [20, -15, 0];
const MIN_ZOOM = 0.82;
const MAX_ZOOM = 2.8;

// Small jurisdictions disappear at Natural Earth's 1:110m resolution, so they
// receive geographic point markers while still participating in normal state.
const SMALL_COUNTRY_MARKERS: CountryMarker[] = [
  { country: 'barbados', label: 'Barbados', coordinates: [-59.54, 13.19] },
  { country: 'caymanislands', label: 'Cayman Islands', coordinates: [-81.25, 19.31] },
  { country: 'cyprus', label: 'Cyprus', coordinates: [33.43, 35.13] },
  { country: 'luxembourg', label: 'Luxembourg', coordinates: [6.13, 49.82] },
  { country: 'singapore', label: 'Singapore', coordinates: [103.82, 1.35] },
];

const worldTopology = worldAtlas as unknown as Topology<{ countries: GeometryCollection<CountryProperties> }>;
const countryFeatures = (feature(worldTopology, worldTopology.objects.countries) as FeatureCollection<Geometry, CountryProperties>).features;
const sphere = { type: 'Sphere' } as const;
const graticule = geoGraticule10();

const normalizeCountry = (value: string | number) => {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/unitedstatesofamerica/g, 'unitedstates');

  // Treat numeric ISO identifiers with and without leading zeroes as equal.
  return /^\d+$/.test(normalized) ? String(Number(normalized)) : normalized;
};

const getBaseScale = (width: number, height: number) => Math.min(width, height) * 0.455;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const invertProjection = (projection: GeoProjection, point: [number, number]) => projection.invert?.(point) ?? null;

const getCountryState = (country: CountryFeature, highlighted: Set<string>, candidates: Set<string>) => {
  const id = normalizeCountry(country.id ?? '');
  const name = normalizeCountry(country.properties?.name ?? '');
  return {
    active: highlighted.has(id) || highlighted.has(name),
    candidate: candidates.has(id) || candidates.has(name),
  };
};

const toSvgPoint = (svg: SVGSVGElement, clientX: number, clientY: number): [number, number] => {
  const bounds = svg.getBoundingClientRect();
  return [((clientX - bounds.left) / bounds.width) * svg.viewBox.baseVal.width, ((clientY - bounds.top) / bounds.height) * svg.viewBox.baseVal.height];
};

const pointerDistance = (pointers: Map<number, [number, number]>) => {
  const [first, second] = [...pointers.values()];
  return Math.hypot(second[0] - first[0], second[1] - first[1]);
};

export const WorldMap = React.memo(function WorldMap({
  width,
  height,
  highlightedCountries = EMPTY_HIGHLIGHTS,
  highlightedIds = EMPTY_HIGHLIGHTS,
  candidateCountries = EMPTY_HIGHLIGHTS,
  defaultFill = 'var(--gray-125)',
  candidateFill = 'var(--gray-300)',
  highlightFill = 'var(--haven-green)',
  dotRadius = 3,
  highlightedDotRadius = 4.5,
}: WorldMapProps) {
  const titleId = `world-map-title-${useId()}`;
  const descriptionId = `world-map-description-${useId()}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const pointersRef = useRef(new Map<number, [number, number]>());
  const dragRef = useRef<DragGesture | null>(null);
  const pinchRef = useRef<PinchGesture | null>(null);
  const zoomRef = useRef(1);
  const dimensionsRef = useRef<[number, number]>([width, height]);
  const projectionRef = useRef<GeoProjection | null>(null);
  const [, redraw] = useReducer((revision: number) => revision + 1, 0);
  const [isDragging, setIsDragging] = useState(false);

  if (!projectionRef.current) {
    projectionRef.current = geoOrthographic()
      .translate([width / 2, height / 2])
      .scale(getBaseScale(width, height))
      .rotate(INITIAL_ROTATION)
      .clipAngle(90)
      .precision(0.25);
  } else if (dimensionsRef.current[0] !== width || dimensionsRef.current[1] !== height) {
    dimensionsRef.current = [width, height];
    projectionRef.current.translate([width / 2, height / 2]).scale(getBaseScale(width, height) * zoomRef.current);
  }

  const projection = projectionRef.current;
  const path = geoPath(projection);
  const highlighted = useMemo(() => new Set([...highlightedCountries, ...highlightedIds].map(normalizeCountry)), [highlightedCountries, highlightedIds]);
  const candidates = useMemo(() => new Set(candidateCountries.map(normalizeCountry)), [candidateCountries]);
  const highlightedLabel = [...highlightedCountries, ...highlightedIds].map(String).join(', ');

  const beginDrag = (pointerId: number, clientPoint: [number, number]) => {
    const svg = svgRef.current;
    if (!svg) return;
    const location = invertProjection(projection, toSvgPoint(svg, clientPoint[0], clientPoint[1]));
    if (!location || !location.every(Number.isFinite)) return;
    const startRotation = projection.rotate() as Rotation;
    dragRef.current = {
      pointerId,
      startVector: versor.cartesian(location) as Cartesian,
      startQuaternion: versor(startRotation) as Quaternion,
      startRotation,
    };
  };

  const resetView = () => {
    zoomRef.current = 1;
    projection.rotate(INITIAL_ROTATION).scale(getBaseScale(width, height));
    redraw();
  };

  const endPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    pointersRef.current.delete(event.pointerId);
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    pinchRef.current = null;
    dragRef.current = null;

    const remainingPointer = pointersRef.current.entries().next().value as [number, [number, number]] | undefined;
    if (remainingPointer) {
      beginDrag(remainingPointer[0], remainingPointer[1]);
    } else {
      setIsDragging(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    const rotation = projection.rotate() as Rotation;
    const rotationStep = event.shiftKey ? 18 : 7;
    let nextRotation: Rotation | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        nextRotation = [rotation[0] - rotationStep, rotation[1], rotation[2]];
        break;
      case 'ArrowRight':
        nextRotation = [rotation[0] + rotationStep, rotation[1], rotation[2]];
        break;
      case 'ArrowUp':
        nextRotation = [rotation[0], clamp(rotation[1] - rotationStep, -90, 90), rotation[2]];
        break;
      case 'ArrowDown':
        nextRotation = [rotation[0], clamp(rotation[1] + rotationStep, -90, 90), rotation[2]];
        break;
      case '+':
      case '=':
        zoomRef.current = clamp(zoomRef.current * 1.15, MIN_ZOOM, MAX_ZOOM);
        projection.scale(getBaseScale(width, height) * zoomRef.current);
        break;
      case '-':
      case '_':
        zoomRef.current = clamp(zoomRef.current / 1.15, MIN_ZOOM, MAX_ZOOM);
        projection.scale(getBaseScale(width, height) * zoomRef.current);
        break;
      case 'Home':
        resetView();
        event.preventDefault();
        return;
      default:
        return;
    }

    if (nextRotation) projection.rotate(nextRotation);
    event.preventDefault();
    redraw();
  };

  const globeCenter = invertProjection(projection, [width / 2, height / 2]) ?? [0, 0];

  return (
    <div className={styles.mapShell}>
      <svg
        ref={svgRef}
        className={`${styles.map} ${isDragging ? styles.dragging : ''}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        tabIndex={0}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        onDoubleClick={resetView}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointersRef.current.set(event.pointerId, [event.clientX, event.clientY]);
          setIsDragging(true);

          if (pointersRef.current.size === 1) {
            beginDrag(event.pointerId, [event.clientX, event.clientY]);
          } else if (pointersRef.current.size === 2) {
            dragRef.current = null;
            pinchRef.current = {
              startDistance: pointerDistance(pointersRef.current),
              startScale: projection.scale(),
            };
          }
        }}
        onPointerMove={(event) => {
          if (!pointersRef.current.has(event.pointerId)) return;
          pointersRef.current.set(event.pointerId, [event.clientX, event.clientY]);

          if (pointersRef.current.size === 2 && pinchRef.current) {
            const nextScale = clamp(
              pinchRef.current.startScale * (pointerDistance(pointersRef.current) / pinchRef.current.startDistance),
              getBaseScale(width, height) * MIN_ZOOM,
              getBaseScale(width, height) * MAX_ZOOM,
            );
            projection.scale(nextScale);
            zoomRef.current = nextScale / getBaseScale(width, height);
            redraw();
            return;
          }

          const drag = dragRef.current;
          const svg = svgRef.current;
          if (!drag || !svg || drag.pointerId !== event.pointerId) return;
          projection.rotate(drag.startRotation);
          const location = invertProjection(projection, toSvgPoint(svg, event.clientX, event.clientY));
          if (!location || !location.every(Number.isFinite)) return;

          const currentVector = versor.cartesian(location) as Cartesian;
          const delta = versor.delta(drag.startVector, currentVector) as Quaternion;
          const nextQuaternion = versor.multiply(drag.startQuaternion, delta) as Quaternion;
          projection.rotate(versor.rotation(nextQuaternion) as Rotation);
          redraw();

          // Quaternion rotation becomes unstable close to the antipode; restart
          // the gesture before the cursor reaches that region.
          if (delta[0] < 0.7) beginDrag(event.pointerId, [event.clientX, event.clientY]);
        }}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={(event) => {
          event.preventDefault();
          zoomRef.current = clamp(zoomRef.current * Math.exp(-event.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM);
          projection.scale(getBaseScale(width, height) * zoomRef.current);
          redraw();
        }}
      >
        <title id={titleId}>Interactive world map</title>
        <desc id={descriptionId}>
          Drag to rotate and scroll or pinch to zoom. Use the arrow keys to rotate, plus and minus to zoom, and Home to reset.
          {highlightedLabel ? ` Highlighted countries: ${highlightedLabel}.` : ''}
        </desc>
        <path className={styles.sphere} d={path(sphere) ?? undefined} />
        <path className={styles.graticule} d={path(graticule) ?? undefined} />
        {countryFeatures.map((country) => {
          const { active, candidate } = getCountryState(country, highlighted, candidates);
          const name = country.properties?.name ?? 'Country';
          return (
            <path
              key={String(country.id ?? name)}
              className={styles.country}
              d={path(country) ?? undefined}
              fill={active ? highlightFill : candidate ? candidateFill : defaultFill}
            >
              <title>{name}</title>
            </path>
          );
        })}
        {SMALL_COUNTRY_MARKERS.map((marker) => {
          const active = highlighted.has(marker.country);
          const candidate = candidates.has(marker.country);
          if (!active && !candidate) return null;
          const coordinates = projection(marker.coordinates);
          const visible = coordinates && geoDistance(globeCenter, marker.coordinates) < Math.PI / 2;
          if (!coordinates || !visible) return null;
          return (
            <circle
              key={marker.country}
              className={styles.marker}
              cx={coordinates[0]}
              cy={coordinates[1]}
              r={active ? highlightedDotRadius : dotRadius}
              fill={active ? highlightFill : candidateFill}
            >
              <title>{marker.label}</title>
            </circle>
          );
        })}
      </svg>
      <div className={styles.mapHint} aria-hidden="true">Drag to rotate · Scroll to zoom</div>
      <button type="button" className={styles.resetButton} onClick={resetView} aria-label="Reset globe view">
        Reset view
      </button>
    </div>
  );
});
