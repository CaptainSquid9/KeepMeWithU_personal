const { google } = require("googleapis");
const { PassThrough } = require("stream");

var Time = 11;
//new Date().getHours();
const folderId = "1-1S1b2VKJCPx8pkzd5Nn0kY2u74xJ9P4";
console.log(Time);

if (Time > 10 && Time < 21) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const jwtClient = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/drive.readonly"]
  );

  async function fetchRandomPhoto(folderId) {
    const drive = google.drive({ version: "v3", auth: jwtClient });
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/'`,
      fields: "files(id, name)",
    });

    const files = response.data.files;
    if (files.length > 0) {
      const randomIndex = Math.floor(Math.random() * files.length);
      return files[randomIndex].id;
    }
    return null;
  }

  exports.handler = async (event, context) => {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: "",
      };
    }

    try {
      const fileId = await fetchRandomPhoto(folderId);
      if (!fileId) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ error: "No photos found" }),
        };
      }

      const drive = google.drive({ version: "v3", auth: jwtClient });
      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      const bufferStream = new PassThrough();
      response.data.pipe(bufferStream);

      const chunks = [];
      bufferStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      return new Promise((resolve, reject) => {
        bufferStream.on("end", () => {
          const responseBuffer = Buffer.concat(chunks);
          const base64Image = responseBuffer.toString("base64");
          resolve({
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              image: `data:image/jpeg;base64,${base64Image}`,
            }),
          });
        });

        bufferStream.on("error", (err) => {
          console.error("Error", err);
          resolve({
            statusCode: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: "Error fetching photo",
          });
        });
      });
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
  };
}
