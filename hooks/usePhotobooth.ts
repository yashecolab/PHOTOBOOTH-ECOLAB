"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export function usePhotobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captured, setCaptured] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  const startCamera = useCallback(async () => {
    setPermissionError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("This browser does not support camera access. Try a current version of Chrome, Safari, or Edge.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 }
        }
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      return true;
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setPermissionError("Camera access was blocked. Allow camera permission in your browser settings, then try again.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPermissionError("No camera was found. Connect or enable a camera and try again.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setPermissionError("Your camera is already in use by another app. Close it and try again.");
      } else {
        setPermissionError("We couldn’t start your camera. Check your browser permission and try again.");
      }
      console.error("Camera access failed.", error);
      return false;
    }
  }, []);

  const captureFour = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || !video.videoWidth || capturing) return;
    setCapturing(true);
    setCaptured([]);
    const images: string[] = [];
    try {
      for (let photoIndex = 0; photoIndex < 4; photoIndex += 1) {
        for (let number = 3; number > 0; number -= 1) {
          setCountdown(number);
          await wait(1000);
          if (!streamRef.current?.active) throw new Error("The camera disconnected during capture.");
        }
        setCountdown(null);
        const canvas = document.createElement("canvas");
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        const scale = Math.min(1, 800 / sourceWidth);
        canvas.width = Math.round(sourceWidth * scale);
        canvas.height = Math.round(sourceHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser could not prepare your photo.");
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        images.push(canvas.toDataURL("image/jpeg", 0.82));
        setCaptured([...images]);
        setFlash(true);
        await wait(410);
        setFlash(false);
        if (photoIndex < 3) await wait(600);
      }
      return images;
    } finally {
      setCountdown(null);
      setFlash(false);
      setCapturing(false);
    }
  }, [capturing]);

  const clearCaptured = useCallback(() => setCaptured([]), []);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return {
    videoRef,
    cameraReady,
    permissionError,
    countdown,
    captured,
    capturing,
    flash,
    startCamera,
    captureFour,
    clearCaptured
  };
}
