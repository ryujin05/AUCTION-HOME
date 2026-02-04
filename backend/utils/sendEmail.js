import axios from "axios";

export const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
  const url = "https://api.brevo.com/v3/smtp/email";

  const options = {
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY, // Key xkeysib-...
      "content-type": "application/json",
    },
  };

  const data = {
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Support Team",
      email: process.env.BREVO_USER,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    const response = await axios.post(url, data, options);
    console.log("--> Brevo API Response:", response.data);
    return response.data;
  } catch (error) {
    // Log lỗi chi tiết từ Brevo trả về để dễ debug
    console.error(
      "--> Lỗi gửi mail Brevo:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Lỗi gửi email");
  }
};
