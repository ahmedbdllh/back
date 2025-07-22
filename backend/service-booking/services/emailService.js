const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send booking confirmation email to player
const sendBookingConfirmation = async (playerEmail, bookingDetails) => {
  try {
    const transporter = createTransporter();
    
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

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
      to: playerEmail,
      subject: '✅ Booking Confirmation - Your Court is Reserved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">🏟️ Booking Confirmed!</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Your court reservation is confirmed</p>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td>
                  <td style="padding: 8px 0; color: #6b7280;">#${bookingId.toString().slice(-8).toUpperCase()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Court:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${courtName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${teamName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Captain:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${captainName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${formattedDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${startTime} - ${endTime}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Duration:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Total Price:</td>
                  <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${totalPrice} DT</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #0369a1; margin: 0 0 10px 0; font-size: 16px;">📝 Important Notes</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px;">
                <li>Please arrive 15 minutes before your scheduled time</li>
                <li>Cancellations must be made at least 12 hours in advance</li>
                <li>Bring appropriate sports equipment and attire</li>
                <li>Contact the court manager if you have any questions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Thank you for choosing our courts! Have a great game! 🎾
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent to ${playerEmail}`);
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    throw error;
  }
};

// Send booking notification email to court manager
const sendManagerNotification = async (managerEmail, bookingDetails) => {
  try {
    const transporter = createTransporter();
    
    const { 
      courtName, 
      teamName, 
      playerName,
      playerEmail,
      date, 
      startTime, 
      endTime, 
      duration, 
      totalPrice, 
      bookingId,
      companyName,
      teamSize
    } = bookingDetails;

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
      to: managerEmail,
      subject: `🔔 New Booking Received - ${courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0;">🔔 New Booking Alert</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">A new booking has been made for your court</p>
            </div>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
              <h2 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td>
                  <td style="padding: 8px 0; color: #6b7280;">#${bookingId.toString().slice(-8).toUpperCase()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Court:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${courtName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Company:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${companyName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${formattedDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${startTime} - ${endTime}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Duration:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Revenue:</td>
                  <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${totalPrice} DT</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">👥 Customer Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${teamName ? `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${teamName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team Size:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${teamSize || 'N/A'} players</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Captain:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${playerName}</td>
                  </tr>
                ` : `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Player:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${playerName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Team Size:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${teamSize || 'N/A'} players</td>
                  </tr>
                `}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Contact Email:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${playerEmail}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #0369a1; margin: 0 0 10px 0; font-size: 16px;">⚡ Action Required</h3>
              <p style="color: #374151; margin: 0; line-height: 1.5;">
                Please log into your management dashboard to confirm or manage this booking. 
                The booking is currently in <strong>pending</strong> status and awaits your confirmation.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                This is an automated notification from your court management system 📧
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Manager notification email sent to ${managerEmail}`);
  } catch (error) {
    console.error('❌ Error sending manager notification email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendManagerNotification
};