/**
 * Push Notification Service
 * Handles permission requests, subscription, and notification scheduling
 */

import { showToast } from "@/components/Toast";
import { debug } from "./debug";

export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private reminderTimeout: number | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      debug.warn("This browser does not support notifications");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Initialize service worker registration for notifications
   */
  async initialize(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      debug.warn("Service Workers not supported");
      return;
    }

    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Service Worker registration timeout")), 3000)
      );

      try {
        this.registration = await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
        debug.log("Service Worker ready for notifications");
      } catch (readyError) {
        debug.log("Service Worker not ready, continuing without it:", readyError);
        // Continue anyway - Notification API will still work
      }
    } catch (error) {
      debug.warn("Service Worker initialization error:", error);
      // In development, service worker may not be active, but Notification API will still work
    }
  }

  /**
   * Schedule a daily reminder notification
   * Always works in user's local timezone
   */
  async scheduleDailyReminder(hour: number = 9, minute: number = 0): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== "granted") {
      debug.log("Notification permission not granted");
      return;
    }

    // Calculate next reminder time in user's local timezone
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hour, minute, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const delay = reminderTime.getTime() - now.getTime();

    // Store reminder in localStorage for persistence
    // Store both the local time (hour/minute) and the next trigger time
    const reminderData = JSON.stringify({
      hour,
      minute,
      nextReminder: reminderTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    localStorage.setItem("braindeck-reminder", reminderData);
    debug.log("Saved reminder to localStorage:", reminderData);
    debug.log(`Reminder set for ${reminderTime.toLocaleTimeString()} (${delay / 1000 / 60} minutes from now)`);

    // Clear any existing timeout
    if (this.reminderTimeout) {
      clearTimeout(this.reminderTimeout);
    }

    // Schedule the notification
    this.reminderTimeout = setTimeout(() => {
      this.showNotification("Time to study! 🧠", "Your flashcards are waiting. Keep your streak alive!");
      // Reschedule for next day
      this.scheduleDailyReminder(hour, minute);
    }, delay) as unknown as number;

    debug.log(`Next reminder in ${Math.round(delay / 1000 / 60)} minutes at ${reminderTime.toLocaleTimeString()}`);
  }

  /**
   * Show a notification
   */
  async showNotification(title: string, body: string, icon: string = "/icon.svg"): Promise<void> {
    const permission = await this.requestPermission();
    debug.log("Notification permission status:", permission);

    if (permission !== "granted") {
      debug.warn("Notification permission not granted");
      // Show browser alert as fallback
      alert(`${title}\n\n${body}`);
      return;
    }

    try {
      if (this.registration) {
        // Use service worker to show notification
        await this.registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: "braindeck-reminder",
          requireInteraction: false,
          data: {
            url: "/",
          },
        });
        debug.log("Notification shown via Service Worker");
      } else {
        // Fallback to regular Notification API
        debug.log("Creating Notification with options:", { title, body, icon });

        const notification = new Notification(title, {
          body,
          icon,
          badge: icon,
          tag: "braindeck-reminder",
          requireInteraction: true,
        });

        notification.onshow = () => {
          debug.log("Notification displayed successfully");
        };

        notification.onerror = (error) => {
          debug.error("Notification error:", error);
          // Show in-app toast instead
          showToast(title, body, "info");
        };

        notification.onclick = () => {
          debug.log("Notification clicked");
          window.focus();
          notification.close();
        };

        debug.log("Notification shown via Notification API (fallback)");
        // Show in-app toast as visual confirmation (since browser may suppress notification)
        showToast(title, body, "success");
      }
    } catch (error) {
      debug.error("Failed to show notification:", error);
      // Show browser alert as last resort
      alert(`${title}\n\n${body}\n\n(Notification API error)`);
    }
  }

  /**
   * Cancel all scheduled reminders
   */
  cancelReminders(): void {
    if (this.reminderTimeout) {
      clearTimeout(this.reminderTimeout);
      this.reminderTimeout = null;
    }
    localStorage.removeItem("braindeck-reminder");
    debug.log("Reminders cancelled and cleared from localStorage");
  }

  /**
   * Check if reminders are enabled
   */
  isReminderEnabled(): boolean {
    const stored = localStorage.getItem("braindeck-reminder");
    const enabled = stored !== null;
    debug.log("📋 isReminderEnabled() - localStorage contains 'braindeck-reminder':", stored);
    debug.log("📋 isReminderEnabled() returning:", enabled);
    return enabled;
  }

  /**
   * Get current reminder settings
   */
  getReminderSettings(): { hour: number; minute: number } | null {
    const stored = localStorage.getItem("braindeck-reminder");
    if (!stored) return null;

    try {
      const { hour, minute } = JSON.parse(stored);
      return { hour, minute };
    } catch {
      return null;
    }
  }
}

export const notificationService = NotificationService.getInstance();
