/**
 * Production-ready email templates for authentication
 */

export interface EmailTemplateData {
  url: string;
  host: string;
  email: string;
  brandName?: string;
  expiresIn?: string;
}

/**
 * Generate HTML email for magic link sign-in
 */
export function generateMagicLinkHtml(data: EmailTemplateData): string {
  const brandName = data.brandName || data.host;
  const expiresIn = data.expiresIn || "24 hours";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${brandName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
      color: #555555;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .alternative-link {
      margin: 30px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .alternative-link p {
      margin: 0 0 10px;
      font-size: 14px;
      color: #666666;
    }
    .alternative-link a {
      color: #667eea;
      word-break: break-all;
      text-decoration: none;
    }
    .footer {
      padding: 30px;
      background-color: #f8f9fa;
      text-align: center;
      font-size: 14px;
      color: #888888;
    }
    .footer p {
      margin: 5px 0;
    }
    .security-notice {
      margin: 20px 0;
      padding: 15px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
    }
    .security-notice p {
      margin: 0;
      font-size: 14px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔐 Sign in to ${brandName}</h1>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      <p>You requested a sign-in link for <strong>${data.email}</strong>.</p>
      <p>Click the button below to securely sign in to your account:</p>
      
      <div class="button-container">
        <a href="${data.url}" class="button">Sign in to ${brandName}</a>
      </div>
      
      <div class="security-notice">
        <p><strong>⚠️ Security Notice:</strong> This link will expire in ${expiresIn} and can only be used once.</p>
      </div>
      
      <div class="alternative-link">
        <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
        <a href="${data.url}">${data.url}</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666666;">
        If you didn't request this email, you can safely ignore it. Someone may have typed your email address by mistake.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for magic link sign-in
 */
export function generateMagicLinkText(data: EmailTemplateData): string {
  const brandName = data.brandName || data.host;
  const expiresIn = data.expiresIn || "24 hours";

  return `
Sign in to ${brandName}

Hello,

You requested a sign-in link for ${data.email}.

Click the link below to securely sign in to your account:

${data.url}

Security Notice:
This link will expire in ${expiresIn} and can only be used once.

If you didn't request this email, you can safely ignore it. Someone may have typed your email address by mistake.

---
© ${new Date().getFullYear()} ${brandName}. All rights reserved.
This is an automated email. Please do not reply.
  `.trim();
}

/**
 * Generate HTML email for account verification
 */
export function generateVerificationHtml(data: EmailTemplateData): string {
  const brandName = data.brandName || data.host;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email - ${brandName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
      color: #555555;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      padding: 30px;
      background-color: #f8f9fa;
      text-align: center;
      font-size: 14px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>✅ Verify Your Email</h1>
    </div>
    
    <div class="content">
      <p>Welcome to ${brandName}!</p>
      <p>Please verify your email address <strong>${data.email}</strong> to complete your account setup.</p>
      
      <div class="button-container">
        <a href="${data.url}" class="button">Verify Email Address</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666666;">
        If you didn't create an account with ${brandName}, you can safely ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate subject line for magic link email
 */
export function generateMagicLinkSubject(brandName?: string): string {
  return `${brandName ? `Sign in to ${brandName}` : "Your sign-in link"}`;
}

/**
 * Generate subject line for verification email
 */
export function generateVerificationSubject(brandName?: string): string {
  return `${brandName ? `Verify your ${brandName} account` : "Verify your email address"}`;
}

