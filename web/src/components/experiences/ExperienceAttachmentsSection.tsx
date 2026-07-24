"use client";

import Image from "next/image";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { formatAttachmentSize } from "@/lib/experienceAttachments";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type { ExperienceAttachment } from "@/lib/types";

type ExperienceAttachmentsSectionProps = {
  experienceId: string;
  canDelete?: boolean;
  headingLevel?: "h2" | "h3";
};

export function ExperienceAttachmentsSection({
  experienceId,
  canDelete = false,
  headingLevel = "h3",
}: ExperienceAttachmentsSectionProps) {
  const Heading = headingLevel;
  const [attachments, setAttachments] = useState<
    ExperienceAttachment[] | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadAttachments = useCallback(async () => {
    setErrorMessage("");

    try {
      const storedAttachments =
        await getCampusLogRepository().attachments.listByExperienceId(
          experienceId,
        );
      setAttachments(storedAttachments);
    } catch {
      setAttachments([]);
      setErrorMessage("첨부 파일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [experienceId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const storedAttachments =
          await getCampusLogRepository().attachments.listByExperienceId(
            experienceId,
          );

        if (isMounted) {
          setAttachments(storedAttachments);
          setErrorMessage("");
        }
      } catch {
        if (isMounted) {
          setAttachments([]);
          setErrorMessage(
            "첨부 파일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          );
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [experienceId]);

  async function handleDelete(attachment: ExperienceAttachment) {
    const shouldDelete = window.confirm(
      `"${attachment.fileName}" 첨부 파일을 삭제할까요?`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(attachment.id);
    setErrorMessage("");

    try {
      const didDelete =
        await getCampusLogRepository().attachments.delete(attachment);

      if (!didDelete) {
        throw new Error("Attachment deletion failed.");
      }

      setAttachments((current) =>
        current?.filter((item) => item.id !== attachment.id),
      );
    } catch {
      setErrorMessage(
        "첨부 파일을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setDeletingId("");
    }
  }

  if (attachments === undefined) {
    return (
      <section className="experience-attachments-section">
        <Heading>첨부 파일</Heading>
        <p className="is-muted">첨부 파일을 불러오는 중입니다.</p>
      </section>
    );
  }

  if (attachments.length === 0 && !errorMessage) {
    return null;
  }

  return (
    <section className="experience-attachments-section">
      <div className="experience-attachments-heading">
        <Heading>첨부 파일</Heading>
        {attachments.length > 0 ? <span>{attachments.length}개</span> : null}
      </div>

      {attachments.length > 0 ? (
        <ul className="experience-attachments-list">
          {attachments.map((attachment) => {
            const isPhoto = attachment.kind === "photo";
            const attachmentContent = (
              <>
                <span
                  className={`experience-attachment-preview${isPhoto ? " is-photo" : ""}`}
                  aria-hidden="true"
                >
                  {isPhoto && attachment.viewUrl ? (
                    <Image
                      src={attachment.viewUrl}
                      alt=""
                      width={96}
                      height={72}
                      unoptimized
                    />
                  ) : isPhoto ? (
                    <ImageIcon />
                  ) : (
                    <FileText />
                  )}
                </span>
                <span className="experience-attachment-copy">
                  <strong title={attachment.fileName}>
                    {attachment.fileName}
                  </strong>
                  <span>
                    {isPhoto ? "사진" : "PDF 자료"} ·{" "}
                    {formatAttachmentSize(attachment.fileSize)}
                  </span>
                </span>
                <ExternalLink
                  className="experience-attachment-open-icon"
                  aria-hidden="true"
                />
              </>
            );

            return (
              <li key={attachment.id}>
                {attachment.viewUrl ? (
                  <a
                    href={attachment.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${attachment.fileName} 새 창에서 열기`}
                  >
                    {attachmentContent}
                  </a>
                ) : (
                  <span className="experience-attachment-unavailable">
                    {attachmentContent}
                  </span>
                )}
                {canDelete ? (
                  <button
                    type="button"
                    className="experience-attachment-delete"
                    onClick={() => handleDelete(attachment)}
                    disabled={deletingId === attachment.id}
                    aria-label={`${attachment.fileName} 첨부 파일 삭제`}
                    title="첨부 파일 삭제"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {errorMessage ? (
        <div className="experience-attachments-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={loadAttachments}>
            다시 시도
          </button>
        </div>
      ) : null}
    </section>
  );
}
