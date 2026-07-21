/**
 * 이미지 생성용 프롬프트 정규화.
 * Pollinations/Flux 등은 한국어·채팅 문장("그려줘")을 잘 못 해석해
 * 인물 초상화 등으로 빗나가는 경우가 많다. 시각 영문 프롬프트로 변환한다.
 */

const CONTEXT_PREFIX = /\[최근 대화 맥락[\s\S]*?\[요청\]\s*/i;

/** 요청 문장에서 지울 군더더기 (그려줘 / 이미지 등) */
const BOILERPLATE = [
  /그려진/g,
  /그려\s*줄래/g,
  /그려\s*주세요/g,
  /그려\s*달라/g,
  /그려\s*줘/g,
  /그려줘/g,
  /그려봐/g,
  /만들어\s*줘/g,
  /만들어줘/g,
  /생성해\s*줘/g,
  /생성해줘/g,
  /이미지\s*(를|로|가|는|은)?/g,
  /사진\s*(을|으로|이|가|는|은)?/g,
  /그림\s*(을|으로|이|가|는|은)?/g,
  /please\s+draw/gi,
  /draw\s+(me\s+)?(an?\s+)?image\s+(of\s+)?/gi,
  /generate\s+(an?\s+)?image\s+(of\s+)?/gi,
];

/** 긴 구 → 짧은 구 순. 한글은 단어 단위로만 치환 */
const KO_SUBJECTS: [RegExp, string][] = [
  [/아메리카노/g, "americano coffee"],
  [/카페라떼|카페\s*라떼/g, "cafe latte"],
  [/카푸치노/g, "cappuccino"],
  [/에스프레소/g, "espresso"],
  [/커피\s*잔/g, "a coffee cup"],
  [/커피/g, "a cup of hot coffee with steam"],
  [/머그잔|머그/g, "a ceramic mug"],
  [/노트북|랩탑/g, "a laptop computer"],
  [/책상|데스크/g, "a wooden desk"],
  [/도서관/g, "a library"],
  [/교실|학교/g, "a classroom"],
  [/고양이/g, "a cat"],
  [/강아지/g, "a dog"],
  [/(^|[^가-힣])개([^가-힣]|$)/g, "$1a dog$2"],
  [/여자|여성/g, "a woman"],
  [/남자|남성/g, "a man"],
  [/소녀|girl/gi, "a girl"],
  [/소년|boy/gi, "a boy"],
  [/초상화|portrait/gi, "portrait"],
  [/사람|인물|person|people/gi, "a person"],
  [/장미|튤립|꽃다발|꽃/g, "flowers"],
  [/피자/g, "a pizza"],
  [/케이크/g, "a cake"],
  [/자전거/g, "a bicycle"],
  [/자동차/g, "a car"],
  [/(^|[^가-힣])차([^가-힣]|$)/g, "$1a car$2"],
  [/바다|해변/g, "the ocean"],
  [/산|산맥/g, "mountains"],
  [/숲|나무/g, "trees in a forest"],
  [/도시|거리/g, "a city street"],
  [/하늘|구름/g, "blue sky with clouds"],
  [/보름달|달/g, "the moon"],
  [/일출|일몰|태양/g, "the sun"],
  [/침실|거실|방/g, "a cozy room interior"],
  [/음식|요리/g, "a plated meal"],
  [/책|도서/g, "an open book"],
  [/펜|볼펜/g, "a pen"],
];

const PERSON_HINT =
  /사람|인물|초상|얼굴|여자|남자|소녀|소년|아이|아동|여성|남성|portrait|person|people|woman|man|girl|boy|human|face|selfie/i;

function extractUserRequest(raw: string): string {
  let text = raw.replace(CONTEXT_PREFIX, "").trim();
  const reqIdx = text.lastIndexOf("[요청]");
  if (reqIdx >= 0) text = text.slice(reqIdx + "[요청]".length).trim();
  return text;
}

function detectStyle(text: string): string {
  if (/수채화|watercolor/i.test(text)) return "watercolor painting style";
  if (/일러스트|illustration/i.test(text)) return "clean illustration style";
  if (/만화|애니|anime|cartoon/i.test(text)) return "anime illustration style";
  if (/픽셀|pixel/i.test(text)) return "pixel art style";
  if (/3d/i.test(text)) return "3D render style";
  if (/사실|리얼|사진|photo|photoreal/i.test(text)) return "realistic photograph";
  return "clean realistic photo, soft natural lighting";
}

/**
 * 채팅/도구 입력을 Pollinations·이미지 API용 영문 시각 프롬프트로 변환.
 */
export function buildImagePrompt(rawInput: string): string {
  const request = extractUserRequest(rawInput);
  let subject = request;
  for (const re of BOILERPLATE) subject = subject.replace(re, " ");

  const style = detectStyle(request);
  const wantsPerson = PERSON_HINT.test(request);

  for (const [re, en] of KO_SUBJECTS) {
    subject = subject.replace(re, ` ${en} `);
  }

  // 번역되지 않은 한글·조사 제거 (영문 토큰만 남김)
  subject = subject
    .replace(/[가-힣]+/g, " ")
    .replace(/[^\w\s,.-]/g, " ")
    .replace(/\b(\w+)\s+\1\b/gi, "$1") // "computer computer" → "computer"
    .replace(/\ba\s+a\b/gi, "a")
    .replace(/\s+/g, " ")
    .trim();

  if (!subject || subject.length < 2) {
    subject = "a simple still life object on a table";
  }

  const parts = [
    subject,
    style,
    "high quality, sharp focus, well composed",
    "no text, no watermark, no logo",
  ];
  if (!wantsPerson) {
    parts.push(
      "no people, no human, no person, no face, no portrait, no hands, no silhouette of a person, no anthropomorphic shapes",
    );
  }

  return parts
    .join(", ")
    .replace(/\s+,/g, ",")
    .replace(/,{2,}/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}
