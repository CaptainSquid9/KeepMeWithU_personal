import { file } from "googleapis/build/src/apis/file";

const { google } = require("googleapis");
const fs = require("fs");

const folderId = "1-1S1b2VKJCPx8pkzd5Nn0kY2u74xJ9P4";
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ["https://www.googleapis.com/auth/drive.readonly"]
);

async function fetchFolder(folderId) {
  const drive = google.drive({ version: "v3", auth: jwtClient });
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/'`,
    fields: "files(id, name)",
  });

  const files = response.data.files;
  return files.map((file) => file.id); // Return the file IDs
}

async function fetchPhoto(fileId) {
  const drive = google.drive({ version: "v3", auth: jwtClient });
  const response = await drive.files.get({ fileId, alt: "media" });

  return response.data; // Return the stream
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const fileIds = await fetchFolder(folderId);
    const images = [];

    if (!fileIds || fileIds.length === 0) {
      res.status(404).json({ error: "No photos found" });
      return;
    }
    for (fileId in fileIds) {
      const fileData = fs.readFileSync(fileId);
      images.push(fileData.toString("base64"));
    }
    // Return all images as base64 encoded strings
    res.status(200).json({ images });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Error fetching photos" });
  }
}
