"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Moon, Sun, Waves } from "lucide-react";

function readDarkTheme(): boolean {
  try {
    return window.localStorage.getItem("edc-moments-theme") === "dark";
  } catch (error) {
    console.warn("Could not read the saved EDC Moments theme preference.", error);
    return false;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const applySavedTheme = () => {
      const isDark = readDarkTheme();
      setDark(isDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    };
    const frame = window.requestAnimationFrame(applySavedTheme);
    window.addEventListener("storage", applySavedTheme);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", applySavedTheme);
    };
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    try {
      window.localStorage.setItem("edc-moments-theme", next ? "dark" : "light");
    } catch (error) {
      console.warn("Could not persist the EDC Moments theme preference.", error);
    }
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }

  return (
    <>
      <Link href="#main-content" className="skip-link">Skip to content</Link>
      <header className="site-header">
        <div className="nav-inner">
          <Link href="/" className="brand" aria-label="EDC Moments home">
            <span className="brand-mark"><Waves size={21} strokeWidth={2.5} /></span>
            <span className="brand-copy">
              <strong>EDC <span>Moments</span></strong>
              <small>ECOLAB DIGITAL CENTER</small>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link className="nav-link" href="/">Home</Link>
            <Link className="nav-link" href="/booth">Photo booth</Link>
            <Link className="nav-link" href="/gallery">Gallery</Link>
            <Link className="nav-link" href="/admin">Frame admin</Link>
          </nav>
          <div className="nav-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link href="/booth" className="button button-primary nav-cta"><Camera size={16} /> Start booth</Link>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-inner">
          <Link href="/" className="brand footer-brand">
            <span className="brand-mark"><Waves size={19} strokeWidth={2.5} /></span>
            <span className="brand-copy"><strong>EDC <span>Moments</span></strong><small>MADE FOR THE MOMENTS THAT MATTER</small></span>
          </Link>
          <p>Made with care at Ecolab Digital Center · Bangalore, India</p>
          <span className="privacy-note">Your photos stay on this device.</span>
        </div>
      </footer>
      <ServiceWorkerRegistration />
    </>
  );
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      const appScope = `${window.location.origin}/`;
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) => registration.scope === appScope)
              .map((registration) => registration.unregister())
          )
        )
        .then(() => caches.delete("edc-moments-v1"))
        .catch((error: unknown) => {
          console.warn("Could not disable stale offline caches in development.", error);
        });
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("EDC Moments offline support could not be registered.", error);
    });
  }, []);
  return null;
}
