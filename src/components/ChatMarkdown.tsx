import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { markdownCodeComponents } from "@/components/CodeBlockPre";

/**
 * ChatWorkspace가 next/dynamic으로 지연 로드하는 마크다운 렌더러 — react-markdown/
 * remark-gfm/remark-math/rehype-katex/katex.css를 채팅 화면 초기 번들에서 분리한다.
 */
export default function ChatMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={markdownCodeComponents}
    >
      {text}
    </ReactMarkdown>
  );
}
