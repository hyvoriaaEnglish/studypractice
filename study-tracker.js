let trackerUser = null;

let studySeconds = 0;

let lastTimestamp = null;

let isTracking = false;

let saveTimer = null;

let countTimer = null;

let isSaving = false;

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
      console.log("No logged-in user. Tracker stopped.");

      return;
    }

    console.log("Study tracker started:", trackerUser.email);

    console.log("Tracker User ID:", trackerUser.id);

    startTracking();
  } catch (error) {
    console.error("Tracker initialization error:", error);
  }
}

// ==========================================
// BẮT ĐẦU ĐẾM
// ==========================================

function startTracking() {
  if (isTracking) {
    return;
  }

  isTracking = true;

  lastTimestamp = Date.now();

  // Đếm thời gian mỗi giây

  countTimer = setInterval(updateStudyTime, 1000);

  // Lưu lên Supabase mỗi 10 giây

  saveTimer = setInterval(saveStudyTime, 10000);

  console.log("Study tracking is running.");
}

// ==========================================
// CỘNG THỜI GIAN
// ==========================================

function updateStudyTime() {
  if (!isTracking || !trackerUser || !lastTimestamp) {
    return;
  }

  const now = Date.now();

  const elapsed = Math.floor((now - lastTimestamp) / 1000);

  if (elapsed > 0 && elapsed <= 10) {
    studySeconds += elapsed;
  }

  lastTimestamp = now;
}

// ==========================================
// LƯU THỜI GIAN LÊN SUPABASE
// ==========================================

async function saveStudyTime() {
  if (!trackerUser || studySeconds <= 0 || isSaving) {
    return;
  }

  // Cập nhật thời gian
  // trước khi lưu

  updateStudyTime();

  if (studySeconds <= 0) {
    return;
  }

  isSaving = true;

  // Số giây cần lưu

  const secondsToSave = studySeconds;

  // Reset bộ đếm tạm thời

  studySeconds = 0;

  // Ngày hiện tại

  const today = new Date().toISOString().split("T")[0];

  try {
    console.log("Saving study time:", secondsToSave, "seconds");

    console.log("Saving for User ID:", trackerUser.id);

    // ==========================================
    // TÌM DỮ LIỆU HÔM NAY
    // ==========================================

    const { data: existingRecord, error: selectError } = await supabaseClient

      .from("study_sessions")

      .select("id, user_id, study_date, duration_seconds")

      .eq("user_id", trackerUser.id)

      .eq("study_date", today)

      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    // ==========================================
    // ĐÃ CÓ DỮ LIỆU HÔM NAY
    // ==========================================

    if (existingRecord) {
      const newDuration =
        Number(existingRecord.duration_seconds || 0) + secondsToSave;

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

      console.log("Study time updated:", newDuration, "seconds");
    }

    // ==========================================
    // CHƯA CÓ DỮ LIỆU HÔM NAY
    // ==========================================
    else {
      const { data: insertedData, error: insertError } = await supabaseClient

        .from("study_sessions")

        .insert({
          user_id: trackerUser.id,

          study_date: today,

          duration_seconds: secondsToSave,
        })

        .select();

      if (insertError) {
        throw insertError;
      }

      console.log("New study session created:", insertedData);
    }
  } catch (error) {
    console.error("Could not save study time:", error);

    // Nếu lưu thất bại
    // trả lại thời gian

    studySeconds += secondsToSave;
  } finally {
    isSaving = false;
  }
}

// ==========================================
// KHI CHUYỂN TAB
// ==========================================

document.addEventListener(
  "visibilitychange",

  async function () {
    // Người dùng rời tab

    if (document.visibilityState === "hidden") {
      updateStudyTime();

      isTracking = false;

      await saveStudyTime();

      console.log("Study tracker paused.");
    }

    // Người dùng quay lại tab
    else {
      lastTimestamp = Date.now();

      isTracking = true;

      console.log("Study tracker resumed.");
    }
  },
);

// ==========================================
// KHI RỜI TRANG
// ==========================================

window.addEventListener(
  "pagehide",

  function () {
    updateStudyTime();

    // Cố gắng lưu thời gian
    // trước khi rời trang

    saveStudyTime();
  },
);

// ==========================================
// KHỞI ĐỘNG
// ==========================================

initializeStudyTracker();
