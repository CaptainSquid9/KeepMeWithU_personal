const { google } = require("googleapis");

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
  return files;
}

async function fetchPhoto(fileId) {
  const drive = google.drive({ version: "v3", auth: jwtClient });
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  // Convert the stream to a base64 string
  const chunks = [];
  for await (const chunk of response.data) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return buffer.toString("base64");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const folderId = "1-1S1b2VKJCPx8pkzd5Nn0kY2u74xJ9P4";

  try {
    const files = await fetchFolder(folderId);

    if (!files || files.length === 0) {
      res.status(404).json({ error: "No photos found" });
      return;
    }

    const images = [];
    const RandomStartingPt = Math.floor(Math.random() * files.length);
    for (var i = 0; i < 10; i++) {
      var photoBase64 = await fetchPhoto(files[RandomStartingPt].id);
      images.push(`data:image/jpeg;base64,${photoBase64}`);
    }

    res.status(200).send(images);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ error: "Error fetching photo" });
  }
}
