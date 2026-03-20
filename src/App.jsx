import { useEffect, useRef, useState } from "react";
import videoSrc from "./assets/video.mp4";
import "./App.css";

export default function App() {
  const [ready, setReady] = useState(false);

  const videoRef = useRef(null);
  const tapHintRef = useRef(null);
  const targetRef = useRef(null);

  const userEnabledSoundRef = useRef(false);

  // (Optional) your "disable inspect" stuff — doesn't really secure anything, but kept as-is
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === "U")
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Load scripts ONCE and render scene only after they're ready
  useEffect(() => {
    const loadScriptOnce = (id, src) =>
      new Promise((resolve, reject) => {
        if (document.getElementById(id)) return resolve();

        const s = document.createElement("script");
        s.id = id;
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadScriptOnce("aframe-script", "https://aframe.io/releases/1.4.2/aframe.min.js");
        await loadScriptOnce(
          "mindar-script",
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"
        );
        setReady(true);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Wire up video + target events AFTER scene exists
  useEffect(() => {
    if (!ready) return;

    const video = videoRef.current;
    const tapHint = tapHintRef.current;
    const targetEl = targetRef.current;

    if (!video || !tapHint || !targetEl) return;

    // autoplay policy: start muted
    video.muted = true;
    video.playsInline = true;

    const onTargetFound = async () => {
      try {
        video.muted = !userEnabledSoundRef.current;
        await video.play();
      } catch (e) {}
    };

    const onTargetLost = () => {
      video.pause();
    };

    const enableSound = async () => {
      userEnabledSoundRef.current = true;
      video.muted = false;
      video.volume = 1.0;

      try {
        await video.play();
      } catch (e) {}

      tapHint.style.display = "none";
      document.body.removeEventListener("click", enableSound);
      document.body.removeEventListener("touchstart", enableSound);
    };

    targetEl.addEventListener("targetFound", onTargetFound);
    targetEl.addEventListener("targetLost", onTargetLost);

    document.body.addEventListener("click", enableSound, { passive: true });
    document.body.addEventListener("touchstart", enableSound, { passive: true });

    return () => {
      targetEl.removeEventListener("targetFound", onTargetFound);
      targetEl.removeEventListener("targetLost", onTargetLost);
      document.body.removeEventListener("click", enableSound);
      document.body.removeEventListener("touchstart", enableSound);
    };
  }, [ready]);

  if (!ready) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        Loading AR...
      </div>
    );
  }

  return (
    <>
      <div id="tapHint" ref={tapHintRef}>
        Tap to unmute 🔊
      </div>

      <a-scene
        embedded
        mindar-image={`
          imageTargetSrc: /targets.mind;
          filterMinCF: 0.001;
          filterBeta: 0.01;
        `}
        renderer="alpha: true"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: true"
      >
        <a-assets>
          <video
            id="video"
            ref={videoRef}
            src={videoSrc}
            loop
            muted
            playsInline
            crossOrigin="anonymous"
          />
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" />

        <a-entity id="target0" ref={targetRef} mindar-image-target="targetIndex: 0">
          <a-video src="#video" width="1" height="1" position="0 0 0" />
        </a-entity>
      </a-scene>
    </>
  );
}
