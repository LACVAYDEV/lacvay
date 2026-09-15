export const transportApps = {
  angkas: {
    name: 'Angkas',
    scheme: 'angkas://',
    androidPackage: 'com.angkas.passenger',
    iosAppId: 'id1156870020',
    appStoreUrl: 'https://apps.apple.com/app/id1156870020',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.angkas.passenger',
  },
  grab: {
    name: 'Grab',
    scheme: 'grab://open',
    androidPackage: 'com.grabtaxi.passenger',
    iosAppId: 'id647268330',
    appStoreUrl: 'https://apps.apple.com/app/id647268330',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger',
  },
  idolTaxi: {
    name: 'iDOL Taxi',
    scheme: 'idolbooking://',
    androidPackage: 'com.alphamovers.alphamoversuser',
    iosAppId: 'id6744593753',
    appStoreUrl: 'https://apps.apple.com/ph/app/idol-booking/id6744593753',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.alphamovers.alphamoversuser',
  },
} as const;

export type TransportAppKey = keyof typeof transportApps;

export function launchTransportApp(appKey: TransportAppKey): void {
  const app = transportApps[appKey];
  const userAgent = navigator.userAgent || navigator.vendor;
  const isAndroid = /android/i.test(userAgent);
  const isIos = /iPad|iPhone|iPod/.test(userAgent);

  if (!isAndroid && !isIos) {
    window.open(app.playStoreUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const fallbackUrl = isAndroid ? app.playStoreUrl : app.appStoreUrl;
  let fallbackTimer: number | undefined;

  const cancelFallback = () => {
    if (document.hidden && fallbackTimer !== undefined) {
      window.clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', cancelFallback);
    }
  };

  document.addEventListener('visibilitychange', cancelFallback);
  window.addEventListener('pagehide', cancelFallback, { once: true });
  window.location.assign(app.scheme);

  fallbackTimer = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', cancelFallback);
    if (!document.hidden) window.location.assign(fallbackUrl);
  }, 2500);
}
