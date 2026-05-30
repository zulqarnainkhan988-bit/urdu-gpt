const OpenAI = require("openai");

const SYSTEM_PROMPT = `آپ ایک ذہین اردو زبان کا مددگار ہیں۔ آپ کا نام "مددگار" ہے۔
آپ ہمیشہ خالص اور فصیح اردو میں جواب دیتے ہیں۔
آپ کے جوابات مفید، درست، اور آسان فہم ہونے چاہئیں۔
اگر کوئی انگریزی میں سوال کرے تو بھی اردو میں جواب دیں۔
آپ مہذب اور شائستہ لہجہ استعمال کریں۔`;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: JSON.stringify({ error: "messages array required" }) };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    const sseBody =
      `data: ${JSON.stringify({ content })}\n\n` +
      `data: [DONE]\n\n`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
      body: sseBody,
    };
  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
