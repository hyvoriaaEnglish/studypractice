let trackerUser = null;
let studySeconds = 0;
let lastTimestamp = null;
let isTracking = false;
let saveTimer = null;
let countTimer = null;

// ==========================================
// LẤY USER ĐANG ĐĂNG NHẬP
// ==========================================

async function initializeStudyTracker() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Cannot get user:", error);
      return;
    }

    trackerUser = data.user;

    if (!trackerUser) {
      console.log("No logged-in user.");
      return;
    }

    console.log("Study tracker started:", trackerUser.email);

    startTracking();
  } catch (error) {
    console.error("Tracker error:", error);
  }
}

// ==========================================
// BẮT ĐẦU ĐẾM
// ==========================================

function startTracking() {
  isTracking = true;

  lastTimestamp = Date.now();

  // Cập nhật mỗi giây
  countTimer = setInterval(updateStudyTime, 1000);

  // Lưu lên Supabase mỗi 30 giây
  saveTimer = setInterval(saveStudyTime, 30000);
}

// ==========================================
// CỘNG THỜI GIAN
// ==========================================

function updateStudyTime() {
  if (!isTracking || !trackerUser) {
    return;
  }

  const now = Date.now();

  const elapsed = Math.floor((now - lastTimestamp) / 1000);

  if (elapsed > 0 && elapsed <= 5) {
    studySeconds += elapsed;
  }

  lastTimestamp = now;
}

// ==========================================
// LƯU THỜI GIAN LÊN SUPABASE
// ==========================================

async function saveStudyTime() {
  if (!trackerUser || studySeconds <= 0) {
    return;
  }

  updateStudyTime();

  if (studySeconds <= 0) {
    return;
  }

  const secondsToSave = studySeconds;

  studySeconds = 0;

  const today = new Date().toISOString().split("T")[0];

  try {
    const { data: existingRecord, error: selectError } = await supabaseClient

      .from("study_sessions")

      .select("id, duration_seconds")

      .eq("user_id", trackerUser.id)

      .eq("study_date", today)

      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    // Nếu hôm nay đã có dữ liệu
    if (existingRecord) {
      const newDuration =
        Number(existingRecord.duration_seconds) + secondsToSave;

      const { error: updateError } = await supabaseClient

        .from("study_sessions")

        .update({
          duration_seconds: newDuration,

          updated_at: new Date().toISOString(),
        })

        .eq("id", existingRecord.id);

      if (updateError) {
        throw updateError;
      }
    }

    // Nếu hôm nay chưa có dữ liệu
    else {
      const { error: insertError } = await supabaseClient

        .from("study_sessions")

        .insert({
          user_id: trackerUser.id,

          study_date: today,

          duration_seconds: secondsToSave,
        });

      if (insertError) {
        throw insertError;
      }
    }

    console.log("Saved study time:", secondsToSave, "seconds");
  } catch (error) {
    console.error("Could not save study time:", error);

    // Nếu lỗi thì không mất thời gian
    studySeconds += secondsToSave;
  }
}

// ==========================================
// KHI CHUYỂN TAB
// ==========================================

document.addEventListener("visibilitychange", async function () {
  if (document.visibilityState === "hidden") {
    updateStudyTime();

    isTracking = false;

    await saveStudyTime();

    console.log("Study tracker paused.");
  } else {
    lastTimestamp = Date.now();

    isTracking = true;

    console.log("Study tracker resumed.");
  }
});

// ==========================================
// KHI RỜI TRANG
// ==========================================

window.addEventListener("pagehide", function () {
  updateStudyTime();

  saveStudyTime();
});

// ==========================================
// KHỞI ĐỘNG
// ==========================================

initializeStudyTracker();
