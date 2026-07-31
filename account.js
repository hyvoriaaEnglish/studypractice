console.log("ACCOUNT.JS IS RUNNING");

let currentUser = null;

// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Get user error:", error);
    window.location.href = "login.html";
    return null;
  }

  if (!data.user) {
    console.log("No logged-in user.");
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
    return false;
  }

  console.log("Current User ID:", currentUser.id);
  console.log("Current User Email:", currentUser.email);

  const emailElement = document.getElementById("userEmail");

  const nameElement = document.getElementById("userName");

  if (emailElement) {
    emailElement.textContent = currentUser.email || "";
  }

  const fullName = currentUser.user_metadata?.full_name;

  if (fullName && nameElement) {
    nameElement.textContent = fullName;
  }

  return true;
}

// ==========================================
// LOAD STUDY DATA
// ==========================================

async function loadStudyData() {
  if (!currentUser) {
    console.log("No current user. Cannot load study data.");
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

    const historyList = document.getElementById("historyList");

    if (historyList) {
      historyList.innerHTML =
        '<p class="loading">Could not load study history.</p>';
    }

    return;
  }

  updateStatistics(data || []);
}

// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics(data) {
  console.log("Updating statistics:", data);

  const today = new Date().toISOString().split("T")[0];

  let todaySeconds = 0;

  let totalSeconds = 0;

  data.forEach(function (row) {
    const seconds = Number(row.duration_seconds) || 0;

    totalSeconds += seconds;

    if (row.study_date === today) {
      todaySeconds += seconds;
    }
  });

  const todayElement = document.getElementById("todayTime");

  const totalElement = document.getElementById("totalTime");

  if (todayElement) {
    todayElement.textContent = formatStudyTime(todaySeconds);
  }

  if (totalElement) {
    totalElement.textContent = formatStudyTime(totalSeconds);
  }

  calculateStreak(data);

  displayHistory(data);
}

// ==========================================
// CALCULATE STREAK
// ==========================================

function calculateStreak(data) {
  const streakElement = document.getElementById("streak");

  if (!streakElement) {
    return;
  }

  const studyDates = data
    .filter(function (row) {
      return Number(row.duration_seconds) > 0;
    })
    .map(function (row) {
      return row.study_date;
    });

  if (studyDates.length === 0) {
    streakElement.textContent = "0 days";
    return;
  }

  const uniqueDates = [...new Set(studyDates)];

  uniqueDates.sort(function (a, b) {
    return new Date(b) - new Date(a);
  });

  let streak = 0;

  let checkDate = new Date();

  checkDate.setHours(0, 0, 0, 0);

  const todayString = checkDate.toISOString().split("T")[0];

  if (uniqueDates[0] !== todayString) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const dateString of uniqueDates) {
    const expectedDate = checkDate.toISOString().split("T")[0];

    if (dateString === expectedDate) {
      streak++;

      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  streakElement.textContent = streak + " days";
}

// ==========================================
// DISPLAY STUDY HISTORY
// ==========================================

function displayHistory(data) {
  console.log("Displaying history:", data);

  const historyList = document.getElementById("historyList");

  if (!historyList) {
    console.error("Cannot find #historyList in account.html");
    return;
  }

  historyList.innerHTML = "";

  if (!data || data.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "loading";

    emptyMessage.textContent = "No study history yet.";

    historyList.appendChild(emptyMessage);

    return;
  }

  // Chỉ hiển thị 7 ngày gần nhất

  const recentData = data.slice(0, 7);

  recentData.forEach(function (row) {
    const div = document.createElement("div");

    div.className = "history-row";

    // Ngày

    const dateSpan = document.createElement("span");

    dateSpan.textContent = formatDate(row.study_date);

    // Thời gian

    const timeSpan = document.createElement("span");

    timeSpan.className = "history-time";

    timeSpan.textContent = formatStudyTime(row.duration_seconds);

    // Thêm vào dòng

    div.appendChild(dateSpan);

    div.appendChild(timeSpan);

    // Thêm dòng vào lịch sử

    historyList.appendChild(div);
  });

  console.log("Study history displayed successfully.");
}

// ==========================================
// LOAD MY COURSES
// ==========================================

async function loadMyCourses() {
  if (!currentUser) {
    console.log("No current user. Cannot load courses.");
    return;
  }

  console.log("Loading my courses...");

  console.log("Current User ID:", currentUser.id);

  const coursesContainer = document.getElementById("myCourses");

  if (!coursesContainer) {
    console.error("Cannot find #myCourses in account.html");

    return;
  }

  const { data, error } = await supabaseClient
    .from("user_courses")
    .select("course_id")
    .eq("user_id", currentUser.id);

  console.log("My Courses:", data);

  console.log("Course Error:", error);

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    console.error("Error loading courses:", error);

    coursesContainer.innerHTML =
      '<p class="loading">Could not load your courses.</p>';

    return;
  }

  // ==========================================
  // NO COURSE
  // ==========================================

  if (!data || data.length === 0) {
    coursesContainer.innerHTML =
      '<p class="loading">You have not purchased any courses yet.</p>';

    return;
  }

  // ==========================================
  // CLEAR LOADING
  // ==========================================

  coursesContainer.innerHTML = "";

  // ==========================================
  // DISPLAY COURSES
  // ==========================================

  data.forEach(function (item) {
    const courseDiv = document.createElement("div");

    courseDiv.className = "history-row";

    courseDiv.innerHTML = `
      <div>
        <strong>English Course</strong>
      </div>

      <a
  href="/course/trangchu2.html"
  class="home-btn"
>
  Start Learning
</a>
    `;

    coursesContainer.appendChild(courseDiv);
  });

  console.log("My courses displayed successfully.");
}

// ==========================================
// AUTO REFRESH WHEN TRACKER SAVES
// ==========================================

window.addEventListener("studyTimeUpdated", async function () {
  console.log("Study time updated. Refreshing account...");

  await loadStudyData();
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
// INITIALIZE ACCOUNT
// ==========================================

async function initializeAccount() {
  console.log("Initializing account...");

  const userLoaded = await loadProfile();

  if (!userLoaded) {
    return;
  }

  // Load study information

  await loadStudyData();

  // Load purchased courses

  await loadMyCourses();

  console.log("Account initialized successfully.");
}

// ==========================================
// START ACCOUNT
// ==========================================

initializeAccount();
