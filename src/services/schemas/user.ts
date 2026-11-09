import { z } from "zod";

export const userRoleEnum = z.enum([
  "guest",
  "user",
  "premium",
  "partner",
  "support",
  "admin",
  "superadmin",
]);
export type TUserRole = z.infer<typeof userRoleEnum>;

export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone_number: z
    .string()
    .min(1)
    .regex(/^[0-9]{10}$/, "Invalid phone number format"),
  address: z.string().min(1),
  remark: z.string(),
  role: userRoleEnum,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type TUser = z.infer<typeof userSchema>;
