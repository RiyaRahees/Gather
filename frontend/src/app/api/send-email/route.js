import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { toEmail, subject, html, attachments, secret } = body;

    // Verify shared secret so only our backend can trigger email sends
    const expectedSecret = process.env.INTERNAL_EMAIL_SECRET || "gather_internal_secret_2026";
    if (secret !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!toEmail || !subject || !html) {
      return Response.json({ error: "Missing required fields: toEmail, subject, html" }, { status: 400 });
    }

    const user = (process.env.EMAIL_USER || "riyarahees136@gmail.com").trim();
    const pass = (process.env.EMAIL_PASS || "ipkrsqlubbljbmvf").replace(/\s+/g, "");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from: `Gather <${user}>`,
      to: toEmail,
      subject,
      html,
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content ? Buffer.from(att.content, "base64") : undefined,
        contentType: att.contentType || "image/png",
        cid: att.cid,
      }));
    }

    await transporter.sendMail(mailOptions);
    console.log(`✓ [Vercel Relay] Email delivered to ${toEmail}`);
    return Response.json({ success: true, via: "vercel-relay", to: toEmail });
  } catch (err) {
    console.error("Vercel email relay error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
