import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { getFunctions } from "firebase-admin/functions";

import { parse, subMinutes } from 'date-fns';
import { TZDate } from "@date-fns/tz";
import { GoogleAuth } from "google-auth-library";
import { onTaskDispatched } from "firebase-functions/tasks";
import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/scheduler";

type ApiResponsePrayerItem = {
    id: string,
    iqamah: string,
    start: string,
    name: string,
}

type Payload = {
    name: string,
    topic: string,
    title: string,
    body: string,
    time: Date
}

let auth: any;

export const prayerTimesAlertScheduler = onSchedule("every day 02:00", async (event) => {

    const taskQueue = getFunctions().taskQueue("sendPrayerAlert");
    const sendPrayerAlertURL = await getFunctionUrl("sendPrayerAlert");

    const prayerTimesURL = defineString("PRAYER_TIMES_FETCH_URL");

    const iqamahReminderMinutes = [5, 10, 15, 20, 30, 45];

    const payloads: Payload[] = [];

    try {
        const prayerTimesResponse = await fetch(prayerTimesURL.value());

        if (!prayerTimesResponse.ok) {
            logger.error("HTTP error when trying to get prayer times for notification scheduling", { error: 500 });
            return;
        }

        const json = await prayerTimesResponse.json();

        json.forEach((prayer: ApiResponsePrayerItem) => {

            // Skip shurooq
            if (prayer.id === "shurooq") return;

            const today = new TZDate(new Date(), 'America/Vancouver');

            const parsedIqamah = parse(prayer.iqamah, 'hh:mm a', today);
            const parsedAthan = parse(prayer.start, 'hh:mm a', today);

            const pacificIqamahDate: TZDate = new TZDate(parsedIqamah, 'America/Vancouver');
            const pacificAthanDate: TZDate = new TZDate(parsedAthan, 'America/Vancouver');

            // Server is located in us-central so all time needs to be converted to central time
            const centralIqamahDate: TZDate = pacificIqamahDate.withTimeZone('America/Chicago');
            const centralAthanDate: TZDate = pacificAthanDate.withTimeZone('America/Chicago');


            const capitalizedId = prayer.id.charAt(0).toUpperCase() + prayer.id.slice(1).toLowerCase();

            // Iqamah Reminders
            iqamahReminderMinutes.forEach(value => {
                payloads.push({
                    name: prayer.id,
                    topic: `iqamah${value}MinuteReminder`,
                    title: `${capitalizedId} Iqamah is in ${value} minutes at the Kelowna Masjid`,
                    body: `${capitalizedId} Iqamah is at ${prayer.iqamah} today in Kelowna.`,
                    time: subMinutes(centralIqamahDate, value)
                });
            });

            // Athan Reminder
            payloads.push({
                name: prayer.id,
                topic: "athanReminder",
                title: `It is time for ${capitalizedId} Athan in Kelowna`,
                body: `${capitalizedId} is at ${prayer.start} today in Kelowna.`,
                time: centralAthanDate
            });
        });

        for (const item of payloads) {
            taskQueue.enqueue({ payload: item }, {
                scheduleTime: item.time,
                dispatchDeadlineSeconds: 60 * 5,
                uri: sendPrayerAlertURL
            })
        }

    } catch (error) {
        logger.error("Failure to get prayer times for notification scheduling", { error });
    }
});

export const sendPrayerAlert = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: 3,
            minBackoffSeconds: 30
        },
        rateLimits: {
            maxConcurrentDispatches: 5
        }
    },
    async (req) => {
        const payload = req.data.payload;

        await getFirestore()
            .collection("taskDump")
            .add({ payload: JSON.stringify(payload) });

        logger.info("Successfully wrote to firestore");
    }
);


// Gets URL of firebase function (taken from https://github.com/firebase/functions-samples/blob/c4fde45b65fab584715e786ce3264a6932d996ec/Node/taskqueues-backup-images/functions/index.js#L43-L52)
async function getFunctionUrl(name: string, location = "us-central1") {
    if (!auth) {
        auth = new GoogleAuth({
            scopes: "https://www.googleapis.com/auth/cloud-platform",
        });
    }
    const projectId = await auth.getProjectId();
    const url = "https://cloudfunctions.googleapis.com/v2beta/" +
        `projects/${projectId}/locations/${location}/functions/${name}`;

    const client = await auth.getClient();
    const res = await client.request({ url });
    const uri = res.data?.serviceConfig?.uri;
    if (!uri) {
        throw new Error(`Unable to retreive uri for function at ${url}`);
    }
    return uri;
}