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
  totalSeconds = Math.floor(totalSeconds || 0);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return hours + "h " + minutes + "m";
  }

  return minutes + "m";
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

  document.getElementById("userEmail").textContent = currentUser.email;

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

  const { data, error } = await supabaseClient

    .from("study_sessions")

    .select("*")

    .eq("user_id", currentUser.id)

    .order("study_date", {
      ascending: false,
    });

  if (error) {
    console.error("Error:", error);

    return;
  }

  updateStatistics(data);
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

    totalSeconds += seconds;

    if (row.study_date === today) {
      todaySeconds = seconds;
    }
  });

  document.getElementById("todayTime").textContent =
    formatStudyTime(todaySeconds);

  document.getElementById("totalTime").textContent =
    formatStudyTime(totalSeconds);

  calculateStreak(data);

  displayHistory(data);
}

// ==========================================
// CALCULATE STREAK
// ==========================================

function calculateStreak(data) {
  const studyDates = data

    .filter((row) => row.duration_seconds > 0)

    .map((row) => row.study_date);

  if (studyDates.length === 0) {
    document.getElementById("streak").textContent = "0 days";

    return;
  }

  const uniqueDates = [...new Set(studyDates)];

  uniqueDates.sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;

  let checkDate = new Date();

  // Remove time

  checkDate.setHours(0, 0, 0, 0);

  // If user hasn't studied today,
  // check if they studied yesterday

  const todayString = checkDate.toISOString().split("T")[0];

  if (uniqueDates[0] !== todayString) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const dateString of uniqueDates) {
    const expected = checkDate.toISOString().split("T")[0];

    if (dateString === expected) {
      streak++;

      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  document.getElementById("streak").textContent = streak + " days";
}

// ==========================================
// DISPLAY HISTORY
// ==========================================

function displayHistory(data) {
  const historyList = document.getElementById("historyList");

  if (data.length === 0) {
    historyList.innerHTML = `

            <p class="loading">

                No study history yet.

            </p>

        `;

    return;
  }

  // Show last 7 days

  const recentData = data.slice(0, 7);

  historyList.innerHTML = "";

  recentData.forEach((row) => {
    const div = document.createElement("div");

    div.className = "history-row";

    div.innerHTML = `

                <span>

                    ${formatDate(row.study_date)}

                </span>


                <span class="history-time">

                    ${formatStudyTime(row.duration_seconds)}

                </span>

            `;

    historyList.appendChild(div);
  });
}

// ==========================================
// LOGOUT
// ==========================================

document
  .getElementById("logoutBtn")
  .addEventListener("click", async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error(error);

      return;
    }

    window.location.href = "login.html";
  });

// ==========================================
// INITIALIZE
// ==========================================

async function initializeAccount() {
  await loadProfile();

  await loadStudyData();
}

initializeAccount();
