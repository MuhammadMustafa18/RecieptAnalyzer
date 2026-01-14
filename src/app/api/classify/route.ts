import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const { rawText } = await req.json();

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a receipt analysis assistant. 
          Extract the following fields from the text and return ONLY JSON:
          - merchant (string)
          - total (number, no currency symbols)
          - date (YYYY-MM-DD)
          - category (MUST be one of: Food, Transport, Shopping, Entertainment, Utilities, Health)
          
          If a field is missing, provide a logical guess or null.`
                },
                {
                    role: "user",
                    content: `Receipt Text: ${rawText}`
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = chatCompletion.choices[0]?.message?.content;
        return NextResponse.json(JSON.parse(content || "{}"));
    } catch (error) {
        console.error("Groq Error:", error);
        return NextResponse.json({ error: "Failed to classify" }, { status: 500 });
    }
}