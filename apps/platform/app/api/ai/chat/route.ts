import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const SAVED_MODEL_PATTERN = /^[A-Za-z0-9._:/-]{1,120}$/;

/**
 * Server environment still wins. The saved settings preference is a fallback for
 * deployments that do not set OPENROUTER_MODEL; it is never used to bypass the API key.
 */
async function resolveModel() {
  const fromEnv = process.env.OPENROUTER_MODEL?.trim();
  if (fromEnv) return fromEnv;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "openrouter_model" },
      select: { value: true },
    });
    const saved = setting?.value.trim();
    if (saved && SAVED_MODEL_PATTERN.test(saved)) return saved;
  } catch {
    // A missing settings row (or an unavailable DB) falls back to the default model.
  }
  return DEFAULT_MODEL;
}

export async function POST(req: Request) {
  // Authenticated surfaces only: no anonymous request may spend OpenRouter credits.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to use the assistant." }, { status: 401 });
  }

  // DB-backed sliding window: shared across server instances, keyed by the signed-in user.
  const since = new Date(Date.now() - WINDOW_MS);
  const recentCount = await prisma.aIMessage.count({
    where: {
      role: "user",
      createdAt: { gte: since },
      conversation: { userId: session.user.id },
    },
  });
  if (recentCount >= RATE_LIMIT) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const messages = rawMessages
    .filter(
      (m: { role?: string; content?: string }) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= 4000,
    )
    .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content.trim() }));
  if (!messages.some((m: { role: string }) => m.role === "user")) {
    return NextResponse.json({ error: "A message is required" }, { status: 400 });
  }
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured. Set OPENROUTER_API_KEY." },
      { status: 503 },
    );
  }
  const model = await resolveModel();

  // Verify conversation ownership before any billable call is made.
  let convId = conversationId;
  if (convId) {
    const owned = await prisma.aIConversation.findFirst({
      where: { id: convId, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  const systemPrompt =
    "You are ShadTech Assistant, a technical support guide for ShadTech IT services. " +
    "Help with basic computer, software, and network questions, explain ShadTech services, and suggest creating a support ticket for complex or unresolved issues. " +
    "Reply in the user's language (Arabic or English). " +
    "Never claim you repaired a device, accessed a computer, or ran commands on a customer's machine. " +
    "Do not request passwords, payment card numbers, or remote-access credentials.";

  const orMessages = [{ role: "system", content: systemPrompt }, ...messages];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "ShadTech",
      },
      body: JSON.stringify({ model, messages: orMessages }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: 502 });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "No response.";

    // Every AI conversation is owned by the authenticated caller.
    if (!convId) {
      const conv = await prisma.aIConversation.create({
        data: { userId: session.user.id, title: messages[0]?.content?.slice(0, 60) ?? "New chat" },
      });
      convId = conv.id;
    }
    const lastUser = messages[messages.length - 1];
    if (lastUser) {
      await prisma.aIMessage.create({
        data: { conversationId: convId, role: lastUser.role ?? "user", content: lastUser.content },
      });
    }
    await prisma.aIMessage.create({
      data: { conversationId: convId, role: "assistant", content: reply },
    });
    return NextResponse.json({ reply, conversationId: convId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
