import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSetting } from '../database';
import { calculateOverhead, calculateHourlyRate } from '../services/overhead';
import { PeriodMode, HourlyRateInputs } from '../types';

const CalculatorScreen: React.FC = () => {
  const [overhead, setOverhead] = useState(0);
  const [inputs, setInputs] = useState<HourlyRateInputs>({
    employees: 1,
    billableHoursPerEmployeePerYear: 1200,
    desiredProfitPercent: 15,
    includeDirectLaborCost: false,
    laborCostPerHour: 0,
  });

  const loadData = async () => {
    const mode = (await getSetting('period_mode')) as PeriodMode || 'rolling';
    const overheadData = await calculateOverhead(mode);
    if (overheadData) {
      setOverhead(overheadData.total);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const results = calculateHourlyRate(overhead, inputs);

  const updateInput = (key: keyof HourlyRateInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hourly Rate Calculator</Text>
          <Text style={styles.headerSubtitle}>
            Calculate your break-even and target hourly rates
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Annual Overhead</Text>
          <View style={styles.overheadCard}>
            <Text style={styles.overheadValue}>
              ${overhead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inputs</Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Number of Employees</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={inputs.employees.toString()}
              onChangeText={(text) => updateInput('employees', parseInt(text) || 1)}
            />
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Billable Hours per Employee per Year</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={inputs.billableHoursPerEmployeePerYear.toString()}
              onChangeText={(text) => updateInput('billableHoursPerEmployeePerYear', parseInt(text) || 1200)}
            />
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Desired Profit %</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={inputs.desiredProfitPercent.toString()}
              onChangeText={(text) => updateInput('desiredProfitPercent', parseFloat(text) || 15)}
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Include Direct Labor Cost</Text>
              <Text style={styles.toggleSubtext}>Add hourly labor cost to calculations</Text>
            </View>
            <Switch
              value={inputs.includeDirectLaborCost}
              onValueChange={(value) => updateInput('includeDirectLaborCost', value)}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>

          {inputs.includeDirectLaborCost && (
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Labor Cost per Hour</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={inputs.laborCostPerHour.toString()}
                onChangeText={(text) => updateInput('laborCostPerHour', parseFloat(text) || 0)}
                placeholder="0.00"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Overhead per Hour</Text>
            <Text style={styles.resultValue}>
              ${results.overheadPerHour.toFixed(2)}/hr
            </Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Base Rate (Break-even)</Text>
            <Text style={styles.resultValue}>
              ${results.baseRate.toFixed(2)}/hr
            </Text>
            <Text style={styles.resultMeta}>
              This covers overhead{inputs.includeDirectLaborCost ? ' + labor' : ''} with 0% profit
            </Text>
          </View>

          <View style={[styles.resultCard, styles.primaryResult]}>
            <Text style={styles.resultLabel}>Target Rate ({inputs.desiredProfitPercent}% profit)</Text>
            <Text style={[styles.resultValue, styles.primaryValue]}>
              ${results.targetRate.toFixed(2)}/hr
            </Text>
            <Text style={styles.resultMeta}>
              Recommended hourly rate to achieve your profit goal
            </Text>
          </View>

          <View style={styles.quickReference}>
            <Text style={styles.quickReferenceTitle}>Quick Reference</Text>
            <View style={styles.quickReferenceRow}>
              <Text style={styles.quickReferenceLabel}>10% profit:</Text>
              <Text style={styles.quickReferenceValue}>
                ${results.targetRateWith10Percent.toFixed(2)}/hr
              </Text>
            </View>
            <View style={styles.quickReferenceRow}>
              <Text style={styles.quickReferenceLabel}>15% profit:</Text>
              <Text style={styles.quickReferenceValue}>
                ${results.targetRateWith15Percent.toFixed(2)}/hr
              </Text>
            </View>
            <View style={styles.quickReferenceRow}>
              <Text style={styles.quickReferenceLabel}>20% profit:</Text>
              <Text style={styles.quickReferenceValue}>
                ${results.targetRateWith20Percent.toFixed(2)}/hr
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formulaCard}>
          <Text style={styles.formulaTitle}>💡 How it works</Text>
          <Text style={styles.formulaText}>
            Overhead/Hour = Overhead ÷ Total Billable Hours
          </Text>
          <Text style={styles.formulaText}>
            Base Rate = Overhead/Hour{inputs.includeDirectLaborCost ? ' + Labor Cost' : ''}
          </Text>
          <Text style={styles.formulaText}>
            Target Rate = Base Rate ÷ (1 - Profit%)
          </Text>
        </View>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  overheadCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overheadValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  inputCard: {
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
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 18,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  toggleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#666',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryResult: {
    backgroundColor: '#007AFF',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  primaryValue: {
    color: '#fff',
  },
  resultMeta: {
    fontSize: 12,
    color: '#999',
  },
  quickReference: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  quickReferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quickReferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  quickReferenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  quickReferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  formulaCard: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  formulaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  formulaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
});

export default CalculatorScreen;
