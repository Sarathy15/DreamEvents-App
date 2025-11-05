// Function to register the service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

// Function to check if the app can be installed
export const checkInstallable = async () => {
  if ('getInstalledRelatedApps' in navigator) {
    const relatedApps = await (navigator as any).getInstalledRelatedApps();
    return relatedApps.length === 0;
  }
  return false;
};

// Function to show install prompt
let deferredPrompt: any;

export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
};

export const showInstallPrompt = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
  }
};

// Listen for PWA updates
export const listenForUpdates = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker is activated - app has been updated
      window.location.reload();
    });
  }
};