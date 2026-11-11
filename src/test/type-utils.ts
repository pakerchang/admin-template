/** 攤平頂層交集（orval `allOf` → `A & {...}`），讓 `toEqualTypeOf` 比對不誤報（T3-K1） */
export type Flat<T> = { [K in keyof T]: T[K] };
