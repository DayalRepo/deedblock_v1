
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const feedbackType = formData.get('feedbackType') as string;
    const priority = formData.get('priority') as string;
    const attachments = formData.getAll('attachments') as File[];

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials missing');
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Email credentials missing' },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // Handle attachments
    const mailAttachments = [];
    for (const file of attachments) {
      // Basic validation: skip empty files if any (though frontend handles it)
        if (file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            mailAttachments.push({
                filename: file.name,
                content: buffer,
            });
        }
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to: 'deenanathdayal4002@gmail.com', // Your receiving address
      replyTo: email, // Reply to the user
      subject: `[${feedbackType.toUpperCase()}] ${subject || 'New Feedback Submission'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="color: #000;">New Feedback Received</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Type:</strong> ${feedbackType}</p>
                ${priority ? `<p style="margin: 5px 0;"><strong>Priority:</strong> ${priority}</p>` : ''}
            </div>
            
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Contact Details</h3>
            <p><strong>Name:</strong> ${name || 'N/A'}</p>
            <p><strong>Email:</strong> ${email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>

            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Message</h3>
            <p style="white-space: pre-wrap; background-color: #fff; padding: 10px; border: 1px solid #eee; border-radius: 5px;">${message}</p>
        </div>
      `,
      attachments: mailAttachments,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}
