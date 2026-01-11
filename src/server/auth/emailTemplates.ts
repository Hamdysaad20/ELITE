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
 * Lightweight, clean design with focus on accessibility and clear CTA
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Cabin Condensed', sans-serif;
      line-height: 1.5;
      color: #3C3C3C;
      background-color: #FAFAF8;
      padding: 20px;
    }
    
    .email-wrapper {
      max-width: 520px;
      margin: 0 auto;
    }
    
    .email-container {
      background-color: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    /* Header Section - Light & Clean */
    .header {
      background: linear-gradient(135deg, #F5F3F0 0%, #F9F7F4 100%);
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid rgba(139, 0, 0, 0.06);
    }
    
    .header h1 {
      font-family: 'Calistoga', serif;
      font-size: 28px;
      font-weight: 400;
      color: #6B0000;
      margin-bottom: 8px;
      letter-spacing: 0.3px;
    }
    
    .header-subtitle {
      font-size: 13px;
      color: #8B6F6F;
      font-weight: 400;
      letter-spacing: 0.5px;
    }
    
    /* Content Section - Minimal & Focused */
    .content {
      padding: 40px 30px;
      background-color: #FFFFFF;
    }
    
    .content p {
      margin-bottom: 12px;
      font-size: 15px;
      color: #3C3C3C;
      line-height: 1.6;
    }
    
    .greeting {
      font-family: 'Calistoga', serif;
      font-size: 18px;
      color: #6B0000;
      margin-bottom: 24px;
      font-weight: 400;
    }
    
    /* Main CTA Button - Large & Prominent */
    .button-container {
      text-align: center;
      margin: 36px 0;
    }
    
    .button {
      display: inline-block;
      width: 100%;
      max-width: 100%;
      padding: 18px 30px;
      background: linear-gradient(135deg, #8B0000 0%, #6B0000 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.3px;
      border: none;
      transition: all 0.2s ease;
      font-family: inherit;
      text-transform: none;
      box-shadow: 0 4px 12px rgba(139, 0, 0, 0.15);
    }
    
    .button:hover {
      background: linear-gradient(135deg, #6B0000 0%, #8B0000 100%);
      box-shadow: 0 6px 16px rgba(139, 0, 0, 0.25);
      transform: translateY(-2px);
    }
    
    /* Security Info - Subtle */
    .security-badge {
      margin: 24px 0;
      padding: 14px;
      background: #FDF5E6;
      border-radius: 8px;
      border-left: 3px solid #8B0000;
      font-size: 13px;
      color: #3C3C3C;
      line-height: 1.5;
    }
    
    .security-badge strong {
      color: #6B0000;
    }
    
    /* Backup Link - Hidden but accessible */
    .backup-link {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #EFEFEF;
      text-align: center;
      font-size: 12px;
      color: #8B6F6F;
    }
    
    .backup-link-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .backup-link a {
      color: #6B0000;
      word-break: break-all;
      text-decoration: none;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      background: #F9F7F4;
      padding: 8px;
      border-radius: 6px;
      display: block;
      margin-top: 8px;
      border: 1px solid #EFEFEF;
    }
    
    .backup-link a:hover {
      background: #FDF5E6;
      border-color: #EFEFEF;
    }
    
    /* Footer - Minimal */
    .footer {
      padding: 24px 30px;
      background: #FAFAF8;
      text-align: center;
      font-size: 12px;
      color: #8B6F6F;
      border-top: 1px solid #EFEFEF;
    }
    
    .footer p {
      margin: 4px 0;
    }
    
    .footer-brand {
      font-family: 'Calistoga', serif;
      font-size: 13px;
      color: #6B0000;
      font-weight: 400;
      margin-bottom: 6px;
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .button {
        padding: 16px 24px;
        font-size: 15px;
      }
      
      .footer {
        padding: 20px;
        font-size: 11px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <h1>Elite Coffee Shop</h1>
        <div class="header-subtitle">Sign in to your account</div>
      </div>
      
      <!-- Content -->
      <div class="content">
        <p class="greeting">Welcome back! ☕</p>
        
        <p>Click the button below to sign in securely:</p>
        
        <!-- Main CTA Button -->
        <div class="button-container">
          <a href="${data.url}" class="button">Sign In Now</a>
        </div>
        
        <!-- Security Info -->
        <div class="security-badge">
          🔒 <strong>This link expires in ${expiresIn}</strong> and works only once. Never share it.
        </div>
        
        <!-- Backup Link -->
        <div class="backup-link">
          <span class="backup-link-label">Button not working?</span>
          <a href="${data.url}">${data.url}</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">Elite Coffee Shop</div>
        <p>Faiyum, Egypt • Premium Coffee Experience</p>
        <p style="margin-top: 8px; font-size: 11px; color: #AAAAAA;">© 2025 Elite Coffee Shop. This is an automated message.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for magic link sign-in
 * Simple and clean text version
 */
export function generateMagicLinkText(data: EmailTemplateData): string {
  const brandName = data.brandName || data.host;
  const expiresIn = data.expiresIn || "24 hours";

  return `
ELITE COFFEE SHOP
Sign in to your account

Welcome back! ☕

Click this link to sign in:

${data.url}

---

🔒 This link expires in ${expiresIn} and works only once.
Never share it with anyone.

---

Elite Coffee Shop
Faiyum, Egypt • Premium Coffee Experience

© ${new Date().getFullYear()} Elite Coffee Shop
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
