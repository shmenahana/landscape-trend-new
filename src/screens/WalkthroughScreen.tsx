import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { setSetting } from '../database';
import { importCSV } from '../services/importService';
import * as FileSystem from 'expo-file-system';

type WalkthroughScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Walkthrough'>;
};

const { width } = Dimensions.get('window');

const WalkthroughScreen: React.FC<WalkthroughScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: 'Import Your Bank CSV',
      description:
        'Import one or more CSV files from any bank. We\'ll parse and normalize your transactions automatically.',
      icon: '📄',
    },
    {
      title: 'Confirm Categories',
      description:
        'Review merchants we couldn\'t categorize automatically. Set rules that apply to all similar charges.',
      icon: '✅',
    },
    {
      title: 'Know Your Numbers',
      description:
        'See your overhead breakdown and calculate the hourly rate you should charge to be profitable.',
      icon: '💰',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeWalkthrough();
    }
  };

  const handleSkip = () => {
    completeWalkthrough();
  };

  const completeWalkthrough = async () => {
    await setSetting('onboarding_complete', 'true');
    navigation.replace('MainTabs');
  };

  const handleTrySampleData = async () => {
    setLoading(true);
    try {
      // Load sample CSV from assets
      const assetPath = require('../../assets/sample-data/sample-transactions.csv');
      const response = await fetch(assetPath);
      const content = await response.text();

      // Import the sample data
      const result = await importCSV(content, 'sample-transactions.csv');

      if (result.success) {
        await setSetting('onboarding_complete', 'true');
        navigation.replace('MainTabs');
      } else {
        alert('Failed to load sample data: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert('Failed to load sample data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.stepContainer}>
          <Text style={styles.icon}>{currentStep.icon}</Text>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>
        </View>

        <View style={styles.pagination}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === step && styles.activeDot]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {step < steps.length - 1 ? (
            <>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.sampleButton}
                onPress={handleTrySampleData}
                disabled={loading}
              >
                <Text style={styles.sampleButtonText}>
                  {loading ? 'Loading...' : 'Try with Sample Data'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={completeWalkthrough}
              >
                <Text style={styles.getStartedButtonText}>Get Started</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  buttons: {
    gap: 12,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sampleButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sampleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default WalkthroughScreen;
