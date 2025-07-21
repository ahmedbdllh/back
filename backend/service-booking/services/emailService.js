const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send booking confirmation email
const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  try {
    const {
      courtName,
      teamName,
      date,
      startTime,
      endTime,
      duration,
      totalPrice,
      bookingId,
      captainName
    } = bookingDetails;

    const subject = 'Booking Confirmation - Team Booking Confirmed';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <div class="success-badge">✓ Successfully Booked</div>
          </div>
          
          <div class="content">
            <p>Dear ${captainName},</p>
            
            <p>Great news! Your team booking has been successfully confirmed. Here are your booking details:</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #667eea;">📋 Booking Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">🆔 Booking ID:</span>
                <span class="detail-value">${bookingId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">🏟️ Court:</span>
                <span class="detail-value">${courtName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">👥 Team:</span>
                <span class="detail-value">${teamName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">⏰ Time:</span>
                <span class="detail-value">${startTime} - ${endTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} minutes</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">💰 Total Price:</span>
                <span class="detail-value">$${totalPrice}</span>
              </div>
            </div>
            
            <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #0277bd;">📝 Important Information:</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please arrive 15 minutes before your scheduled time</li>
                <li>Bring your booking ID for reference</li>
                <li>Contact us if you need to make any changes</li>
                <li>Cancellations must be made at least 24 hours in advance</li>
              </ul>
            </div>
            
            <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
            
            <p>We look forward to seeing your team on the court!</p>
            
            <p>Best regards,<br>
            <strong>The Sports Facility Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated confirmation email. Please save this email for your records.</p>
            <p>© 2025 Sports Facility Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Booking Confirmation - Team Booking Confirmed

Dear ${captainName},

Great news! Your team booking has been successfully confirmed.

Booking Details:
- Booking ID: ${bookingId}
- Court: ${courtName}
- Team: ${teamName}
- Date: ${new Date(date).toLocaleDateString()}
- Time: ${startTime} - ${endTime}
- Duration: ${duration} minutes
- Total Price: $${totalPrice}

Important Information:
- Please arrive 15 minutes before your scheduled time
- Bring your booking ID for reference
- Contact us if you need to make any changes
- Cancellations must be made at least 24 hours in advance

If you have any questions or need to make changes to your booking, please don't hesitate to contact us.

We look forward to seeing your team on the court!

Best regards,
The Sports Facility Team

This is an automated confirmation email. Please save this email for your records.
© 2025 Sports Facility Management System. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
      to: userEmail,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    console.log('📧 Sending booking confirmation email to:', userEmail);
    console.log('📧 Email details:', {
      to: userEmail,
      subject: subject,
      bookingId: bookingId,
      courtName: courtName,
      teamName: teamName
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Booking confirmation email sent successfully'
    };

  } catch (error) {
    console.error('❌ Failed to send booking confirmation email:', error);
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation,
  testEmailConfiguration
};
