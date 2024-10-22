const { google } = require("googleapis");
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
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

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

    if (!fileIds || fileIds.length === 0) {
      res.status(404).json({ error: "No photos found" });
      return;
    }

    // Initialize an array to store image buffers
    const images = [];

    // Loop through all file IDs and fetch their streams
    for (const fileId of fileIds) {
      const photoStream = await fetchPhoto(fileId);

      // Create a buffer to store the image data
      const chunks = [];
      for await (const chunk of photoStream) {
        chunks.push(chunk);
      }

      // Combine chunks into a single buffer
      const buffer = Buffer.concat(chunks);

      // Convert the buffer to a base64 string for frontend use
      const base64Image = buffer.toString("base64");

      // Push the base64 image string into the array
      images.push(`data:image/jpeg;base64,${base64Image}`);
    }

    // Return all images as base64 encoded strings
    res.status(200).json({ images });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Error fetching photos" });
  }
}
