export type TPostResponseContent = {
  message: string;
};

export type TGetResponseContent<T = void> = {
  code: number;
  msg: string;
  error: string;
  data?: T;
  total?: number;
};

export type TError = {
  error: string;
};
