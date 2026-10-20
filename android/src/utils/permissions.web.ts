export async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await window.Notification.requestPermission();
      return perm !== 'denied';
    } catch {
      return true;
    }
  }
  return true;
}
