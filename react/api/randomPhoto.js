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
  return files.map((file) => file.id);
}

async function fetchPhoto(fileId) {
  const drive = google.drive({ version: "v3", auth: jwtClient });
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" },
    function (err, { data }) {
      fs.writeFile("sample.jpg", Buffer.from(data), (err) => {
        if (err) console.log(err);
      });
    }
  );

  // Return the raw ArrayBuffer from the file
  return response.data;
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
    const fileIds = await fetchFolder(folderId);

    if (!fileIds || fileIds.length === 0) {
      res.status(404).json({ error: "No photos found" });
      return;
    }
    var buffers = [];
    // Fetch the ArrayBuffer data for each file
    for (var fileId in fileIds) {
      const photoFile = await fetchPhoto(fileId);
      if (!photoFile || Object.keys(photoFile).length === 0) {
        res.status(404).json({ error: "Empty object found" });
        return;
      }
      const arraybuffer = await blobToDataUrl(photoFile);
      buffers.push(arraybuffer);
    }
    res.status(200).json({ images: buffers });
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ error: "Error fetching photo" });
  }
}
