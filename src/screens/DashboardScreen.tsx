import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSetting, getAllCategories, updateCategoryIncludeOverhead } from '../database';
import { calculateOverhead, calculateHourlyRate, generateShareableReport } from '../services/overhead';
import { PeriodMode, OverheadSummary, Category } from '../types';

const DashboardScreen: React.FC = () => {
  const [overhead, setOverhead] = useState<OverheadSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('rolling');

  const loadData = async () => {
    const mode = (await getSetting('period_mode')) as PeriodMode || 'rolling';
    setPeriodMode(mode);

    const overheadData = await calculateOverhead(mode);
    setOverhead(overheadData);

    const cats = await getAllCategories();
    setCategories(cats);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const toggleCategoryInclude = async (categoryId: number, currentValue: boolean) => {
    await updateCategoryIncludeOverhead(categoryId, !currentValue);
    await loadData();
  };

  const handleShare = async () => {
    if (!overhead) return;

    const hourlyRate = calculateHourlyRate(overhead.total, {
      employees: 1,
      billableHoursPerEmployeePerYear: 1200,
      desiredProfitPercent: 15,
      includeDirectLaborCost: false,
      laborCostPerHour: 0,
    });

    const report = generateShareableReport(
      overhead,
      hourlyRate,
      {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      },
      periodMode
    );

    try {
      await Share.share({
        message: report,
        title: 'Know Your Numbers Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  if (!overhead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Import transactions to see your overhead dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedCategories = Object.entries(overhead.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Overhead Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {periodMode === 'rolling' ? 'Last 12 Months (Rolling)' : 'Last Calendar Year'}
          </Text>
          {overhead.coverageMonths < 12 && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠️ Your data covers {overhead.coverageMonths} months
              </Text>
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Annual Overhead</Text>
          <Text style={styles.summaryValue}>
            ${overhead.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.summaryMeta}>
            ${(overhead.total / 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {sortedCategories.map(([categoryName, amount]) => {
            const category = categories.find(c => c.name === categoryName);
            const percentage = overhead.total > 0 ? (amount / overhead.total) * 100 : 0;

            return (
              <View key={categoryName} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{categoryName}</Text>
                  <View style={styles.categoryMeta}>
                    <Text style={styles.categoryAmount}>
                      ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.categoryPercentage}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                {category && (
                  <View style={styles.categoryToggle}>
                    <Switch
                      value={category.include_in_overhead}
                      onValueChange={() => toggleCategoryInclude(category.id!, category.include_in_overhead)}
                      trackColor={{ false: '#ccc', true: '#007AFF' }}
                    />
                    <Text style={styles.toggleLabel}>
                      {category.include_in_overhead ? 'Included' : 'Excluded'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryInfo: {
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
