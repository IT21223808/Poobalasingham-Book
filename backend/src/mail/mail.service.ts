import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT || 587);
    const secure =
      String(process.env.MAIL_SECURE).toLowerCase() === 'true';

    const user = process.env.MAIL_USER;
    const password = process.env.MAIL_PASSWORD;
    const from = process.env.MAIL_FROM || user;

    console.log('=================================');
    console.log('MAIL CONFIG');
    console.log('=================================');
    console.log('MAIL_HOST:', host);
    console.log('MAIL_PORT:', port);
    console.log('MAIL_SECURE:', secure);
    console.log('MAIL_USER:', user);
    console.log('MAIL_PASSWORD:', password ? '********' : 'MISSING');
    console.log('MAIL_FROM:', from);
    console.log('=================================');

    if (!host) {
      throw new Error('MAIL_HOST is not configured.');
    }

    if (!user) {
      throw new Error('MAIL_USER is not configured.');
    }

    if (!password) {
      throw new Error('MAIL_PASSWORD is not configured.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendReceiptEmail(
    customerEmail: string,
    receipt: {
      invoiceNumber: string;
      customerName?: string | null;

      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }>;

      subtotal: number;
      discountAmount: number;
      grandTotal: number;

      payments: Array<{
        paymentMethod: string;
        amount: number;
      }>;

      createdAt: Date;
    },
  ): Promise<void> {
    /*
    =========================================================
    VALIDATE EMAIL
    =========================================================
    */

    if (!customerEmail || !customerEmail.trim()) {
      throw new InternalServerErrorException(
        'Customer email is required.',
      );
    }

    const email = customerEmail.trim();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new InternalServerErrorException(
        'Invalid customer email address.',
      );
    }

    /*
    =========================================================
    VALIDATE RECEIPT
    =========================================================
    */

    if (!receipt) {
      throw new InternalServerErrorException(
        'Receipt information is required.',
      );
    }

    if (!receipt.invoiceNumber) {
      throw new InternalServerErrorException(
        'Invoice number is required.',
      );
    }

    if (!receipt.items || receipt.items.length === 0) {
      throw new InternalServerErrorException(
        'Receipt does not contain any items.',
      );
    }

    /*
    =========================================================
    CUSTOMER NAME
    =========================================================
    */

    const customerName =
      receipt.customerName?.trim() || 'Valued Customer';

    /*
    =========================================================
    FORMAT DATE
    =========================================================
    */

    const formattedDate = new Date(
      receipt.createdAt,
    ).toLocaleString('en-LK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    /*
    =========================================================
    ITEM ROWS
    =========================================================
    */

    const itemRows = receipt.items
      .map(
        (item) => `
          <tr>
            <td style="
              padding:10px;
              border-bottom:1px solid #e5e7eb;
            ">
              ${this.escapeHtml(item.productName)}
            </td>

            <td style="
              padding:10px;
              border-bottom:1px solid #e5e7eb;
              text-align:center;
            ">
              ${Number(item.quantity)}
            </td>

            <td style="
              padding:10px;
              border-bottom:1px solid #e5e7eb;
              text-align:right;
            ">
              Rs. ${Number(item.unitPrice).toFixed(2)}
            </td>

            <td style="
              padding:10px;
              border-bottom:1px solid #e5e7eb;
              text-align:right;
            ">
              Rs. ${Number(item.lineTotal).toFixed(2)}
            </td>
          </tr>
        `,
      )
      .join('');

    /*
    =========================================================
    PAYMENT ROWS
    =========================================================
    */

    const paymentRows =
      receipt.payments && receipt.payments.length > 0
        ? receipt.payments
            .map(
              (payment) => `
                <tr>
                  <td style="
                    padding:6px 0;
                    color:#4b5563;
                  ">
                    ${this.escapeHtml(
                      payment.paymentMethod,
                    )}
                  </td>

                  <td style="
                    padding:6px 0;
                    text-align:right;
                    font-weight:600;
                  ">
                    Rs. ${Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              `,
            )
            .join('')
        : `
          <tr>
            <td colspan="2">
              No payment information
            </td>
          </tr>
        `;

    /*
    =========================================================
    HTML RECEIPT
    =========================================================
    */

    const html = `
      <!DOCTYPE html>

      <html>
        <head>
          <meta charset="UTF-8" />

          <title>
            Receipt ${this.escapeHtml(
              receipt.invoiceNumber,
            )}
          </title>
        </head>

        <body style="
          margin:0;
          padding:30px 15px;
          background:#f3f4f6;
          font-family:Arial,Helvetica,sans-serif;
          color:#111827;
        ">

          <div style="
            max-width:700px;
            margin:0 auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 2px 10px rgba(0,0,0,0.08);
          ">

            <!-- HEADER -->

            <div style="
              padding:25px;
              background:#111827;
              color:#ffffff;
            ">

              <h1 style="
                margin:0 0 8px 0;
                font-size:24px;
              ">
                Poobalasingham Book Depot
              </h1>

              <p style="
                margin:0;
                font-size:14px;
                opacity:0.85;
              ">
                Sales Receipt
              </p>

            </div>

            <!-- RECEIPT INFO -->

            <div style="
              padding:25px;
            ">

              <table style="
                width:100%;
                border-collapse:collapse;
                margin-bottom:25px;
              ">

                <tr>
                  <td style="
                    padding:5px 0;
                    color:#6b7280;
                  ">
                    Invoice Number
                  </td>

                  <td style="
                    padding:5px 0;
                    text-align:right;
                    font-weight:bold;
                  ">
                    ${this.escapeHtml(
                      receipt.invoiceNumber,
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:5px 0;
                    color:#6b7280;
                  ">
                    Customer
                  </td>

                  <td style="
                    padding:5px 0;
                    text-align:right;
                  ">
                    ${this.escapeHtml(customerName)}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:5px 0;
                    color:#6b7280;
                  ">
                    Date
                  </td>

                  <td style="
                    padding:5px 0;
                    text-align:right;
                  ">
                    ${this.escapeHtml(formattedDate)}
                  </td>
                </tr>

              </table>

              <!-- ITEMS -->

              <h2 style="
                font-size:18px;
                margin:0 0 12px 0;
              ">
                Items
              </h2>

              <table style="
                width:100%;
                border-collapse:collapse;
                margin-bottom:25px;
              ">

                <thead>

                  <tr style="
                    background:#f9fafb;
                  ">

                    <th style="
                      padding:10px;
                      text-align:left;
                      border-bottom:1px solid #d1d5db;
                    ">
                      Product
                    </th>

                    <th style="
                      padding:10px;
                      text-align:center;
                      border-bottom:1px solid #d1d5db;
                    ">
                      Qty
                    </th>

                    <th style="
                      padding:10px;
                      text-align:right;
                      border-bottom:1px solid #d1d5db;
                    ">
                      Unit Price
                    </th>

                    <th style="
                      padding:10px;
                      text-align:right;
                      border-bottom:1px solid #d1d5db;
                    ">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>
                  ${itemRows}
                </tbody>

              </table>

              <!-- TOTALS -->

              <table style="
                width:100%;
                border-collapse:collapse;
                margin-bottom:25px;
              ">

                <tr>
                  <td style="
                    padding:6px 0;
                    color:#6b7280;
                  ">
                    Subtotal
                  </td>

                  <td style="
                    padding:6px 0;
                    text-align:right;
                  ">
                    Rs. ${Number(
                      receipt.subtotal,
                    ).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:6px 0;
                    color:#6b7280;
                  ">
                    Discount
                  </td>

                  <td style="
                    padding:6px 0;
                    text-align:right;
                  ">
                    Rs. ${Number(
                      receipt.discountAmount,
                    ).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:12px 0;
                    font-size:18px;
                    font-weight:bold;
                    border-top:2px solid #111827;
                  ">
                    Grand Total
                  </td>

                  <td style="
                    padding:12px 0;
                    text-align:right;
                    font-size:18px;
                    font-weight:bold;
                    border-top:2px solid #111827;
                  ">
                    Rs. ${Number(
                      receipt.grandTotal,
                    ).toFixed(2)}
                  </td>
                </tr>

              </table>

              <!-- PAYMENTS -->

              <h2 style="
                font-size:18px;
                margin:0 0 12px 0;
              ">
                Payment
              </h2>

              <table style="
                width:100%;
                border-collapse:collapse;
                margin-bottom:25px;
              ">
                ${paymentRows}
              </table>

              <!-- FOOTER -->

              <div style="
                padding-top:20px;
                border-top:1px solid #e5e7eb;
                text-align:center;
                color:#6b7280;
                font-size:13px;
              ">

                <p style="margin:0 0 5px 0;">
                  Thank you for shopping with us.
                </p>

                <p style="margin:0;">
                  Please keep this email for your records.
                </p>

              </div>

            </div>

          </div>

        </body>
      </html>
    `;

    /*
    =========================================================
    SEND EMAIL
    =========================================================
    */

    console.log(
      'Sending receipt email to:',
      email,
    );

    try {
      await this.transporter.sendMail({
        from:
          process.env.MAIL_FROM ||
          process.env.MAIL_USER,

        to: email,

        subject:
          `Receipt - ${receipt.invoiceNumber}`,

        html,
      });

      console.log(
        `Receipt email sent successfully to ${email}`,
      );
    } catch (error) {
      console.error(
        '=================================',
      );

      console.error(
        'RECEIPT EMAIL FAILED',
      );

      console.error(
        '=================================',
      );

      console.error(error);

      throw new InternalServerErrorException(
        'Failed to send receipt email.',
      );
    }
  }

  /*
  =========================================================
  ESCAPE HTML
  =========================================================
  */

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}