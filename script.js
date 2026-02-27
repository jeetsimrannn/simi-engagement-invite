const EVENT_DATE_ISO = "2026-03-14T18:30:00";

const countdownIds = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

const inviteIntro = document.getElementById("inviteIntro");
const envelopeMedia = document.getElementById("envelopeMedia");
const introVideo = document.getElementById("introVideo");
const heroBgVideo = document.getElementById("heroBgVideo");
const bgAudio = document.getElementById("bgAudio");
const audioToggle = document.getElementById("audioToggle");
const INTRO_VISIBLE_MS = 2500;
let introTimeoutId = null;
let heroVideoPrimed = false;
let bgAudioStarted = false;
let introAutoStarted = false;
const audioStartEvents = ["pointerdown", "touchstart", "keydown"];

function updateAudioToggleState() {
  if (!audioToggle || !bgAudio) return;
  const isMuted = bgAudio.muted || bgAudio.paused;
  audioToggle.classList.toggle("is-muted", isMuted);
  audioToggle.setAttribute("aria-label", isMuted ? "Unmute background music" : "Mute background music");
}

async function startBackgroundAudioWithIntro() {
  if (!bgAudio) return;
  bgAudio.loop = true;
  if (!bgAudioStarted) {
    bgAudio.currentTime = 0;
  }
  bgAudio.volume = 0.42;
  bgAudio.muted = false;
  try {
    await bgAudio.play();
    bgAudioStarted = true;
    removeAudioStartFallbackListeners();
  } catch {
    // Ignore playback blocking; fallback listeners will retry on interaction.
  }
  updateAudioToggleState();
}

async function handleAudioStartFallback() {
  if (bgAudioStarted) return;
  await startBackgroundAudioWithIntro();
}

function addAudioStartFallbackListeners() {
  audioStartEvents.forEach((eventName) => {
    window.addEventListener(eventName, handleAudioStartFallback, { passive: true });
  });
}

function removeAudioStartFallbackListeners() {
  audioStartEvents.forEach((eventName) => {
    window.removeEventListener(eventName, handleAudioStartFallback);
  });
}

function tickCountdown() {
  if (!countdownIds.days || !countdownIds.hours || !countdownIds.minutes || !countdownIds.seconds) return;

  const target = new Date(EVENT_DATE_ISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownIds.days.textContent = days;
  countdownIds.hours.textContent = hours;
  countdownIds.minutes.textContent = minutes;
  countdownIds.seconds.textContent = seconds;
}

async function hideIntro() {
  if (!inviteIntro || inviteIntro.hidden) return;
  if (introTimeoutId) {
    clearTimeout(introTimeoutId);
    introTimeoutId = null;
  }
  inviteIntro.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
  // Start hero video immediately so video and line-by-line text reveal run together.
  startHeroBgVideo();
  startBackgroundAudioWithIntro();
  document.body.classList.add("intro-complete");
  setTimeout(() => {
    inviteIntro.hidden = true;
  }, 760);
}

async function startHeroBgVideo() {
  if (!heroBgVideo) return;
  heroBgVideo.muted = true;
  heroBgVideo.playsInline = true;
  if (!heroVideoPrimed) {
    heroBgVideo.currentTime = 0;
  }
  document.body.classList.add("hero-video-visible");
  try {
    await heroBgVideo.play();
  } catch {
    // Ignore playback blocking and keep the hero visible.
  }
}

async function primeHeroBgVideoFromGesture() {
  if (!heroBgVideo || heroVideoPrimed) return;
  heroBgVideo.muted = true;
  heroBgVideo.playsInline = true;
  heroBgVideo.currentTime = 0;
  try {
    await heroBgVideo.play();
    heroBgVideo.pause();
    heroBgVideo.currentTime = 0;
    heroVideoPrimed = true;
  } catch {
    // If priming fails, startHeroBgVideo will retry later.
  }
}

if (inviteIntro) {
  document.body.classList.remove("intro-complete");
  document.body.classList.add("intro-active");
  const startIntroExperience = async () => {
    if (introAutoStarted || inviteIntro.classList.contains("is-opening")) return;
    introAutoStarted = true;
    inviteIntro.classList.add("is-opening");
    await primeHeroBgVideoFromGesture();
    if (introVideo) {
      introVideo.currentTime = 0;
      introVideo.playbackRate = 2;
      try {
        await introVideo.play();
      } catch {
        // If intro video autoplay fails, continue to reveal after fallback timeout.
      }
    }
    introTimeoutId = setTimeout(hideIntro, INTRO_VISIBLE_MS);
  };

  window.addEventListener("load", startIntroExperience, { once: true });
  setTimeout(startIntroExperience, 120);
}

if (bgAudio) {
  bgAudio.loop = true;
  bgAudio.volume = 0.42;
  bgAudio.muted = true;
  addAudioStartFallbackListeners();
  updateAudioToggleState();
}

audioToggle?.addEventListener("click", async () => {
  if (!bgAudio) return;

  if (!bgAudioStarted || bgAudio.paused) {
    if (!bgAudioStarted) {
      bgAudio.currentTime = 0;
    }
    bgAudio.muted = false;
    try {
      await bgAudio.play();
      bgAudioStarted = true;
      removeAudioStartFallbackListeners();
    } catch {
      bgAudio.muted = true;
      updateAudioToggleState();
      return;
    }
    updateAudioToggleState();
    return;
  }

  bgAudio.muted = !bgAudio.muted;
  updateAudioToggleState();
});

if (!inviteIntro) {
  document.body.classList.remove("intro-active");
  document.body.classList.add("intro-complete");
  document.body.classList.add("hero-video-visible");
  startHeroBgVideo();
}

if (!envelopeMedia && inviteIntro) {
  setTimeout(() => {
    hideIntro();
  }, 2000);
}

if (introVideo) {
  introVideo.addEventListener("ended", hideIntro);
  introVideo.addEventListener("error", () => {
    setTimeout(hideIntro, 1800);
  });
}

if (heroBgVideo) {
  heroBgVideo.addEventListener("ended", () => {
    // Hold the final frame instead of replaying.
    heroBgVideo.pause();
  });
}

const revealItems = Array.from(document.querySelectorAll(".reveal-on-scroll"));

if (revealItems.length) {
  document.body.classList.add("motion-enabled");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.22 }
    );
    revealItems.forEach((el) => observer.observe(el));
  }
}

