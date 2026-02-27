import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SupabaseClient } from '@supabase/supabase-js';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

/**
 * Request push notification permissions
 */
export async function requestPushNotificationPermissions(): Promise<PushNotificationPermissions> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return {
      granted: false,
      canAskAgain: false,
      status: 'undetermined' as Notifications.PermissionStatus,
    };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return {
    granted: finalStatus === 'granted',
    canAskAgain: existingStatus === 'undetermined',
    status: finalStatus,
  };
}

/**
 * Get the Expo Push Token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('No EAS project ID found in app config');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Register push token with the backend
 */
export async function registerPushToken(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceId = Constants.sessionId || Device.deviceName || undefined;

    // Check if token already exists
    const { data: existing } = await supabase
      .from('push_tokens')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('token', token)
      .single();

    if (existing) {
      // Reactivate if inactive
      if (!existing.is_active) {
        const { error } = await supabase
          .from('push_tokens')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      }
      return { success: true, error: null };
    }

    // Insert new token
    const { error } = await supabase.from('push_tokens').insert({
      user_id: userId,
      token,
      device_type: deviceType,
      device_id: deviceId,
      is_active: true,
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error registering push token:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Unregister push token (mark as inactive)
 */
export async function unregisterPushToken(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
): () => void {
  // Handle notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  // Handle notification taps
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(onNotificationTapped);

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Show immediately
  });

  return id;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
