import { logger } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { initializeApp, getApps } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { defineString } from "firebase-functions/params";

if (!getApps().length) {
  initializeApp();
}

const apiLink = defineString("API_LINK");

const cors = require("cors")({ origin: true });
const messaging = getMessaging();

// Upon https request, fetch data from BCMA's API and format it
exports.prayerTimesFetch = onRequest((request, response) => {
  // Parse date according to Vancouver (not server time)
  const date = new Date();

  // Add another day to date if tomorrow is passed as in query
  if (request.query.day) {
    if (request.query.day === "tomorrow") {
      date.setDate(date.getDate() + 1);
    }
  }
  const formatter = new Intl.DateTimeFormat("gregory", { timeZone: "America/Vancouver" });
  const dateString = formatter.format(date);

  const BCMAUrl = `${apiLink}${dateString}`;

  cors(request, response, async () => {
    try {
      const res = await fetch(BCMAUrl, { method: "GET", cache: "no-store" });
      const json = await res.json();

      const data = [
        {
          id: "fajr",
          start: parseTime(json.fajr),
          iqamah: parseTime(json.fajrIqama ? json.fajrIqama : json.fajr),
          name: "Fajr - الفجر"
        },
        {
          id: "shurooq",
          start: parseTime(json.sunrise),
          iqamah: parseTime(json.sunrise),
          name: "Shurooq - الشروق"
        },
        {
          id: "duhr",
          start: parseTime(json.duhr),
          iqamah: parseTime(json.duhrIqama),
          name: "Duhr - الظهر"
        },
        {
          id: "asr",
          start: parseTime(json.asr),
          iqamah: parseTime(json.asrIqama),
          name: "Asr - العصر"
        },
        {
          id: "maghrib",
          start: parseTime(json.maghreb),
          iqamah: parseTime(json.maghreb),
          name: "Maghrib - المغرب"
        },
        {
          id: "isha",
          start: parseTime(json.isha),
          iqamah: parseTime(json.ishaIqama),
          name: "Isha - العشاء",
        },
        {
          id: "jumuah",
          start: parseTime(json.firstJumma),
          iqamah: parseTime(json.firstJumma),
          name: "Jumuah - الجمعة"
        }
      ];

      response.send(data);
    } catch (error) {
      response.status(500).send(error);
    }
  });
});


// Send cloud message upon adding a new announcement
exports.announcementAlert = onDocumentCreated("/announcements/{docId}", async (event) => {
  const snapshot = event.data;

  if (!snapshot) {
    logger.error("Missing snapshot for document creation.");
    return;
  }

  const data = snapshot.data();

  // Set current server timeStamp to newly added announcement
  await snapshot.ref.set({
    timeStamp: Timestamp.now()
  }, { merge: true });

  // Dont continue to firebase messaging if no platform provided
  if (!data.platforms) {
    return;
  }

  // Dont continue to firebase messaging if platforms isn't an array
  if (!Array.isArray(data.platforms)) {
    return;
  }

  // Dont continue to firebase messaging if platform is not for mobile
  if (!data.platforms.includes("mobile")) {
    return;
  }

  const payload = {
    notification: {
      title: `${data.title} - New Announcement`,
      body: data.description,
    }
  };

  try {
    await messaging.sendToTopic("announcements", payload);
  } catch (error) {
    logger.error("Failure sending notification", error);
  }
});


function parseTime(time: string) {
  const parsedHour = (time.indexOf(":") == 1) ? `0${time.substring(0, time.indexOf(":"))}` : time.substring(0, time.indexOf(":"));
  const parsedMinute = time.substring(time.indexOf(":") + 1, time.indexOf(":") + 3);
  const aMpM = time.substring(time.length, time.length - 2);

  return `${parsedHour}:${parsedMinute} ${aMpM.toUpperCase()}`;
}
