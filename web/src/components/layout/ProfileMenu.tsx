"use client";

import type { CSSProperties } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LogOut, Pencil, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACCOUNT_PROFILE_UPDATED_EVENT,
  useAccountProfile,
} from "@/hooks/use-account-profile";
import { signOutAction } from "@/lib/auth/actions";
import { initialNicknameUpdateState } from "@/lib/auth/profile-action-state";
import { updateNicknameAction } from "@/lib/auth/profile-actions";
import { AUTH_NICKNAME_MAX_LENGTH } from "@/lib/auth/profile";
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

type NicknameEditDialogProps = {
  initialNickname: string;
  onClose: () => void;
};

function NicknameSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.saveButton} disabled={pending}>
      {pending ? "저장 중" : "저장"}
    </button>
  );
}

function NicknameEditDialog({
  initialNickname,
  onClose,
}: NicknameEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(
    updateNicknameAction,
    initialNicknameUpdateState,
  );
  const errorId = "nickname-edit-error";
  const descriptionId = "nickname-edit-description";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(ACCOUNT_PROFILE_UPDATED_EVENT, {
        detail: { nickname: state.nickname },
      }),
    );
    dialogRef.current?.close();
  }, [state]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="nickname-edit-title"
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
      onClose={onClose}
    >
      <div className={styles.dialogHeader}>
        <div>
          <h2 id="nickname-edit-title">닉네임 수정</h2>
          <p id={descriptionId}>CampusLog 안에서 표시할 이름을 바꿔보세요.</p>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="닉네임 수정 닫기"
          onClick={() => dialogRef.current?.close()}
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <form action={formAction} className={styles.nicknameForm}>
        <label htmlFor="profile-nickname">닉네임</label>
        <input
          id="profile-nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          autoFocus
          required
          maxLength={AUTH_NICKNAME_MAX_LENGTH}
          defaultValue={
            state.status === "error" ? state.nickname : initialNickname
          }
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? errorId : undefined}
        />
        <div className={styles.formFooter}>
          <span className={styles.inputHelp}>1~20자</span>
          {state.status === "error" ? (
            <p id={errorId} className={styles.formError} role="alert">
              {state.message}
            </p>
          ) : null}
          <NicknameSubmitButton />
        </div>
      </form>
    </dialog>
  );
}

export function ProfileMenu({ variant = "desktop" }: ProfileMenuProps) {
  const { nickname, avatarUrl, initial } = useAccountProfile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [editSession, setEditSession] = useState(0);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
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
            ref={triggerRef}
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

          <DropdownMenuItem
            className={styles.editButton}
            onSelect={() => {
              setEditSession((currentSession) => currentSession + 1);
              setIsEditingNickname(true);
            }}
          >
            <Pencil aria-hidden="true" />
            <span>닉네임 수정</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className={styles.separator} />

          <form action={signOutAction} className={styles.logoutForm}>
            <LogoutSubmitButton />
          </form>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditingNickname ? (
        <NicknameEditDialog
          key={editSession}
          initialNickname={nickname}
          onClose={() => {
            setIsEditingNickname(false);
            window.requestAnimationFrame(() => triggerRef.current?.focus());
          }}
        />
      ) : null}
    </div>
  );
}
