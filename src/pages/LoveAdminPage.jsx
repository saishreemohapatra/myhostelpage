import React, { useState, useEffect, useCallback } from "react";
import { ref, onValue, remove, push, set } from "firebase/database";
import { db } from "../services/firebase";
import { SECTIONS } from "../data/loveFormData";
import {
  parseImageAnswer,
  getImageDisplayUrl,
  getImageViewUrl,
} from "../services/googleDrive";
import {
  ADMIN_QUESTIONS_SECTION,
  LOVE_RESPONSES_PATH,
  getExtraAnswerText,
  normalizeExtraQuestions,
  normalizeThread,
} from "../services/loveFormHelpers";
import LoveAdminLoginScreen from "../components/LoveAdminLoginScreen";
import {
  isAdminLoggedIn,
  setAdminLoggedIn,
} from "../services/loveAdminAuth";
import "../styles/loveadmin.css";

const renderAdminAnswer = (question, answer) => {
  if (!answer) return "— No answer provided —";
  if (question.type === "image") {
    const { files } = parseImageAnswer(answer);
    if (!files.length) return "— No photos uploaded —";
    return (
      <span className="la-image-answers">
        {files.map((f) => (
          <a
            key={f.id || f.url}
            href={getImageViewUrl(f)}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={getImageDisplayUrl(f)}
              alt={f.name || "photo"}
              className="la-admin-thumb"
            />
          </a>
        ))}
      </span>
    );
  }
  return answer;
};

// ─── Build question lookup map ────────────────────────────────────────
const QUESTION_MAP = {};
SECTIONS.forEach((section) => {
  section.questions.forEach((q) => {
    QUESTION_MAP[q.id] = {
      text: q.text,
      type: q.type,
      sectionTitle: section.title,
      sectionEmoji: section.emoji,
      sectionColor: section.color,
      sectionGradient: section.gradient,
    };
  });
});

