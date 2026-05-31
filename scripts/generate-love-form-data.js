/**
 * Regenerates src/data/loveFormData.js from Google-form.json
 * Run: node scripts/generate-love-form-data.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const formPath = path.join(ROOT, "Google-form.json");
const outPath = path.join(ROOT, "src", "data", "loveFormData.js");

const data = JSON.parse(fs.readFileSync(formPath, "utf8"));
const items = data.items || [];

const questions = [];
items.forEach((item) => {
  if (!item.questionItem) return;
  const q = item.questionItem.question;
  const isUpload = !!q.fileUploadQuestion;
  questions.push({
    text: (item.title || "").trim(),
    type: isUpload
      ? "image"
      : q.textQuestion?.paragraph
        ? "paragraph"
        : "short",
    required: q.required !== false,
    description: item.description || "",
    maxFiles: q.fileUploadQuestion?.maxFiles || 10,
    driveFolderId:
      q.fileUploadQuestion?.folderId ||
      "1qSN_OiM40WMt3VKkr-SbCYXA1BW4U8SN9e_T1bMmZ7gJCMkPzRSzDGaf8lQxMOTXVhrT38LR",
  });
});

const formatQuestion = (q, id) => {
  const lines = [
    `      {`,
    `        id: "${id}",`,
    `        text: ${JSON.stringify(q.text)},`,
    `        type: "${q.type}",`,
    `        required: ${q.required},`,
  ];
  if (q.type === "image") {
    lines.push(`        maxFiles: ${q.maxFiles},`);
    lines.push(`        driveFolderId: ${JSON.stringify(q.driveFolderId)},`);
    if (q.description) {
      lines.push(`        description: ${JSON.stringify(q.description)},`);
    }
  } else {
    lines.push(`        placeholder: "Your answer...",`);
  }
  lines.push(`      },`);
  return lines.join("\n");
};

const sayariQuestions = [formatQuestion(questions[0], "q_001")];
const mainQuestions = questions
  .slice(1)
  .map((q, i) => formatQuestion(q, `q_${String(i + 2).padStart(3, "0")}`))
  .join("\n");

const fileContent = `// =====================================================================
// Love Form Data — auto-generated from Google-form.json
// Total questions: ${questions.length}
// Regenerate: node scripts/generate-love-form-data.js
// =====================================================================

export const FORM_INFO = {
  title: "Saishree Love Gourab ❤️",
  description: ${JSON.stringify(
    `Hello My Love ❤️,

Thank you for taking the time to fill out this form. This form is a special part of our relationship journey and is meant to help me understand your thoughts, feelings, memories, and expectations better. Please answer every question honestly and from your heart.

A few small requests:
• This form can be submitted only once, so please take your time.
• Please do not rush through the questions.
• Find a comfortable and peaceful place, relax your mind, and answer sincerely.
• There are no right or wrong answers.
• Please avoid writing "I don't know" whenever possible — share what you genuinely think or feel.
• Feel free to express your emotions, opinions, memories, concerns, wishes, and expectations openly.
• I want to know the real you, your real thoughts, and your honest feelings.

🔒 Confidentiality Notice
Everything you write here is highly confidential and private. Your responses will only be read by your love (me) and will not be shared with anyone else.

This is not a test. This is simply a way for us to understand each other more deeply and celebrate our beautiful journey together.

Thank you for being such an important part of my life. ❤️
With Love,
Your Forever Partner ❤️`
  )},
};

export const SAYARI_TEXT = ${JSON.stringify(`🌹❤️ Tum meri zindagi ka woh hissa ho,
jise main kabhi khona nahi chahta.
Har din bas itni si dua karta hoon,
ki tumhara saath hamesha bana rahe. 🥰🤝❤️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💖✨ 3 saal ka safar chhota nahi hota,
isme hazaar yaadein aur lakhon ehsaas hote hain. 🌸
Aur in sab yaadon mein,
meri sabse khoobsurat yaad tum ho. 😘💕

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌙❤️ Chand bhi sharma jaata hai,
jab tum muskuraati ho. 😊✨
Meri har khushi ka reason,
sirf aur sirf tum ho. 💞🥹

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌹💘 Pyaar ka matlab maine tumse seekha hai,
intezaar ka matlab maine tumse seekha hai.
Aur zindagi ko khoobsurat banana bhi,
maine tumse hi seekha hai. ❤️🌍

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💑💕 Na koi daulat chahiye,
na koi shohrat chahiye.
Bas har janam mein mujhe,
tumhara saath chahiye. 🥰💍❤️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌸✨ Kuch log zindagi mein aate hain aur chale jaate hain,
lekin kuch log dil mein ghar bana lete hain. 🏡❤️
Tum unhi logon mein se ho,
jo meri duniya ban gaye ho. 🌍💖

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥹❤️ Jab bhi main apne future ke baare mein sochta hoon,
har tasveer mein tum nazar aati ho. 🌈💕
Shayad isi ko saccha pyaar kehte hain. 😘❤️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌹🤗 Tumse milne ke baad samjha,
ki mohabbat sirf lafzon mein nahi hoti.
Kabhi kabhi ek muskaan bhi,
dil jeet leti hai. 😊💘✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💞🌙 Rab se sirf ek hi dua hai meri,
tumhari har khushi meri ho. 🥰❤️
Aur meri har saans mein,
sirf tumhara naam ho. 😘💕

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❤️👑 Tum meri aadat bhi ho,
tum meri zaroorat bhi ho. 💖
Aur sach kahun,
tum meri zindagi ki sabse khoobsurat haqeeqat ho. 🥹🌹❤️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❤️✨🥰 Is form ke har jawab ko main sirf padhunga nahi,
mehsoos bhi karunga. 💖
Tumhare har lafz ki mere liye keemat hai,
kyunki tum sirf meri girlfriend nahi,
meri sabse achhi dost, meri khushi aur meri duniya ho. 🌍❤️
Thank you for being part of my life. 🌹🥰💕`)};

export const GOOGLE_DRIVE_FOLDER_ID =
  "1qSN_OiM40WMt3VKkr-SbCYXA1BW4U8SN9e_T1bMmZ7gJCMkPzRSzDGaf8lQxMOTXVhrT38LR";

export const SECTIONS = [
  {
    id: "sayari",
    title: "Sayari For You",
    emoji: "🌹",
    color: "#e91e63",
    gradient: "linear-gradient(135deg, #e91e63, #f48fb1)",
    subtitle: "A collection of love poems written just for you",
    intro: SAYARI_TEXT,
    questions: [
${sayariQuestions.join("\n")}
    ],
  },
  {
    id: "all-questions",
    title: "365 Love Questions",
    emoji: "❤️",
    color: "#c2185b",
    gradient: "linear-gradient(135deg, #c2185b, #f48fb1)",
    subtitle: "All ${questions.length} questions from your Google Form",
    intro:
      "Hello Love ❤️,\\n\\nAfter you begin, your love form answers are saved live — you can pause and continue anytime before submitting.\\n\\nPlease answer honestly. There are no right or wrong answers. ❤️",
    questions: [
${mainQuestions}
    ],
  },
];

export const buildSteps = () => {
  const steps = [{ type: "cover" }];
  SECTIONS.forEach((section) => {
    steps.push({ type: "section-intro", section });
    section.questions.forEach((question, qIdx) => {
      steps.push({
        type: "question",
        question,
        section,
        questionIndexInSection: qIdx,
        totalInSection: section.questions.length,
      });
    });
  });
  steps.push({ type: "review" });
  return steps;
};

export const TOTAL_QUESTIONS = SECTIONS.reduce(
  (acc, s) => acc + s.questions.length,
  0
);

export const getQuestionById = (id) => {
  for (const section of SECTIONS) {
    const q = section.questions.find((x) => x.id === id);
    if (q) return q;
  }
  return null;
};
`;

fs.writeFileSync(outPath, fileContent, "utf8");
console.log(`Wrote ${outPath} with ${questions.length} questions.`);
