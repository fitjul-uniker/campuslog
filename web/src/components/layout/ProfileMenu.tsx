"use client";

import type { CSSProperties } from "react";
import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountProfile } from "@/hooks/use-account-profile";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

import styles from "./ProfileMenu.module.css";

type ProfileMenuProps = {
  variant?: "desktop" | "mobile";
};

type AvatarStyle = CSSProperties & {
  "--profile-avatar-image"?: string;
};

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <DropdownMenuItem
      asChild
      disabled={pending}
      onSelect={(event) => event.preventDefault()}
    >
      <button
        type="submit"
        className={styles.logoutButton}
        disabled={pending}
      >
        <LogOut aria-hidden="true" />
        <span>{pending ? "로그아웃 중" : "로그아웃"}</span>
      </button>
    </DropdownMenuItem>
  );
}

export function ProfileMenu({ variant = "desktop" }: ProfileMenuProps) {
  const { nickname, avatarUrl, initial } = useAccountProfile();
  const isMobile = variant === "mobile";
  const avatarStyle: AvatarStyle | undefined = avatarUrl
    ? { "--profile-avatar-image": `url("${avatarUrl}")` }
    : undefined;

  const avatar = (
    <span
      aria-hidden="true"
      className={cn(styles.avatar, avatarUrl && styles.avatarWithImage)}
      style={avatarStyle}
    >
      {avatarUrl ? null : initial}
    </span>
  );

  return (
    <div className={cn(styles.root, isMobile && styles.mobileRoot)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(styles.trigger, isMobile && styles.mobileTrigger)}
            aria-label={`${nickname} 계정 메뉴`}
          >
            {avatar}
            {isMobile ? (
              <span className={styles.srOnly}>계정 메뉴: {nickname}</span>
            ) : (
              <span className={styles.nickname}>{nickname}</span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={isMobile ? "end" : "start"}
          side={isMobile ? "bottom" : "top"}
          className={styles.content}
        >
          <DropdownMenuLabel className={styles.identity}>
            {avatar}
            <span className={styles.identityNickname}>{nickname}</span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className={styles.separator} />

          <form action={signOutAction} className={styles.logoutForm}>
            <LogoutSubmitButton />
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