// ─── Response Card ────────────────────────────────────────────────────
const ResponseCard = ({ response, index, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [replyingQuestionId, setReplyingQuestionId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const startReply = (questionId) => {
    setReplyingQuestionId(questionId);
    setReplyText("");
  };

  const cancelReply = () => {
    setReplyingQuestionId(null);
    setReplyText("");
  };

  const saveReply = async (questionId) => {
    const text = replyText.trim();
    if (!text || isSavingReply) return;
    setIsSavingReply(true);
    try {
      await push(
        ref(db, `${LOVE_RESPONSES_PATH}/${response.key}/threads/${questionId}`),
        {
          sender: "admin",
          text,
          createdAt: new Date().toISOString(),
        }
      );
      cancelReply();
    } catch (err) {
      console.error("Reply failed:", err);
    } finally {
      setIsSavingReply(false);
    }
  };

  const deleteChat = async (questionId) => {
    try {
      await remove(
        ref(db, `${LOVE_RESPONSES_PATH}/${response.key}/threads/${questionId}`),
      );
    } catch (err) {
      console.error("Delete chat failed:", err);
    }
  };

  const addExtraQuestion = async () => {
    const text = newQuestionText.trim();
    if (!text || isAddingQuestion) return;
    setIsAddingQuestion(true);
    try {
      const questionRef = push(
        ref(db, `${LOVE_RESPONSES_PATH}/${response.key}/extraQuestions`),
      );
      await set(questionRef, {
        text,
        type: "paragraph",
        required: true,
        createdAt: new Date().toISOString(),
      });
      setNewQuestionText("");
      setOpenSections((prev) => ({
        ...prev,
        [ADMIN_QUESTIONS_SECTION.id]: true,
      }));
    } catch (err) {
      console.error("Add question failed:", err);
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const dateSource = response.submittedAt || response.updatedAt;
  const formattedDate = dateSource
    ? new Date(dateSource).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";
  const statusLabel =
    response.status === "draft" ? "Draft (in progress)" : "Submitted";

  const extraQuestions = normalizeExtraQuestions(response.extraQuestions);
  const totalAnswers =
    Object.keys(response.answers).length +
    extraQuestions.filter((question) =>
      getExtraAnswerText(response, question.id).trim(),
    ).length;

  const renderQuestionRow = (question, qIdx, answer, sectionColor) => {
    const messages = normalizeThread(response.threads?.[question.id]);
    const isReplying = replyingQuestionId === question.id;

    return (
      <div key={question.id} className="la-qa-row">
        <div className="la-qa-left">
          <span className="la-qa-num" style={{ color: sectionColor }}>
            Q{qIdx + 1}
          </span>
        </div>
        <div className="la-qa-right">
          <div className="la-q-text">{question.text}</div>
          <div className="la-a-row">
            <span className={answer ? "la-a-text" : "la-a-text la-a-empty"}>
              {renderAdminAnswer(question, answer)}
            </span>
          </div>

          {messages.length > 0 && (
            <div className="la-chat-thread">
              <div className="la-chat-head">
                <span>Reply chat</span>
                <button
                  type="button"
                  className="la-delete-chat-btn"
                  onClick={() => deleteChat(question.id)}
                >
                  Delete chat
                </button>
              </div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`la-chat-bubble la-chat-bubble--${message.sender}`}
                >
                  <span className="la-chat-sender">
                    {message.sender === "admin" ? "Admin" : "User"}
                  </span>
                  <span className="la-chat-text">{message.text}</span>
                </div>
              ))}
            </div>
          )}

          {isReplying ? (
            <div className="la-reply-editor">
              <textarea
                className="la-edit-textarea"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                style={{ borderColor: sectionColor }}
                placeholder="Write admin reply..."
                autoFocus
              />
              <div className="la-edit-actions">
                <button
                  type="button"
                  className="la-btn-save"
                  onClick={() => saveReply(question.id)}
                  disabled={isSavingReply || !replyText.trim()}
                  style={{ background: sectionColor }}
                >
                  {isSavingReply ? "Saving..." : "Send reply"}
                </button>
                <button
                  type="button"
                  className="la-btn-cancel-edit"
                  onClick={cancelReply}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="la-inline-edit-btn la-reply-btn"
              onClick={() => startReply(question.id)}
            >
              Reply
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`la-response-card ${isOpen ? "la-response-card--open" : ""}`}>
      {/* Card header */}
      <div
        className="la-response-header"
        onClick={() => setIsOpen((p) => !p)}
      >
        <div className="la-response-meta">
          <span className="la-response-num">#{index + 1}</span>
          <span className="la-response-icon">💌</span>
          <div className="la-response-info">
            {response.userEmail && (
              <span className="la-response-email">{response.userEmail}</span>
            )}
            <span className="la-response-date">{formattedDate}</span>
            <span className="la-response-count">
              {statusLabel} · {totalAnswers} answers
            </span>
          </div>
        </div>

        <div className="la-response-header-actions">
          {confirmDelete ? (
            <div
              className="la-confirm-delete"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Delete this response?</span>
              <button
                className="la-btn-yes-delete"
                onClick={() => onDelete(response.key)}
              >
                Yes, Delete
              </button>
              <button
                className="la-btn-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="la-btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              🗑️ Delete
            </button>
          )}
          <span className="la-expand-arrow">{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded body — admin Q&A and add-question first */}
      {isOpen && (
        <div className="la-response-body">
          <div className="la-admin-top-panel">
            <div
              className="la-admin-top-head"
              style={{ borderLeft: `4px solid ${ADMIN_QUESTIONS_SECTION.color}` }}
            >
              <span className="la-section-emoji">
                {ADMIN_QUESTIONS_SECTION.emoji}
              </span>
              <span className="la-admin-top-title">
                {ADMIN_QUESTIONS_SECTION.title}
              </span>
              <span className="la-section-answered-count">
                {
                  extraQuestions.filter((q) =>
                    getExtraAnswerText(response, q.id).trim(),
                  ).length
                }
                /{extraQuestions.length} answered
              </span>
            </div>

            <div className="la-add-question la-add-question--top">
              <label className="la-add-question-label" htmlFor={`add-q-${response.key}`}>
                Add a new question
              </label>
              <textarea
                id={`add-q-${response.key}`}
                className="la-edit-textarea"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                rows={3}
                placeholder="Type a new question for the user..."
              />
              <button
                type="button"
                className="la-btn-save"
                onClick={addExtraQuestion}
                disabled={isAddingQuestion || !newQuestionText.trim()}
                style={{ background: ADMIN_QUESTIONS_SECTION.color }}
              >
                {isAddingQuestion ? "Adding..." : "Add question"}
              </button>
            </div>

            <button
              type="button"
              className="la-section-toggle-btn la-admin-qa-toggle"
              style={{ borderLeft: `4px solid ${ADMIN_QUESTIONS_SECTION.color}` }}
              onClick={() => toggleSection(ADMIN_QUESTIONS_SECTION.id)}
            >
              <span className="la-section-label">
                <span className="la-section-name">Answers &amp; replies</span>
                <span className="la-section-answered-count">
                  {extraQuestions.length} question
                  {extraQuestions.length !== 1 ? "s" : ""}
                </span>
              </span>
              <span>
                {openSections[ADMIN_QUESTIONS_SECTION.id] !== false
                  ? "▲"
                  : "▼"}
              </span>
            </button>

            {openSections[ADMIN_QUESTIONS_SECTION.id] !== false && (
              <>
                {extraQuestions.length === 0 ? (
                  <p className="la-admin-section-empty">
                    No custom questions yet. Use the box above to add one — the
                    user will see it on their submitted form.
                  </p>
                ) : (
                  <div className="la-qa-list">
                    {extraQuestions.map((question, qIdx) =>
                      renderQuestionRow(
                        question,
                        qIdx,
                        getExtraAnswerText(response, question.id),
                        ADMIN_QUESTIONS_SECTION.color,
                      ),
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="la-form-sections-label">Form answers</div>

          {SECTIONS.map((section) => {
            const sectionIsOpen = openSections[section.id] !== false;
            const sectionQuestions = section.questions;
            const answeredCount = sectionQuestions.filter(
              (q) => response.answers[q.id] !== undefined,
            ).length;

            return (
              <div key={section.id} className="la-section-block">
                <button
                  className="la-section-toggle-btn"
                  style={{ borderLeft: `4px solid ${section.color}` }}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="la-section-label">
                    <span className="la-section-emoji">{section.emoji}</span>
                    <span className="la-section-name">{section.title}</span>
                    <span className="la-section-answered-count">
                      {answeredCount}/{sectionQuestions.length}
                    </span>
                  </span>
                  <span>{sectionIsOpen ? "▲" : "▼"}</span>
                </button>

                {sectionIsOpen && (
                  <div className="la-qa-list">
                    {sectionQuestions.map((question, qIdx) =>
                      renderQuestionRow(
                        question,
                        qIdx,
                        response.answers[question.id],
                        section.color,
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Admin Dashboard ───────────────────────────────────────────────────
const AdminDashboard = ({ onLogout }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const responsesRef = ref(db, LOVE_RESPONSES_PATH);
    const unsub = onValue(responsesRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setResponses([]);
        setLoading(false);
        return;
      }
      const list = Object.entries(data).map(([key, val]) => ({
        key,
        userEmail: val.userEmail || "",
        status:
          val.status || (val.submittedAt ? "submitted" : val.answers ? "draft" : ""),
        submittedAt: val.submittedAt || val.updatedAt || "",
        updatedAt: val.updatedAt || "",
        answers: val.answers || {},
        threads: val.threads || {},
        extraQuestions: val.extraQuestions || {},
        extraAnswers: val.extraAnswers || {},
      }));
      list.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      setResponses(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = useCallback(async (key) => {
    try {
      await remove(ref(db, `${LOVE_RESPONSES_PATH}/${key}`));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  // Filter responses by search text (searches all answer values)
  const filtered = searchText.trim()
    ? responses.filter((r) => {
        const q = searchText.toLowerCase();
        return Object.values(r.answers).some((v) =>
          String(v).toLowerCase().includes(q)
        );
      })
    : responses;

  return (
    <div className="la-dashboard">
      {/* Header */}
      <div className="la-dashboard-header">
        <div className="la-dashboard-title-group">
          <h1 className="la-dashboard-title">❤️ Love Form Admin</h1>
          <p className="la-dashboard-subtitle">
            {responses.length} total response{responses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="la-btn-logout" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Search */}
      <div className="la-search-bar">
        <span className="la-search-icon">🔍</span>
        <input
          className="la-search-input"
          type="text"
          placeholder="Search answers..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {searchText && (
          <button
            className="la-search-clear"
            onClick={() => setSearchText("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="la-stats-bar">
        <div className="la-stat-item">
          <span className="la-stat-num">{responses.length}</span>
          <span className="la-stat-label">Total Responses</span>
        </div>
        <div className="la-stat-item">
          <span className="la-stat-num">
            {responses.length > 0
              ? Object.keys(responses[0].answers).length
              : 0}
          </span>
          <span className="la-stat-label">Questions Answered</span>
        </div>
        <div className="la-stat-item">
          <span className="la-stat-num">{SECTIONS.length}</span>
          <span className="la-stat-label">Sections</span>
        </div>
      </div>

      {/* Content */}
      <div className="la-responses-list">
        {loading && (
          <div className="la-loading">
            <div className="la-loading-spinner" />
            Loading responses...
          </div>
        )}

        {!loading && responses.length === 0 && (
          <div className="la-empty-state">
            <div className="la-empty-icon">💌</div>
            <h3>No responses yet</h3>
            <p>When Saishree submits the form, her answers will appear here.</p>
          </div>
        )}

        {!loading && filtered.length === 0 && responses.length > 0 && (
          <div className="la-empty-state">
            <div className="la-empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>No answers match "{searchText}"</p>
          </div>
        )}

        {filtered.map((response, idx) => (
          <ResponseCard
            key={response.key}
            response={response}
            index={idx}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main Export ───────────────────────────────────────────────────────
const LoveAdminPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAdminLoggedIn());

  const handleLogin = () => {
    setAdminLoggedIn(true);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoveAdminLoginScreen onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default LoveAdminPage;
