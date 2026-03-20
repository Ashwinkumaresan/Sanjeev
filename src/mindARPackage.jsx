import { useEffect } from "react";
import "aframe";
import "mind-ar/dist/mindar-image-aframe.prod.js";

import videoSrc from "./assets/video.mp4";
import "./App.css";

export default function App() {

  /* 🔒 Disable right click + dev tools */
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

  /* 🔁 Force all routes to "/" */
  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  /* 🎥 MindAR logic */
  useEffect(() => {
    const video = document.getElementById("video");
    const tapHint = document.getElementById("tapHint");
    const targetEl = document.getElementById("target0");

    if (!video || !targetEl) return;

    let userEnabledSound = false;
    video.muted = true;

    targetEl.addEventListener("targetFound", async () => {
      try {
        video.muted = !userEnabledSound;
        await video.play();
      } catch {}
    });

    targetEl.addEventListener("targetLost", () => {
      video.pause();
    });

    const enableSound = async () => {
      userEnabledSound = true;
      video.muted = false;
      video.volume = 1.0;

      try {
        await video.play();
      } catch {}

      tapHint.style.display = "none";
      document.body.removeEventListener("click", enableSound);
      document.body.removeEventListener("touchstart", enableSound);
    };

    document.body.addEventListener("click", enableSound);
    document.body.addEventListener("touchstart", enableSound);

    return () => {
      document.body.removeEventListener("click", enableSound);
      document.body.removeEventListener("touchstart", enableSound);
    };
  }, []);

  return (
    <>
      <div id="tapHint">Tap to unmute 🔊</div>

      <a-scene
        embedded
        mindar-image="
          imageTargetSrc: targets.mind;
          filterMinCF: 0.001;
          filterBeta: 0.01;
        "
        renderer="alpha: true"
        vr-mode-ui="enabled:false"
        device-orientation-permission-ui="enabled:true"
      >
        <a-assets>
          <video
            id="video"
            src={videoSrc}
            loop
            muted
            playsInline
            crossOrigin="anonymous"
          />
        </a-assets>

        <a-camera
          position="0 0 0"
          look-controls="enabled:false"
        ></a-camera>

        <a-entity id="target0" mindar-image-target="targetIndex: 0">
          <a-video
            src="#video"
            width="1"
            height="1"
            position="0 0 0"
          ></a-video>
        </a-entity>
      </a-scene>
    </>
  );
}
