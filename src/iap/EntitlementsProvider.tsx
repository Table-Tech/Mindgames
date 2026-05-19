import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getJSON, setJSON } from '@/storage/storage';

// RevenueCat-shaped entitlements provider.
//
// The current implementation persists a local flag so the rest of the app
// can be built end-to-end. To wire RevenueCat for real:
//
//   1. yarn add react-native-purchases
//   2. Set REVENUECAT_API_KEY in EAS / app config (see comment below).
//   3. Replace the four stub bodies below with the real Purchases SDK calls.
//
// The interface intentionally mirrors RevenueCat's CustomerInfo / Purchases
// shape so the swap is a copy-paste:
//
//   await Purchases.configure({ apiKey });
//   const customerInfo = await Purchases.getCustomerInfo();
//   const adsRemoved = !!customerInfo.entitlements.active['no_ads'];
//   const purchase = await Purchases.purchasePackage(pkg);
//   await Purchases.restorePurchases();

const KEY = 'iap.entitlements.v1';
const ENTITLEMENT_ID = 'no_ads';
const PRODUCT_ID = 'remove_ads';

interface EntitlementsContextValue {
  adsRemoved: boolean;
  loading: boolean;
  purchaseRemoveAds: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const Ctx = createContext<EntitlementsContextValue>({
  adsRemoved: false,
  loading: true,
  purchaseRemoveAds: async () => {},
  restorePurchases: async () => {},
});

// Pulled out so the swap to real RevenueCat is a single-file change.
async function configureRevenueCat(): Promise<void> {
  // TODO(revenuecat):
  //   const apiKey = Platform.OS === 'ios'
  //     ? process.env.EXPO_PUBLIC_REVENUECAT_IOS!
  //     : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID!;
  //   await Purchases.configure({ apiKey });
}

async function fetchEntitlements(): Promise<{ adsRemoved: boolean }> {
  // TODO(revenuecat):
  //   const info = await Purchases.getCustomerInfo();
  //   return { adsRemoved: !!info.entitlements.active[ENTITLEMENT_ID] };
  const flag = (await getJSON<boolean>(KEY)) ?? false;
  return { adsRemoved: flag };
}

async function purchaseProduct(): Promise<{ adsRemoved: boolean }> {
  // TODO(revenuecat):
  //   const offerings = await Purchases.getOfferings();
  //   const pkg = offerings.current?.availablePackages.find(p => p.product.identifier === PRODUCT_ID);
  //   if (!pkg) throw new Error('Package not configured');
  //   const { customerInfo } = await Purchases.purchasePackage(pkg);
  //   return { adsRemoved: !!customerInfo.entitlements.active[ENTITLEMENT_ID] };
  await setJSON(KEY, true);
  return { adsRemoved: true };
}

async function restore(): Promise<{ adsRemoved: boolean }> {
  // TODO(revenuecat):
  //   const info = await Purchases.restorePurchases();
  //   return { adsRemoved: !!info.entitlements.active[ENTITLEMENT_ID] };
  const flag = (await getJSON<boolean>(KEY)) ?? false;
  return { adsRemoved: flag };
}

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await configureRevenueCat();
        const e = await fetchEntitlements();
        setAdsRemoved(e.adsRemoved);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const purchaseRemoveAds = useCallback(async () => {
    const e = await purchaseProduct();
    setAdsRemoved(e.adsRemoved);
  }, []);

  const restorePurchases = useCallback(async () => {
    const e = await restore();
    setAdsRemoved(e.adsRemoved);
  }, []);

  return (
    <Ctx.Provider value={{ adsRemoved, loading, purchaseRemoveAds, restorePurchases }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEntitlements() {
  return useContext(Ctx);
}

// Exported so other modules (e.g. analytics) can reference the canonical
// product / entitlement names without typo risk.
export const IAP_IDS = { PRODUCT_ID, ENTITLEMENT_ID };
