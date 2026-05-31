/**
 * Upload a file to Google Drive via Apps Script web app.
 * Set REACT_APP_GOOGLE_DRIVE_UPLOAD_URL in .env (see google-apps-script/DriveUpload.gs)
 */

const UPLOAD_URL = (process.env.REACT_APP_GOOGLE_DRIVE_UPLOAD_URL || "").trim();

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.split(",")[1] : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * @param {File} file
 * @param {string} [folderId]
 * @returns {Promise<{url:string,id:string,name:string}>}
 */
export async function uploadImageToGoogleDrive(file, folderId) {
  if (!UPLOAD_URL) {
    throw new Error(
      "Google Drive upload is not configured. Add REACT_APP_GOOGLE_DRIVE_UPLOAD_URL to your .env file (see google-apps-script/DriveUpload.gs).",
    );
  }

  const base64 = await fileToBase64(file);
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      base64,
      mimeType: file.type || "image/jpeg/png",
      fileName: file.name,
      folderId: folderId || undefined,
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || "Upload failed");
  }
  const id = data.id;
  return {
    url: data.url,
    viewUrl: data.viewUrl || data.url,
    thumbnailUrl:
      data.thumbnailUrl ||
      (id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : data.url),
    id,
    name: data.name,
  };
}

export function isGoogleDriveConfigured() {
  return Boolean(UPLOAD_URL);
}

export function parseImageAnswer(raw) {
  if (!raw) return { files: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.files)) return parsed;
  } catch {
    /* plain text fallback */
  }
  return { files: [] };
}

export function formatImageAnswer(files) {
  return JSON.stringify({ files });
}

export function getImageDisplayUrl(file) {
  if (!file) return "";
  if (file.thumbnailUrl) return file.thumbnailUrl;
  if (file.id) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      file.id,
    )}&sz=w1000`;
  }
  return file.url || "";
}

export function getImageViewUrl(file) {
  return file?.viewUrl || file?.url || getImageDisplayUrl(file);
}
