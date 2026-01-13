import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { resetAllData, setSetting } from '../database';
import { restorePurchases, isPurchased } from '../services/iap';

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const isPurch = await isPurchased();
    setPurchased(isPurch);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all transactions, imports, and categorization rules. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert('Success', 'All data has been reset');
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const handleResetWalkthrough = async () => {
    await setSetting('onboarding_complete', 'false');
    Alert.alert('Success', 'Walkthrough will show on next app launch');
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      Alert.alert(result.success ? 'Success' : 'No Purchases', result.message);
      if (result.success) {
        setPurchased(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {purchased ? '✅ Full Access Unlocked' : '🆓 Free Plan (100 transactions)'}
            </Text>
          </View>

          {!purchased && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleRestorePurchases}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <TouchableOpacity style={styles.button} onPress={handleResetWalkthrough}>
            <Text style={styles.buttonText}>Show Walkthrough Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleResetData}
          >
            <Text style={[styles.buttonText, styles.dangerButtonText]}>
              Reset All Data
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>Know Your Numbers</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Privacy</Text>
            <Text style={styles.infoValue}>
              All data is stored locally on your device. No servers, no tracking.
            </Text>
          </View>
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
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoCard: {
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
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FF3B30',
  },
});

export default SettingsScreen;
