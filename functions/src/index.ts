import { initializeApp, getApps } from "firebase-admin/app";

import prayerTimesFetch from "./functions/prayerTimesFetch";
import announcementAlert from "./functions/announcementAlert";

if (!getApps().length) {
  initializeApp();
}

// Upon https request, fetch data from BCMA's API and format it
exports.prayerTimesFetch = prayerTimesFetch;

// Send cloud message upon adding a new announcement
exports.announcementAlert = announcementAlert;
