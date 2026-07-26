/**
 * Paymentwall 서명 구현 자체 검증.
 *
 *   npx tsx scripts/verify-paymentwall-signature.mts
 *
 * 벡터는 공식 라이브러리(paymentwall/paymentwall-node)의 features/pingback.feature 에서
 * 그대로 가져왔다. 서명이 틀리면 결제가 통째로 실패하거나 위조 pingback 을 받아들이게
 * 되므로, 구현을 손댈 때마다 이 스크립트가 통과하는지 확인한다.
 *
 * 시나리오마다 시크릿 키가 다르다는 점에 주의 — 벡터별로 짝을 맞춰 두었다.
 */
import { calculateSignature } from "../src/lib/paymentwall";

type Vector = { name: string; secret: string; query: string; expected: string };

const VECTORS: Vector[] = [
  {
    name: "Digital Goods · v2 (MD5) · 결제",
    secret: "a7408723eaf4bfa2e3ac49b3cb695046",
    query:
      "uid=test_user&goodsid=test_product&slength=5&speriod=month&type=0&ref=t123&is_test=1&sign_version=2",
    expected: "754cff93c0eb859f6054bef143ad253c",
  },
  {
    name: "Digital Goods · v3 (SHA256) · 차지백",
    secret: "a7408723eaf4bfa2e3ac49b3cb695046",
    query:
      "uid=test_user&goodsid=test_product&slength=-5&speriod=month&type=2&ref=t123&is_test=1&reason=9&sign_version=3",
    expected: "2f67209c3e581313a70de9425efef49f35a74c0cdb7f93051b47e3c097011a71",
  },
  {
    name: "Virtual Currency · v3 (SHA256) · 결제",
    secret: "6274def95b105f1c92d341a8d3bc2e77",
    query: "uid=test_user&currency=1000&type=0&ref=t555&is_test=1&sign_version=3",
    expected: "a2932c360010e613166ae95ede5a3fa45bfcac10e1dd93715d21b00d684eb0fb",
  },
];

let failed = 0;
for (const v of VECTORS) {
  const params = Object.fromEntries(new URLSearchParams(v.query));
  const got = calculateSignature(params, v.secret, Number(params.sign_version));
  if (got === v.expected) {
    console.log(`ok   ${v.name}`);
  } else {
    failed++;
    console.log(`FAIL ${v.name}\n       got      ${got}\n       expected ${v.expected}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed}건 불일치 — 서명 구현이 깨졌다.`);
  process.exit(1);
}
console.log("\n공식 테스트 벡터 3건 전부 일치.");
