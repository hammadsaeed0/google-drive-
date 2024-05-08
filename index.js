const stream = require("stream");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // res.sendFile(`${__dirname}/index.html`);
    res.send("Video Upload")
});

const KEYFILEPATH = path.join(__dirname, "cred.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const uploadFile = async (fileObject) => {
    try {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);
        const drive = google.drive({ version: "v3", auth });
        const { data } = await drive.files.create({
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: fileObject.originalname,
                parents: ["1CtV2N3VPuzz-TKRnpTVaJAWfMWE7vVRX"],
            },
            fields: "id,name,webViewLink", // Include webViewLink to get the URL
        });
        console.log(`Uploaded file ${data.name} ${data.id}`);

        // Construct the URL of the uploaded file
        const fileUrl = data.webViewLink;

        return fileUrl; // Return the URL of the uploaded file
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

app.post("/upload", upload.any(), async (req, res) => {
    try {
        const { files } = req;

        const uploadedFileUrls = [];
        for (let f = 0; f < files.length; f += 1) {
            const fileUrl = await uploadFile(files[f]);
            uploadedFileUrls.push(fileUrl); // Add the URL to the array
        }

        res.status(200).json({
            success: true,
            message: "Files uploaded successfully",
            data: uploadedFileUrls // Include the array of URLs in the response
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error uploading files",
            error: error.message
        });
    }
});

app.listen(5050, () => {
    console.log('Form running on port 5050');
});
