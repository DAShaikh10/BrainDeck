"use client";

import { useState, useEffect } from "react";
import { notificationService } from "@/lib/notifications";
import { debug } from "@/lib/debug";

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isEnabled, setIsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    debug.log("NotificationSettings mounted - initializing...");

    // Initialize service and check current state
    const init = async () => {
      try {
        debug.log("Starting notification initialization...");
        try {
          await notificationService.initialize();
          debug.log("NotificationService initialized successfully");
        } catch (initError) {
          debug.error("Error initializing NotificationService:", initError);
        }

        // Check browser's actual notification permission (persisted by browser)
        debug.log("Checking if Notification API is available...");
        if ("Notification" in window) {
          debug.log("Notification API available");
          const currentPermission = Notification.permission;
          debug.log("Current notification permission:", currentPermission);
          setPermission(currentPermission);

          // Always check localStorage for reminder state, regardless of permission
          debug.log("Checking localStorage for reminders...");
          const enabled = notificationService.isReminderEnabled();
          const settings = notificationService.getReminderSettings();

          debug.log("Reminders enabled in storage:", enabled);
          debug.log("Reminder settings from storage:", settings);
          debug.log("localStorage['braindeck-reminder']:", localStorage.getItem("braindeck-reminder"));

          setIsEnabled(enabled);

          if (settings) {
            debug.log("Restoring reminder time:", settings);
            setReminderTime(settings);

            // Re-schedule the reminder (it was lost on page reload since setTimeout doesn't persist)
            debug.log("Re-scheduling reminder after page reload...");
            try {
              await notificationService.scheduleDailyReminder(settings.hour, settings.minute);
              debug.log("Reminder re-scheduled successfully");
            } catch (scheduleError) {
              debug.error("Error re-scheduling reminder:", scheduleError);
            }
          }
        } else {
          debug.warn("Notification API not available");
        }
      } catch (error) {
        debug.error("Failed to initialize notification settings:", error);
      }
    };

    init();

    return () => {
      debug.log("🔔 NotificationSettings unmounting");
    };
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await notificationService.requestPermission();
    setPermission(perm);

    if (perm === "granted") {
      await notificationService.scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
      setIsEnabled(true);

      // Show confirmation
      notificationService.showNotification(
        "Reminders enabled! 🎉",
        `You'll receive daily study reminders at ${formatTime(reminderTime.hour, reminderTime.minute)}`
      );
    }
  };

  const handleDisableNotifications = () => {
    notificationService.cancelReminders();
    setIsEnabled(false);
  };

  const handleTimeChange = async (hour: number, minute: number) => {
    setReminderTime({ hour, minute });
    if (isEnabled) {
      await notificationService.scheduleDailyReminder(hour, minute);
    }
  };

  const handleTestNotification = async () => {
    const perm = await notificationService.requestPermission();
    if (perm === "granted") {
      notificationService.showNotification(
        "Test Notification 🧠",
        "If you see this, notifications are working perfectly!"
      );
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, "0");
    const period = hour >= 12 ? "PM" : "AM";
    return `${h}:${m} ${period}`;
  };

  if (permission === "denied") {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔕</span>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">Notifications Blocked</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              Please enable notifications in your browser settings to receive study reminders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Daily Reminders</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Never miss a study session</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showSettings ? "Hide" : "Settings"}
        </button>
      </div>

      {!isEnabled ? (
        <button
          onClick={handleEnableNotifications}
          className="w-full px-4 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Enable Daily Reminders
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              📅 Reminder set for {formatTime(reminderTime.hour, reminderTime.minute)}
            </span>
            <button
              onClick={handleDisableNotifications}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Disable
            </button>
          </div>

          {showSettings && (
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Reminder Time</label>
              <div className="flex gap-2">
                <select
                  value={reminderTime.hour}
                  onChange={(e) => handleTimeChange(Number(e.target.value), reminderTime.minute)}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-50"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {formatTime(i, 0).split(":")[0]} {i >= 12 ? "PM" : "AM"}
                    </option>
                  ))}
                </select>
                <select
                  value={reminderTime.minute}
                  onChange={(e) => handleTimeChange(reminderTime.hour, Number(e.target.value))}
                  className="w-20 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-50"
                >
                  <option value={0}>:00</option>
                  <option value={15}>:15</option>
                  <option value={30}>:30</option>
                  <option value={45}>:45</option>
                </select>
              </div>

              {/* Test Notification Button */}
              <button
                onClick={handleTestNotification}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700"
              >
                🧪 Send Test Notification
              </button>
            </div>
          )}

          {/* Test Button when settings are hidden */}
          {!showSettings && permission === "granted" && (
            <button
              onClick={handleTestNotification}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              🧪 Send Test Notification
            </button>
          )}
        </div>
      )}
    </div>
  );
}
