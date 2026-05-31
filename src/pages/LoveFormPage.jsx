import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ref, push, onValue, update } from "firebase/database";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import {
  FORM_INFO,
  SECTIONS,
  buildSteps,
  TOTAL_QUESTIONS,
} from "../data/loveFormData";
import {
  uploadImageToGoogleDrive,
  isGoogleDriveConfigured,
  parseImageAnswer,
  formatImageAnswer,
  getImageDisplayUrl,
  getImageViewUrl,
} from "../services/googleDrive";
import {
  ADMIN_QUESTIONS_SECTION,
  LOVE_RESPONSES_PATH,
  LOVE_SUBMITTED_KEY,
  LOVE_ANSWERS_KEY,
  LOVE_DRAFT_STEP_KEY,
  LOVE_RESPONSE_KEY,
  findPendingExtraQuestion,
  getExtraAnswerText,
  markAdminActivitySeen,
  normalizeExtraQuestions,
  normalizeThread,
} from "../services/loveFormHelpers";
import "../styles/loveform.css";

const STEPS = buildSteps();
const REVIEW_STEP_IDX = STEPS.findIndex((s) => s.type === "review");
const ALL_QUESTIONS_SECTION_ID = "all-questions";
const REVIEW_PAGE_SIZE = 12;

const renderAnswerContent = (question, raw) => {
  if (!raw) return null;
  if (question.type === "image") {
    const { files } = parseImageAnswer(raw);
    if (!files.length) return <em className="lf-review-no-ans">No photos uploaded</em>;
    return (
      <div className="lf-image-answer-preview">
        {files.map((f) => (
          <a
            key={f.id || f.url}
            href={getImageViewUrl(f)}
            target="_blank"
            rel="noreferrer"
            className="lf-image-thumb-link"
          >
            <img
              src={getImageDisplayUrl(f)}
              alt={f.name || "upload"}
              className="lf-image-thumb"
            />
          </a>
        ))}
      </div>
    );
  }
  return <span className="lf-review-a-text">{raw}</span>;
};

// Count total questions answered so far
const countAnswered = (steps, currentStepIdx) => {
  let count = 0;
  for (let i = 0; i < currentStepIdx && i < steps.length; i++) {
    if (steps[i].type === "question") count++;
  }
  return count;
};

const ConversationThread = ({ messages, questionId, onReply }) => {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const lastMessage = messages[messages.length - 1];
  const canReply = lastMessage?.sender === "admin";

  if (!messages.length) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canReply || isSending) return;
    setIsSending(true);
    try {
      await onReply(questionId, text);
      setDraft("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="lf-chat-thread">
      <div className="lf-chat-title">Conversation</div>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`lf-chat-bubble lf-chat-bubble--${message.sender}`}
        >
          <span className="lf-chat-sender">
            {message.sender === "admin" ? "Admin reply" : "Your reply"}
          </span>
          <span className="lf-chat-text">{message.text}</span>
        </div>
      ))}
      {canReply ? (
        <form className="lf-user-reply-form" onSubmit={handleSubmit}>
          <textarea
            className="lf-user-reply-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Write your reply..."
          />
          <button
            type="submit"
            className="lf-user-reply-btn"
            disabled={isSending || !draft.trim()}
          >
            {isSending ? "Sending..." : "Reply"}
          </button>
        </form>
      ) : (
        <div className="lf-chat-waiting">Waiting for admin reply.</div>
      )}
    </div>
  );
};

const FollowUpQuestionForm = ({ question, onSubmit, navigate }) => {
  const [answer, setAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = answer.trim();
    if (!text) {
      setError("Please write your answer before submitting.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSubmit(question, text);
      setAnswer("");
    } catch (err) {
      console.error(err);
      setError("Could not save this answer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="lf-fullscreen lf-question-bg lf-followup-bg">
      <div className="lf-question-love-layer" aria-hidden="true">
        {["❤", "✦", "♡", "♥", "✧", "♡", "❤", "❥", "✦"].map((h, i) => (
          <span
            key={i}
            className="lf-love-petal"
            style={{ "--delay": `${i * 0.75}s`, "--pos": `${6 + i * 11}%` }}
          >
            {h}
          </span>
        ))}
      </div>
      <div className="lf-top-bar">
        <button
          className="lf-back-icon"
          type="button"
          onClick={() => navigate("/dashboard")}
          title="Dashboard"
        >
          ←
        </button>
      </div>
      <form className="lf-question-card lf-followup-card" onSubmit={handleSubmit}>
        <div className="lf-q-number">New question from admin</div>
        <h3 className="lf-q-text">{question.text}</h3>
        <textarea
          className="lf-input-para"
          placeholder="Your answer..."
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (error) setError("");
          }}
          rows={6}
          autoFocus
        />
        {error && <div className="lf-error">{error}</div>}
        <button type="submit" className="lf-btn-submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Submit this answer"}
        </button>
      </form>
    </div>
  );
};

