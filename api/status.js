export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "ID da cobrança não informado"
      });
    }

    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "MP_ACCESS_TOKEN não configurado"
      });
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Erro ao consultar cobrança",
        details: data
      });
    }

    const payment =
      data?.transactions?.payments?.[0];

    return res.status(200).json({
      order_id: data.id,

      order_status: data.status,

      order_status_detail: data.status_detail,

      payment_id: payment?.id || null,

      payment_status: payment?.status || null,

      payment_status_detail:
        payment?.status_detail || null,

      amount: payment?.amount || null
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}
