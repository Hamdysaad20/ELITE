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
 * Branded with Elite Coffee Shop design system
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sign in to ${brandName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Calistoga&family=Cabin+Condensed:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cabin Condensed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #2C2C2C;
      background-color: #FDF5E6;
      padding: 20px;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .email-container {
      background-color: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(107, 0, 0, 0.15);
      border: 2px solid rgba(139, 0, 0, 0.08);
    }
    
    /* Header Section */
    .header {
      background: linear-gradient(135deg, #8B0000 0%, #6B0000 100%);
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/></pattern></defs><rect width="1000" height="1000" fill="url(%23grid)"/></svg>');
      pointer-events: none;
      opacity: 0.5;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .header h1 {
      font-family: 'Calistoga', serif;
      font-size: 36px;
      font-weight: 400;
      color: #FDF5E6;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    
    .header-subtitle {
      font-size: 14px;
      color: #FDF5E6;
      opacity: 0.9;
      font-weight: 400;
      letter-spacing: 1px;
    }
    
    /* Content Section */
    .content {
      padding: 50px 40px;
      background-color: #FFFFFF;
    }
    
    .content p {
      margin-bottom: 16px;
      font-size: 16px;
      color: #2C2C2C;
      line-height: 1.7;
    }
    
    .greeting {
      font-family: 'Calistoga', serif;
      font-size: 20px;
      color: #8B0000;
      margin-bottom: 20px;
      font-weight: 400;
    }
    
    .email-highlight {
      background-color: #FDF5E6;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 600;
      color: #6B0000;
      font-family: 'Cabin Condensed', sans-serif;
    }
    
    /* Button Section */
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .button {
      display: inline-block;
      padding: 18px 50px;
      background: linear-gradient(135deg, #8B0000 0%, #6B0000 100%);
      color: #FDF5E6 !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.5px;
      border: 2px solid #8B0000;
      transition: all 0.3s ease;
      font-family: 'Cabin Condensed', sans-serif;
      text-transform: uppercase;
    }
    
    .button:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(139, 0, 0, 0.3);
      background: linear-gradient(135deg, #6B0000 0%, #8B0000 100%);
    }
    
    .button:active {
      transform: translateY(-1px);
    }
    
    /* Info Cards */
    .info-card {
      margin: 30px 0;
      padding: 20px;
      background: linear-gradient(135deg, #FDF5E6 0%, #F5E6D3 100%);
      border-radius: 12px;
      border: 2px solid rgba(139, 0, 0, 0.1);
    }
    
    .info-card-title {
      font-family: 'Calistoga', serif;
      font-size: 14px;
      color: #6B0000;
      font-weight: 400;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .info-card p {
      margin-bottom: 8px;
      font-size: 14px;
      color: #2C2C2C;
    }
    
    /* Security Notice */
    .security-notice {
      margin: 30px 0;
      padding: 20px;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.08) 0%, rgba(107, 0, 0, 0.08) 100%);
      border-left: 4px solid #8B0000;
      border-radius: 8px;
    }
    
    .security-notice p {
      margin: 0;
      font-size: 14px;
      color: #2C2C2C;
      font-weight: 600;
    }
    
    .security-icon {
      font-size: 16px;
      margin-right: 8px;
    }
    
    /* Alternative Link */
    .alternative-link {
      margin: 30px 0;
      padding: 20px;
      background-color: #F8F8F8;
      border-radius: 12px;
      border: 2px dashed rgba(139, 0, 0, 0.2);
    }
    
    .alternative-link-title {
      font-size: 13px;
      color: #6B0000;
      font-weight: 600;
      margin-bottom: 10px;
      font-family: 'Cabin Condensed', sans-serif;
    }
    
    .alternative-link a {
      color: #8B0000;
      word-break: break-all;
      text-decoration: none;
      font-size: 12px;
      font-family: monospace;
      background-color: #FFFFFF;
      padding: 10px;
      border-radius: 6px;
      display: block;
      border-left: 3px solid #8B0000;
    }
    
    .alternative-link a:hover {
      background-color: #FDF5E6;
    }
    
    /* Footer Section */
    .footer {
      padding: 30px 40px;
      background-color: #F8F8F8;
      text-align: center;
      font-size: 13px;
      color: #6B7280;
    }
    
    .footer p {
      margin: 8px 0;
    }
    
    .footer-divider {
      height: 1px;
      background: rgba(139, 0, 0, 0.1);
      margin: 15px 0;
    }
    
    .footer-brand {
      font-family: 'Calistoga', serif;
      font-size: 14px;
      color: #8B0000;
      font-weight: 400;
      margin-bottom: 8px;
    }
    
    /* Responsive Design */
    @media (max-width: 600px) {
      .email-container {
        border-radius: 16px;
      }
      
      .header {
        padding: 40px 20px;
      }
      
      .header h1 {
        font-size: 28px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .button {
        padding: 16px 40px;
        font-size: 14px;
      }
      
      .footer {
        padding: 20px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>Elite Coffee Shop</h1>
          <div class="header-subtitle">YOUR AUTHENTICATION GATEWAY</div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="content">
        <p class="greeting">Welcome Back! ☕</p>
        
        <p>You requested a sign-in link for:</p>
        <p><span class="email-highlight">${data.email}</span></p>
        
        <p style="margin-top: 24px;">Click the button below to securely access your account:</p>
        
        <!-- CTA Button -->
        <div class="button-container">
          <a href="${data.url}" class="button">Unlock Your Access</a>
        </div>
        
        <!-- Security Notice -->
        <div class="security-notice">
          <p><span class="security-icon">🔒</span> This link expires in <strong>${expiresIn}</strong> and can only be used once.</p>
        </div>
        
        <!-- Alternative Link -->
        <div class="alternative-link">
          <div class="alternative-link-title">Button not responding? Use this link:</div>
          <a href="${data.url}" style="color: #8B0000; word-break: break-all;">${data.url}</a>
        </div>
        
        <!-- Safety Message -->
        <p style="margin-top: 30px; font-size: 13px; color: #6B7280; font-style: italic;">
          Didn't request this email? No worries – just delete it. This link was sent because someone used your email address to sign in. If that wasn't you, your account remains secure.
        </p>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">Elite Coffee Shop</div>
        <div class="footer-divider"></div>
        <p>Faiyum, Governorate Club | Premium Coffee Experience</p>
        <p style="margin-top: 12px;">© 2025 Elite Coffee Shop. All rights reserved.</p>
        <p style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">This is an automated message, please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for magic link sign-in
 * Branded with Elite Coffee Shop design standards
 */
export function generateMagicLinkText(data: EmailTemplateData): string {
  const brandName = data.brandName || data.host;
  const expiresIn = data.expiresIn || "24 hours";

  return `
╔════════════════════════════════════════════════════════════════╗
║                   ELITE COFFEE SHOP                            ║
║                 Your Authentication Gateway                    ║
╚════════════════════════════════════════════════════════════════╝

Welcome Back! ☕

You requested a sign-in link for: ${data.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIGN IN TO YOUR ACCOUNT:

${data.url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 SECURITY INFORMATION:
• This link expires in ${expiresIn}
• This link can only be used once
• Never share this link with anyone

If you didn't request this email, you can safely delete it. 
Your account remains secure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Elite Coffee Shop
Faiyum, Governorate Club
Premium Coffee Experience

© ${new Date().getFullYear()} Elite Coffee Shop. All rights reserved.
This is an automated message. Please do not reply to this email.
  `.trim();
}

/**
 * Generate subject line for magic link email
 * Branded with Elite Coffee Shop standards
 */
export function generateMagicLinkSubject(brandName?: string): string {
  const brand = brandName || "Elite Coffee Shop";
  return `☕ Your Secure Sign-In Link - ${brand}`;
}

/**
 * Generate subject line for verification email
 * Branded with Elite Coffee Shop standards
 */
export function generateVerificationSubject(brandName?: string): string {
  const brand = brandName || "Elite Coffee Shop";
  return `Verify your ${brand} account`;
}

