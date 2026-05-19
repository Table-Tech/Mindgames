import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getJSON, setJSON } from '@/storage/storage';

// One-time "Remove ads" purchase (~€3). Wire this to:
//   react-native-iap (RevenueCat is a friendlier alternative for cross-store receipts).
// For now we persist a local flag so the UI can be developed end-to-end.

const KEY = 'iap.adsRemoved.v1';

interface EntitlementsContextValue {
  adsRemoved: boolean;
  purchaseRemoveAds: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const EntitlementsContext = createContext<EntitlementsContextValue>({
  adsRemoved: false,
  purchaseRemoveAds: async () => {},
  restorePurchases: async () => {},
});

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [adsRemoved, setAdsRemoved] = useState(false);

  useEffect(() => {
    (async () => {
      const flag = (await getJSON<boolean>(KEY)) ?? false;
      setAdsRemoved(flag);
    })();
  }, []);

  const purchaseRemoveAds = useCallback(async () => {
    // TODO(iap): replace stub with real store flow:
    //   await RNIap.requestPurchase({ sku: 'remove_ads' });
    //   verify receipt server-side or via store SDK, then set flag.
    await setJSON(KEY, true);
    setAdsRemoved(true);
  }, []);

  const restorePurchases = useCallback(async () => {
    // TODO(iap): call RNIap.getAvailablePurchases() and re-apply entitlements.
    const flag = (await getJSON<boolean>(KEY)) ?? false;
    setAdsRemoved(flag);
  }, []);

  return (
    <EntitlementsContext.Provider value={{ adsRemoved, purchaseRemoveAds, restorePurchases }}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementsContext);
}
