const { google } = require("googleapis");
const { PassThrough } = require("stream");

const clientId = process.env.GOOGLE_CLIENTID;
const clientSecret = process.env.GOOGLE_CLIENTSECRET;
const redirectUri = process.env.GOOGLE_REDIRECTURI;

async function fetchRandomPhoto(accessToken, folderId) {
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });
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
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: "Unauthorized",
      };
    }

    const accessToken = authHeader.split("Bearer ")[1];
    const folderId = event.queryStringParameters.folderId;

    if (!folderId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: "Missing folder ID",
      };
    }

    const fileId = await fetchRandomPhoto(accessToken, folderId);
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

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
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
