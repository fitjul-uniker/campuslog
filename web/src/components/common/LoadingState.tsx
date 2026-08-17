type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "화면을 불러오는 중입니다.",
}: LoadingStateProps) {
  return (
    <span
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {message}
    </span>
  );
}
