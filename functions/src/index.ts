import { initializeApp, getApps } from "firebase-admin/app";

import prayerTimesFetch from "./functions/prayerTimesFetch";
import announcementAlert from "./functions/announcementAlert";
import { prayerTimesAlertScheduler, sendPrayerAlert } from "./functions/prayerTimesAlert";

if (!getApps().length) {
  initializeApp();
}

// Upon https request, fetch data from BCMA's API and format it
exports.prayerTimesFetch = prayerTimesFetch;

// Send cloud message upon adding a new announcement
exports.announcementAlert = announcementAlert;

// Schedule notification tasks for athan and iqamah through firebase messaging
exports.prayerTimesAlertScheduler = prayerTimesAlertScheduler;

// Notification alerts on task completion
exports.sendPrayerAlert = sendPrayerAlert;