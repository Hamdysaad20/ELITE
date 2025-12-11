import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('Testing email configuration...\n');
  
  const config = {
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  };

  console.log('Config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    pass: config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'missing',
  });

  try {
    const transporter = nodemailer.createTransport(config);
    
    console.log('\nVerifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'contact@jointhedragons.com',
      to: 'hamdysaad.biz@gmail.com',
      subject: 'Test Email from ELITE',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a test email to verify SMTP configuration.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
