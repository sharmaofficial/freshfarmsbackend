exports.getPrivacypolicy = async(req, res, next) => {
    try {
        const htmlContent = `
        <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Privacy Policy - My E-Commerce App</title>
            <style>
                body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                }
                .container {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1, h2, h3 {
                color: #333;
                margin-top: 20px;
                margin-bottom: 10px;
                }
                h1 {
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                }
                p {
                margin: 10px 0;
                color: #555;
                }
                ul {
                margin: 10px 0;
                padding-left: 20px;
                color: #555;
                }
                li {
                margin-bottom: 10px;
                }
                .contact-info {
                margin-top: 20px;
                }
                .contact-info p {
                margin: 5px 0;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <h1>Privacy Policy</h1>
                <p>Last updated: [Date]</p>

                <h2>1. Introduction</h2>
                <p>Welcome to My E-Commerce App. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy policy, or our practices with regards to your personal information, please contact us at [Your Contact Information].</p>

                <h2>2. Information We Collect</h2>
                <h3>2.1 Personal Information</h3>
                <p>We collect personal information that you voluntarily provide to us when you register on the website, place an order, subscribe to our newsletter, or otherwise contact us. This information may include:</p>
                <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Mailing address</li>
                <li>Phone number</li>
                <li>Payment information</li>
                </ul>

                <h3>2.2 Non-Personal Information</h3>
                <p>We may also collect non-personal information that does not directly identify you. This may include:</p>
                <ul>
                <li>Browser and device information</li>
                <li>IP address</li>
                <li>Browsing history</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use the information we collect for various purposes, including:</p>
                <ul>
                <li>Processing and managing your orders</li>
                <li>Communicating with you</li>
                <li>Improving our services and website</li>
                <li>Personalizing your experience</li>
                <li>Sending promotional materials and newsletters</li>
                </ul>

                <h2>4. Sharing Your Information</h2>
                <p>We do not share your personal information with third parties except in the following circumstances:</p>
                <ul>
                <li>With service providers who perform services on our behalf</li>
                <li>To comply with legal obligations</li>
                <li>To protect and defend our rights and property</li>
                </ul>

                <h2>5. Your Rights</h2>
                <p>You have certain rights regarding your personal information, including the right to access, correct, or delete the personal information we hold about you. To exercise these rights, please contact us at [Your Contact Information].</p>

                <h2>6. Data Security</h2>
                <p>We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or method of electronic storage is 100% secure.</p>

                <h2>7. Changes to This Privacy Policy</h2>
                <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date at the top of this page.</p>

                <h2>8. Contact Us</h2>
                <p>If you have any questions about this privacy policy, please contact us at:</p>
                <div class="contact-info">
                <p>Email: [Your Email Address]</p>
                <p>Address: [Your Mailing Address]</p>
                </div>
            </div>
            </body>
            </html>
        `
        res.send({status:10, message: `Success`, data: htmlContent})
    } catch (error) {
        res.send({status: 0, message: `Error while fetching orders - ${error}`, data: null});
    }
}
