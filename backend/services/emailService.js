import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { generateTicketQrBuffer } from "./ticketService.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export function getFrontendBaseUrl() {
  const envUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://gather-learn.vercel.app";
}

export function getFromAddress() {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || "riyarahees136@gmail.com").trim();
  return process.env.EMAIL_FROM || `Gather <${user}>`;
}

function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass || user.includes("placeholder")) {
    return null;
  }

  const cleanUser = user.trim();
  const cleanPass = pass.replace(/\s+/g, "");
  const host = process.env.SMTP_HOST;
  const isGmail = !host || host.includes("gmail") || cleanUser.includes("@gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }

  return nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

/**
 * Send booking confirmation email with inline QR ticket and direct cancellation option
 */
export async function sendBookingConfirmation({
  toEmail,
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  seatsBooked,
  bookingRef,
  bookingId,
  cancellationSecret,
  amount,
  isFree,
  paymentStatus,
  ticketCode,
  tickets = [],
}) {
  const transporter = getTransporter();

  const formattedAmount = isFree ? "Free Pass" : `₹${amount} (Paid via Razorpay)`;
  const frontendUrl = getFrontendBaseUrl();
  const accountUrl = `${frontendUrl}/account/bookings`;

  // Generate cancellation token and direct cancellation link
  let cancelToken = cancellationSecret;
  if (!cancelToken && bookingId) {
    try {
      cancelToken = jwt.sign(
        { bookingId: bookingId.toString(), action: "cancel", ref: bookingRef },
        process.env.JWT_SECRET || "default_jwt_secret",
        { expiresIn: "60d" }
      );
    } catch {
      cancelToken = bookingRef;
    }
  }
  const cancelUrl = `${frontendUrl}/bookings/cancel?id=${bookingId || ""}&token=${encodeURIComponent(
    cancelToken || ""
  )}&ref=${bookingRef}`;

  // Primary ticket code for the main QR pass
  const primaryTicketCode = ticketCode || tickets?.[0]?.ticketCode || bookingRef;

  // Generate QR buffer for inline email attachment
  let qrBuffer = null;
  const isEligibleForAdmission = (isFree || paymentStatus === "completed" || paymentStatus === "free") && primaryTicketCode;
  if (isEligibleForAdmission) {
    try {
      qrBuffer = await generateTicketQrBuffer(primaryTicketCode);
    } catch (e) {
      console.warn("Could not generate QR buffer for email attachment:", e.message);
    }
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation - ${eventTitle}</title>
      </head>
      <body style="margin: 0; padding: 32px 16px; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171915; line-height: 1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFEFA; border: 1px solid #E7E2D8; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(23, 25, 21, 0.04);" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #073F2E; padding: 36px 32px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 14px; background-color: rgba(255, 255, 255, 0.15); color: #EBF3E8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 999px; margin-bottom: 12px;">
                      Pass Confirmed
                    </span>
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #FFFEFA; letter-spacing: -0.5px;">
                      You&apos;re Going to ${eventTitle}!
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #A9C3A0; font-size: 14px;">
                      Gather Curated Sessions &bull; Official Admission Pass
                    </p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #171915;">
                      Dear <strong>${attendeeName}</strong>,
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #77776F; line-height: 1.6;">
                      Your reservation has been confirmed. Below are your event admission details and QR entry pass. Present this QR code at the check-in desk upon arrival.
                    </p>

                    <!-- Pass Badge / QR Code Card -->
                    <div style="background-color: #FAF8F5; border: 1.5px dashed #073F2E; border-radius: 16px; padding: 22px 18px; text-align: center; margin-bottom: 28px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #77776F; margin-bottom: 12px;">
                        Digital Admission Pass &bull; Scan for Entry
                      </div>
                      
                      ${
                        qrBuffer
                          ? `<img src="cid:ticketqrcode" alt="QR Admission Ticket" width="180" height="180" style="display: block; margin: 0 auto 12px auto; border-radius: 12px; border: 1px solid #E7E2D8; background-color: #FFFEFA; padding: 6px;" />`
                          : `<img src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                              primaryTicketCode
                            )}&color=073F2E&bgcolor=FFFEFA&margin=1" alt="QR Admission Ticket" width="180" height="180" style="display: block; margin: 0 auto 12px auto; border-radius: 12px; border: 1px solid #E7E2D8; background-color: #FFFEFA; padding: 6px;" />`
                      }

                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; color: #073F2E; letter-spacing: 2px;">
                        ${primaryTicketCode}
                      </div>
                      <div style="font-size: 12px; color: #073F2E; font-weight: 600; margin-top: 6px;">
                        &bull; ${seatsBooked} ${seatsBooked === 1 ? "Seat" : "Seats"} Reserved &bull;
                      </div>
                      <div style="font-size: 11px; color: #77776F; margin-top: 4px;">
                        Booking Reference: <strong style="color: #171915;">${bookingRef}</strong>
                      </div>

                      ${
                        tickets && tickets.length > 1
                          ? `
                        <div style="margin-top: 14px; text-align: left; background-color: #FFFEFA; border: 1px solid #E7E2D8; border-radius: 10px; padding: 10px 14px;">
                          <div style="font-size: 11px; font-weight: 700; color: #77776F; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">All Seat Passcodes:</div>
                          ${tickets
                            .map(
                              (t, idx) => `
                            <div style="font-size: 12px; padding: 4px 0; border-bottom: ${
                              idx < tickets.length - 1 ? "1px dashed #F0ECE1" : "none"
                            }; display: flex; justify-content: space-between;">
                              <span style="color: #77776F;">Seat ${t.seatNumber || idx + 1}:</span>
                              <strong style="font-family: monospace; color: #073F2E;">${t.ticketCode}</strong>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                      `
                          : ""
                      }
                    </div>

                    <!-- Event Details Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F; width: 35%;">
                          Event
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${eventTitle}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Date &amp; Time
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${eventDate} &bull; ${eventTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Venue Location
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #073F2E; text-align: right;">
                          📍 ${venue}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Reserved For
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${attendeeName} (${toEmail})
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #77776F;">
                          Payment
                        </td>
                        <td style="padding: 12px 0; font-size: 14px; font-weight: 700; color: #073F2E; text-align: right;">
                          ${formattedAmount}
                        </td>
                      </tr>
                    </table>

                    <!-- View Pass in Account Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; margin-bottom: 16px;">
                      <tr>
                        <td align="center">
                          <a href="${accountUrl}" target="_blank" style="display: inline-block; background-color: #073F2E; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 999px; box-shadow: 0 2px 8px rgba(7, 63, 46, 0.25);">
                            View Pass in My Account &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Cancel Reservation from Email -->
                    <div style="background-color: #FFF8F8; border: 1px solid #FEE2E2; border-radius: 14px; padding: 18px 20px; text-align: center; margin-top: 16px; margin-bottom: 24px;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #991B1B;">
                        Need to change plans or cancel?
                      </p>
                      <p style="margin: 0 0 12px 0; font-size: 12px; color: #7F1D1D; line-height: 1.5;">
                        You can cancel your reservation anytime before the session starts. If you cancel, your seats are released back to the event catalogue.
                      </p>
                      <a href="${cancelUrl}" target="_blank" style="display: inline-block; background-color: #DC2626; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 10px 24px; border-radius: 999px; letter-spacing: 0.3px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);">
                        Cancel My Reservation &rarr;
                      </a>
                    </div>

                    <!-- Helpful Venue Tips -->
                    <div style="background-color: #FAF8F5; border: 1px solid #E7E2D8; border-radius: 14px; padding: 16px; font-size: 12px; color: #77776F; line-height: 1.6;">
                      <strong style="color: #171915; display: block; margin-bottom: 4px;">Important Venue Instructions:</strong>
                      &bull; Doors open 30 minutes before session starts.<br>
                      &bull; Present the QR code on your phone at entry for instant scanning.<br>
                      &bull; In case of queries, reply directly to this email or contact support at <a href="mailto:admin@gmail.com" style="color: #073F2E; font-weight: 600;">admin@gmail.com</a>.
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F7F4ED; border-top: 1px solid #E7E2D8; padding: 20px 24px; text-align: center; font-size: 11px; color: #77776F;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #171915;">
                      Gather &mdash; Curated Sessions for Curious Minds
                    </p>
                    <p style="margin: 0;">
                      This is an automated pass confirmation sent to ${toEmail}.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(
      `✉️  [Email Notice] SMTP not configured. Simulated dispatch for Booking #${bookingRef} to ${attendeeName} <${toEmail}>.`
    );
    return { success: true, simulated: true };
  }

  try {
    const from = getFromAddress();
    const mailOptions = {
      from,
      to: toEmail,
      subject: `Confirmed: Your pass for "${eventTitle}" [${bookingRef}]`,
      html: emailHtml,
    };

    if (qrBuffer) {
      mailOptions.attachments = [
        {
          filename: `ticket-${primaryTicketCode || bookingRef}.png`,
          content: qrBuffer,
          contentType: "image/png",
          contentDisposition: "inline",
          cid: "ticketqrcode",
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    console.log(`✓  [Email Sent] Confirmation delivered to ${toEmail} for booking ${bookingRef}.`);
    return { success: true, simulated: false };
  } catch (err) {
    console.error(`⚠️  [Email Error] Failed to send email to ${toEmail}:`, err.message);
    // Return gracefully so booking is never cancelled or rolled back merely because of an email delivery network issue
    return { success: false, error: err.message };
  }
}

/**
 * Send cancellation confirmation email
 */
export async function sendBookingCancellation({
  toEmail,
  attendeeName,
  eventTitle,
  eventDate,
  bookingRef,
  seatsBooked = 1,
  amount = 0,
  isFree = false,
}) {
  const transporter = getTransporter();
  const frontendUrl = getFrontendBaseUrl();
  const eventsUrl = `${frontendUrl}/events`;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservation Cancelled - ${eventTitle}</title>
      </head>
      <body style="margin: 0; padding: 32px 16px; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171915; line-height: 1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFEFA; border: 1px solid #E7E2D8; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(23, 25, 21, 0.04);" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #4B1A1A; padding: 32px 28px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 14px; background-color: rgba(255, 255, 255, 0.15); color: #FEE2E2; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 999px; margin-bottom: 12px;">
                      Reservation Cancelled
                    </span>
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #FFFEFA; letter-spacing: -0.5px;">
                      Booking Cancelled Successfully
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #FCA5A5; font-size: 13px;">
                      ${eventTitle}
                    </p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #171915;">
                      Hello <strong>${attendeeName || "Attendee"}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #77776F; line-height: 1.6;">
                      As requested, your booking for <strong>${eventTitle}</strong> (Reference: <code style="font-weight: 700; color: #171915;">${bookingRef}</code>) has been cancelled.
                    </p>

                    <div style="background-color: #FAF8F5; border: 1px solid #E7E2D8; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; font-size: 13px;">
                      <div style="padding: 6px 0; border-bottom: 1px solid #F0ECE1;">
                        <span style="color: #77776F;">Event:</span>
                        <strong style="color: #171915; float: right;">${eventTitle}</strong>
                      </div>
                      ${
                        eventDate
                          ? `
                      <div style="padding: 6px 0; border-bottom: 1px solid #F0ECE1;">
                        <span style="color: #77776F;">Scheduled Date:</span>
                        <strong style="color: #171915; float: right;">${eventDate}</strong>
                      </div>
                      `
                          : ""
                      }
                      <div style="padding: 6px 0; border-bottom: 1px solid #F0ECE1;">
                        <span style="color: #77776F;">Seats Released:</span>
                        <strong style="color: #171915; float: right;">${seatsBooked} ${
                          seatsBooked === 1 ? "seat" : "seats"
                        }</strong>
                      </div>
                      <div style="padding: 6px 0;">
                        <span style="color: #77776F;">Ticket Status:</span>
                        <strong style="color: #DC2626; float: right;">QR Passes Voided</strong>
                      </div>
                    </div>

                    <p style="margin: 0 0 24px 0; font-size: 13px; color: #77776F; line-height: 1.6;">
                      Your reserved seats have been returned to the event catalogue. We hope to welcome you to another Gather session soon!
                    </p>

                    <div style="text-align: center; margin: 28px 0 12px 0;">
                      <a href="${eventsUrl}" style="display: inline-block; background-color: #073F2E; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 999px;">
                        Browse Upcoming Sessions &rarr;
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F7F4ED; border-top: 1px solid #E7E2D8; padding: 20px 24px; text-align: center; font-size: 11px; color: #77776F;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #171915;">
                      Gather &mdash; Curated Sessions for Curious Minds
                    </p>
                    <p style="margin: 0;">
                      This cancellation confirmation was sent to ${toEmail}.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(
      `✉️  [Email Notice] SMTP not configured. Simulated cancellation for Booking #${bookingRef} to ${toEmail}.`
    );
    return { success: true, simulated: true };
  }

  try {
    const from = getFromAddress();
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Cancelled: Your reservation for "${eventTitle}" [${bookingRef}]`,
      html: emailHtml,
    });
    console.log(`✓  [Email Sent] Cancellation confirmed to ${toEmail} for booking ${bookingRef}.`);
    return { success: true, simulated: false };
  } catch (err) {
    console.error(`⚠️  [Email Error] Failed to send cancellation email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Waitlist Joined Confirmation Email with Queue Position details
 */
export async function sendWaitlistJoinedEmail({
  toEmail,
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  price,
  queuePosition,
  eventSlug,
  eventId,
}) {
  const transporter = getTransporter();
  const formattedPrice = price === 0 ? "Free Admission" : `₹${price}`;
  const frontendUrl = getFrontendBaseUrl();
  const eventUrl = `${frontendUrl}/events/${eventSlug || eventId}`;

  const num = parseInt(queuePosition, 10) || 1;
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  const words = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
  const word = words[num] || `${num}${suffix}`;
  const ordinalLabel = `${num}${suffix} in line ${words[num] ? `(${words[num]})` : ""}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're on the Waitlist - ${eventTitle}</title>
      </head>
      <body style="margin: 0; padding: 32px 16px; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171915; line-height: 1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFEFA; border: 1px solid #E7E2D8; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(23, 25, 21, 0.04);" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #073F2E; padding: 36px 32px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 14px; background-color: rgba(255, 255, 255, 0.15); color: #EBF3E8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 999px; margin-bottom: 12px;">
                      Waitlist Confirmed
                    </span>
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #FFFEFA; letter-spacing: -0.5px;">
                      You&apos;re on the Waitlist!
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #A9C3A0; font-size: 14px;">
                      Gather Curated Sessions &bull; Priority Queue Notice
                    </p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #171915;">
                      Hello <strong>${attendeeName}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #77776F; line-height: 1.6;">
                      You have successfully joined the waitlist for <strong>${eventTitle}</strong>. We have saved your position in line and will contact you immediately when a seat opens.
                    </p>

                    <!-- Queue Position Highlight Card -->
                    <div style="background-color: #EBF3E8; border: 1px solid #A9C3A0; border-radius: 16px; padding: 22px 20px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #073F2E; display: block; margin-bottom: 6px;">
                        Your Queue Position
                      </span>
                      <div style="font-family: Georgia, serif; font-size: 40px; font-weight: bold; color: #073F2E; line-height: 1;">
                        #${num}
                      </div>
                      <span style="display: inline-block; margin-top: 8px; font-size: 13px; font-weight: 700; color: #073F2E; background: rgba(7, 63, 46, 0.1); padding: 4px 14px; border-radius: 999px;">
                        ${ordinalLabel}
                      </span>
                    </div>

                    <!-- Event Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid #F0ECE1; border-radius: 14px; overflow: hidden; background-color: #FAF8F5;">
                      <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Session
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${eventTitle}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Date &amp; Time
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${eventDate} &bull; ${eventTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Venue
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #073F2E; text-align: right;">
                          📍 ${venue}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; font-size: 13px; color: #77776F;">
                          Registration Fee
                        </td>
                        <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #171915; text-align: right;">
                          ${formattedPrice}
                        </td>
                      </tr>
                    </table>

                    <!-- What happens next -->
                    <div style="background-color: #FFFDF0; border: 1px solid #ECC968; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                      <div style="font-weight: 700; color: #7A5700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        💡 How Automated Seat Release Works
                      </div>
                      <p style="margin: 0; font-size: 13px; color: #6E5311; line-height: 1.5;">
                        When an attendee reschedules or the organizer increases session capacity, available seats are automatically allocated to attendees in queue order. You will receive an instant email notice with an exclusive <strong>2-hour window</strong> and payment option to confirm your ticket.
                      </p>
                    </div>

                    <!-- Action Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${eventUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #073F2E; color: #FFFEFA; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 999px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(7, 63, 46, 0.2);">
                            View Event &amp; Waitlist Status &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF8F5; padding: 20px 28px; text-align: center; border-top: 1px solid #F0ECE1;">
                    <p style="margin: 0; font-size: 11px; color: #A1A19A;">
                      &copy; ${new Date().getFullYear()} Gather Sessions &bull; Curated Workshops &amp; Community Gatherings
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[Email Mock] Waitlist Joined email sent to ${toEmail} for ${eventTitle} (Position #${num})`);
    return { success: true, simulated: true };
  }

  try {
    const from = getFromAddress();
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `You're on the Waitlist (#${num} · ${word} in line) - ${eventTitle}`,
      html: emailHtml,
    });
    console.log(`✓  [Email Sent] Waitlist confirmation sent to ${toEmail} for "${eventTitle}" (#${num}).`);
    return { success: true, simulated: false };
  } catch (err) {
    console.error(`⚠️  [Email Error] Failed to send waitlist joined email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Waitlist Offer email with 2-hour claim link, countdown notice, and payment option
 */
export async function sendWaitlistOfferEmail({
  toEmail,
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  price,
  offerExpiresAt,
  claimUrl,
}) {
  const transporter = getTransporter();
  const formattedPrice = price === 0 ? "Free Admission" : `₹${price}`;
  const expiryTimeFormatted = new Date(offerExpiresAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const expiryDateFormatted = new Date(offerExpiresAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A Seat Opened Up For You! - ${eventTitle}</title>
      </head>
      <body style="margin: 0; padding: 32px 16px; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171915; line-height: 1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFEFA; border: 1px solid #E7E2D8; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(23, 25, 21, 0.04);" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #073F2E; padding: 36px 32px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 14px; background-color: #C2A265; color: #073F2E; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 999px; margin-bottom: 12px;">
                      Waitlist Confirmed &bull; Action Required
                    </span>
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #FFFEFA; letter-spacing: -0.5px;">
                      A Seat Just Opened Up!
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #A9C3A0; font-size: 14px;">
                      You are next in line for ${eventTitle} &bull; Complete payment to secure pass
                    </p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #171915;">
                      Dear <strong>${attendeeName}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #77776F; line-height: 1.6;">
                      Great news! Additional slots have been upgraded or a seat has opened for <strong>${eventTitle}</strong>. Because you were at the top of the queue, 1 seat has been held exclusively for you.
                    </p>

                    <!-- Urgent 2-Hour Window Notice -->
                    <div style="background-color: #FFFDF0; border: 1px solid #ECC968; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                      <div style="font-weight: 700; color: #7A5700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        ⏱ Limited 2-Hour Priority Checkout Window
                      </div>
                      <p style="margin: 0; font-size: 13px; color: #6E5311; line-height: 1.5;">
                        This reservation offer expires on <strong>${expiryDateFormatted} at ${expiryTimeFormatted}</strong> (2 hours from issue). Complete your payment before expiration or this seat will automatically pass to the next attendee.
                      </p>
                    </div>

                    <!-- Event Summary Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px; border: 1px solid #F0ECE1; border-radius: 14px; overflow: hidden; background-color: #FAF8F5;">
                      <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Session
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${eventTitle}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Date &amp; Time
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #171915; text-align: right;">
                          ${eventDate} &bull; ${eventTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #77776F;">
                          Venue
                        </td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE1; font-size: 14px; font-weight: 600; color: #073F2E; text-align: right;">
                          📍 ${venue}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; font-size: 13px; color: #77776F;">
                          Amount Payable
                        </td>
                        <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #073F2E; text-align: right;">
                          ${formattedPrice}
                        </td>
                      </tr>
                    </table>

                    <!-- Claim & Pay CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="${claimUrl}" target="_blank" style="display: inline-block; background-color: #073F2E; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 999px; box-shadow: 0 4px 14px rgba(7, 63, 46, 0.3);">
                            ${price === 0 ? "Claim Your Free Pass &rarr;" : `Pay ₹${price} & Confirm Ticket &rarr;`}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; color: #999990; text-align: center;">
                      Can&apos;t click the button? Copy and paste this checkout link in your browser:<br>
                      <a href="${claimUrl}" style="color: #073F2E; word-break: break-all;">${claimUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F7F4ED; border-top: 1px solid #E7E2D8; padding: 20px 24px; text-align: center; font-size: 11px; color: #77776F;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #171915;">
                      Gather &mdash; Curated Sessions for Curious Minds
                    </p>
                    <p style="margin: 0;">
                      You received this notification because you joined the waitlist for this event.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(
      `✉️  [Email Notice] SMTP not configured. Simulated Waitlist Offer for ${attendeeName} <${toEmail}>.`
    );
    return { success: true, simulated: true };
  }

  try {
    const from = getFromAddress();
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Seat Available! You've been promoted from the waitlist for "${eventTitle}"`,
      html: emailHtml,
    });
    console.log(`✓  [Email Sent] Waitlist offer sent to ${toEmail} for "${eventTitle}".`);
    return { success: true, simulated: false };
  } catch (err) {
    console.error(`⚠️  [Email Error] Failed to send waitlist offer to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Password Reset OTP and Link Email
 */
export async function sendPasswordResetEmail({ toEmail, name, otp, resetToken }) {
  const transporter = getTransporter();
  const frontendUrl = getFrontendBaseUrl();
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  console.log(`🔑 [Password Reset] Verification code for ${toEmail}: ${otp}`);
  console.log(`🔗 [Password Reset] Reset link for ${toEmail}: ${resetUrl}`);

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Gather Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171915;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F7F4ED; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E7E2D8; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #073F2E; padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                      Gather
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8EA996; font-weight: 600;">
                      Security Verification
                    </p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #171915;">
                      Password Reset Request
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555550;">
                      Hello ${name || "there"},<br>
                      We received a request to reset the password for your Gather account (${toEmail}). Use the 6-digit verification code below to set a new password.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #FAF8F5; border: 2px dashed #073F2E; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #77776F; margin-bottom: 8px;">
                        Your 6-Digit Reset Code
                      </div>
                      <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #073F2E; font-family: monospace;">
                        ${otp}
                      </div>
                      <div style="font-size: 12px; color: #888880; margin-top: 8px;">
                        This code will expire in <strong>15 minutes</strong>.
                      </div>
                    </div>

                    <!-- Direct Reset Button -->
                    <div style="text-align: center; margin: 32px 0 16px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background-color: #073F2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 999px; letter-spacing: 0.3px;">
                        Reset Password Directly &rarr;
                      </a>
                    </div>

                    <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #888880; text-align: center;">
                      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F7F4ED; border-top: 1px solid #E7E2D8; padding: 20px 24px; text-align: center; font-size: 11px; color: #77776F;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #171915;">
                      Gather &mdash; Curated Sessions for Curious Minds
                    </p>
                    <p style="margin: 0;">
                      This is an automated security email sent to ${toEmail}.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`✉️  [Email Notice] SMTP not configured. OTP printed above to console.`);
    return { success: true, simulated: true };
  }

  try {
    const from = getFromAddress();
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Your Gather Password Reset Code: ${otp}`,
      html: emailHtml,
    });
    console.log(`✓  [Email Sent] Password reset OTP sent to ${toEmail}`);
    return { success: true, simulated: false };
  } catch (err) {
    console.error(`⚠️  [Email Error] Failed to send password reset to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

export default {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendWaitlistJoinedEmail,
  sendWaitlistOfferEmail,
  sendPasswordResetEmail,
};


