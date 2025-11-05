# DreamEvents — Frontend (Vite + React + TypeScript)

A modern React + TypeScript frontend for DreamEvents — an event marketplace connecting customers with vendors (photography, catering, venues, transport, etc.). This README covers setup, development, environment configuration, Gemini AI integration, speech features, troubleshooting, and deployment.

---

## Table of contents

- About
- Prerequisites
- Quick start (development)
- Environment variables
- Gemini (Google Generative AI) integration
- Speech features (Web Speech API)
- Project structure
- Scripts
- Common issues & troubleshooting
- Tests
- Contributing
- Security & API key handling
- License

---

## About

This repository contains the DreamEvents frontend app built with:

- Vite
- React 18 + TypeScript
- Tailwind CSS
- Firebase (Auth, Firestore)
- Google Generative AI (Gemini) integration for chatbot
- Web Speech API for speech-to-text and text-to-speech

The app provides service discovery, booking flow, QR ticket generation, vendor/customer dashboards, and an AI-powered chatbot.

---

## Prerequisites

- Node.js >= 18 (recommended)
- npm (comes with Node.js)
- A Google Cloud project and a generative AI API key / service setup (if you use Gemini programmatically)
- Firebase project (for Auth/Firestore)

---

## Quick start (development)

1. Clone repository (or open existing workspace).

2. Install dependencies:

```powershell
# from Windows PowerShell (project root)
Set-Location -Path "c:\Users\Madava\Downloads\DREAM EVENTS (31)\DREAM EVENTS\project"
npm install
```

3. Create a `.env` file at project root (see Environment variables below). Never commit this file.

4. Start development server (PowerShell example):

```powershell
Set-Location -Path "c:\Users\Madava\Downloads\DREAM EVENTS (31)\DREAM EVENTS\project"
npm run dev
```

Vite will start (if port 5173 is in use it will pick another port, e.g., 5174). Open the Local URL shown in the terminal.

---

## Environment variables

Create a `.env` file (do NOT commit) and add required variables. Example names used throughout the codebase (Vite exposes variables prefixed with `VITE_`):

```
# .env (DO NOT COMMIT)
VITE_GEMINI_API_KEY=your_google_generative_api_key_here
VITE_QRCODE_API_KEY=your_qrcode_api_key_here
VITE_LOCATIONIQ_KEY=pk.your_locationiq_public_key
VITE_LOCATIONIQ_BASE_URL=https://us1.locationiq.com/v1
```

Create a `.env.example` (safe to commit) with the same variable names but placeholder values. I can add this file for you if you want.

Make sure `.gitignore` contains the `.env` entry. Example:

```
# .gitignore
.env
```

---

## Gemini (Google Generative AI) integration

- The project uses `src/services/geminiService.ts` to call the Gemini model via `@google/generative-ai`.
- The Vite variable `import.meta.env.VITE_GEMINI_API_KEY` is used to provide the API key at runtime.

Notes & common pitfalls:

- Models and API versions change: if you see 404 errors like `models/gemini-pro is not found for API version v1beta`, the model name or API version may be mismatched with the installed `@google/generative-ai` package. Use `ListModels` (or check provider docs) to find available model names supported by your package version.
- The Gemini client expects specific shapes for prompts/messages. If you see errors complaining about `parts` or `parts property with an array`, ensure `parts` is an array of objects like `{ text: '...' }` when using chat-style messages, or use the direct `generateContent` call with a prompt string where appropriate.
- If the package raises `Cannot find module '@google/generative-ai'` ensure the dependency is installed: `npm install @google/generative-ai`.

If you prefer a simple and robust approach, `geminiService` can build a plain prompt string and call `model.generateContent(prompt)`; that avoids chat-mode shape mismatches while still providing helpful responses.

---

## Speech features

- Speech-to-text: implemented using the browser Web Speech API (`SpeechRecognition` and `webkitSpeechRecognition`). This is a client-side feature and does NOT require the Gemini API key.
- Text-to-speech: implemented using `window.speechSynthesis`.
- For improved AI-driven speech recognition (server-side or higher-quality transcription) you could route audio to a cloud STT service (Google Speech-to-Text, Whisper, etc.) — that would require additional backend code.

UX details in the app:

- Chat UI includes a microphone button that starts/stops recognition and automatically sends the final transcript to Gemini (if available).
- Bot messages have a small speaker icon to play text via TTS.

