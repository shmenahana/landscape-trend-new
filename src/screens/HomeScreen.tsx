import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getTransactionCount, getSetting, setSetting } from '../database';
import { importCSV } from '../services/importService';
import { calculateOverhead } from '../services/overhead';
import { PeriodMode } from '../types';
import { purchaseUnlock, isPurchased, getProducts } from '../services/iap';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('rolling');
  const [overheadAnnual, setOverheadAnnual] = useState(0);
  const [overheadMonthly, setOverheadMonthly] = useState(0);
  const [purchased, setPurchased] = useState(false);

  const loadData = async () => {
    const count = await getTransactionCount();
    setTransactionCount(count);

    const mode = (await getSetting('period_mode')) as PeriodMode || 'rolling';
    setPeriodMode(mode);

    const isPurch = await isPurchased();
    setPurchased(isPurch);

    if (count > 0) {
      const overhead = await calculateOverhead(mode);
      if (overhead) {
        setOverheadAnnual(overhead.total);
        setOverheadMonthly(overhead.total / 12);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const togglePeriodMode = async () => {
    const newMode: PeriodMode = periodMode === 'rolling' ? 'calendar' : 'rolling';
    setPeriodMode(newMode);
    await setSetting('period_mode', newMode);
    loadData();
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setLoading(true);

      const content = await FileSystem.readAsStringAsync(file.uri);
      const importResult = await importCSV(content, file.name);

      if (importResult.needsColumnMapping && importResult.detectedMapping) {
        navigation.navigate('ColumnMapper', {
          csvContent: content,
          filename: file.name,
          detectedMapping: importResult.detectedMapping,
        });
      } else if (importResult.success) {
        Alert.alert('Success', importResult.message);
        await loadData();

        // Check if there are uncategorized transactions
        // Navigate to review if needed (we'll check this in review screen)
        navigation.navigate('Review');
      } else {
        Alert.alert('Import Failed', importResult.message);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to import CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      const result = await purchaseUnlock();
      if (result.success) {
        Alert.alert('Success', result.message);
        setPurchased(true);
      } else {
        Alert.alert('Purchase Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Know Your Numbers</Text>
          <TouchableOpacity
            style={styles.periodToggle}
            onPress={togglePeriodMode}
          >
            <Text style={styles.periodToggleText}>
              {periodMode === 'rolling' ? 'Last 12 Months' : 'Last Calendar Year'}
            </Text>
          </TouchableOpacity>
        </View>

        {!purchased && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitText}>
              Free plan: {transactionCount}/100 transactions
            </Text>
            <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
              <Text style={styles.unlockButtonText}>Unlock Full Access</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryCards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Annual Overhead</Text>
            <Text style={styles.cardValue}>
              ${overheadAnnual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Monthly Overhead</Text>
            <Text style={styles.cardValue}>
              ${overheadMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Transactions</Text>
            <Text style={styles.cardValue}>{transactionCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportCSV}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.importButtonText}>Import CSV</Text>
          )}
        </TouchableOpacity>

        {transactionCount > 0 && (
          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.quickLinkText}>📊 View Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('Calculator')}
            >
              <Text style={styles.quickLinkText}>💰 Calculate Hourly Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkButton}
              onPress={() => navigation.navigate('Review')}
            >
              <Text style={styles.quickLinkText}>✅ Review Categories</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 12,
  },
  periodToggle: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  limitBanner: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  limitText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCards: {
    marginBottom: 24,
  },
  card: {
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
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quickLinks: {
    gap: 12,
  },
  quickLinkButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickLinkText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});

export default HomeScreen;
