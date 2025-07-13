import { logger } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const messaging = getMessaging();

const announcementAlert = onDocumentCreated("/announcements/{docId}", async (event) => {
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

export default announcementAlert;