import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ColumnMapping } from '../types';
import { importCSV } from '../services/importService';

type Props = NativeStackScreenProps<RootStackParamList, 'ColumnMapper'>;

const ColumnMapperScreen: React.FC<Props> = ({ route, navigation }) => {
  const { csvContent, filename, detectedMapping } = route.params;

  const [dateColumn, setDateColumn] = useState(detectedMapping.suggestedMapping?.dateColumn || '');
  const [descriptionColumn, setDescriptionColumn] = useState(detectedMapping.suggestedMapping?.descriptionColumn || '');
  const [useAmountColumn, setUseAmountColumn] = useState(true);
  const [amountColumn, setAmountColumn] = useState(detectedMapping.suggestedMapping?.amountColumn || '');
  const [debitColumn, setDebitColumn] = useState(detectedMapping.suggestedMapping?.debitColumn || '');
  const [creditColumn, setCreditColumn] = useState(detectedMapping.suggestedMapping?.creditColumn || '');
  const [loading, setLoading] = useState(false);

  const headers = detectedMapping.headers;

  const handleImport = async () => {
    if (!dateColumn || !descriptionColumn) {
      Alert.alert('Error', 'Please select date and description columns');
      return;
    }

    if (useAmountColumn && !amountColumn) {
      Alert.alert('Error', 'Please select amount column');
      return;
    }

    if (!useAmountColumn && (!debitColumn || !creditColumn)) {
      Alert.alert('Error', 'Please select both debit and credit columns');
      return;
    }

    const mapping: ColumnMapping = {
      dateColumn,
      descriptionColumn,
      amountColumn: useAmountColumn ? amountColumn : undefined,
      debitColumn: useAmountColumn ? undefined : debitColumn,
      creditColumn: useAmountColumn ? undefined : creditColumn,
    };

    setLoading(true);
    try {
      const result = await importCSV(csvContent, filename, mapping);

      if (result.success) {
        Alert.alert('Success', result.message);
        navigation.navigate('MainTabs');
      } else {
        Alert.alert('Import Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map CSV Columns</Text>
          <Text style={styles.headerSubtitle}>
            We couldn't auto-detect your CSV format. Please map the columns manually.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date Column *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dateColumn}
              onValueChange={(value) => setDateColumn(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select column..." value="" />
              {headers.map(header => (
                <Picker.Item key={header} label={header} value={header} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description Column *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={descriptionColumn}
              onValueChange={(value) => setDescriptionColumn(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select column..." value="" />
              {headers.map(header => (
                <Picker.Item key={header} label={header} value={header} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount Columns</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, useAmountColumn && styles.toggleButtonActive]}
              onPress={() => setUseAmountColumn(true)}
            >
              <Text style={[styles.toggleButtonText, useAmountColumn && styles.toggleButtonTextActive]}>
                Single Amount Column
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !useAmountColumn && styles.toggleButtonActive]}
              onPress={() => setUseAmountColumn(false)}
            >
              <Text style={[styles.toggleButtonText, !useAmountColumn && styles.toggleButtonTextActive]}>
                Debit + Credit Columns
              </Text>
            </TouchableOpacity>
          </View>

          {useAmountColumn ? (
            <View style={styles.section}>
              <Text style={styles.label}>Amount Column *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={amountColumn}
                  onValueChange={(value) => setAmountColumn(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select column..." value="" />
                  {headers.map(header => (
                    <Picker.Item key={header} label={header} value={header} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Debit Column *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={debitColumn}
                    onValueChange={(value) => setDebitColumn(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select column..." value="" />
                    {headers.map(header => (
                      <Picker.Item key={header} label={header} value={header} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Credit Column *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={creditColumn}
                    onValueChange={(value) => setCreditColumn(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select column..." value="" />
                    {headers.map(header => (
                      <Picker.Item key={header} label={header} value={header} />
                    ))}
                  </Picker>
                </View>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImport}
          disabled={loading}
        >
          <Text style={styles.importButtonText}>
            {loading ? 'Importing...' : 'Import CSV'}
          </Text>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ColumnMapperScreen;