Browser support:

- Web Speech API is supported in Chromium-based browsers (Chrome, Edge) and some other browsers; Safari support varies. Check `speechService.isRecognitionSupported()` before showing mic controls.

---

## Project structure (high level)

```
project/
  public/                # static files
  src/
    components/          # React components (Chatbot, Navbar, modals, etc.)
    pages/               # Page components
    services/            # API wrapper code (geminiService.ts, speechService.ts, emailService.ts, etc.)
    contexts/            # React contexts (AuthContext)
    config/              # firebase config, etc.
    utils/               # helper functions
    types/               # custom type declarations
  functions/             # Cloud Functions (if any)
  package.json
  tsconfig.json
  vite.config.ts
```

Key files:

- `src/services/geminiService.ts` — Gemini client wrapper
- `src/services/speechService.ts` — Web Speech API wrapper
- `src/components/Chatbot.tsx` — chat UI that integrates Gemini & speech
- `src/contexts/AuthContext.tsx` — Firebase Auth and user data subscription

---

## Scripts

- `npm run dev` — start dev server
- `npm run build` — build production bundle
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

---

## Common issues & troubleshooting

1. Vite says `Port 5173 is in use` and picks another port.
   - This is normal if another process is using 5173. You can kill the process or open the new port printed by Vite (e.g., http://localhost:5174).

2. `Cannot find module '@google/generative-ai'`
   - Run `npm install @google/generative-ai`.

3. Gemini errors `parts property with an array of Parts` or similar
   - Ensure chat history `parts` are arrays of objects: `parts: [{ text: '...' }]`, or use `generateContent(prompt)` which accepts a plain string.

4. `models/gemini-pro is not found for API version v1beta` (404)
   - Different versions of the client and the API expose different model names. Check your package version and the provider docs. Try fallback candidates (e.g., `gemini-1.0`, `text-bison-001`) or call ListModels.

5. Speech recognition not working
   - Check browser support (Chrome/Edge recommended), microphone permissions, and `speechService.isRecognitionSupported()`.

6. TypeScript warnings (unused variables)
   - Some components declare handlers/params for future use; remove or use them to eliminate lint warnings.

---

## Testing locally

- Start dev server (`npm run dev`) and open the site.
- Test authentication flows (register/login). If using Firebase, ensure `src/config/firebase.ts` is configured correctly with your Firebase project values.
- Test the chatbot:
  - Type a question and press Enter or Send.
  - Use the mic button to speak; the final transcript will be auto-sent.
  - Click the speaker icon next to bot messages to hear TTS.

---

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a branch for your feature/fix
3. Run the app and add tests where relevant
4. Open a PR describing the change and how to test it

Please follow the coding style and run linters before sending a PR.

---

## Security & API key handling

- Never commit `.env` with secrets.
- Use `VITE_` prefixed variables for client-side public keys; remember that these are embedded in the client bundle and visible to users. Do NOT put private keys or admin service keys in `VITE_` variables that run in the browser.
- For server-side usage (cloud functions or backend), put sensitive keys in server environment variables (Firebase functions config, or secrets manager). For Gemini server usage, prefer server-side calls so the client never holds private credentials.
- If you exposed the Gemini API key publicly, rotate it immediately in Google Cloud Console.

---

## Deployment

- Build for production:

```powershell
npm run build
```

- Serve the built output using any static hosting (Netlify, Vercel, GitHub Pages, or your own server). If you use server-side functions for API calls, deploy those with appropriate providers (Firebase Functions, Google Cloud Functions, etc.).

---

## Notes / Known issues (from active development)

- `src/services/geminiService.ts` has been iterated during development to handle model name differences and shape mismatches. If you encounter runtime errors, check the installed `@google/generative-ai` version and model names. The library and API change over time.
- Speech features rely on browser APIs.
- Some TypeScript warnings for unused parameters are present; these are non-blocking but can be cleaned up.

---

## Where to get help

- Open an issue in the repository with steps to reproduce.
- Share terminal logs (Vite) and browser console errors when reporting Gemini/speech issues.

---

If you want, I can:

- Add a `.env.example` file to the repo now
- Add a short `docs/` folder with troubleshooting steps for Gemini model selection
- Re-run the dev server and verify the chatbot end-to-end

Tell me which of the above you want next and I will do it.
