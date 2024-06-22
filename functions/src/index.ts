import { logger } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { initializeApp } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const cors = require("cors")({ origin: true });
const messaging = getMessaging();

initializeApp();

// Upon https request, fetch data from BCMA's API and format it
exports.apiFetch = onRequest((request, response) => {
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

  const BCMAUrl = "https://org.thebcma.com/api/Prayertimes/GetPrayertimeByDate?dt=" + dateString + "&organizationId=7";

  cors(request, response, async () => {
    try {
      const res = await fetch(BCMAUrl, { method: "GET", cache: "no-store" });
      const json = await res.json();

      const data = [
        {
          id: "Fajr",
          start: parseTime(json.fajr),
          iqamah: parseTime(json.fajrIqama ? json.fajrIqama : json.fajr),
          name: "Fajr - الفجر"
        },
        {
          id: "Shurooq",
          start: parseTime(json.sunrise),
          iqamah: parseTime(json.sunrise),
          name: "Shurooq - الشروق"
        },
        {
          id: "Duhr",
          start: parseTime(json.duhr),
          iqamah: parseTime(json.duhrIqama),
          name: "Duhr - الظهر"
        },
        {
          id: "Asr",
          start: parseTime(json.asr),
          iqamah: parseTime(json.asrIqama),
          name: "Asr - العصر"
        },
        {
          id: "Maghrib",
          start: parseTime(json.maghreb),
          iqamah: parseTime(json.maghreb),
          name: "Maghrib - المغرب"
        },
        {
          id: "Isha",
          start: parseTime(json.isha),
          iqamah: parseTime(json.ishaIqama),
          name: "Isha - العشاء"
        },
        {
          id: "Jumuah",
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
  const payload = {
    notification: {
      title: `${data.title} - New Announcement`,
      body: data.description,
    }
  };

  // Set current server timeStamp to newly added announcement
  await snapshot.ref.set({
    timeStamp: Timestamp.now()
  }, { merge: true });

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