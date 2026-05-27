import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email({ error: "올바른 이메일을 입력해주세요." }).trim(),
  password: z
    .string()
    .min(6, { error: "비밀번호는 최소 6자 이상이어야 해요." }),
});

export const SignupSchema = z.object({
  name: z
    .string()
    .min(1, { error: "이름을 입력해주세요." })
    .max(20, { error: "이름은 20자 이하로 입력해주세요." })
    .trim(),
  email: z.email({ error: "올바른 이메일을 입력해주세요." }).trim(),
  password: z
    .string()
    .min(8, { error: "8자 이상으로 설정해주세요." })
    .regex(/[a-zA-Z]/, { error: "영문을 1개 이상 포함해주세요." })
    .regex(/[0-9]/, { error: "숫자를 1개 이상 포함해주세요." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
