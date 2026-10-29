export type PlaceId = 'customers' | 'ireland' | 'netherlands' | 'bermuda';
export type RouteId = 'sales' | 'royalty' | 'offshore';

export const places: Record<PlaceId, { label: string; coordinates: [number, number]; offset: [number, number] }> = {
  customers: { label: 'Customers', coordinates: [12, 41], offset: [14, 23] },
  ireland: { label: 'Ireland', coordinates: [-8, 53], offset: [-16, -16] },
  netherlands: { label: 'Netherlands', coordinates: [5, 52], offset: [17, -14] },
  bermuda: { label: 'Bermuda', coordinates: [-64.75, 32.3], offset: [-15, 24] },
};

export const routes: Record<RouteId, { from: PlaceId; to: PlaceId; label: string }> = {
  sales: { from: 'customers', to: 'ireland', label: 'Customer revenue → Irish operating company' },
  royalty: { from: 'ireland', to: 'netherlands', label: 'Royalty → Dutch intermediary' },
  offshore: { from: 'netherlands', to: 'bermuda', label: 'Onward royalty → Irish-incorporated IP company, managed in Bermuda' },
};

export type StoryStep = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  note: string;
  scene: {
    rotation: [number, number, number];
    countries: string[];
    places: PlaceId[];
    routes: RouteId[];
    label: string;
    amount: string;
    caption: string;
  };
};

// Edit the story here. Each section owns its copy and its corresponding globe state.
// Amounts are invented teaching examples, not reported company results or tax rates.
export const steps: StoryStep[] = [
  {
    id: 'intro',
    kicker: 'A short guide to profit shifting',
    title: 'Follow the profit.',
    paragraphs: [
      'A customer buys something. A company earns money. But where does that profit end up?',
      'Follow the historical “Double Irish with a Dutch Sandwich”: a chain of related companies that moved profits through Ireland and the Netherlands to an offshore destination.',
    ],
    note: 'Scroll to follow the money. Each chapter reveals another part of the route.',
    scene: { rotation: [25, -28, 0], countries: [], places: [], routes: [], label: 'One business. Several jurisdictions.', amount: '€100', caption: 'An imaginary sale. Let’s follow it.' },
  },
  {
    id: 'companies',
    kicker: '01 / The setup',
    title: 'Two Irish companies. Different tax homes.',
    paragraphs: [
      'One Irish company runs the business. Another holds intellectual property rights, such as rights to software or a brand.',
      'Both are incorporated in Ireland. In this historical structure, the IP company is managed from Bermuda and treated as resident there for Irish tax purposes. A Dutch company sits between them in the licensing chain.',
    ],
    note: '“Double Irish” refers to two Irish-incorporated companies, even though their tax residences differed.',
    scene: { rotation: [25, -35, 0], countries: ['372', '528'], places: ['ireland', 'netherlands', 'bermuda'], routes: [], label: 'The companies behind the route', amount: '3', caption: 'Related companies in the licensing chain' },
  },
  {
    id: 'sale',
    kicker: '02 / The sale',
    title: 'Revenue arrives in Ireland.',
    paragraphs: [
      'The Irish operating company collects revenue from customers outside the United States. In our simplified example, it receives €100 and spends €20 running the business.',
      'That leaves €80 before royalties. Next comes the payment for using the group’s intellectual property.',
    ],
    note: 'Illustrative starting point: €100 revenue − €20 operating costs = €80 before royalties.',
    scene: { rotation: [-2, -43, 0], countries: ['372'], places: ['customers', 'ireland'], routes: ['sales'], label: 'Revenue enters the operating company', amount: '€80', caption: 'Profit before royalty payments' },
  },
  {
    id: 'royalty',
    kicker: '03 / The deduction',
    title: 'A royalty shrinks the tax base.',
    paragraphs: [
      'The operating company pays a €75 royalty to the related Dutch company for using the IP. The payment is an expense in this example.',
      'Subtracting that expense leaves €5 of profit in Ireland. The group still has the money, but much less profit is now booked in the operating company.',
    ],
    note: '€80 − €75 = €5. The royalty amount is illustrative; real deductions depend on applicable rules.',
    scene: {
      rotation: [-1, -48, 0],
      countries: ['372', '528'],
      places: ['ireland', 'netherlands'],
      routes: ['royalty'],
      label: 'The Irish tax base becomes smaller',
      amount: '€5',
      caption: 'Profit remaining in the Irish operating company',
    },
  },
  {
    id: 'dutch',
    kicker: '04 / The sandwich',
    title: 'The Netherlands is the middle stop.',
    paragraphs: [
      'The Dutch intermediary receives the royalty and passes most of it to the IP company. Imagine it keeps €1 and sends €74 onward.',
      'Historically, qualifying royalty payments could use this route without withholding tax at these borders. That is the purpose of the Dutch layer in this version of the structure.',
    ],
    note: 'Withholding tax is tax collected on a payment as it leaves a country. It differs from tax on company profits.',
    scene: {
      rotation: [20, -38, 0],
      countries: ['528'],
      places: ['ireland', 'netherlands', 'bermuda'],
      routes: ['royalty', 'offshore'],
      label: 'A royalty passes through the Dutch company',
      amount: '€74',
      caption: 'Sent onward after an illustrative €1 margin',
    },
  },
  {
    id: 'offshore',
    kicker: '05 / The destination',
    title: 'The profit ends up offshore.',
    paragraphs: [
      'The €74 arrives at the Irish-incorporated IP company managed in Bermuda. Under the historical arrangement, the profits could face little or no tax there.',
      'The location of the customers has not changed. The location of the group’s reported profit has.',
      'The total tax remitted to the countries in this example is based on the €5 of profit in Ireland and the €1 of profit in the Netherlands. Bermuda has no corporate tax, so no tax is remitted there, meaning the total tax is €5 + €1 = €6.',
    ],
    note: 'Bermuda marks the IP company’s management and tax-residence location in this historical example, not its place of incorporation.',
    scene: { rotation: [55, -30, 0], countries: [], places: ['netherlands', 'bermuda'], routes: ['offshore'], label: 'The IP company receives the royalty', amount: '€74', caption: 'Profit routed to the offshore IP company' },
  },
  {
    id: 'takeaway',
    kicker: '06 / The bigger picture',
    title: 'The business stays. The profit moves.',
    paragraphs: [
      'Our €80 of profit is now split: €5 in the Irish operating company, €1 in the Dutch intermediary, and €74 in the offshore IP company. Payments within the group changed where the profit was booked.',
      'This illustrates tax base erosion: deductible payments reduce the profit a country can tax. The globe traces royalty payments, not shipments or the movement of workers.',
      'This is a historical explanation. Ireland changed its residence rules from 2015, with a transition for existing companies ending on 31 December 2020.',
    ],
    note: 'A simplified map of one mechanism. Parent-company taxes, IP transfers, and other rules are outside this starter walkthrough.',
    scene: {
      rotation: [25, -32, 0],
      countries: ['372', '528'],
      places: ['customers', 'ireland', 'netherlands', 'bermuda'],
      routes: ['sales', 'royalty', 'offshore'],
      label: 'The complete route',
      amount: '€5 / €1 / €74',
      caption: 'Ireland / Netherlands / offshore IP company',
    },
  },
];
