const { google } = require("googleapis");
const { PassThrough } = require("stream");

var Time = new Date().getHours();
const imageResults = [];
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
    const fileIds = files.map((file) => file.id); // Collect all file IDs
    return fileIds;
  }
  return null;
}

async function fetchPhoto(fileIds) {
  for (const fileId of fileIds) {
    const drive = google.drive({ version: "v3", auth: jwtClient });
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    const bufferStream = new PassThrough();
    response.data.pipe(bufferStream);

    const chunks = [];
    const base64Image = await new Promise((resolve, reject) => {
      bufferStream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      bufferStream.on("end", () => {
        const responseBuffer = Buffer.concat(chunks);
        const base64Image = responseBuffer.toString("base64");
        resolve(`data:image/jpeg;base64,${base64Image}`);
      });

      bufferStream.on("error", (err) => {
        console.error("Error", err);
        reject(err); // Reject in case of error
      });
    });

    // Add the base64 image result to the array
    imageResults.push(base64Image);
  }
}

// Immediately Invoked Async Function
(async () => {
  try {
    const fileIds = await fetchFolder(folderId);
    if (!fileIds || fileIds.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "No photos found" }),
      };
    }

    await fetchPhoto(fileIds);
    console.log({
      body: JSON.stringify({
        images: imageResults, // Array of images
      }),
    });

    return {
      body: JSON.stringify({
        images: imageResults, // Array of images
      }),
    };
  } catch (error) {
    console.error("Error fetching photo:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: "Error fetching photo",
    };
  }
})();
