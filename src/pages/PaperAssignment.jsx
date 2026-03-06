// import React, { useEffect, useState } from "react";
// import "../styles/editor.css";

// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";

// import { db } from "../services/firebase";
// import { ref, set, onValue } from "firebase/database";

// import html2pdf from "html2pdf.js";
// import { saveAs } from "file-saver";

// import { v4 as uuid } from "uuid";

// const PaperAssignment = () => {
//   const [docId] = useState(uuid());
//   const [title, setTitle] = useState("Untitled Document");

//   const editor = useEditor({
//     extensions: [StarterKit],
//     content: "<p>Start writing your assignment...</p>",
//   });

//   /* LOAD DOCUMENT */

//   useEffect(() => {
//     const docRef = ref(db, "documents/" + docId);

//     onValue(docRef, (snapshot) => {
//       const data = snapshot.val();

//       if (data && editor) {
//         editor.commands.setContent(data.content);
//         setTitle(data.title);
//       }
//     });
//   }, [editor, docId]);

//   /* AUTO SAVE */

//   useEffect(() => {
//     if (!editor) return;

//     const interval = setInterval(() => {
//       const content = editor.getHTML();

//       set(ref(db, "documents/" + docId), {
//         title,
//         content,
//         updatedAt: new Date().toISOString(),
//       });
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [editor, title, docId]);

//   /* DOWNLOAD PDF */

//   const downloadPDF = () => {
//     const element = document.querySelector(".editor-page");

//     html2pdf()
//       .from(element)
//       .save(title + ".pdf");
//   };

//   /* DOWNLOAD WORD */

//   const downloadWord = () => {
//     const content = editor.getHTML();

//     const blob = new Blob([content], {
//       type: "application/msword;charset=utf-8",
//     });

//     saveAs(blob, title + ".doc");
//   };

//   if (!editor) return null;

//   return (
//     <div className="editor-wrapper">
//       {/* TOP BAR */}

//       <div className="editor-toolbar">
//         <input
//           className="doc-title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />

//         <div className="toolbar-buttons">
//           <button onClick={() => editor.chain().focus().toggleBold().run()}>
//             B
//           </button>

//           <button onClick={() => editor.chain().focus().toggleItalic().run()}>
//             I
//           </button>

//           <button
//             onClick={() => editor.chain().focus().toggleBulletList().run()}
//           >
//             List
//           </button>

//           <button onClick={downloadPDF}>PDF</button>

//           <button onClick={downloadWord}>Word</button>
//         </div>
//       </div>

//       {/* EDITOR PAGE */}

//       <div className="editor-page">
//         <EditorContent editor={editor} />
//       </div>
//     </div>
//   );
// };

// export default PaperAssignment;
