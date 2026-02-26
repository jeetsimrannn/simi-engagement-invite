const ADMIN_PIN = "4580";
const SESSION_KEY = "engagement_admin_unlocked";

const authCard = document.getElementById("authCard");
const authForm = document.getElementById("authForm");
const authError = document.getElementById("authError");
const dashboard = document.getElementById("dashboard");
const lockDashboard = document.getElementById("lockDashboard");
const storageMode = document.getElementById("storageMode");

function unlock() {
  authCard.hidden = true;
  dashboard.hidden = false;
  storageMode.textContent = "Backend: Disabled";
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = String(new FormData(authForm).get("adminPin") || "").trim();

  if (pin !== ADMIN_PIN) {
    authError.hidden = false;
    return;
  }

  authError.hidden = true;
  sessionStorage.setItem(SESSION_KEY, "true");
  authForm.reset();
  unlock();
});

lockDashboard.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  dashboard.hidden = true;
  authCard.hidden = false;
});

if (sessionStorage.getItem(SESSION_KEY) === "true") {
  unlock();
}
