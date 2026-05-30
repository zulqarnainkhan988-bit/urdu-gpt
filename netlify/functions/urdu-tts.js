const OpenAI = require("openai");

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
    const { text } = JSON.parse(event.body || "{}");
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: "text is required" }) };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text.slice(0, 4096),
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("TTS error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "TTS failed" }),
    };
  }
};
