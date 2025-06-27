const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

async function sendQRMail(user, event) {
  // 📦 Create JSON payload for QR
  const payload = JSON.stringify({
    userId: user._id,
    eventId: event._id,
  });

  // 🖼 Generate QR as base64 data URL
  const qrDataURL = await QRCode.toDataURL(payload);

  // ✉️ Configure email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  });

  // 📧 Email contents
  const mailOptions = {
    from: `"FestFlow" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: `Your QR Code for ${event.title}`,
    html: `
      <h2>You're registered for <b>${event.title}</b> 🎉</h2>
      <p><b>Event Date:</b> ${new Date(event.date).toDateString()}</p>
      <p>Show this QR code at the event entrance:</p>
      <img src="cid:qrcode" alt="QR Code" />
      <p style="color:gray;font-size:12px">Fest: ${event.festType}</p>
      <br>
      <p>Thank you for using FestFlow ✨</p>
    `,
    attachments: [
      {
        filename: `qr-${event._id}.png`,
        content: qrDataURL.split("base64,")[1],
        encoding: 'base64',
        cid: 'qrcode' // 👈 This allows inline embedding in HTML
      }
    ]
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendQRMail;
