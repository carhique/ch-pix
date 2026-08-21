export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { amount } = req.body || {};

    const valor = Number(amount);

    if (!valor || valor <= 0) {
      return res.status(400).json({
        error: "Valor inválido"
      });
    }

    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "MP_ACCESS_TOKEN não configurado"
      });
    }

    const idempotencyKey =
      `${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const response = await fetch(
      "https://api.mercadopago.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          type: "online",
          total_amount: valor.toFixed(2),
          external_reference: `CHPIX-${Date.now()}`,
          processing_mode: "automatic",

          transactions: {
            payments: [
              {
                amount: valor.toFixed(2),

                payment_method: {
                  id: "pix",
                  type: "bank_transfer"
                },

                expiration_time: "PT24H"
              }
            ]
          },

          payer: {
            email: "test_user_br@testuser.com"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao criar Pix",
        details: data
      });
    }

    const payment =
      data?.transactions?.payments?.[0];

    const paymentMethod =
      payment?.payment_method;

    return res.status(200).json({
      success: true,

      order_id: data.id,

      payment_id: payment?.id,

      status: payment?.status,

      status_detail: payment?.status_detail,

      qr_code: paymentMethod?.qr_code,

      qr_code_base64:
        paymentMethod?.qr_code_base64,

      ticket_url:
        paymentMethod?.ticket_url
    });

  } catch (error) {

    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });

  }
}
