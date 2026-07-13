"use client";

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import styles from "./stepper.module.css";

export type StepProps = {
  children: ReactNode;
  label: string;
};

type StepperProps = {
  children: ReactElement<StepProps> | ReactElement<StepProps>[];
  initialStep?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  validateStep?: (step: number) => boolean;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  pendingButtonText?: string;
  isPending?: boolean;
  className?: string;
};

export function Step({ children }: StepProps) {
  return <div className={styles.step}>{children}</div>;
}

export default function Stepper({
  children,
  initialStep = 1,
  currentStep,
  onStepChange,
  onFinalStepCompleted,
  validateStep,
  backButtonText = "이전",
  nextButtonText = "다음",
  completeButtonText = "완료",
  pendingButtonText = "저장 중",
  isPending = false,
  className,
}: StepperProps) {
  const steps = Children.toArray(children).filter(
    (child): child is ReactElement<StepProps> => isValidElement(child),
  );
  const totalSteps = steps.length;
  const [internalStep, setInternalStep] = useState(initialStep);
  const activeStep = Math.min(
    Math.max(currentStep ?? internalStep, 1),
    Math.max(totalSteps, 1),
  );
  const [direction, setDirection] = useState(0);
  const previousStepRef = useRef(activeStep);
  const shouldReduceMotion = useReducedMotion();
  const indicatorId = useId();
  const activeStepData = steps[activeStep - 1];

  useEffect(() => {
    const previousStep = previousStepRef.current;

    if (previousStep !== activeStep) {
      setDirection(activeStep > previousStep ? 1 : -1);
      previousStepRef.current = activeStep;
    }
  }, [activeStep]);

  if (totalSteps === 0 || !activeStepData) {
    return null;
  }

  function updateStep(nextStep: number) {
    setDirection(nextStep > activeStep ? 1 : -1);

    if (currentStep === undefined) {
      setInternalStep(nextStep);
    }

    onStepChange?.(nextStep);
  }

  function handleNext() {
    if (isPending || (validateStep && !validateStep(activeStep))) {
      return;
    }

    if (activeStep === totalSteps) {
      onFinalStepCompleted?.();
      return;
    }

    updateStep(activeStep + 1);
  }

  function handleBack() {
    if (isPending || activeStep === 1) {
      return;
    }

    updateStep(activeStep - 1);
  }

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };
  const contentVariants = {
    enter: (nextDirection: number) => ({
      opacity: shouldReduceMotion ? 1 : 0,
      x: shouldReduceMotion ? 0 : nextDirection >= 0 ? 22 : -22,
    }),
    center: { opacity: 1, x: 0 },
    exit: (nextDirection: number) => ({
      opacity: shouldReduceMotion ? 1 : 0,
      x: shouldReduceMotion ? 0 : nextDirection >= 0 ? -14 : 14,
    }),
  };

  return (
    <div
      className={cn(styles.container, className)}
      aria-busy={isPending || undefined}
    >
      <ol
        id={indicatorId}
        className={styles.indicatorList}
        aria-label="회원가입 진행 단계"
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = activeStep === stepNumber;
          const isComplete = activeStep > stepNumber;

          return (
            <li
              className={styles.indicatorItem}
              key={`${step.props.label}-${stepNumber}`}
              aria-current={isActive ? "step" : undefined}
            >
              <motion.span
                className={cn(
                  styles.indicatorCircle,
                  isActive && styles.isActive,
                  isComplete && styles.isComplete,
                )}
                animate={{ scale: isActive && !shouldReduceMotion ? 1.04 : 1 }}
                transition={transition}
                aria-hidden="true"
              >
                {isComplete ? <Check /> : stepNumber}
              </motion.span>
              <span className="sr-only">
                {step.props.label}, {isComplete ? "완료" : isActive ? "현재" : "예정"}
              </span>
              {stepNumber < totalSteps ? (
                <span className={styles.connector} aria-hidden="true">
                  <motion.span
                    className={styles.connectorFill}
                    animate={{ scaleX: isComplete ? 1 : 0 }}
                    transition={transition}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className={styles.contentViewport}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={activeStep}
            className={styles.content}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            role="group"
            aria-label={`${activeStepData.props.label}, ${totalSteps}단계 중 ${activeStep}단계`}
          >
            {activeStepData}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          styles.footer,
          activeStep === 1 && styles.onlyNext,
        )}
      >
        {activeStep > 1 ? (
          <button
            className={cn("button button-ghost", styles.backButton)}
            disabled={isPending}
            onClick={handleBack}
            type="button"
          >
            {backButtonText}
          </button>
        ) : null}

        <button
          className={cn("button button-primary", styles.nextButton)}
          disabled={isPending}
          onClick={handleNext}
          type="button"
        >
          {isPending && activeStep === totalSteps ? (
            <Loader2 className={cn("button-icon auth-spinner")} aria-hidden="true" />
          ) : null}
          <span>
            {isPending && activeStep === totalSteps
              ? pendingButtonText
              : activeStep === totalSteps
                ? completeButtonText
                : nextButtonText}
          </span>
        </button>
      </div>
    </div>
  );
}
