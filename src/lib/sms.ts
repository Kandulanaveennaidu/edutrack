/**
 * SMS & WhatsApp Integration
 * Supports Twilio for SMS and WhatsApp Business API
 */

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(
      "SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER",
    );
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64",
    );
    const body = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.sid };
    }
    return { success: false, error: data.message || "SMS send failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS send failed",
    };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("WhatsApp not configured");
    return { success: false, error: "WhatsApp service not configured" };
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64",
    );
    const body = new URLSearchParams({
      To: `whatsapp:${to}`,
      From: `whatsapp:${fromNumber}`,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.sid };
    }
    return { success: false, error: data.message || "WhatsApp send failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "WhatsApp send failed",
    };
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(
  recipients: Array<{ phone: string; message: string }>,
): Promise<Array<SMSResult & { phone: string }>> {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message);
    results.push({ ...result, phone: recipient.phone });
    // Rate limit: wait 100ms between messages
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return results;
}

/**
 * Send attendance notification to parent
 */
export async function sendAttendanceAlert(
  parentPhone: string,
  studentName: string,
  status: string,
  date: string,
): Promise<SMSResult> {
  const message = `EduTrack Alert: ${studentName} was marked ${status} on ${date}. For more details, login to your EduTrack account.`;
  return sendSMS(parentPhone, message);
}

/**
 * Send low attendance warning
 */
export async function sendLowAttendanceWarning(
  parentPhone: string,
  studentName: string,
  percentage: number,
  threshold: number,
): Promise<SMSResult> {
  const message = `EduTrack Warning: ${studentName}'s attendance is ${percentage}%, below the required ${threshold}%. Please ensure regular attendance.`;
  return sendSMS(parentPhone, message);
}

/**
 * Send fee reminder
 */
export async function sendFeeReminder(
  parentPhone: string,
  studentName: string,
  amount: number,
  dueDate: string,
): Promise<SMSResult> {
  const message = `EduTrack Reminder: Fee of ₹${amount} for ${studentName} is due on ${dueDate}. Please make the payment to avoid late fees.`;
  return sendSMS(parentPhone, message);
}
