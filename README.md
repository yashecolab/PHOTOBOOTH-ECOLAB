# EDC Moments — Ecolab Digital Center Photobooth

A polished, responsive photo-booth web app for Ecolab Digital Center events. Built with Next.js 16 App Router, React, TypeScript, Tailwind CSS, Framer Motion, Fabric.js, and html2canvas.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Camera access works on `localhost`; deployed camera access requires HTTPS. Use a current browser and allow camera permission when prompted.

Available scripts:

```bash
npm run dev       # Start the local development server
npm run build     # Build the production application
npm run start     # Serve the production build
npm run typecheck # Run the TypeScript compiler
npm run lint      # Run Next.js ESLint checks
```

## What’s included

- Landing page, accessible navigation, light/dark theme, five event frame designs, and sample event choices.
- Four-shot webcam capture with countdown, progress, flash, review, and retake.
- Customizable strip with name, event, date, draggable Fabric.js stickers, and draggable photo crops.
- PNG, JPG, and PDF exports; native device sharing where available, with a download fallback.
- Browser-local gallery with search, event filter, likes, sharing, and download-again.
- Local frame studio at `/admin` for editing built-in designs and adding custom frames with transparent PNG overlays.
- Installable web app manifest and a service worker that caches the app shell and visited same-origin resources for offline revisits.

## Privacy and browser-only storage

Camera frames are captured in the browser and are not uploaded. Saved gallery images, likes, and theme preference stay in that browser’s local storage; in-progress captures stay in session storage. Clearing browser site data removes the local gallery. Browser storage has finite capacity, so only a limited number of memories are retained.

Frame metadata and uploaded PNG overlays are stored in this browser’s IndexedDB. The `/admin` page is an unlocked, device-local editor; it does not provide administrator authentication or share changes with other devices. Keep frame overlays to 5 MB or less. Clearing browser site data removes locally managed frames and overlays; built-in defaults can be restored from the editor.

The gallery is personal to the current browser, not a shared event feed. QR photo downloads and direct Teams uploads are intentionally not enabled: both require a hosted, cross-device photo URL or an organization-approved sharing integration. The Share button uses the device/browser share sheet when it supports photo files (which may include Teams if installed), and otherwise downloads the image.

Offline access improves after an online visit has cached the application. Camera support, browser storage, and native sharing depend on the device/browser; exports are generated client-side.

## Deploy to Vercel

1. Push this project to a Git provider and import it into [Vercel](https://vercel.com/new).
2. Keep the default Next.js framework preset and build command (`npm run build`).
3. Deploy. Vercel serves the app over HTTPS, which is required for camera access outside `localhost`.
4. Open the deployed site on the target device, allow camera permission, and optionally install it from the browser’s Add to Home Screen / Install action.

No environment variables or external image service are required.

## Project structure

```text
app/
  admin/page.tsx             # Browser-local frame studio
  booth/page.tsx             # Photo booth route
  gallery/page.tsx           # Personal gallery route
  globals.css                # Responsive design system and component styles
  layout.tsx                 # Metadata, manifest, and shared application shell
  page.tsx                   # Landing page
components/
  AppShell.tsx               # Navigation, theme toggle, and service worker registration
  BoothExperience.tsx        # Frame selection through photo-strip editing
  AdminFramesExperience.tsx  # Create, edit, upload, and manage local frames
  FabricStickerLayer.tsx     # Draggable Fabric.js sticker canvas
  GalleryExperience.tsx      # Local gallery, filters, likes, and sharing
  TemplateCard.tsx           # Reusable template and memory cards
  Toast.tsx                  # Accessible feedback
hooks/
  usePhotobooth.ts           # Camera lifecycle and four-photo capture sequence
  useFrameTemplates.ts       # Merges built-in and browser-local frame templates
lib/
  data.ts                    # Frame, sticker, and event mock data
  frame-storage.ts           # IndexedDB persistence for managed frames and PNG overlays
  export.ts                  # html2canvas and PDF/JPG/PNG export helpers
  storage.ts                 # Browser-local gallery and in-progress capture storage
  types.ts                   # Shared TypeScript domain types
public/
  icon.svg
  manifest.webmanifest
  offline.html
  sw.js
tailwind.config.mjs          # Ecolab theme tokens
```
