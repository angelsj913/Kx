import {
  type ModerationCategory,
  MODERATION_POLICY,
} from "@/lib/moderationPolicy";

export interface ModerationResult {
  allowed: boolean;
  category: ModerationCategory;
  /** 보안 로그용 규칙 id — 사용자 입력값은 넣지 않는다 */
  matchedRule?: string;
  log: boolean;
}

interface Rule {
  id: string;
  category: Exclude<ModerationCategory, "allowed">;
  test: (text: string) => boolean;
  skipIfLegal?: boolean;
}

/** 법률·규정·처벌 등 교육/정보성 맥락 — violence 필터 면제 */
function hasLegalEducationalContext(text: string): boolean {
  return /법률|법적|법령|조항|처벌|합법|위법|illegal|legal|statute|regulation|판례|헌법|민법|형법|\blaw\b/i.test(
    text,
  );
}

const RULES: Rule[] = [
  {
    id: "csam_zero_tolerance",
    category: "csam",
    test: (t) =>
      /(?:미성년|미성년자|아동|청소년|child(?:ren)?|minor|under\s*18)[\s\S]{0,40}(?:야한|성적|sexual|nude|누드|포르노|porn|裸)|(?:야한|성적|sexual|nude|누드|포르노|porn)[\s\S]{0,40}(?:미성년|미성년자|아동|청소년|child(?:ren)?|minor|under\s*18)/i.test(
        t,
      ),
  },
  {
    id: "sexual_explicit",
    category: "sexual_explicit",
    test: (t) =>
      /(?:포르노|porn(?:ography)?|야동|sexual\s+act|explicit\s+sex|누드\s*(?:사진|pic|photo)|nude\s*(?:pic|photo)|성행위\s*(?:묘사|장면|해줘)|erotic\s+roleplay|nsfw\s+(?:story|chat|image))/i.test(
        t,
      ),
  },
  {
    id: "credential_exfil",
    category: "credential_exfil",
    test: (t) =>
      /(?:DATABASE_URL|POSTGRES(?:QL)?_URL|MYSQL_URL|REDIS_URL|MONGODB_URI|API[_-]?KEY|SECRET[_-]?KEY|OPENAI_API_KEY|GEMINI_API_KEY|TAVILY_API_KEY|BLOB_READ_WRITE_TOKEN|NEXTAUTH_SECRET)|\.env(?:\s*파일)?|process\.env|환경\s*변수(?:\s*값)?|(?:show|print|dump|give|tell|보여|알려|출력).{0,24}(?:env|secret|credential|api\s*key|비밀\s*키)/i.test(
        t,
      ),
  },
  {
    id: "source_dump",
    category: "source_dump",
    test: (t) =>
      /(?:full|entire|complete|whole|all|전체|모든).{0,20}(?:source\s*code|codebase|repository|소스\s*코드|소스코드|api\s*routes?)|(?:dump|export|download|show\s+me).{0,20}(?:all\s+)?(?:source\s*files?|api\s*routes?|코드\s*전부)|git\s*clone.{0,30}(?:private|internal)/i.test(
        t,
      ),
  },
  {
    id: "cross_user_pii",
    category: "cross_user_pii",
    test: (t) =>
      /(?:other|another|all|every|다른|전체|모든).{0,16}(?:users?|회원|사용자).{0,24}(?:email|e-?mail|password|비밀번호|정보|data|list|목록)|(?:user\s+list|회원\s*목록|사용자\s*목록|다른\s*사람.{0,12}(?:정보|email|메일))/i.test(
        t,
      ),
  },
  {
    id: "violence_howto",
    category: "violence_howto",
    skipIfLegal: true,
    test: (t) =>
      /(?:폭탄|bombs?|explosive|IED|칼|knife|총|gun|firearm|흉기|weapon|독|poison|3d\s*print)[\s\S]{0,24}(?:만드|제작|조립|how\s+to\s+make|instructions?|recipe|방법)|(?:만드는\s*방법|제작\s*법)[\s\S]{0,16}(?:폭탄|칼|총|흉기|gun|bomb|weapon|knife)/i.test(
        t,
      ),
  },
  {
    id: "jailbreak",
    category: "jailbreak",
    test: (t) =>
      /(?:ignore|disregard|forget|override).{0,24}(?:previous|prior|above|system|all).{0,16}(?:instructions?|rules?|prompt|guidelines?)|jailbreak|DAN\s+mode|do\s+anything\s+now|developer\s+mode\s+enabled|bypass.{0,16}(?:filter|moderation|safety|guardrails?)|(?:새\s*)?(?:규칙|지침).{0,12}(?:무시|하지\s*마)/i.test(
        t,
      ),
  },
];

/** 동기 규칙 기반 입력 모더레이션 — AI 호출 전에 실행 */
export function moderateInput(text: string): ModerationResult {
  const input = text.trim();
  if (!input) {
    return { allowed: true, category: "allowed", log: false };
  }

  for (const rule of RULES) {
    if (rule.skipIfLegal && hasLegalEducationalContext(input)) continue;
    if (rule.test(input)) {
      const policy = MODERATION_POLICY[rule.category];
      return {
        allowed: false,
        category: rule.category,
        matchedRule: rule.id,
        log: policy.log,
      };
    }
  }

  return { allowed: true, category: "allowed", log: false };
}
