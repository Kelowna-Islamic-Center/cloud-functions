import { logger } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { defineString } from "firebase-functions/params";

const announcementsAndroidChannelId = defineString("ANDROID_CHANNEL_ID_ANNOUNCEMENTS");

const announcementAlert = onDocumentCreated("/announcements/{docId}", async (event) => {
	const messaging = getMessaging();
	
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

	// Safety Checks

	if (!data.platforms) {
		return;
	}

	if (!Array.isArray(data.platforms)) {
		return;
	}

	if (!data.platforms.includes("mobile")) {
		return;
	}

	// Look for all localized keys in the l10n object, if none are found, default to sending the notification in English
	const localeKeys = Object.keys(data.l10n ?? {}).filter((value): value is string => typeof value === "string" && value.trim() !== "");
	const localesToSend = localeKeys.length > 0 ? localeKeys : ["en"];
	
	const messages = localesToSend.map((locale) => {
		const localizedValues = (data.l10n?.[locale] as Record<string, string> | undefined) ?? {};
		const title = (localizedValues.title ?? data.title ?? "New Announcement").toString().trim();
		const body = (localizedValues.description ?? data.description ?? "A new announcement is available.").toString().trim();

		return {
			condition: `'announcements' in topics && 'lang-${locale}' in topics`,
			notification: {
				title,
				body,
				android_channel_id: announcementsAndroidChannelId.value()
			},
			data: {
				notificationType: "announcements",
				topic: "announcements",
				locale,
				announcementId: event.params.docId
			}
		};
	});

	try {
		await messaging.sendEach(messages);
	} catch (error) {
		logger.error("Failure sending notification", error);
	}
});

export default announcementAlert;