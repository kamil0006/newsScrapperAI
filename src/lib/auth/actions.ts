"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dictionaries } from "@/lib/i18n/dictionary";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";
import {
  encryptSession,
  hashPassword,
  sessionExpiry,
  SESSION_COOKIE_NAME,
  verifyPasswordHash,
} from "@/lib/auth/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export type AuthState = { error: string } | undefined;

async function startSession(userId: string) {
  const cookieStore = await cookies();
  const expiresAt = sessionExpiry();
  const token = await encryptSession(userId, expiresAt);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

async function currentDict() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return dictionaries[isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE];
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const dict = await currentDict();

  const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim().toLowerCase() : "";
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const valid = user ? await verifyPasswordHash(password, user.passwordHash) : false;

  if (!user || !valid) {
    // slow down brute-force guessing a little
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: dict.login.invalidCredentials };
  }

  await startSession(user.id);
  redirect("/");
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const dict = await currentDict();

  const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim().toLowerCase() : "";
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const confirmPassword =
    typeof formData.get("confirmPassword") === "string" ? (formData.get("confirmPassword") as string) : "";

  if (!EMAIL_PATTERN.test(email)) {
    return { error: dict.signup.invalidEmail };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: dict.signup.passwordTooShort };
  }
  if (password !== confirmPassword) {
    return { error: dict.signup.passwordMismatch };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: dict.signup.emailTaken };
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });

  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
