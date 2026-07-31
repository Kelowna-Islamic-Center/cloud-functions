# Kelowna Islamic Center Firebase Cloud Functions

These functions power the backend Firebase services of the KIC ecosystem.
All serverless business logic for announcements and announcement notification delivery is handled here.

The full documentation for this repository can be found on the [Official Documentation Website](https://kelowna-islamic-center.github.io/documentation/server-side/).

If access to the production Firebase project is required, it can be requested by submitting a request to the Masjid Board.

The latest version of the mobile app and kiosk app both use two functions.

**announcementAlert (onDocumentCreated):** Schedules and dispatches new announcement notifications through FCM.

**prayerTimesFetch (onRequest):** Prayer Times API that combines and provides clean, usable prayer data from both BCMA and AlAdhan APIs.

> **Note:** There are also currently three legacy Cloud Functions that are deployed within the production environment. These functions handle requests and provide services to previous versions of the mobile app. These legacy functions are no longer included within this repository.

## Prerequisites

* [Node.js](https://nodejs.org) (v18 or later)
* [Firebase CLI](https://firebase.google.com/docs/cli)

## Getting Started

Clone and install dependencies:

```bash
git clone https://github.com/Kelowna-Islamic-Center/cloud-functions
cd cloud-functions/functions
npm install
```

Emulate locally for testing changes:

```bash
firebase emulators:start
```

## Deployment

Deploy to Firebase:

```bash
firebase deploy --only functions
```

## License

GPL-v3
