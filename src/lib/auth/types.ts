import { z } from "zod";

export const appRoleSchema = z.enum(["admin", "cleaner"]);
export const profileStatusSchema = z.enum(["active", "inactive"]);

export const profileSchema = z.object({
  id: z.uuid(),
  full_name: z.string().min(1),
  email: z.email(),
  phone: z.string().nullable(),
  role: appRoleSchema,
  status: profileStatusSchema,
});

export type AppRole = z.infer<typeof appRoleSchema>;
export type ProfileStatus = z.infer<typeof profileStatusSchema>;
export type Profile = z.infer<typeof profileSchema>;

export type AuthContext = {
  profile: Profile;
  userId: string;
};
