// Seed keyword mappings for automatic categorization
// Format: [pattern, category_name, match_type]
export const SEED_MAPPINGS: Array<[string, string, 'contains' | 'exact' | 'regex']> = [
  // Excluded (transfers, payments, owner draws, refunds)
  ['transfer', 'Excluded', 'contains'],
  ['internal transfer', 'Excluded', 'contains'],
  ['to savings', 'Excluded', 'contains'],
  ['from savings', 'Excluded', 'contains'],
  ['payment thank you', 'Excluded', 'contains'],
  ['cc payment', 'Excluded', 'contains'],
  ['credit card payment', 'Excluded', 'contains'],
  ['owner draw', 'Excluded', 'contains'],
  ['distribution', 'Excluded', 'contains'],
  ['loan payment', 'Excluded', 'contains'],
  ['principal payment', 'Excluded', 'contains'],
  ['refund', 'Excluded', 'contains'],
  ['reversal', 'Excluded', 'contains'],
  ['deposit', 'Excluded', 'contains'],

  // Fuel & Vehicle
  ['shell', 'Fuel & Vehicle', 'contains'],
  ['chevron', 'Fuel & Vehicle', 'contains'],
  ['exxon', 'Fuel & Vehicle', 'contains'],
  ['mobil', 'Fuel & Vehicle', 'contains'],
  ['bp ', 'Fuel & Vehicle', 'contains'],
  ['arco', 'Fuel & Vehicle', 'contains'],
  ['texaco', 'Fuel & Vehicle', 'contains'],
  ['gas station', 'Fuel & Vehicle', 'contains'],
  ['fuel', 'Fuel & Vehicle', 'contains'],
  ['auto parts', 'Fuel & Vehicle', 'contains'],
  ['autozone', 'Fuel & Vehicle', 'contains'],
  ['napa', 'Fuel & Vehicle', 'contains'],
  ['o\'reilly', 'Fuel & Vehicle', 'contains'],

  // Materials & Supplies
  ['home depot', 'Materials & Supplies', 'contains'],
  ['lowes', 'Materials & Supplies', 'contains'],
  ['lowe\'s', 'Materials & Supplies', 'contains'],
  ['ace hardware', 'Materials & Supplies', 'contains'],
  ['menards', 'Materials & Supplies', 'contains'],
  ['lumber', 'Materials & Supplies', 'contains'],
  ['supply', 'Materials & Supplies', 'contains'],

  // Software & Subscriptions
  ['adobe', 'Software & Subscriptions', 'contains'],
  ['microsoft', 'Software & Subscriptions', 'contains'],
  ['google workspace', 'Software & Subscriptions', 'contains'],
  ['aws', 'Software & Subscriptions', 'contains'],
  ['amazon web services', 'Software & Subscriptions', 'contains'],
  ['dropbox', 'Software & Subscriptions', 'contains'],
  ['zoom', 'Software & Subscriptions', 'contains'],
  ['slack', 'Software & Subscriptions', 'contains'],
  ['quickbooks', 'Software & Subscriptions', 'contains'],
  ['godaddy', 'Software & Subscriptions', 'contains'],
  ['hostgator', 'Software & Subscriptions', 'contains'],

  // Rent/Facility/Utilities
  ['rent', 'Rent/Facility/Utilities', 'contains'],
  ['lease', 'Rent/Facility/Utilities', 'contains'],
  ['electric', 'Rent/Facility/Utilities', 'contains'],
  ['power company', 'Rent/Facility/Utilities', 'contains'],
  ['water', 'Rent/Facility/Utilities', 'contains'],
  ['gas company', 'Rent/Facility/Utilities', 'contains'],
  ['utility', 'Rent/Facility/Utilities', 'contains'],
  ['pge', 'Rent/Facility/Utilities', 'contains'],
  ['pg&e', 'Rent/Facility/Utilities', 'contains'],

  // Insurance
  ['insurance', 'Insurance', 'contains'],
  ['state farm', 'Insurance', 'contains'],
  ['allstate', 'Insurance', 'contains'],
  ['geico', 'Insurance', 'contains'],
  ['progressive', 'Insurance', 'contains'],

  // Office/Admin
  ['staples', 'Office/Admin', 'contains'],
  ['office depot', 'Office/Admin', 'contains'],
  ['fedex', 'Office/Admin', 'contains'],
  ['ups', 'Office/Admin', 'contains'],
  ['usps', 'Office/Admin', 'contains'],
  ['postage', 'Office/Admin', 'contains'],

  // Marketing & Sales
  ['advertising', 'Marketing & Sales', 'contains'],
  ['google ads', 'Marketing & Sales', 'contains'],
  ['facebook ads', 'Marketing & Sales', 'contains'],
  ['meta ads', 'Marketing & Sales', 'contains'],
  ['yelp', 'Marketing & Sales', 'contains'],
  ['marketing', 'Marketing & Sales', 'contains'],

  // Meals & Travel
  ['restaurant', 'Meals & Travel', 'contains'],
  ['hotel', 'Meals & Travel', 'contains'],
  ['airbnb', 'Meals & Travel', 'contains'],
  ['airline', 'Meals & Travel', 'contains'],
  ['uber', 'Meals & Travel', 'contains'],
  ['lyft', 'Meals & Travel', 'contains'],
  ['taxi', 'Meals & Travel', 'contains'],

  // Fees & Interest
  ['bank fee', 'Fees & Interest', 'contains'],
  ['service charge', 'Fees & Interest', 'contains'],
  ['interest charge', 'Fees & Interest', 'contains'],
  ['late fee', 'Fees & Interest', 'contains'],
  ['overdraft', 'Fees & Interest', 'contains'],

  // Taxes & Licenses
  ['irs', 'Taxes & Licenses', 'contains'],
  ['tax', 'Taxes & Licenses', 'contains'],
  ['license', 'Taxes & Licenses', 'contains'],
  ['permit', 'Taxes & Licenses', 'contains'],
];
