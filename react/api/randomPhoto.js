const { google } = require("googleapis");

var Time = new Date().getHours();
const folderId = "1-1S1b2VKJCPx8pkzd5Nn0kY2u74xJ9P4";
console.log(Time);

// if (Time > 8 && Time < 22) {
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
  if (files.length > 0) {
    return files.map((file) => "https://drive.google.com/id=" + file.id);
  } else {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow any origin
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allowed methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allowed headers

  // Handle OPTIONS request (CORS preflight)
  if (req.method === "OPTIONS") {
    res.status(200).end(); // End the preflight request
    return;
  }

  try {
    const fileIds = await fetchFolder(folderId);

    if (!fileIds || fileIds.length === 0) {
      res.status(404).json({ error: "No photos found" });
    } else {
      res.status(200).json({ images: fileIds });
    }
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Error fetching photos" });
  }
}
