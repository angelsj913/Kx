// plotly.js-dist-min은 plotly.js와 동일한 API를 갖는 사전 빌드 배포판이지만
// 별도 타입 패키지가 없다. @types/plotly.js의 타입을 그대로 재사용한다.
declare module "plotly.js-dist-min" {
  export * from "plotly.js";
}
