import * as IAP from 'react-native-iap';
import { setSetting, getSetting } from '../database';

// Product ID for the one-time unlock
// You'll need to configure these in App Store Connect and Google Play Console
export const UNLOCK_PRODUCT_ID = 'com.knowyournumbers.unlock';

// Price options (can be configured)
export const PRICE_OPTIONS = {
  tier1: 'com.knowyournumbers.unlock.499', // $4.99
  tier2: 'com.knowyournumbers.unlock.999', // $9.99
};

let iapInitialized = false;

export const initIAP = async (): Promise<boolean> => {
  try {
    await IAP.initConnection();
    iapInitialized = true;
    return true;
  } catch (error) {
    console.error('IAP initialization error:', error);
    return false;
  }
};

export const endIAP = async (): Promise<void> => {
  try {
    await IAP.endConnection();
    iapInitialized = false;
  } catch (error) {
    console.error('IAP end connection error:', error);
  }
};

export const getProducts = async (): Promise<IAP.Product[]> => {
  if (!iapInitialized) {
    await initIAP();
  }

  try {
    const products = await IAP.getProducts({ skus: [UNLOCK_PRODUCT_ID] });
    return products;
  } catch (error) {
    console.error('Get products error:', error);
    return [];
  }
};

export const purchaseUnlock = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!iapInitialized) {
    await initIAP();
  }

  try {
    const purchase = await IAP.requestPurchase({ sku: UNLOCK_PRODUCT_ID });

    if (purchase) {
      // Verify purchase (in production, you'd verify with your backend)
      await finalizePurchase(purchase);

      return {
        success: true,
        message: 'Purchase successful! Full access unlocked.',
      };
    }

    return {
      success: false,
      message: 'Purchase was cancelled or failed.',
    };
  } catch (error: any) {
    console.error('Purchase error:', error);

    // Handle user cancellation
    if (error.code === 'E_USER_CANCELLED') {
      return {
        success: false,
        message: 'Purchase cancelled.',
      };
    }

    return {
      success: false,
      message: `Purchase failed: ${error.message || 'Unknown error'}`,
    };
  }
};

export const finalizePurchase = async (
  purchase: IAP.ProductPurchase | IAP.PurchaseResult
): Promise<void> => {
  try {
    // Mark as unlocked in local database
    await setSetting('purchase_unlocked', 'true');

    // Finish the transaction
    if ('purchaseToken' in purchase) {
      await IAP.finishTransaction({ purchase });
    }
  } catch (error) {
    console.error('Finalize purchase error:', error);
  }
};

export const restorePurchases = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!iapInitialized) {
    await initIAP();
  }

  try {
    const purchases = await IAP.getAvailablePurchases();

    const hasUnlock = purchases.some(
      p => p.productId === UNLOCK_PRODUCT_ID
    );

    if (hasUnlock) {
      await setSetting('purchase_unlocked', 'true');
      return {
        success: true,
        message: 'Purchases restored! Full access unlocked.',
      };
    }

    return {
      success: false,
      message: 'No previous purchases found.',
    };
  } catch (error: any) {
    console.error('Restore purchases error:', error);
    return {
      success: false,
      message: `Restore failed: ${error.message || 'Unknown error'}`,
    };
  }
};

export const isPurchased = async (): Promise<boolean> => {
  const value = await getSetting('purchase_unlocked');
  return value === 'true';
};

export const checkPurchaseStatus = async (): Promise<void> => {
  // Check on app start if user has previously purchased
  try {
    const purchases = await IAP.getAvailablePurchases();
    const hasUnlock = purchases.some(p => p.productId === UNLOCK_PRODUCT_ID);

    if (hasUnlock) {
      await setSetting('purchase_unlocked', 'true');
    }
  } catch (error) {
    console.error('Check purchase status error:', error);
  }
};
