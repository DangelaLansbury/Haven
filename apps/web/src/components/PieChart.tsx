import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import { BlendingResult, CountryNames, Countries } from '../types';
import { matchToCountryEnum } from '../utils';
import explorerStyles from '../css/Explorer.module.css';

type CountrySlice = {
  key: string; // Enum key
  name: string; // Display name
  percent: number; // % of income
  taxRate: number; // Rate (e.g. 0.125)
  color: string; // Fill color
};

interface Props {
  blend: BlendingResult;
  size?: number; // Optional, default = 500
}

export const RadialTaxBlendChart: React.FC<Props> = ({ blend, size = 400 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const isActive = (key: string) => blend.blendComposition[matchToCountryEnum(key)];
  const isZeroRate = (key: string) => Countries[key as CountryNames].rate < 0.01;

  useEffect(() => {
    if (!blend) return;

    const data = Object.entries(Countries).map(([key]) => {
      const country = Countries[key as CountryNames];
      return {
        key,
        name: country.name,
        percent: blend.blendComposition[key] || 0,
        taxRate: country.rate,
        color: isActive(key) ? 'var(--haven-green)' : 'var(--gray-200)',
      };
    });

    const radius = size / 2;
    const innerRadius = radius * 0.4;

    const outerRadius = radius * 0.9;
    const taxRateScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.taxRate)!]) // e.g. [0, 0.30]
      .range([innerRadius, outerRadius]);

    const svg = d3.select(ref.current).attr('width', size).attr('height', size).attr('viewBox', `0 0 ${size} ${size}`).style('font-family', 'sans-serif');

    svg.selectAll('*').remove(); // Clear previous render

    const defs = svg.append('defs');
    defs
      .append('pattern')
      .attr('id', 'stripes')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4)
      .append('path')
      .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
      .attr('stroke', 'var(--gray-200)')
      .attr('stroke-width', 2);

    defs
      .append('pattern')
      .attr('id', 'stripes-active')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4)
      .append('path')
      .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
      .attr('stroke', 'var(--haven-green)')
      .attr('stroke-width', 2);

    const pie = d3
      .pie<CountrySlice>()
      .value(() => 1)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<CountrySlice>>()
      .innerRadius(innerRadius)
      .outerRadius((d) => (d.data.taxRate > 0.01 ? taxRateScale(d.data.taxRate) : radius * 0.475));

    const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

    const arcs = g
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr(
        'fill',
        (d) =>
          d.data.taxRate > 0.01
            ? d.data.color // Use the slice's color if taxRate > 0.01
            : isActive(d.data.key) // Check if the slice is active
            ? 'url(#stripes-active)' // Use the active pattern
            : 'url(#stripes)' // Use the default pattern
      )
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', function (_, d) {
        d3.select(this).attr('stroke-width', 3);
        tooltip.style('display', 'block').html(`
            <strong>${matchToCountryEnum(d.data.name)}</strong><br>
            ${Math.round(d.data.percent * 100)}% of income<br>
            ${Math.round(d.data.taxRate * 1000) / 10}% tax rate
          `);
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-width', 1);
        tooltip.style('display', 'none');
      });

    // Tooltip div
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '6px 10px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('display', 'none')
      .style('font-size', '12px')
      .style('z-index', '1000');
  }, [blend, size]);

  return <svg ref={ref}></svg>;
};
