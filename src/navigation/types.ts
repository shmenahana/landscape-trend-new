import { ColumnMapping, DetectedMapping } from '../types';

export type RootStackParamList = {
  Walkthrough: undefined;
  MainTabs: undefined;
  Review: undefined;
  ColumnMapper: {
    csvContent: string;
    filename: string;
    detectedMapping: DetectedMapping;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Calculator: undefined;
  Settings: undefined;
};
