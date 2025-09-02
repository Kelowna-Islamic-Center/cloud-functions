# Kelowna Islamic Center Firebase Cloud Functions

The **KIC Firebase Cloud Functions** repository powers the backend services of the ecosystem.  
It provides serverless business logic for prayer time scheduling, announcements, and notification delivery.  

The full documentation for this repository can be found on the [**Official Documentation Website**](https://kelowna-islamic-center.github.io/documentation/server-side/).

If access to the production Firebase project is required, it can be requested by submitting a request to the Masjid Board.

[![Visit Live Site](https://img.shields.io/badge/Read%20the%20Full%20Documentation-4CAF50?style=for-the-badge)](https://kelowna-islamic-center.github.io/documentation/server-side/)

## Features

- 🔔 Schedules and dispatches athan & iqamah reminders through FCM
- 📢 Stores and delivers announcements in real-time with Firestore
- 🕌 Integrates with external APIs (e.g., prayer times API)
- 🌍 Fully internationalized notifications

## Prerequisites

- [Node.js](https://nodejs.org) (v18 or later)  
- [Firebase CLI](https://firebase.google.com/docs/cli)

## Getting Started

Clone and install dependencies:

```bash
git clone https://github.com/Kelowna-Islamic-Center/cloud-functions
cd cloud-functions/functions
npm install
````

Emulate locally:

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
