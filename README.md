# Daywise — installable to-do app

Daywise is a lightweight Progressive Web App (PWA). It works on phones and computers, saves tasks on the device, and can be installed to the home screen.

## Features
- Monthly calendar with indicators for days that contain tasks
- Add tasks with due dates
- Collective unfinished-tasks page
- Mark tasks complete or unfinished
- All / Overdue / Today / Upcoming filters and search
- Delete tasks
- Local storage and offline app shell after the first online visit
- Responsive phone-friendly layout

## Install on Android
The app must be served from an HTTPS website (or localhost); opening `index.html` directly from a ZIP/file manager is not enough for PWA installation or offline caching.

1. Upload the contents of this folder to an HTTPS static host, keeping the folder structure intact.
2. Open the website in Chrome on your Android phone.
3. Use Chrome's menu and choose **Install app** or **Add to Home screen**. If supported, Daywise also shows an Install app button.
4. Open Daywise from the new home-screen icon.

## Quick hosting option: GitHub Pages
1. Sign in to GitHub and create a new repository.
2. Upload all files and the `icons` folder from this folder to the repository root.
3. In the repository, open **Settings → Pages** and enable deployment from the main branch and root folder.
4. Wait for the published HTTPS URL, open it on your phone, and install it from Chrome.

Other HTTPS static hosts work too. Do not rename or separate `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, and `icons/`.

## Data and privacy
Tasks are stored in your browser's local storage on that device. No account or server is used for your task data. Browser data clearing, private browsing, or changing devices/browsers can remove or separate tasks. There is no automatic sync between devices yet.

## Developer preview
For local testing, run a static server from this directory, e.g. `python -m http.server 8000`, then visit `http://localhost:8000`. Service workers are supported on localhost.
