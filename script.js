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
const INTRO_VISIBLE_MS = 2500;
let introTimeoutId = null;
let heroVideoPrimed = false;

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

function hideIntro() {
  if (!inviteIntro || inviteIntro.hidden) return;
  if (introTimeoutId) {
    clearTimeout(introTimeoutId);
    introTimeoutId = null;
  }
  inviteIntro.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
  // Start hero video immediately so video and line-by-line text reveal run together.
  startHeroBgVideo();
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
  envelopeMedia?.addEventListener("click", async () => {
    if (inviteIntro.classList.contains("is-opening")) return;
    inviteIntro.classList.add("is-opening");
    await primeHeroBgVideoFromGesture();
    if (introVideo) {
      introVideo.currentTime = 0;
      introVideo.playbackRate = 2;
      try {
        await introVideo.play();
      } catch {
        // If intro video cannot autoplay, continue anyway.
      }
    }
    introTimeoutId = setTimeout(hideIntro, INTRO_VISIBLE_MS);
  });

  envelopeMedia?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      envelopeMedia.click();
    }
  });
}

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
  setTimeout(() => {
    if (inviteIntro?.classList.contains("is-opening") && !inviteIntro.hidden) {
      hideIntro();
    }
  }, 4500);
}

if (heroBgVideo) {
  heroBgVideo.addEventListener("ended", () => {
    // Hold the final frame instead of replaying.
    heroBgVideo.pause();
  });
}

const revealUpItems = Array.from(document.querySelectorAll(".reveal-up"));

if (revealUpItems.length) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    revealUpItems.forEach((el) => el.classList.add("is-visible"));
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
    revealUpItems.forEach((el) => observer.observe(el));
  }
}

tickCountdown();
setInterval(tickCountdown, 1000);
