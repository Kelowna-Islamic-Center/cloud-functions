<h2 align="center">
  Firebase functions as backend
</h2>
<br>

### There are currently two active functions

## 1. ApiFetch
HTTPS function that fetches data from BCMA API and parses it.

## 2. Announcements CMS Listener
A Firestore listener that gets dispatches a CMS notification upon the addition of a new announcement.

For functions to work, admin key must be provided as `./admin-key.json`. This key should never be shared publicly and should be added to `.gitignore`.

### For the deployment of these functions to work, you must provide an "admin-key.json" file in the functions directory.
</p>
