import { ref, get, set, update } from "firebase/database";
import { db } from "./firebase";
import {
  LOVE_RESPONSES_PATH,
  LOVE_SUBMITTED_KEY,
  LOVE_ANSWERS_KEY,
  LOVE_DRAFT_STEP_KEY,
  LOVE_RESPONSE_KEY,
  LOVE_ADMIN_REPLY_SEEN_KEY,
  getLatestAdminActivity,
} from "./loveFormHelpers";

export const getLoveFormRef = (uid) =>
  ref(db, `${LOVE_RESPONSES_PATH}/${uid}`);

export const clearLoveFormLocalStorage = () => {
  localStorage.removeItem(LOVE_SUBMITTED_KEY);
  localStorage.removeItem(LOVE_RESPONSE_KEY);
  localStorage.removeItem(LOVE_ANSWERS_KEY);
  localStorage.removeItem(LOVE_DRAFT_STEP_KEY);
  localStorage.removeItem(LOVE_ADMIN_REPLY_SEEN_KEY);
};

/** One-time move from localStorage → Firebase (per logged-in user). */
export const migrateLocalStorageToFirebase = async (uid, userEmail = "") => {
  const userRef = getLoveFormRef(uid);
  const existing = (await get(userRef)).val();
  if (existing?.answers && Object.keys(existing.answers).length > 0) {
    clearLoveFormLocalStorage();
    return existing;
  }

  const wasSubmitted = localStorage.getItem(LOVE_SUBMITTED_KEY) === "true";
  const legacyKey = localStorage.getItem(LOVE_RESPONSE_KEY);
  let payload = null;

  if (wasSubmitted && legacyKey) {
    const legacy = (await get(ref(db, `${LOVE_RESPONSES_PATH}/${legacyKey}`)))
      .val();
    if (legacy) {
      payload = {
        ...legacy,
        status: "submitted",
        userId: uid,
        userEmail: userEmail || legacy.userEmail || "",
      };
    }
  }

  if (!payload) {
    try {
      const answers = JSON.parse(localStorage.getItem(LOVE_ANSWERS_KEY) || "{}");
      const stepIdx = parseInt(
        localStorage.getItem(LOVE_DRAFT_STEP_KEY) || "0",
        10,
      );
      if (Object.keys(answers).length > 0) {
        payload = {
          status: wasSubmitted ? "submitted" : "draft",
          answers,
          stepIdx: Number.isFinite(stepIdx) ? stepIdx : 0,
          userId: uid,
          userEmail,
          updatedAt: new Date().toISOString(),
          ...(wasSubmitted
            ? { submittedAt: new Date().toISOString() }
            : {}),
        };
      }
    } catch {
      /* ignore corrupt local data */
    }
  }

  if (payload) {
    await set(userRef, payload);
  }

  const seenAt = localStorage.getItem(LOVE_ADMIN_REPLY_SEEN_KEY);
  if (seenAt) {
    await update(userRef, { lastSeenAdminActivity: seenAt });
  }

  clearLoveFormLocalStorage();
  return payload;
};

export const saveLoveFormDraft = async (
  uid,
  { answers, stepIdx, userEmail },
) => {
  const userRef = getLoveFormRef(uid);
  const existing = (await get(userRef)).val() || {};
  if (existing.status === "submitted" || existing.submittedAt) {
    return;
  }
  await set(userRef, {
    ...existing,
    userId: uid,
    userEmail: userEmail || existing.userEmail || "",
    status: "draft",
    answers,
    stepIdx,
    updatedAt: new Date().toISOString(),
  });
};

export const submitLoveFormToFirebase = async (
  uid,
  { answers, userEmail },
) => {
  const userRef = getLoveFormRef(uid);
  const existing = (await get(userRef)).val() || {};
  const now = new Date().toISOString();
  await set(userRef, {
    ...existing,
    userId: uid,
    userEmail: userEmail || existing.userEmail || "",
    status: "submitted",
    answers,
    submittedAt: now,
    updatedAt: now,
  });
};

export const markAdminActivitySeenInFirebase = async (uid, response) => {
  if (!uid || !response) return;
  const latest = getLatestAdminActivity(response);
  if (!latest?.createdAt) return;
  await update(getLoveFormRef(uid), {
    lastSeenAdminActivity: latest.createdAt,
  });
};
