const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

/const CLIENT_URL = 'https://sign-client-app.onrender.com';
app.use(cors({ origin: CLIENT_URL }));

app.use(express.json({ limit: '10mb' }));

const UPLOAD_FOLDER = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, fileId + ext);
  },
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'לא התקבל קובץ' });
  const fileId = path.parse(req.file.filename).name;

  // קישור לשיתוף לקליינט בענן
  const shareLink = `${CLIENT_URL}/sign/${fileId}`;
  res.json({ message: 'הקובץ התקבל', shareLink });
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // שימוש ב-TLS רגיל ולא ב-SSL
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.on('error', err => {
  console.error('Nodemailer Error:', err);
});

app.post('/sign/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const { signerName, signatureImage } = req.body;

  if (!signerName) return res.status(400).json({ error: 'חסר שם חתימה' });
  if (!signatureImage) return res.status(400).json({ error: 'חסר חתימה' });

  try {
    const files = fs.readdirSync(UPLOAD_FOLDER);
    const wordFile = files.find(f => path.parse(f).name === fileId && (f.endsWith('.doc') || f.endsWith('.docx')));
    if (!wordFile) return res.status(404).json({ error: 'קובץ לא נמצא' });

    const wordPath = path.join(UPLOAD_FOLDER, wordFile);
    const pdfPath = path.join(UPLOAD_FOLDER, `${fileId}.pdf`);

    // אם השרת בענן אין אפשרות להריץ LibreOffice, יש לשנות את הלוגיקה או לספק פתרון אחר
    const sofficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
    execSync(`${sofficePath} --headless --convert-to pdf --outdir "${UPLOAD_FOLDER}" "${wordPath}"`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = fs.readFileSync(path.join(__dirname, 'fonts', 'Alef-Regular.ttf'));
    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const today = new Date();
    const dateStr = today.toLocaleDateString('he-IL');

    firstPage.drawText(`חתום על ידי: ${signerName} בתאריך: ${dateStr}`, {
      x: 50,
      y: 100,
      size: 14,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    const base64Data = signatureImage.replace(/^data:image\/png;base64,/, "");
    const signatureImageBytes = Buffer.from(base64Data, 'base64');
    const pngImage = await pdfDoc.embedPng(signatureImageBytes);
    const pngDims = pngImage.scale(0.5);

    firstPage.drawImage(pngImage, {
      x: 50,
      y: 150,
      width: pngDims.width,
      height: pngDims.height,
    });

    const signedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, signedPdfBytes);

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: process.env.EMAIL_ADDRESS,
      subject: `המסמך נחתם על ידי: ${signerName}`,
      text: `המסמך נחתם על ידי ${signerName}. ראה קובץ מצורף.`,
      attachments: [{ filename: `${fileId}.pdf`, path: pdfPath }],
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `המסמך נחתם ונשלח בהצלחה על ידי ${signerName}` });
  } catch (error) {
    console.error('שגיאה בתהליך החתימה:', error);
    res.status(500).json({ error: 'שגיאה בתהליך החתימה: ' + error.message });
  }
});

app.listen(PORT, () => {
console.log(`✅ השרת רץ, PORT=${PORT}`);
});
