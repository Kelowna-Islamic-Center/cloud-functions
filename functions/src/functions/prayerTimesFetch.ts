import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as cors from "cors";

const apiLink = defineString("API_LINK");
const islamicFinderApiLink = defineString("ISLAMIC_FINDER_API_LINK");

const corsHandler = cors({ origin: true });

const prayerTimesFetch = onRequest((request, response) => {

	const date = new Date();
	const method = request.query.method;

	// Add another day to date if tomorrow is passed as in query
	if (request.query.day) {
		if (request.query.day === "tomorrow") {
			date.setDate(date.getDate() + 1);
		}
	}
	
	// Parse date according to Vancouver (not server time)
	const formatter = new Intl.DateTimeFormat("gregory", { timeZone: "America/Vancouver" });
	const dateString = formatter.format(date);
	let asrHanbaliTime: string;

	const BCMAUrl = `${apiLink.value()}${dateString}`;
	// Islamic finder URL for non-hanafi asr athan time
	const islamicFinderURL = `${islamicFinderApiLink.value()}${dateString}`;

	corsHandler(request, response, async () => {
		try {
			const res = await fetch(BCMAUrl, { method: "GET", cache: "no-store" });
			const json = await res.json();

			// Get Asr athan times from IslamicFinder if Hanbali/Shafi/Maliki method is selected
			if (method === "hanbali") {
				const islamicFinderRes = await fetch(islamicFinderURL, { method: "GET", cache: "no-store" });
				const hanbaliJson = await islamicFinderRes.json();
				const hanbaliAsrTime = hanbaliJson.results.Asr;

				asrHanbaliTime = new Date("1970-01-01T" + hanbaliAsrTime + "Z").toLocaleTimeString("en-US",
					{ timeZone: "PST", hour12: true, hour: "2-digit", minute: "2-digit" }
				);
			}

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
					start: (asrHanbaliTime) ? asrHanbaliTime : parseTime(json.asr),
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

function parseTime(time: string) {
	const parsedHour = (time.indexOf(":") == 1) ? `0${time.substring(0, time.indexOf(":"))}` : time.substring(0, time.indexOf(":"));
	const parsedMinute = time.substring(time.indexOf(":") + 1, time.indexOf(":") + 3);
	const aMpM = time.substring(time.length, time.length - 2);

	return `${parsedHour}:${parsedMinute} ${aMpM.toUpperCase()}`;
}

export default prayerTimesFetch;