export const LOVE_RESPONSES_PATH = "love-form-responses";

/** UI section for admin-added follow-up questions (not part of the 365-question form). */
export const ADMIN_QUESTIONS_SECTION = {
  id: "admin-questions",
  title: "Questions from Admin",
  emoji: "💬",
  color: "#00a884",
  gradient: "linear-gradient(135deg, #00a884, #25d366)",
  subtitle: "Custom questions and answers",
};
export const LOVE_SUBMITTED_KEY = "love_form_submitted_v1";
export const LOVE_ANSWERS_KEY = "love_form_answers_v1";
export const LOVE_DRAFT_STEP_KEY = "love_form_step_v1";
export const LOVE_RESPONSE_KEY = "love_form_response_key_v1";
export const LOVE_ADMIN_REPLY_SEEN_KEY = "love_form_admin_reply_seen_v1";

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

export const sortByCreatedAt = (items) =>
  [...items].sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));

export const normalizeThread = (thread) => {
  if (!thread) return [];
  return sortByCreatedAt(
    Object.entries(thread).map(([id, value]) => ({
      id,
      sender: value?.sender || "admin",
      text: value?.text || "",
      createdAt: value?.createdAt || "",
    })),
  );
};

export const normalizeExtraQuestions = (extraQuestions) => {
  if (!extraQuestions) return [];
  return sortByCreatedAt(
    Object.entries(extraQuestions).map(([id, value]) => ({
      id,
      text: value?.text || "",
      type: value?.type || "paragraph",
      required: value?.required !== false,
      placeholder: "Your answer...",
      createdAt: value?.createdAt || "",
    })),
  );
};

export const getExtraAnswerText = (response, questionId) => {
  const raw = response?.extraAnswers?.[questionId];
  if (typeof raw === "string") return raw;
  return raw?.text || "";
};

export const findPendingExtraQuestion = (response) =>
  normalizeExtraQuestions(response?.extraQuestions).find(
    (question) => !getExtraAnswerText(response, question.id).trim(),
  );

export const getLatestAdminActivity = (response) => {
  let latest = null;
  const remember = (candidate) => {
    if (!candidate?.createdAt) return;
    if (!latest || toTime(candidate.createdAt) > toTime(latest.createdAt)) {
      latest = candidate;
    }
  };

  Object.entries(response?.threads || {}).forEach(([questionId, thread]) => {
    normalizeThread(thread)
      .filter((message) => message.sender === "admin")
      .forEach((message) =>
        remember({
          ...message,
          questionId,
          type: "reply",
          title: "New admin reply",
        }),
      );
  });

  normalizeExtraQuestions(response?.extraQuestions).forEach((question) => {
    if (!getExtraAnswerText(response, question.id).trim()) {
      remember({
        questionId: question.id,
        text: question.text,
        createdAt: question.createdAt,
        type: "question",
        title: "New question from admin",
      });
    }
  });

  return latest;
};

export const getLatestAdminActivityFromResponses = (responses) => {
  if (!responses) return null;
  let latest = null;
  Object.entries(responses).forEach(([responseKey, response]) => {
    const activity = getLatestAdminActivity(response);
    if (
      activity &&
      (!latest || toTime(activity.createdAt) > toTime(latest.createdAt))
    ) {
      latest = { ...activity, responseKey };
    }
  });
  return latest;
};

export const markAdminActivitySeen = (response) => {
  const latest = getLatestAdminActivity(response);
  if (latest?.createdAt) {
    localStorage.setItem(LOVE_ADMIN_REPLY_SEEN_KEY, latest.createdAt);
  }
};
