import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesError,
  PURCHASES_ERROR_CODE,
  CustomerInfoUpdateListener,
} from 'react-native-purchases';
import { getJSON, setJSON } from '@/storage/storage';

// RevenueCat-backed entitlements provider.
//
// API keys live in .env.local as EXPO_PUBLIC_REVENUECAT_ANDROID / _IOS.
// When a key is missing (eg. fresh checkout, dev forgot to copy .env) we
// fall back to a local AsyncStorage flag so the UI keeps working and the
// app doesn't crash. The store roundtrip is gated on a configured key.

const LOCAL_KEY = 'iap.entitlements.v1';
const ENTITLEMENT_ID = 'no_ads';
const PRODUCT_ID = 'remove_ads';

const API_KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID;

const isConfigured = !!API_KEY && API_KEY.length > 0;

interface EntitlementsContextValue {
  adsRemoved: boolean;
  loading: boolean;
  purchasing: boolean;
  restoring: boolean;
  purchaseRemoveAds: () => Promise<{ ok: boolean; cancelled?: boolean; error?: string }>;
  restorePurchases: () => Promise<{ ok: boolean; error?: string }>;
}

const Ctx = createContext<EntitlementsContextValue>({
  adsRemoved: false,
  loading: true,
  purchasing: false,
  restoring: false,
  purchaseRemoveAds: async () => ({ ok: false, error: 'Provider not mounted' }),
  restorePurchases: async () => ({ ok: false, error: 'Provider not mounted' }),
});

async function configureRevenueCat(): Promise<void> {
  if (!isConfigured) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: API_KEY! });
}

async function fetchEntitlements(): Promise<{ adsRemoved: boolean }> {
  if (!isConfigured) {
    const flag = (await getJSON<boolean>(LOCAL_KEY)) ?? false;
    return { adsRemoved: flag };
  }
  const info = await Purchases.getCustomerInfo();
  return { adsRemoved: !!info.entitlements.active[ENTITLEMENT_ID] };
}

async function purchaseProduct(): Promise<{
  ok: boolean;
  adsRemoved: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  if (!isConfigured) {
    // Dev fallback: pretend the purchase succeeded so the UI flow can be
    // exercised end-to-end without a configured RevenueCat key.
    await setJSON(LOCAL_KEY, true);
    return { ok: true, adsRemoved: true };
  }

  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(
    p => p.product.identifier === PRODUCT_ID,
  );
  if (!pkg) {
    return {
      ok: false,
      adsRemoved: false,
      error: 'Product not available. Make sure it is published in the store.',
    };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, adsRemoved: !!customerInfo.entitlements.active[ENTITLEMENT_ID] };
  } catch (e) {
    const err = e as PurchasesError;
    if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { ok: false, adsRemoved: false, cancelled: true };
    }
    return {
      ok: false,
      adsRemoved: false,
      error: err?.message ?? 'Purchase failed',
    };
  }
}

async function restore(): Promise<{ ok: boolean; adsRemoved: boolean; error?: string }> {
  if (!isConfigured) {
    const flag = (await getJSON<boolean>(LOCAL_KEY)) ?? false;
    return { ok: true, adsRemoved: flag };
  }
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, adsRemoved: !!info.entitlements.active[ENTITLEMENT_ID] };
  } catch (e) {
    return {
      ok: false,
      adsRemoved: false,
      error: (e as Error)?.message ?? 'Restore failed',
    };
  }
}

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await configureRevenueCat();
        const e = await fetchEntitlements();
        setAdsRemoved(e.adsRemoved);
      } catch {
        // Swallow on init — fall back to "no entitlement" rather than crash.
      } finally {
        setLoading(false);
      }
    })();

    // Live updates so a successful purchase from another flow propagates.
    if (isConfigured) {
      const listener: CustomerInfoUpdateListener = info => {
        setAdsRemoved(!!info.entitlements.active[ENTITLEMENT_ID]);
      };
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
      };
    }
  }, []);

  const purchaseRemoveAds = useCallback(async () => {
    setPurchasing(true);
    try {
      const r = await purchaseProduct();
      if (r.ok) setAdsRemoved(r.adsRemoved);
      return { ok: r.ok, cancelled: r.cancelled, error: r.error };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setRestoring(true);
    try {
      const r = await restore();
      if (r.ok) setAdsRemoved(r.adsRemoved);
      return { ok: r.ok, error: r.error };
    } finally {
      setRestoring(false);
    }
  }, []);

  return (
    <Ctx.Provider
      value={{ adsRemoved, loading, purchasing, restoring, purchaseRemoveAds, restorePurchases }}
    >
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

// Silence "imported but unused" for narrow consumers.
export { PURCHASES_ERROR_CODE };
