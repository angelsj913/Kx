import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/rag";
import { embedTexts } from "@/lib/embeddings";

/**
 * 서재 항목을 청크로 나눠 임베딩하고 색인한다(재색인 시 기존 청크 교체).
 * 업로드 직후 자동 호출과, 수동 재색인 양쪽에서 공유하는 서버 헬퍼.
 * 추출된 텍스트가 없으면 조용히 건너뛴다(색인 없이도 서재 저장 자체는 유효해야 함).
 */
export async function indexLibraryItem(item: {
  id: string;
  userId: string;
  workspaceId: string | null;
  extractedText: string | null;
}): Promise<{ chunks: number; provider: string } | null> {
  const source = (item.extractedText ?? "").trim();
  if (!source) return null;

  const chunks = chunkText(source);
  if (chunks.length === 0) return null;
  const { vectors, provider } = await embedTexts(chunks.map((c) => c.content));

  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { libraryItemId: item.id } }),
    prisma.documentChunk.createMany({
      data: chunks.map((c, i) => ({
        libraryItemId: item.id,
        userId: item.userId,
        workspaceId: item.workspaceId,
        idx: c.idx,
        content: c.content,
        embedding: vectors[i] ?? [],
        provider,
      })),
    }),
  ]);

  return { chunks: chunks.length, provider };
}
