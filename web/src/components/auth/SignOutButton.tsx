"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";

function SignOutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label="로그아웃"
      className="session-signout"
      disabled={pending}
      title="로그아웃"
      type="submit"
    >
      <LogOut aria-hidden="true" />
      <span>{pending ? "로그아웃 중" : "로그아웃"}</span>
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction} className="session-signout-form">
      <SignOutSubmitButton />
    </form>
  );
}
