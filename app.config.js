// Dynamic Expo config on top of app.json: adds the AdMob plugin with the app
// IDs taken from environment variables (set them as EAS environment
// variables, never commit them):
//
//   ADMOB_ANDROID_APP_ID   ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
//   ADMOB_IOS_APP_ID       ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
//
// Development builds fall back to Google's sample app IDs. A production build
// without the ID or ad units for its platform fails on purpose, so a release
// can never ship with test IDs or without ads (which earns nothing).

const SAMPLE_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

function isProductionBuildFor(platform) {
  return (
    process.env.EAS_BUILD_PROFILE === 'production' && process.env.EAS_BUILD_PLATFORM === platform
  );
}

function missingInProduction(envName) {
  return new Error(`${envName} is not set. Add it as an EAS environment variable for production.`);
}

function appId(platform, envName) {
  const value = process.env[envName];
  if (value) return value;
  if (isProductionBuildFor(platform)) throw missingInProduction(envName);
  return SAMPLE_APP_IDS[platform];
}

// Without its ad units a release would build fine and silently show no ads,
// so production builds check them too (src/ads/config.ts reads them).
for (const platform of ['android', 'ios']) {
  if (!isProductionBuildFor(platform)) continue;
  for (const kind of ['BANNER', 'INTERSTITIAL']) {
    const envName = `EXPO_PUBLIC_ADMOB_${kind}_${platform.toUpperCase()}`;
    if (!process.env[envName]) throw missingInProduction(envName);
  }
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: appId('android', 'ADMOB_ANDROID_APP_ID'),
        iosAppId: appId('ios', 'ADMOB_IOS_APP_ID'),
        // Wait for consent (UMP) before Google measurement starts.
        delayAppMeasurementInit: true,
        // Google's SKAdNetwork ID. Add the full list from Google's docs before
        // the first iOS release with ads.
        skAdNetworkItems: ['cstr6suwn9.skadnetwork'],
      },
    ],
  ],
});
