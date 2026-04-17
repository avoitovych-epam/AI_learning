import { NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/ollama";

function extractJson(text) {
  if (!text) return "";

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").trim();
  cleaned = cleaned.replace(/```$/i, "").trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);

  return cleaned;
}

const Schema = z.object({
  summary: z.string().min(1),
  key_points: z.array(z.string().min(1)).min(3).max(8),
  risks: z.array(z.string().min(1)).min(1).max(6)
});

export async function POST(req) {
  const { text } = await req.json();
  const input = (text ?? "").toString().trim();

  const basic = await chat({
    messages: [
      { role: "system", content: "You are concise." },
      { role: "user", content: `Summarize in 2 sentences:\n\n${input}` }
    ],
    temperature: 0.3
  });

  const fewShot = await chat({
    messages: [
      { role: "system", content: "Write crisp bullet points." },
      {
        role: "user",
        content:
          'Text: "Build search."\nOutput:\n- Goal: Build search\n- Deliverable: UI+API\n- Risk: unclear scope'
      },
      { role: "user", content: `Text: "${input.replaceAll("\n", " ")}"\nOutput:` }
    ],
    temperature: 0.3
  });

  const jsonText = await chat({
    messages: [
      {
        role: "system",
        content:
          [
            "Return ONLY valid JSON.",
            "No markdown. No triple backticks. No explanations.",
            "Keys: summary, key_points, risks.",
            "key_points must have 3-8 items.",
            "risks must have at least 1 item."
          ].join(" ")
      },
      { role: "user", content: `Create a structured summary for:\n\n${input}` }
    ],
    temperature: 0.2
  });

  let parsed;
  try {
    const obj = JSON.parse(extractJson(jsonText));

    if (!Array.isArray(obj.key_points)) obj.key_points = [];
    if (!Array.isArray(obj.risks)) obj.risks = [];

    if (obj.risks.length === 0) {
      obj.risks = [
        "Model output may violate format requirements (e.g., invalid JSON); add validation, retries, and safe fallbacks."
      ];
    }

    parsed = Schema.parse(obj);
  } catch (e) {
    parsed = { error: String(e), raw: jsonText };
  }

  return NextResponse.json({
    basic,
    fewShot,
    json: parsed
  });
}