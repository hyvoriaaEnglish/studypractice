console.log("ACCOUNT.JS IS RUNNING");

// ==========================================
// ACCOUNT PAGE
// ==========================================

let currentUser = null;

// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "login.html";
    return null;
  }

  return data.user;
}

// ==========================================
// FORMAT TIME
// ==========================================

function formatStudyTime(totalSeconds) {
  totalSeconds = Math.floor(Number(totalSeconds) || 0);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return hours + "h " + minutes + "m";
  }

  if (minutes > 0) {
    return minutes + "m " + seconds + "s";
  }

  return seconds + "s";
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ==========================================
// LOAD USER PROFILE
// ==========================================

async function loadProfile() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    return;
  }

  document.getElementById("userEmail").textContent = currentUser.email || "";

  const fullName = currentUser.user_metadata?.full_name;

  if (fullName) {
    document.getElementById("userName").textContent = fullName;
  }
}

// ==========================================
// LOAD STUDY DATA
// ==========================================

async function loadStudyData() {
  if (!currentUser) {
    return;
  }

  console.log("Loading study data...");

  console.log("Current User ID:", currentUser.id);

  const { data, error } = await supabaseClient
    .from("study_sessions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("study_date", {
      ascending: false,
    });

  console.log("Study Data:", data);

  console.log("Study Error:", error);

  if (error) {
    console.error("Error loading study data:", error);
    return;
  }

  updateStatistics(data || []);
}

// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics(data) {
  const today = new Date().toISOString().split("T")[0];

  let todaySeconds = 0;

  let totalSeconds = 0;

  data.forEach((row) => {
    const seconds = Number(row.duration_seconds) || 0;

    ```
totalSeconds += seconds;

if (row.study_date === today) {
  todaySeconds += seconds;
}
```;
  });

  // Today's Study Time

  document.getElementById("todayTime").textContent =
    formatStudyTime(todaySeconds);

  // Total Study Time

  document.getElementById("totalTime").textContent =
    formatStudyTime(totalSeconds);

  // Study Streak

  calculateStreak(data);

  // Study History

  displayHistory(data);
}

// ==========================================
// CALCULATE STREAK
// ==========================================

function calculateStreak(data) {
  const studyDates = data
    .filter((row) => Number(row.duration_seconds) > 0)
    .map((row) => row.study_date);

  if (studyDates.length === 0) {
    document.getElementById("streak").textContent = "0 days";
    return;
  }

  const uniqueDates = [...new Set(studyDates)];

  uniqueDates.sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;

  let checkDate = new Date();

  checkDate.setHours(0, 0, 0, 0);

  const todayString = checkDate.toISOString().split("T")[0];

  // Nếu hôm nay chưa học,
  // kiểm tra từ ngày hôm qua

  if (uniqueDates[0] !== todayString) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const dateString of uniqueDates) {
    const expected = checkDate.toISOString().split("T")[0];

    ```
if (dateString === expected) {
  streak++;

  checkDate.setDate(
    checkDate.getDate() - 1
  );
} else {
  break;
}
```;
  }

  document.getElementById("streak").textContent = streak + " days";
}

// ==========================================
// DISPLAY HISTORY
// ==========================================

function displayHistory(data) {
  const historyList = document.getElementById("historyList");

  if (!historyList) {
    return;
  }

  if (data.length === 0) {
    historyList.innerHTML = '<p class="loading">No study history yet.</p>';

    return;
  }

  // Show last 7 days
  const recentData = data.slice(0, 7);

  historyList.innerHTML = "";

  recentData.forEach((row) => {
    const div = document.createElement("div");

    div.className = "history-row";

    const dateSpan = document.createElement("span");
    dateSpan.textContent = formatDate(row.study_date);

    const timeSpan = document.createElement("span");
    timeSpan.className = "history-time";
    timeSpan.textContent = formatStudyTime(row.duration_seconds);

    div.appendChild(dateSpan);
    div.appendChild(timeSpan);

    historyList.appendChild(div);
  });
}

// ==========================================
// AUTO REFRESH AFTER STUDY TRACKER SAVES
// ==========================================

window.addEventListener("studyTimeUpdated", async function () {
  console.log("Study time changed. Refreshing account data...");

  ```
await loadStudyData();
```;
});

// ==========================================
// LOGOUT
// ==========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    window.location.href = "login.html";
  });
}
// ==========================================
// INITIALIZE
// ==========================================

async function initializeAccount() {
  await loadProfile();

  await loadStudyData();
}

initializeAccount();