const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));

if (parallaxItems.length) {
  let parallaxTicking = false;

  const updateParallax = () => {
    const viewportCenter = window.innerHeight / 2;
    parallaxItems.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const factor = Number(el.dataset.parallax || 0.06);
      const delta = (viewportCenter - elementCenter) * factor * 0.14;
      const shift = Math.max(-18, Math.min(18, delta));
      el.style.setProperty("--parallax-shift", `${shift.toFixed(2)}px`);
    });
    parallaxTicking = false;
  };

  const onScroll = () => {
    if (parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(updateParallax);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateParallax);
  updateParallax();
}

const ceremonyTabs = Array.from(document.querySelectorAll(".ceremony-tab"));
const ceremonyPanelsWrap = document.getElementById("ceremonyPanels");
const ceremonyPanels = Array.from(document.querySelectorAll(".ceremony-panel"));
const ceremonyTabsIndicator = document.querySelector(".ceremony-tabs-indicator");
let ceremonySwitchTimer = null;

function positionCeremonyIndicator(activeTab) {
  if (!ceremonyTabsIndicator || !activeTab) return;
  ceremonyTabsIndicator.style.width = `${activeTab.offsetWidth}px`;
  ceremonyTabsIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
}

function setActiveCeremonyPanel(targetPanelKey, shouldAnimate = true) {
  const nextTab = ceremonyTabs.find((tab) => tab.dataset.target === targetPanelKey);
  const nextPanel = ceremonyPanels.find((panel) => panel.dataset.panel === targetPanelKey);
  if (!nextTab || !nextPanel) return;

  const applySwitch = () => {
    ceremonyTabs.forEach((tab) => {
      const isActive = tab === nextTab;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    ceremonyPanels.forEach((panel) => {
      const isActive = panel === nextPanel;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });

    positionCeremonyIndicator(nextTab);
  };

  if (!ceremonyPanelsWrap || !shouldAnimate) {
    applySwitch();
    return;
  }

  ceremonyPanelsWrap.classList.add("is-fading");
  if (ceremonySwitchTimer) clearTimeout(ceremonySwitchTimer);

  ceremonySwitchTimer = setTimeout(() => {
    applySwitch();
    requestAnimationFrame(() => {
      ceremonyPanelsWrap.classList.remove("is-fading");
    });
  }, 140);
}

if (ceremonyTabs.length && ceremonyPanels.length) {
  ceremonyTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.classList.contains("is-active")) return;
      setActiveCeremonyPanel(tab.dataset.target);
    });
  });

  const initialActiveTab = ceremonyTabs.find((tab) => tab.classList.contains("is-active")) || ceremonyTabs[0];
  if (initialActiveTab) setActiveCeremonyPanel(initialActiveTab.dataset.target, false);
  window.addEventListener("resize", () => {
    const activeTab = ceremonyTabs.find((tab) => tab.classList.contains("is-active"));
    if (activeTab) positionCeremonyIndicator(activeTab);
  });
}

tickCountdown();
setInterval(tickCountdown, 1000);
