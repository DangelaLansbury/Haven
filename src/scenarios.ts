import { DEFAULT_FTC_BLEND_CONSTRAINTS, OptimizationScenario, type FtcBlendConstraints, type JurisdictionSection, type OptimizationResult } from './types';

export const SCENARIOS = Object.values(OptimizationScenario);

export const SCENARIO_LABELS: Record<OptimizationScenario, { label: string; chartLabel: string }> = {
  [OptimizationScenario.economicFootprint]: { label: 'Economic footprint', chartLabel: 'Footprint' },
  [OptimizationScenario.illustrativeFunnel]: { label: 'Illustrative funnel', chartLabel: 'Funnel' },
  [OptimizationScenario.ftcCrossCredit]: { label: 'FTC cross-crediting', chartLabel: 'FTC target' },
  [OptimizationScenario.usOnly]: { label: 'Tax at U.S. rate', chartLabel: 'U.S. rate' },
};

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

export function describeScenario(
  result: OptimizationResult,
  sections: JurisdictionSection[],
  constraints: FtcBlendConstraints = DEFAULT_FTC_BLEND_CONSTRAINTS,
): string {
  switch (result.scenario) {
    case OptimizationScenario.economicFootprint:
      return `Profit follows sales: ${percent.format(result.domesticShare)} is earned from U.S. customers and taxed in the U.S.; the rest stays in the markets that generated it.`;
    case OptimizationScenario.illustrativeFunnel: {
      const foreignShare = 1 - result.domesticShare;
      const shares = new Map(result.allocations.map(({ country, share }) => [country, share]));
      const sectionShare = (id: JurisdictionSection['id']) =>
        percent.format(foreignShare > 0 ? (sections.find((section) => section.id === id)?.countries ?? []).reduce((sum, country) => sum + (shares.get(country) ?? 0), 0) / foreignShare : 0);
      return `Of foreign profit, ${sectionShare('operations')} remains in operating markets, ${sectionShare('hubs')} is booked in regional hubs, and ${sectionShare('low-tax')} reaches the illustrative low-tax endpoint.`;
    }
    case OptimizationScenario.ftcCrossCredit:
      return `Targets a ${percent.format(result.targetRate ?? result.taxBreakdown.noTopUpForeignRate)} blended foreign rate while retaining at least ${percent.format(constraints.minimumOperationsShare)} of foreign profit in operations and capping the low-tax endpoint at ${percent.format(constraints.maximumLowTaxShare)} and any hub at ${percent.format(constraints.maximumSingleHubShare)}.`;
    case OptimizationScenario.usOnly:
      return 'Places all modeled profit in the United States for comparison.';
  }
}
