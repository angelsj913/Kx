import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { chatReplyWithFallback } from "@/lib/ai";
import { getPersona } from "@/lib/personas";
import { friendlyError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StoredAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: conversationId } = await params;

  const conversation = await prisma.chatConversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let text = "";
    const uploads: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      text = String(form.get("text") ?? "").trim();
      for (const entry of form.getAll("files")) {
        if (entry instanceof File) uploads.push(entry);
      }
    } else {
      const body = await request.json().catch(() => ({}));
      text = typeof body?.text === "string" ? body.text.trim() : "";
    }

    if (!text && uploads.length === 0) {
      return NextResponse.json(
        { error: "메시지를 입력해 주세요." },
        { status: 400 }
      );
    }

    const storedAttachments: StoredAttachment[] = [];
    const inlineFiles: { data: string; mimeType: string }[] = [];

    for (const file of uploads) {
      const buf = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "application/octet-stream";
      const blob = await put(
        `chat/${userId}/${conversationId}/${Date.now()}-${file.name}`,
        buf,
        { access: "public", contentType: mimeType }
      );
      storedAttachments.push({ url: blob.url, filename: file.name, mimeType });
      inlineFiles.push({ data: buf.toString("base64"), mimeType });
    }

    const persona = getPersona(conversation.personaId);

    const history: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role === "model" ? "model" : "user",
      text: m.text,
    }));

    const reply = await chatReplyWithFallback({
      systemInstruction: persona.systemInstruction,
      messages: [
        ...history,
        { role: "user", text, files: inlineFiles.length ? inlineFiles : undefined },
      ],
    });

    if (!reply) {
      return NextResponse.json(
        { error: "AI가 빈 응답을 반환했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId,
          role: "user",
          text,
          attachments: storedAttachments.length
            ? (storedAttachments as unknown as Prisma.InputJsonValue)
            : undefined,
        },
      }),
      prisma.chatMessage.create({
        data: { conversationId, role: "model", text: reply },
      }),
    ]);

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        ...(conversation.title ? {} : { title: text.slice(0, 40) || "새 대화" }),
      },
    });

    return NextResponse.json({ userMessage, assistantMessage });
  } catch (err) {
    console.error("chat message error:", err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
