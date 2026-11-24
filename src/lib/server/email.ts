import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

type EmailAttachment = {
  filename: string;
  content: Uint8Array;
  contentType?: string;
};

type EmailMessage = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

type EmailProvider = "resend" | "ses";
type EmailBody = { html: string; text?: string } | { html?: string; text: string };

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "eu-west-2",
});

function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "resend";
  if (provider === "ses" || provider === "resend") return provider;
  throw new Error('EMAIL_PROVIDER must be either "ses" or "resend".');
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() === "ses"
    ? Boolean(process.env.SES_FROM_EMAIL?.trim())
    : Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  let body: EmailBody;
  if (message.html !== undefined && message.text !== undefined) {
    body = { html: message.html, text: message.text };
  } else if (message.html !== undefined) {
    body = { html: message.html };
  } else if (message.text !== undefined) {
    body = { text: message.text };
  } else {
    throw new Error("An email body is required.");
  }

  const provider = getEmailProvider();

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend.");

    const { Resend } = await import("resend");
    const { error } = await new Resend(apiKey).emails.send({
      from: message.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      ...body,
      replyTo: message.replyTo,
      attachments: message.attachments?.map(({ filename, content }) => ({
        filename,
        content: Buffer.from(content),
      })),
    });

    if (error) throw new Error(`Resend send failed: ${error.message}`);
    return;
  }

  const from = process.env.SES_FROM_EMAIL?.trim();
  if (!from) throw new Error("SES_FROM_EMAIL is required when EMAIL_PROVIDER=ses.");

  await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: {
        ToAddresses: Array.isArray(message.to) ? message.to : [message.to],
      },
      ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: "UTF-8" },
          Body: {
            Html: message.html ? { Data: message.html, Charset: "UTF-8" } : undefined,
            Text: message.text ? { Data: message.text, Charset: "UTF-8" } : undefined,
          },
          Attachments: message.attachments?.map(({ filename, content, contentType }) => ({
            FileName: filename,
            RawContent: content,
            ContentType: contentType || undefined,
            ContentDisposition: "ATTACHMENT",
            ContentTransferEncoding: "BASE64",
          })),
        },
      },
    })
  );
}