const answerMatchesSearch = (answer, query) => {
  if (!query || answer == null || answer === "") return false;
  if (typeof answer === "string") {
    return answer.toLowerCase().includes(query);
  }
  try {
    return JSON.stringify(answer).toLowerCase().includes(query);
  } catch {
    return String(answer).toLowerCase().includes(query);
  }
};

// ─── Read-only Answers View (used in submitted screen) ───────────────
const ReadOnlyAnswers = ({
  savedAnswers,
  response,
  responseKey,
  navigate,
  onUserReply,
  onSubmitExtraAnswer,
}) => {
  const [openSections, setOpenSections] = useState({
    [ADMIN_QUESTIONS_SECTION.id]: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState({});
  const effectiveAnswers = useMemo(
    () => response?.answers || savedAnswers || {},
    [response?.answers, savedAnswers],
  );
  const pendingExtraQuestion = findPendingExtraQuestion(response);
  const extraQuestions = normalizeExtraQuestions(response?.extraQuestions);
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const isSearching = trimmedSearch.length > 0;

  useEffect(() => {
    if (response) markAdminActivitySeen(response);
  }, [response]);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const countAnswered = (questions, getAnswer) =>
    questions.filter((q) => {
      const value = getAnswer(q);
      return value != null && String(value).trim() !== "";
    }).length;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const results = [];
    extraQuestions.forEach((question, idx) => {
      const answer = getExtraAnswerText(response, question.id);
      if (
        question.text.toLowerCase().includes(trimmedSearch) ||
        answerMatchesSearch(answer, trimmedSearch)
      ) {
        results.push({
          key: question.id,
          sectionLabel: ADMIN_QUESTIONS_SECTION.title,
          sectionEmoji: ADMIN_QUESTIONS_SECTION.emoji,
          question,
          idx,
          answer,
        });
      }
    });
    SECTIONS.forEach((section) => {
      section.questions.forEach((question, idx) => {
        const answer = effectiveAnswers[question.id];
        if (
          question.text.toLowerCase().includes(trimmedSearch) ||
          answerMatchesSearch(answer, trimmedSearch)
        ) {
          results.push({
            key: question.id,
            sectionLabel: section.title,
            sectionEmoji: section.emoji,
            question,
            idx,
            answer,
          });
        }
      });
    });
    return results;
  }, [
    isSearching,
    trimmedSearch,
    extraQuestions,
    response,
    effectiveAnswers,
  ]);

  const renderSubmittedQuestion = (
    question,
    idx,
    answer,
    { compact = false, sectionTag } = {},
  ) => {
    const messages = normalizeThread(response?.threads?.[question.id]);
    return (
      <div
        key={question.id}
        className={`lf-review-qa${compact ? " lf-review-qa--compact" : ""}`}
      >
        {sectionTag && (
          <div className="lf-review-section-tag">
            {sectionTag.emoji} {sectionTag.label}
          </div>
        )}
        <div className="lf-review-q-row">
          <span className="lf-review-qnum">Q{idx + 1}</span>
          <span className="lf-review-q-text">{question.text}</span>
        </div>
        <div className="lf-review-a-row">
          {answer ? (
            renderAnswerContent(question, answer)
          ) : (
            <em className="lf-review-no-ans">No answer given</em>
          )}
          <ConversationThread
            messages={messages}
            questionId={question.id}
            onReply={onUserReply}
          />
        </div>
      </div>
    );
  };

  const renderSectionBlock = (
    sectionId,
    headerContent,
    headerStyle,
    questions,
    getAnswer,
    { className = "" } = {},
  ) => {
    const isOpen = openSections[sectionId] === true;
    const answered = countAnswered(questions, getAnswer);
    const isLarge = questions.length > REVIEW_PAGE_SIZE;
    const shownCount = isLarge
      ? visibleCount[sectionId] ?? REVIEW_PAGE_SIZE
      : questions.length;
    const visibleQuestions = isOpen ? questions.slice(0, shownCount) : [];
    const remaining = questions.length - shownCount;

    return (
      <div key={sectionId} className={`lf-review-section ${className}`.trim()}>
        <button
          type="button"
          className="lf-review-section-header"
          style={headerStyle}
          onClick={() => toggleSection(sectionId)}
          aria-expanded={isOpen}
        >
          <span className="lf-review-section-header-text">{headerContent}</span>
          <span className="lf-review-section-meta">
            <span className="lf-review-section-count">
              {answered}/{questions.length}
            </span>
            <span className="lf-section-toggle">{isOpen ? "▲" : "▼"}</span>
          </span>
        </button>
        {isOpen && (
          <>
            <div className="lf-review-qa-list">
              {visibleQuestions.map((question, idx) =>
                renderSubmittedQuestion(question, idx, getAnswer(question)),
              )}
            </div>
            {isLarge && remaining > 0 && (
              <div className="lf-review-load-more-wrap">
                <button
                  type="button"
                  className="lf-review-load-more"
                  onClick={() =>
                    setVisibleCount((prev) => ({
                      ...prev,
                      [sectionId]:
                        (prev[sectionId] ?? REVIEW_PAGE_SIZE) + REVIEW_PAGE_SIZE,
                    }))
                  }
                >
                  Show {Math.min(remaining, REVIEW_PAGE_SIZE)} more (
                  {remaining} left)
                </button>
              </div>
            )}
          </>
        )}
        {!isOpen && isLarge && (
          <p className="lf-review-section-hint">
            Tap to open — loads {REVIEW_PAGE_SIZE} at a time so scrolling stays
            easy on your phone.
          </p>
        )}
      </div>
    );
  };

  if (pendingExtraQuestion && responseKey) {
    return (
      <FollowUpQuestionForm
        question={pendingExtraQuestion}
        onSubmit={onSubmitExtraAnswer}
        navigate={navigate}
      />
    );
  }

  const allQuestionsSection = SECTIONS.find(
    (s) => s.id === ALL_QUESTIONS_SECTION_ID,
  );
  const otherSections = SECTIONS.filter(
    (s) => s.id !== ALL_QUESTIONS_SECTION_ID,
  );

  return (
    <div className="lf-fullscreen lf-review-bg">
      <div className="lf-review-container">
        <div className="lf-review-header">
          <div className="lf-big-emoji">💌</div>
          <h2 className="lf-review-title">Your Submitted Answers</h2>
          <p className="lf-review-sub lf-review-sub--mobile">
            Sections are collapsed so your phone is not flooded with 365
            questions. Search or open a section to read answers. ❤️
          </p>
          <div className="lf-readonly-badge">🔒 Read Only — Already Submitted</div>
        </div>

        <div className="lf-review-search-bar">
          <span className="lf-review-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            className="lf-review-search-input"
            placeholder="Search question or answer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search your answers"
          />
          {searchQuery && (
            <button
              type="button"
              className="lf-review-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {isSearching && (
          <div className="lf-review-search-results">
            <p className="lf-review-search-summary">
              {searchResults.length === 0
                ? `No matches for “${searchQuery.trim()}”`
                : `${searchResults.length} match${
                    searchResults.length !== 1 ? "es" : ""
                  }`}
            </p>
            {searchResults.length > 0 && (
              <div className="lf-review-qa-list">
                {searchResults.map((item) =>
                  renderSubmittedQuestion(item.question, item.idx, item.answer, {
                    compact: true,
                    sectionTag: {
                      emoji: item.sectionEmoji,
                      label: item.sectionLabel,
                    },
                  }),
                )}
              </div>
            )}
          </div>
        )}

        {!isSearching && (
          <>
            {extraQuestions.length > 0 &&
              renderSectionBlock(
                ADMIN_QUESTIONS_SECTION.id,
                <>
                  {ADMIN_QUESTIONS_SECTION.emoji}{" "}
                  {ADMIN_QUESTIONS_SECTION.title}
                </>,
                { background: ADMIN_QUESTIONS_SECTION.gradient },
                extraQuestions,
                (q) => getExtraAnswerText(response, q.id),
                { className: "lf-review-section--admin" },
              )}

            {otherSections.map((section) =>
              renderSectionBlock(
                section.id,
                <>
                  {section.emoji} {section.title}
                </>,
                { background: section.gradient },
                section.questions,
                (q) => effectiveAnswers[q.id],
              ),
            )}

            {allQuestionsSection &&
              renderSectionBlock(
                allQuestionsSection.id,
                <>
                  {allQuestionsSection.emoji} {allQuestionsSection.title}
                </>,
                { background: allQuestionsSection.gradient },
                allQuestionsSection.questions,
                (q) => effectiveAnswers[q.id],
              )}
          </>
        )}

        <div className="lf-review-footer-actions">
          <button
            className="lf-btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────
const LoveFormPage = () => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentInput, setCurrentInput] = useState("");
  const [error, setError] = useState("");
  const [animDir, setAnimDir] = useState("enter");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [submittedResponse, setSubmittedResponse] = useState(null);
  const [submittedResponseKey, setSubmittedResponseKey] = useState("");
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [liveSavedAt, setLiveSavedAt] = useState(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const touchNextRef = useRef(false);

  // Check Firebase before locking the form. If admin deletes the response,
  // the local one-time lock is cleared and the form opens again.
  useEffect(() => {
    const restoreDraft = () => {
      try {
        const draft = JSON.parse(localStorage.getItem(LOVE_ANSWERS_KEY) || "{}");
        if (Object.keys(draft).length > 0) {
          setAnswers(draft);
          setHasDraft(true);
        }
        const savedStep = parseInt(
          localStorage.getItem(LOVE_DRAFT_STEP_KEY) || "0",
          10,
        );
        if (savedStep > 0 && savedStep < STEPS.length) {
          setStepIdx(savedStep);
        }
      } catch {
        /* ignore corrupt draft */
      } finally {
        setIsCheckingSubmission(false);
      }
    };

    const clearSubmissionLock = () => {
      localStorage.removeItem(LOVE_SUBMITTED_KEY);
      localStorage.removeItem(LOVE_RESPONSE_KEY);
      localStorage.removeItem(LOVE_ANSWERS_KEY);
      localStorage.removeItem(LOVE_DRAFT_STEP_KEY);
      setAlreadySubmitted(false);
      setSubmittedAnswers({});
      setSubmittedResponse(null);
      setSubmittedResponseKey("");
      setAnswers({});
      setHasDraft(false);
      setStepIdx(0);
      setIsCheckingSubmission(false);
    };

    const applySubmittedResponse = (key, value) => {
      if (!value) {
        clearSubmissionLock();
        return;
      }
      setAlreadySubmitted(true);
      setSubmittedResponseKey(key);
      setSubmittedResponse({ key, ...value });
      setSubmittedAnswers(value.answers || {});
      localStorage.setItem(LOVE_RESPONSE_KEY, key);
      localStorage.setItem(LOVE_ANSWERS_KEY, JSON.stringify(value.answers || {}));
      setIsCheckingSubmission(false);
    };

    if (localStorage.getItem(LOVE_SUBMITTED_KEY) !== "true") {
      restoreDraft();
      return undefined;
    }

    setAlreadySubmitted(true);
    const storedResponseKey = localStorage.getItem(LOVE_RESPONSE_KEY);
    if (storedResponseKey) {
      return onValue(
        ref(db, `${LOVE_RESPONSES_PATH}/${storedResponseKey}`),
        (snap) => applySubmittedResponse(storedResponseKey, snap.val()),
        (err) => {
          console.error(err);
          setIsCheckingSubmission(false);
        },
      );
    }

    return onValue(
      ref(db, LOVE_RESPONSES_PATH),
      (snap) => {
        const data = snap.val();
        if (!data) {
          clearSubmissionLock();
          return;
        }
        const [key, value] =
          Object.entries(data).sort(
            ([, a], [, b]) =>
              new Date(b?.submittedAt || 0) - new Date(a?.submittedAt || 0),
          )[0] || [];
        if (key && value) {
          applySubmittedResponse(key, value);
        } else {
          clearSubmissionLock();
        }
      },
      (err) => {
        console.error(err);
        try {
          const saved = JSON.parse(
            localStorage.getItem(LOVE_ANSWERS_KEY) || "{}",
          );
          setSubmittedAnswers(saved);
        } catch {
          setSubmittedAnswers({});
        } finally {
          setIsCheckingSubmission(false);
        }
      }
    );
  }, []);

  // Live-save answers and current step (love form answers in real time)
  useEffect(() => {
    if (alreadySubmitted || showThankYou) return;
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(LOVE_ANSWERS_KEY, JSON.stringify(answers));
      setHasDraft(true);
      setLiveSavedAt(new Date());
    }
  }, [answers, alreadySubmitted, showThankYou]);

  useEffect(() => {
    if (alreadySubmitted || showThankYou) return;
    localStorage.setItem(LOVE_DRAFT_STEP_KEY, String(stepIdx));
  }, [stepIdx, alreadySubmitted, showThankYou]);

  // Sync currentInput when step changes
  useEffect(() => {
    const step = STEPS[stepIdx];
    if (step?.type === "question") {
      if (step.question.type === "image") {
        setCurrentInput("");
      } else {
        setCurrentInput(answers[step.question.id] || "");
        setTimeout(() => inputRef.current?.focus(), 300);
      }
      setError("");
      setUploadStatus("");
    }
  }, [stepIdx, answers]);

  const currentStep = STEPS[stepIdx];

  const questionsAnsweredBefore = countAnswered(STEPS, stepIdx);
  const progressPercent = Math.round(
    (questionsAnsweredBefore / TOTAL_QUESTIONS) * 100
  );

  const animate = useCallback((direction, callback) => {
    setAnimDir(direction === "forward" ? "exit-left" : "exit-right");
    setIsAnimating(true);
    setTimeout(() => {
      callback();
      setAnimDir(direction === "forward" ? "enter-right" : "enter-left");
      setTimeout(() => {
        setAnimDir("enter");
        setIsAnimating(false);
      }, 50);
    }, 250);
  }, []);

  const goNext = () => {
    if (isAnimating) return;

    if (currentStep.type === "question") {
      const q = currentStep.question;
      if (q.type === "image") {
        const { files } = parseImageAnswer(answers[q.id]);
        if (q.required && files.length === 0) {
          setError("Please upload at least one photo. ❤️");
          return;
        }
      } else {
        const trimmed = currentInput.trim();
        if (q.required && !trimmed) {
          setError("This question is required. Please write your answer. ❤️");
          inputRef.current?.focus();
          return;
        }
        setAnswers((prev) => ({
          ...prev,
          [q.id]: trimmed,
        }));
      }

      // If editing from review, jump back to review step
      if (editingFromReview) {
        setEditingFromReview(false);
        animate("forward", () => setStepIdx(REVIEW_STEP_IDX));
        return;
      }
    }

    if (stepIdx < STEPS.length - 1) {
      animate("forward", () => setStepIdx((p) => p + 1));
    }
  };

  const goBack = () => {
    if (isAnimating || stepIdx === 0) return;
    if (editingFromReview && currentStep.type === "question") {
      setEditingFromReview(false);
      animate("backward", () => setStepIdx(REVIEW_STEP_IDX));
      return;
    }
    animate("backward", () => setStepIdx((p) => p - 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentStep?.question?.type === "short") {
      e.preventDefault();
      goNext();
    }
  };

  const handleNextTouchEnd = (e) => {
    touchNextRef.current = true;
    e.preventDefault();
    goNext();
    window.setTimeout(() => {
      touchNextRef.current = false;
    }, 350);
  };

  const handleNextClick = () => {
    if (touchNextRef.current) return;
    goNext();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const responsesRef = ref(db, LOVE_RESPONSES_PATH);
      const savedRef = await push(responsesRef, {
        submittedAt: new Date().toISOString(),
        answers,
      });
      localStorage.setItem(LOVE_SUBMITTED_KEY, "true");
      localStorage.setItem(LOVE_RESPONSE_KEY, savedRef.key);
      localStorage.setItem(LOVE_ANSWERS_KEY, JSON.stringify(answers));
      localStorage.removeItem(LOVE_DRAFT_STEP_KEY);
      setSubmittedResponseKey(savedRef.key);
      setSubmittedResponse({
        key: savedRef.key,
        submittedAt: new Date().toISOString(),
        answers,
      });
      setSubmittedAnswers(answers);
      setShowThankYou(true);
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Firebase did not save this submission. Please check your internet/database rules and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserReply = async (questionId, text) => {
    if (!submittedResponseKey) return;
    await push(
      ref(
        db,
        `${LOVE_RESPONSES_PATH}/${submittedResponseKey}/threads/${questionId}`,
      ),
      {
        sender: "user",
        text,
        createdAt: new Date().toISOString(),
      },
    );
  };

  const handleSubmitExtraAnswer = async (question, text) => {
    if (!submittedResponseKey) return;
    await update(
      ref(
        db,
        `${LOVE_RESPONSES_PATH}/${submittedResponseKey}/extraAnswers/${question.id}`,
      ),
      {
        text,
        answeredAt: new Date().toISOString(),
      },
    );
  };

  const goToQuestionFromReview = (questionStepIdx) => {
    setEditingFromReview(true);
    animate("backward", () => setStepIdx(questionStepIdx));
  };

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleImageSelect = async (e, question) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    if (!isGoogleDriveConfigured()) {
      setError(
        "Photo upload to Google Drive is not set up yet. Add REACT_APP_GOOGLE_DRIVE_UPLOAD_URL in .env (see google-apps-script folder)."
      );
      return;
    }

    const existing = parseImageAnswer(answers[question.id]);
    const maxFiles = question.maxFiles || 10;
    const room = maxFiles - existing.files.length;
    if (room <= 0) {
      setError(`You can upload at most ${maxFiles} photos.`);
      return;
    }

    const toUpload = picked.slice(0, room);
    setIsUploadingImages(true);
    setUploadStatus(`Uploading 0 / ${toUpload.length} to Google Drive...`);
    setError("");

    const uploaded = [...existing.files];
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        setUploadStatus(
          `Uploading ${i + 1} / ${toUpload.length} to Google Drive...`
        );
        const result = await uploadImageToGoogleDrive(
          file,
          question.driveFolderId
        );
        uploaded.push(result);
        setAnswers((prev) => ({
          ...prev,
          [question.id]: formatImageAnswer(uploaded),
        }));
      }
      setUploadStatus(`${uploaded.length} photo(s) saved to Google Drive ❤️`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeUploadedImage = (questionId, index) => {
    const { files } = parseImageAnswer(answers[questionId]);
    const next = files.filter((_, i) => i !== index);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: next.length ? formatImageAnswer(next) : "",
    }));
  };

  if (isCheckingSubmission) {
    return (
      <div className="lf-fullscreen lf-review-bg">
        <div className="lf-center-card lf-tada">
          <div className="lf-big-emoji">💌</div>
          <h2 className="lf-ty-title">Opening your love form...</h2>
          <p className="lf-ty-sub">Checking the latest Firebase response.</p>
        </div>
      </div>
    );
  }

  // ─── Already Submitted Screen ──────────────────────────────────────
  if (alreadySubmitted) {
    const hasAnswers = Object.keys(submittedAnswers).length > 0;
    if (hasAnswers) {
      return (
        <ReadOnlyAnswers
          savedAnswers={submittedAnswers}
          response={submittedResponse}
          responseKey={submittedResponseKey}
          navigate={navigate}
          onUserReply={handleUserReply}
          onSubmitExtraAnswer={handleSubmitExtraAnswer}
        />
      );
    }
    return (
      <div className="lf-fullscreen lf-thankyou-bg">
        <div className="lf-center-card lf-tada">
          <div className="lf-big-emoji">🔒</div>
          <h2 className="lf-ty-title">Already Submitted</h2>
          <p className="lf-ty-sub">
            You have already filled out this form once. It can only be submitted
            once. Thank you for your answers! ❤️
          </p>
          <button
            className="lf-btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Thank You Screen ──────────────────────────────────────────────
  if (showThankYou) {
    return (
      <div className="lf-fullscreen lf-thankyou-bg">
        <div className="lf-center-card lf-tada">
          <div className="lf-hearts-anim">
            {"❤️💕💖💗💝".split("").map((h, i) => (
              <span
                key={i}
                className="lf-floating-heart"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {h}
              </span>
            ))}
          </div>
          <div className="lf-big-emoji">🥰</div>
          <h2 className="lf-ty-title">Thank You, My Love! ❤️</h2>
          <p className="lf-ty-sub">
            Your answers mean the world to me. I will read every word with all
            my heart. You are my everything. 🌹
          </p>
          <p className="lf-ty-quote">
            "Tumse milne ke baad samjha, ki mohabbat sirf lafzon mein nahi
            hoti. Kabhi kabhi ek jawab bhi, dil jeet leta hai. 💞"
          </p>
          <button
            className="lf-btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Cover Screen ──────────────────────────────────────────────────
  if (currentStep.type === "cover") {
    return (
      <div className="lf-fullscreen lf-cover-bg">
        <div className="lf-floating-hearts-bg" aria-hidden="true">
          {["❤️", "💕", "🌹", "💖", "💗", "💝", "✨", "🥰"].map((h, i) => (
            <span
              key={i}
              className="lf-bg-heart"
              style={{
                "--delay": `${i * 1.2}s`,
                "--pos": `${10 + i * 11}%`,
              }}
            >
              {h}
            </span>
          ))}
        </div>
        <div className="lf-cover-card">
          <div className="lf-cover-emoji">❤️</div>
          <h1 className="lf-cover-title">{FORM_INFO.title}</h1>
          <div className="lf-cover-desc-scroll">
            {FORM_INFO.description.split("\n").map((line, i) =>
              line.trim() === "" ? (
                <br key={i} />
              ) : (
                <p key={i} className="lf-cover-desc-line">
                  {line}
                </p>
              )
            )}
          </div>
          <div className="lf-cover-meta">
            <span className="lf-badge">🔒 Submit Once</span>
            <span className="lf-badge">📝 {TOTAL_QUESTIONS} Questions</span>
            <span className="lf-badge">💾 Live auto-save</span>
          </div>
          {hasDraft && (
            <p className="lf-draft-notice">
              💾 You have saved answers from last time — tap Begin to continue
              where you left off.
            </p>
          )}
          <button
            className="lf-btn-start"
            type="button"
            onTouchEnd={handleNextTouchEnd}
            onClick={handleNextClick}
          >
            {hasDraft ? "Continue ❤️" : "Begin ❤️"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Section Intro Screen ──────────────────────────────────────────
  if (currentStep.type === "section-intro") {
    const { section } = currentStep;
    return (
      <div className="lf-fullscreen" style={{ background: section.gradient }}>
        <div className="lf-top-bar">
          <button className="lf-back-icon" onClick={goBack} title="Back">
            ←
          </button>
          <div className="lf-progress-wrap">
            <div className="lf-progress-bar">
              <div
                className="lf-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="lf-progress-label">{progressPercent}%</span>
          </div>
        </div>
        <div className={`lf-section-card lf-anim-${animDir}`}>
          <div className="lf-section-emoji">{section.emoji}</div>
          <h2 className="lf-section-title">{section.title}</h2>
          <p className="lf-section-subtitle">{section.subtitle}</p>
          {section.intro && (
            <div className="lf-section-intro-text">
              {section.intro.split("\n").map((line, i) =>
                line.trim() === "" ? (
                  <br key={i} />
                ) : (
                  <p key={i}>{line}</p>
                )
              )}
            </div>
          )}
          <div className="lf-section-qcount">
            {section.questions.length} question
            {section.questions.length !== 1 ? "s" : ""} in this section
          </div>
          <button
            className="lf-btn-section-start"
            type="button"
            onTouchEnd={handleNextTouchEnd}
            onClick={handleNextClick}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ─── Question Screen ───────────────────────────────────────────────
  if (currentStep.type === "question") {
    const { question, section, questionIndexInSection, totalInSection } =
      currentStep;

    let overallQNum = 0;
    for (let i = 0; i <= stepIdx; i++) {
      if (STEPS[i].type === "question") overallQNum++;
    }

    return (
      <div
        className="lf-fullscreen lf-question-bg"
        style={{ "--accent": section.color }}
      >
        <div className="lf-question-love-layer" aria-hidden="true">
          {["❤", "♡", "✦", "♥", "❥", "♡", "✧", "❤", "✦", "♥"].map((h, i) => (
            <span
              key={i}
              className="lf-love-petal"
              style={{ "--delay": `${i * 0.65}s`, "--pos": `${5 + i * 10}%` }}
            >
              {h}
            </span>
          ))}
        </div>
        <div className="lf-top-bar">
          <button className="lf-back-icon" onClick={goBack} title="Back">
            ←
          </button>
          <div className="lf-progress-wrap">
            <div className="lf-progress-bar">
              <div
                className="lf-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: section.color,
                }}
              />
            </div>
            <span
              className="lf-progress-label"
              style={{ color: section.color }}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        {editingFromReview && (
          <div className="lf-editing-banner" style={{ background: section.color }}>
            ✏️ Editing from Review — click Save &amp; Back when done
          </div>
        )}

        <div className="lf-question-section-badge" style={{ color: section.color }}>
          <span>{section.emoji}</span>
          <span>{section.title}</span>
          <span className="lf-q-in-section">
            {questionIndexInSection + 1} / {totalInSection}
          </span>
        </div>

        {liveSavedAt && (
          <div className="lf-live-save-badge">💾 Answers saved live</div>
        )}

        <div className={`lf-question-card lf-anim-${animDir}`}>
          <div className="lf-q-number" style={{ color: section.color }}>
            Q{overallQNum}{" "}
            {question.required && (
              <span className="lf-required-dot">*</span>
            )}
          </div>
          <h3 className="lf-q-text">{question.text}</h3>
          {question.description && (
            <p className="lf-q-description">{question.description}</p>
          )}
          <div className="lf-input-wrap">
            {question.type === "image" ? (
              <>
                <div className="lf-image-upload-zone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="lf-image-input-hidden"
                    disabled={isUploadingImages}
                    onChange={(e) => handleImageSelect(e, question)}
                  />
                  <button
                    type="button"
                    className="lf-image-upload-btn"
                    style={{ borderColor: section.color, color: section.color }}
                    disabled={isUploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingImages
                      ? "Uploading..."
                      : "📷 Choose photos (saved to Google Drive)"}
                  </button>
                  <p className="lf-image-hint">
                    Up to {question.maxFiles || 10} images.{" "}
                    {isGoogleDriveConfigured()
                      ? "Each photo uploads to your Google Drive folder."
                      : "Configure REACT_APP_GOOGLE_DRIVE_UPLOAD_URL to enable Drive upload."}
                  </p>
                </div>
                {(() => {
                  const { files } = parseImageAnswer(answers[question.id]);
                  if (!files.length) return null;
                  return (
                    <div className="lf-uploaded-grid">
                      {files.map((f, idx) => (
                        <div key={f.id || f.url || idx} className="lf-uploaded-item">
                          <img
                            src={getImageDisplayUrl(f)}
                            alt={f.name || `Photo ${idx + 1}`}
                            className="lf-uploaded-thumb"
                          />
                          <button
                            type="button"
                            className="lf-remove-image"
                            onClick={() =>
                              removeUploadedImage(question.id, idx)
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {uploadStatus && (
                  <div className="lf-upload-status">{uploadStatus}</div>
                )}
              </>
            ) : question.type === "short" ? (
              <input
                ref={inputRef}
                type="text"
                className="lf-input-short"
                placeholder={question.placeholder}
                value={currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  if (error) setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: e.target.value,
                  }));
                }}
                onKeyDown={handleKeyDown}
                style={{ "--accent": section.color }}
              />
            ) : (
              <textarea
                ref={inputRef}
                className="lf-input-para"
                placeholder={question.placeholder}
                value={currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  if (error) setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: e.target.value,
                  }));
                }}
                style={{ "--accent": section.color }}
                rows={5}
              />
            )}
            {error && <div className="lf-error">{error}</div>}
          </div>
          {question.type === "short" && !editingFromReview && (
            <div className="lf-enter-hint">Press Enter or click Next →</div>
          )}
        </div>

        <div className="lf-nav-row">
          <button
            className="lf-nav-btn lf-nav-prev"
            onClick={goBack}
            disabled={stepIdx === 0}
          >
            ←
          </button>
          <div className="lf-q-counter">
            {overallQNum} / {TOTAL_QUESTIONS}
          </div>
          <button
            className="lf-nav-btn lf-nav-next"
            type="button"
            onTouchEnd={handleNextTouchEnd}
            onClick={handleNextClick}
            style={{ background: section.color }}
            title={editingFromReview ? "Save & Back to Review" : "Next"}
          >
            {editingFromReview ? "✓" : "→"}
          </button>
        </div>
        {editingFromReview && (
          <div className="lf-save-review-hint">
            ✓ = Save &amp; Back to Review
          </div>
        )}
      </div>
    );
  }

  // ─── Review Screen (Final step — Review + Submit) ──────────────────
  if (currentStep.type === "review") {
    const totalAnswered = Object.keys(answers).length;

    return (
      <div className="lf-fullscreen lf-review-bg">
        <div className="lf-top-bar lf-top-bar-review">
          <button className="lf-back-icon" onClick={goBack} title="Back">
            ←
          </button>
          <div className="lf-progress-wrap">
            <div className="lf-progress-bar">
              <div className="lf-progress-fill" style={{ width: "100%" }} />
            </div>
            <span className="lf-progress-label">100%</span>
          </div>
        </div>

        <div className="lf-review-container">
          <div className="lf-review-header">
            <div className="lf-big-emoji">💌</div>
            <h2 className="lf-review-title">Review Your Answers</h2>
            <p className="lf-review-sub">
              You answered <strong>{totalAnswered}</strong> of{" "}
              <strong>{TOTAL_QUESTIONS}</strong> questions. Please review
              everything before submitting — you can edit any answer here.
            </p>
          </div>

          {SECTIONS.map((section) => {
            const isOpen = openSections[section.id] !== false;
            return (
              <div key={section.id} className="lf-review-section">
                <button
                  className="lf-review-section-header"
                  style={{ background: section.gradient }}
                  onClick={() => toggleSection(section.id)}
                >
                  <span>
                    {section.emoji} {section.title}
                  </span>
                  <span className="lf-section-toggle">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="lf-review-qa-list">
                    {section.questions.map((question, idx) => {
                      const qStepIdx = STEPS.findIndex(
                        (s) =>
                          s.type === "question" && s.question.id === question.id
                      );
                      return (
                        <div key={question.id} className="lf-review-qa">
                          <div className="lf-review-q-row">
                            <span className="lf-review-qnum">Q{idx + 1}</span>
                            <span className="lf-review-q-text">
                              {question.text}
                            </span>
                            <button
                              className="lf-review-edit-btn"
                              onClick={() => goToQuestionFromReview(qStepIdx)}
                              title="Edit this answer"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                          <div className="lf-review-a-row">
                            {answers[question.id] ? (
                              renderAnswerContent(
                                question,
                                answers[question.id]
                              )
                            ) : (
                              <em className="lf-review-no-ans">
                                ⚠️ Not answered yet
                              </em>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="lf-review-submit-block">
            <div className="lf-submit-notice">
              <span>🔒</span>
              <span>
                Once submitted, this form cannot be filled again. Please make
                sure you are happy with all your answers.
              </span>
            </div>
            {submitError && <div className="lf-submit-error">{submitError}</div>}
            <button
              className="lf-btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="lf-submitting">Submitting... ❤️</span>
              ) : (
                "Submit Your Answers ❤️"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LoveFormPage;
