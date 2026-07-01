# CampusLog

> AI가 대학생의 활동 경험을 분석하고, 필요한 순간 가장 적합한 경험을 추천해주는 성장 기록 서비스

## Overview

CampusLog는 대학생이 프로젝트, 공모전, 인턴 등 다양한 활동 경험을 잊지 않게 기록하고 AI가 역량과 성과를 정리해 자기소개서·포트폴리오·면접 준비에 바로 참고할 수 있게 돕는 성장 기록 서비스입니다.

이 프로젝트는 커널아카데미 대학생 AI 크루 UNIKER 1기 팀 핏줄의 10주 MVP 개발 프로젝트입니다. 현재는 4~5주차까지 완성할 1차 MVP를 먼저 만들며, 많은 기능을 한 번에 만들기보다 경험을 기록하고 필요한 상황에 맞게 다시 활용하는 핵심 흐름에 집중합니다.

## Problem

대학생들은 프로젝트, 공모전, 대외활동, 인턴, 수상, 블로그, GitHub 등 다양한 경험을 여러 곳에 남기거나 제대로 기록하지 못하는 경우가 많습니다.

나중에 자기소개서, 포트폴리오, 면접, 대외활동 지원을 준비할 때는 어떤 경험을 했는지 다시 찾고 정리하는 데 시간이 많이 걸립니다. CampusLog는 흩어진 경험을 한곳에 모으고, AI가 필요한 상황에 맞는 경험을 찾아 활용할 수 있도록 돕습니다.

## Target Users

- 활동 경험은 있지만 정리해둔 곳이 없는 대학생
- 자기소개서, 포트폴리오, 면접을 준비하는 대학생
- 대외활동, 서포터즈, 인턴 지원을 준비하는 대학생
- 자신의 경험에서 역량, 성과, 키워드를 뽑아내기 어려운 대학생

## Core Features

### 활동 경험 기록

프로젝트, 공모전, 인턴, 대외활동 등 다양한 경험을 제목, 기간, 역할, 내용, 성과, 관련 링크 중심으로 기록합니다.

### AI 경험 분석

입력된 경험을 AI가 요약하고, 핵심 역량, 주요 성과, 활용 가능한 키워드로 정리합니다.

### AI 경험 추천 및 활용 지원

자기소개서 문항, 포트폴리오 작성 목적, 면접 질문 등을 입력하면 AI가 저장된 경험 중 적합한 경험을 추천하고, 추천 이유와 활용 방향을 제공합니다.

## User Flow

```text
활동 경험 기록
→ AI 경험 분석
→ 자기소개서 / 포트폴리오 / 면접 질문 입력
→ AI 경험 추천
→ 추천 결과 활용
```

## MVP Scope

현재 구현 기준은 1차 MVP입니다. 1차 MVP에서는 아래 기능에 집중합니다.

### 구현하는 것

- 활동 경험 기록
- AI 경험 분석
- AI 경험 추천 및 활용 지원
- Browser localStorage 기반 활동 기록 저장
- `sampleExperiences.ts` 기반 공통 샘플 데이터

### 구현하지 않는 것

- 로그인 / 회원가입
- Supabase Auth / Postgres / Storage
- GitHub 자동 연동
- 블로그 / Notion 연동
- 수료증 / 활동사진 등 파일 업로드
- PDF 포트폴리오 자동 생성
- 모바일 앱
- Spring Boot 백엔드 구현
- MySQL / AWS RDS / AWS S3

## Tech Stack

### 1차 MVP

- Next.js
- Browser localStorage
- `sampleExperiences.ts`
- OpenAI API
- Vercel

1차 MVP에서는 별도 데이터베이스 없이 브라우저 localStorage를 사용해 핵심 사용자 경험을 먼저 검증합니다.

### 2차 MVP

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Next.js API Route 또는 Server Action

2차 MVP에서는 UNIKER 10주차 최종 발표 전까지 외부 사용자가 직접 체험 가능한 사용자 기반 MVP로 확장할 예정입니다.

### 3차 확장

- Spring Boot
- MySQL / AWS RDS
- AWS S3

3차 확장은 UNIKER 프로젝트 종료 이후 백엔드 포트폴리오 및 실제 서비스 확장 버전으로 검토합니다.

## Project Structure

```text
campuslog/
├── frontend/              # 1차 MVP Next.js 앱, 초기 세팅 예정
├── backend/               # 3차 확장 검토용, 1차 MVP에서는 미구현
├── docs/
│   ├── USER_FLOW.md
│   ├── IA.md
│   ├── SCREEN_SPEC.md
│   ├── GIT_WORKFLOW.md
│   ├── WORK_STATUS.md
│   ├── TASK_LOG.md
│   ├── TODO.md
│   └── ISSUE_LOG.md
├── README.md
├── PRD.md
└── AGENTS.md
```

## Getting Started

현재 프로젝트는 초기 MVP 개발 단계입니다.  
아직 프론트엔드 초기 세팅 전이므로 로컬 실행 방법은 추후 작성 예정입니다. 1차 MVP의 Next.js 실행 방식과 Vercel 배포 방식이 정해지면 이 섹션에 정리할 예정입니다.
