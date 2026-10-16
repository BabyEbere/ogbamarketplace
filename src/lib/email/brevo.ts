/**
 * Brevo (Sendinblue) Transactional Email Service
 * API Documentation: https://developers.brevo.com/reference/sendtransacemail
 */

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  params?: Record<string, any>;
}

export async function sendBrevoEmail({ to, subject, htmlContent, textContent }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'support@ogbamarketplace.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'OGBA MARKET PLACE';

  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.warn(`[Brevo Email Simulation] To: ${to.map(t => t.email).join(', ')} | Subject: ${subject}`);
    return {
      success: true,
      simulated: true,
      message: 'Brevo API key not configured yet. Email logged to console in simulation mode.',
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to,
        subject,
        htmlContent,
        textContent: textContent || subject,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Brevo Error]', data);
      return { success: false, error: data };
    }

    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error('[Brevo Request Exception]', error);
    return { success: false, error: error.message };
  }
}

/**
 * 1. Order Confirmation Email for Shoppers
 */
export async function sendOrderConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderReference: string;
  totalAmount: number;
  deliveryAddress: string;
  items: { title: string; quantity: number; price: number }[];
}) {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${item.title} (x${item.quantity})</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: bold;">₦${(item.price * item.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join('');

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
      <div style="background-color: #164E2E; padding: 16px; border-radius: 8px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px;">OGBA MARKET PLACE</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #A7F3D0;">Order Placed in Escrow • Omoku & Egi</p>
      </div>

      <div style="padding: 20px 0;">
        <h3 style="color: #111827;">Hello ${params.customerName},</h3>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
          Thank you for shopping on <strong>OGBA MARKET PLACE</strong>! Your order <strong>#${params.orderReference}</strong> has been received and is secured in Paystack Escrow.
        </p>

        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <h4 style="margin: 0 0 10px 0; color: #164E2E;">Order Summary</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 10px 8px; font-weight: bold; font-size: 15px;">Total Paid (Held in Escrow):</td>
              <td style="padding: 10px 8px; font-weight: bold; font-size: 16px; text-align: right; color: #164E2E;">₦${params.totalAmount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748B;">
          <strong>Delivery Location:</strong> ${params.deliveryAddress}<br/>
          <strong>Rider Dispatch:</strong> A verified local bike rider will be assigned to pick up your items from the vendor stalls.
        </p>
      </div>

      <div style="text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 12px;">
        © ${new Date().getFullYear()} OGBA MARKET PLACE • Built for Ogba & Egi Communities
      </div>
    </div>
  `;

  return sendBrevoEmail({
    to: [{ email: params.customerEmail, name: params.customerName }],
    subject: `Order Confirmation #${params.orderReference} - OGBA MARKET PLACE`,
    htmlContent,
  });
}

/**
 * 2. Vendor KYC Status Email
 */
export async function sendVendorKYCStatusEmail(params: {
  vendorEmail: string;
  vendorName: string;
  businessName: string;
  status: 'verified' | 'rejected';
  reason?: string;
}) {
  const isApproved = params.status === 'verified';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
      <div style="background-color: ${isApproved ? '#164E2E' : '#991B1B'}; padding: 16px; border-radius: 8px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">OGBA MARKET PLACE</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px;">Vendor KYC Verification Update</p>
      </div>

      <div style="padding: 20px 0;">
        <h3 style="color: #111827;">Hello ${params.vendorName},</h3>
        <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
          ${
            isApproved
              ? `Congratulations! Your vendor store <strong>${params.businessName}</strong> has been officially <strong>VERIFIED</strong> by the Ogba Market Place Admin Team.`
              : `Your KYC submission for <strong>${params.businessName}</strong> was reviewed and could not be approved at this time.`
          }
        </p>

        ${
          isApproved
            ? `<div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin: 16px 0; color: #065F46;">
                <strong>Next Steps:</strong> You can now start adding products, managing stock, and accepting orders with automated escrow payouts!
              </div>`
            : `<div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px; margin: 16px 0; color: #991B1B;">
                <strong>Reason / Required Update:</strong> ${params.reason || 'Please re-upload a clear copy of your valid ID or Market Stalls receipt.'}
              </div>`
        }
      </div>

      <div style="text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 12px;">
        OGBA MARKET PLACE Admin Support • Omoku, Rivers State
      </div>
    </div>
  `;

  return sendBrevoEmail({
    to: [{ email: params.vendorEmail, name: params.vendorName }],
    subject: `KYC ${isApproved ? 'Approved ✅' : 'Update Required ⚠️'} - ${params.businessName}`,
    htmlContent,
  });
}
