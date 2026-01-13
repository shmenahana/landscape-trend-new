import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllTransactions, getAllCategories } from '../database';
import { getUncategorizedMerchants, applyCategoryToMerchant } from '../services/categorization';
import { Category } from '../types';

const ReviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [uncategorized, setUncategorized] = useState<
    Array<{
      merchant_norm: string;
      count: number;
      total_amount: number;
      transaction_ids: number[];
      confidence: string;
    }>
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const transactions = await getAllTransactions();
    const uncat = await getUncategorizedMerchants(
      transactions.map(t => ({
        id: t.id!,
        merchant_norm: t.merchant_norm,
        amount_signed: t.amount_signed,
      }))
    );
    setUncategorized(uncat);

    const cats = await getAllCategories();
    setCategories(cats);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSelectMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    setShowCategoryModal(true);
  };

  const handleSelectCategory = async (category: Category) => {
    if (!selectedMerchant) return;

    setLoading(true);
    try {
      await applyCategoryToMerchant(
        selectedMerchant.merchant_norm,
        category.id!,
        selectedMerchant.transaction_ids
      );

      Alert.alert('Success', `Categorized "${selectedMerchant.merchant_norm}" as ${category.name}`);
      setShowCategoryModal(false);
      setSelectedMerchant(null);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to categorize merchant');
    } finally {
      setLoading(false);
    }
  };

  if (uncategorized.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Set!</Text>
          <Text style={styles.emptyText}>
            All transactions have been categorized.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Transactions</Text>
        <Text style={styles.headerSubtitle}>
          {uncategorized.length} merchant{uncategorized.length !== 1 ? 's' : ''} need review
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {uncategorized.map((merchant, index) => (
          <TouchableOpacity
            key={index}
            style={styles.merchantCard}
            onPress={() => handleSelectMerchant(merchant)}
          >
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.merchant_norm}</Text>
              <Text style={styles.merchantMeta}>
                {merchant.count} transaction{merchant.count !== 1 ? 's' : ''} •{' '}
                ${Math.abs(merchant.total_amount).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedMerchant && (
              <View style={styles.merchantPreview}>
                <Text style={styles.merchantPreviewText}>
                  {selectedMerchant.merchant_norm}
                </Text>
                <Text style={styles.merchantPreviewMeta}>
                  Apply to all {selectedMerchant.count} matching transaction{selectedMerchant.count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            <ScrollView style={styles.categoryList}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleSelectCategory(category)}
                  disabled={loading}
                >
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {!category.include_in_overhead && (
                    <Text style={styles.excludedBadge}>Excluded</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  merchantCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  merchantMeta: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 12,
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  merchantPreview: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  merchantPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  merchantPreviewMeta: {
    fontSize: 14,
    color: '#666',
  },
  categoryList: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  excludedBadge: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ReviewScreen;
