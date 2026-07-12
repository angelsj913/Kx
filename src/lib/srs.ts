// 자동 복습 스케줄러 — SM-2 간격 반복 알고리즘(순수 함수).
// 4버튼(Anki 스타일)을 SM-2 품질값 q에 매핑한다.

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface SrsState {
  ease: number; // 난이도 계수(E-Factor), 최소 1.3
  intervalDays: number; // 현재 간격(일)
  repetitions: number; // 연속 정답 횟수
}

export interface SrsResult extends SrsState {
  /** 다음 복습까지 남은 일수(dueAt 계산용). */
  dueInDays: number;
}

export const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

/**
 * 현재 상태와 채점 결과로 다음 SM-2 상태를 계산한다.
 * - again: 실패(lapse) — 반복 초기화, 난이도 하향, 즉시 재복습
 * - hard/good/easy: 성공 — 간격 확장 + 난이도 조정
 */
export function schedule(state: SrsState, grade: ReviewGrade): SrsResult {
  const ease = state.ease || DEFAULT_EASE;

  if (grade === "again") {
    return {
      ease: Math.max(MIN_EASE, ease - 0.2),
      intervalDays: 0,
      repetitions: 0,
      dueInDays: 0,
    };
  }

  const q = grade === "hard" ? 3 : grade === "good" ? 4 : 5;
  const nextEase = Math.max(
    MIN_EASE,
    ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );
  const repetitions = state.repetitions + 1;

  let interval: number;
  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 6;
  } else {
    interval = Math.round(state.intervalDays * nextEase);
  }

  // 채점별 간격 보정
  if (grade === "hard") interval = Math.round(interval * 0.8);
  else if (grade === "easy") interval = Math.round(interval * 1.3);

  interval = Math.max(1, interval);

  return {
    ease: nextEase,
    intervalDays: interval,
    repetitions,
    dueInDays: interval,
  };
}

/** dueInDays를 실제 만기 시각으로 변환. */
export function dueDateFrom(dueInDays: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + dueInDays * 24 * 60 * 60 * 1000);
}
