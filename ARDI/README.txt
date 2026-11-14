ARDI 3D INTERACTIVE FRONTEND PROTOTYPE

Files:
- index.html
- style.css
- app.js

Run:
Open index.html in a modern browser. For best results, use a local static server or upload the folder to Netlify.
Internet is required for the Three.js and Google Fonts CDN assets.

Included:
- Multi-page navigation (Overview, My Farm, Earth Explorer, Farm Data, Crop Rotation, Insights, Settings)
- Animated Three.js illustrative Earth scenes, orbit rings and starfield
- Drag-to-rotate and scroll-to-zoom Earth Explorer
- Editable farm profile stored only in browser localStorage
- Editable four-season planner stored only in browser localStorage
- Responsive layout

Important:
This is a FRONTEND-ONLY visual prototype. It intentionally contains NO NASA data, no external datasets, no backend, no database, no AI model, and no fabricated readings or recommendations. The 3D Earth is artistic/illustrative, not a live satellite image or geographic data layer. Data/API integrations can be added later.


Account UI additions:
- Account button opens the sign-in screen.
- Create an account opens a registration form with client-side password guidance (15-128 characters, demo common-password checks, and confirmation).
- Password visibility controls are available on registration fields.
- These browser checks are for user feedback only. They are NOT security enforcement and do not provide authentication.
- Before real deployment, implement equivalent server-side validation, a full common/compromised-password blocklist, Argon2id password hashing, rate limiting, secure sessions, MFA, and authorization in the backend. Never store passwords in browser storage.
