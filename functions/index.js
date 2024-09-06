/* eslint-disable require-jsdoc */
/* eslint-disable comma-dangle */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable eol-last */
/* eslint-disable no-trailing-spaces */
/* eslint-disable max-len */

const functions = require("firebase-functions/v1");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// admin.initializeApp({
//   credential: admin.credential.cert(require("./admin-key.json"))
// });

admin.initializeApp();

const cors = require("cors")({ origin: true });


// Upon https request, fetch data from BCMA's API and format it
exports.apiFetch = functions.https.onRequest((request, response) => {
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
  console.log(date);

  const BCMAUrl = "https://org.thebcma.com/api/Prayertimes/GetPrayertimeByDate?dt=" + dateString + "&organizationId=7";

  cors(request, response, async () => {
    try {
      const data = [];
      const res = await fetch(BCMAUrl, { method: "GET", cache: "no-store" });
      const json = await res.json();

      data[0] = { id: "Fajr", start: parseTime(json.fajr), iqamah: parseTime(json.fajrIqama ? json.fajrIqama : json.fajr), name: "Fajr - الفجر" };
      data[1] = { id: "Shurooq", start: parseTime(json.sunrise), iqamah: parseTime(json.sunrise), name: "Shurooq - الشروق" };
      data[2] = { id: "Duhr", start: parseTime(json.duhr), iqamah: parseTime(json.duhrIqama), name: "Duhr - الظهر" };
      data[3] = { id: "Asr", start: parseTime(json.asr), iqamah: parseTime(json.asrIqama), name: "Asr - العصر" };
      data[4] = { id: "Maghrib", start: parseTime(json.maghreb), iqamah: parseTime(json.maghreb), name: "Maghrib - المغرب" };
      data[5] = { id: "Isha", start: parseTime(json.isha), iqamah: parseTime(json.ishaIqama), name: "Isha - العشاء" };
      data[6] = { id: "Jumuah", start: parseTime(json.firstJumma), iqamah: parseTime(json.firstJumma), name: "Jumuah - الجمعة" };

      response.send(data);
    } catch (error) {
      response.status(500).send(error);
    }
  });
});

// // Send cloud message upon adding a new announcement
// exports.announcementAlert = functions.firestore.document("/announcements/{documentId}").onCreate(async (snap, context) => {
//   const data = snap.data();

//   const payload = {
//     notification: {
//       title: `${data.title} - New Announcement`,
//       body: data.description,
//     }
//   };

//   // Set current server timeStamp to newly added announcement
//   await snap.ref.set({
//     timeStamp: admin.firestore.FieldValue.serverTimestamp()
//   }, { merge: true });

//   try {
//     await admin.messaging().sendToTopic("announcements", payload);
//   } catch (error) {
//     functions.logger.error("Failure sending notification", error);
//   }
// });


function parseTime(time) {
  const parsedHour = (time.indexOf(":") == 1) ? `0${time.substring(0, time.indexOf(":"))}` : time.substring(0, time.indexOf(":"));
  const parsedMinute = time.substring(time.indexOf(":") + 1, time.indexOf(":") + 3);
  const aMpM = time.substring(time.length, time.length - 2);

  return `${parsedHour}:${parsedMinute} ${aMpM.toUpperCase()}`;
}