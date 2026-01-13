import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Labor', include_in_overhead: true },
  { name: 'Subcontractors', include_in_overhead: true },
  { name: 'Materials & Supplies', include_in_overhead: true },
  { name: 'Fuel & Vehicle', include_in_overhead: true },
  { name: 'Equipment & Repairs', include_in_overhead: true },
  { name: 'Rent/Facility/Utilities', include_in_overhead: true },
  { name: 'Insurance', include_in_overhead: true },
  { name: 'Marketing & Sales', include_in_overhead: true },
  { name: 'Office/Admin', include_in_overhead: true },
  { name: 'Software & Subscriptions', include_in_overhead: true },
  { name: 'Fees & Interest', include_in_overhead: true },
  { name: 'Taxes & Licenses', include_in_overhead: true },
  { name: 'Meals & Travel', include_in_overhead: true },
  { name: 'Other', include_in_overhead: true },
  { name: 'Excluded', include_in_overhead: false },
];
