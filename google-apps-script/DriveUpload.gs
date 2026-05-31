/**
 * Google Apps Script — upload love form images to Google Drive
 *
 * Setup:
 * 1. Open https://script.google.com → New project
 * 2. Paste this file, save
 * 3. Run setDriveFolder once (or edit FOLDER_ID below)
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into .env:
 *    REACT_APP_GOOGLE_DRIVE_UPLOAD_URL=https://script.google.com/macros/s/.../exec
 */
const FOLDER_ID =
  "1qSN_OiM40WMt3VKkr-SbCYXA1BW4U8SN9e_T1bMmZ7gJCMkPzRSzDGaf8lQxMOTXVhrT38LR";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const base64 = payload.base64;
    const mimeType = payload.mimeType || "image/jpeg";
    const fileName = payload.fileName || "love-form-photo.jpg";
    const folderId = payload.folderId || FOLDER_ID;

    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );
    const thumbnailUrl =
      "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";

    return jsonResponse({
      ok: true,
      url: thumbnailUrl,
      viewUrl: file.getUrl(),
      thumbnailUrl,
      id: file.getId(),
      name: file.getName(),
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: "Love form Drive upload is ready." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
