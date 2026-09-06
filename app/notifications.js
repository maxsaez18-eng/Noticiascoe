import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getStats } from './api';

let lastUnreadCount = 0;
let pollingInterval = null;

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  // ignore on web
}

export async function initNotifications() {
  try {
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('news', {
        name: 'Nuevas noticias',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 200, 100, 200],
      });
    }
  } catch (e) {
    console.warn('Notifications init failed:', e);
  }
}

export function startPolling() {
  checkAndNotify();
  pollingInterval = setInterval(checkAndNotify, 5 * 60 * 1000);
}

export function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function checkAndNotify() {
  try {
    const stats = await getStats();
    const current = stats.noLeidas || 0;

    if (lastUnreadCount > 0 && current > lastUnreadCount) {
      const nuevas = current - lastUnreadCount;
      showNotification(nuevas);
    }

    lastUnreadCount = current;
  } catch {}
}

async function showNotification(count) {
  try {
    const title = count === 1 ? '1 nueva noticia' : `${count} nuevas noticias`;
    const body = 'Toca para ver las noticias recientes';

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        vibrate: [0, 200, 100, 200],
      },
      trigger: null,
    });
  } catch {}
}
