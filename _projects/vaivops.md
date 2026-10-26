---
title: "온프레미스 LLMOps 솔루션 VAIVOps 개발"
order: 1
period: "2025.12 — 진행중"
org: "(주)바이브컴퍼니 · AI연구소"
role: "책임 연구원"
outcome: "평균 장애 대응 시간 1분 이내로 단축, 학습 지원 공수 30% 이상 절감"
tags: ["vLLM", "LiteLLM", "FastAPI", "ELK", "PLG", "Langfuse"]
---

<p class="pj-lead">폐쇄망 고객도 LLM을 직접 학습·배포·운영할 수 있도록, 학습부터 서빙·테스트·모니터링까지 하나로 묶은 온프레미스 LLMOps 플랫폼 <strong>VAIVOps</strong>를 개발하고 있습니다.</p>

<div class="pj-stats">
  <div class="pj-stat"><span class="pj-stat__v">&lt;1분</span><span class="pj-stat__k">평균 장애 대응 시간</span><span class="pj-stat__s">모니터링 · 이중화 · 자가 복구</span></div>
  <div class="pj-stat"><span class="pj-stat__v">−30%+</span><span class="pj-stat__k">학습 지원 공수</span><span class="pj-stat__s">비개발 직군 · 고객사 대상</span></div>
  <div class="pj-stat"><span class="pj-stat__v">13종</span><span class="pj-stat__k">컴포넌트 통합 운영</span><span class="pj-stat__s">3노드 · 6레이어</span></div>
  <div class="pj-stat"><span class="pj-stat__v">0초</span><span class="pj-stat__k">모델 추가 시 중단</span><span class="pj-stat__s">LiteLLM API 등록 · Rolling</span></div>
</div>

<dl class="pj-meta">
  <div><dt>기간</dt><dd>2025.12 — 진행중<br>선행: 학습 모듈 2025.03—</dd></div>
  <div><dt>역할</dt><dd>설계 · 개발 전담 (인프라 구축 포함)</dd></div>
  <div><dt>고객</dt><dd>식약처 · 우리카드 · 풍산 · 사내 연구원 · 폐쇄망 고객사</dd></div>
  <div><dt>기술</dt><dd>vLLM · LiteLLM · Kubernetes · MLflow · Langfuse · PLG</dd></div>
</dl>

## 문제 정의

<div class="pj-ps">
<div class="pj-card" markdown="1">
<span class="pj-card__label">문제 배경</span>

### 흩어진 도구, 수작업 운영

학습 · 서빙 · 모니터링이 제각각이라 사람 손이 계속 필요하고, 폐쇄망 고객은 직접 운영할 수 없었습니다.

- **Train** — 외부 의뢰 · 블랙박스 학습, 기록 분산
- **Serve** — 설정 변경 시 전체 모델 요청 중단
- **Ops** — GPU 사양 · 장애 대응을 감으로 판단

</div>
<span class="pj-ps__arrow" aria-hidden="true">→</span>
<div class="pj-card pj-card--accent" markdown="1">
<span class="pj-card__label">문제 정의</span>

### 하나의 화면, 하나의 루프

학습 → 서빙 → 비교 → 데이터 개선 루프를 제품 안에서 닫고, 다중 GPU 노드를 무중단으로 운영한다.

- No-Code 학습 · 테스트
- 무중단 서빙 · LLM 게이트웨이
- k8s 클러스터 · 관측성

</div>
</div>

## 역할

- **통합 서비스 개발** — 원클릭 서빙 · No-Code 학습(SFT/DPO, LoRA/QLoRA) · 동작/응답비교/스트레스 테스트 · 모니터링
- **서빙 · 게이트웨이** — 사내 모델 VAIVGeM과 오픈웨이트 모델을 vLLM + LiteLLM으로 서빙, GPU 메모리 예측 배포 마법사
- **장애 대응 체계** — FastAPI 미들웨어 + ELK · PLG · Langfuse 연동으로 이상 징후 즉시 감지
- **인프라 전환** — Docker Swarm → k8s(Rocky + Podman), SeaweedFS · Harbor · Longhorn · MetalLB, 폐쇄망 설치 번들

## 아키텍처 — 4계층 + 개선 루프

<div class="table-wrap" markdown="1">

| 계층 | 구성 |
|---|---|
| Application | Open WebUI · VAIV Search · Agent · 고객사 앱 |
| Core | VAIVOps (학습 · 서빙 · 테스트 · 데이터 관리) · LiteLLM (OpenAI 호환 · fallback) |
| Engine | vLLM Pod (Base + Multi-LoRA) · Trainer (SFT · DPO) · MLflow (실험 기록) |
| Observe · Store | Prometheus · Loki · Grafana · Langfuse (요청 trace) · SeaweedFS · Harbor |
| Infra | k8s · GPU Operator · Longhorn · MetalLB · Traefik — Rocky Linux + Podman · 폐쇄망 |

</div>

<ol class="pj-flow">
  <li><strong>학습</strong> — No-Code로 어댑터를 학습합니다.</li>
  <li><strong>서빙</strong> — 학습한 어댑터를 바로 배포합니다.</li>
  <li><strong>A/B 비교</strong> — 응답을 나란히 비교하고 선호 응답을 고릅니다.</li>
  <li><strong>데이터</strong> — 선호 응답이 다음 학습 데이터로 저장되어 루프가 닫힙니다.</li>
</ol>

## A. No-Code 학습 · 테스트

스크립트 없이 5단계로 학습하고 실시간 loss를 확인합니다(예: Gemma 4 12B SFT, loss 3.80 → 0.18). 응답 비교 화면에서 고른 선호 응답은 바로 학습 데이터로 저장됩니다.

- **문제 → 해결** — LLaMA-Factory는 옵션이 과다해, 필요한 파라미터만 남긴 자체 학습기를 만들었습니다.
- **추적** — MLflow Run 자동 생성, Artifact(SeaweedFS)와 Backend(PostgreSQL) 분리, Redis로 상태 공유
- **테스트** — 동작 · A/B · 스트레스(동접 증가/지속/외부 URL) 테스트와 결과 다운로드

## B. 모델 서빙 · LLM 게이트웨이

GPU 사양은 감이 아니라 측정으로 정합니다.

- **배포 마법사** — 모델 · LoRA 어댑터 선택 → 노드 · 옵션 → 검토 · 배포의 3단계
- **GPU 자원 예측** — 모델 `config.json`으로 배포 전 필요 GPU 메모리 산출 (파라미터 수 × dtype 바이트 + 토큰당 KV × 최대 토큰 수 + 활성화 오버헤드)
- **무중단 등록** — LiteLLM replica 2 + Rolling 방식에서 API 등록 방식으로 전환
- **스트레스 테스트** — 동시 사용자 · 종료 조건을 설정하면 TTFT · TPOT · 처리량 리포트 생성

### GPU별 평균 응답 속도 (Gemma 3 · 동시 1명 → 100명)

<div class="table-wrap" markdown="1">

| 모델 · GPU | tokens/s (1명 → 100명) | 운영 가이드 |
|---|---|---|
| 27B · H100 | **156 → 68** | A100 대비 2배 이상 · 100명 가능 |
| 27B · A100 | 87 → 19 | |
| 12B · L40S | 62 → 22 | 동시 50명까지 안정 운영 |
| 12B · A6000 | 56 → 14 | |

</div>

이 결과는 영업·견적 단계의 표준 운영 사양 가이드로 쓰이고 있습니다.

## C. 클러스터 · 관측성

Docker Swarm(v1, 2026.02—04)으로 빠르게 검증한 뒤 Kubernetes 표준으로 옮겼습니다.

<div class="table-wrap" markdown="1">

| 항목 | Docker Swarm | Kubernetes (k8s) |
|---|---|---|
| GPU 할당 | generic_resources 수동 | **nvidia device plugin** |
| 모델 공유 | rclone plugin | **SeaweedFS + Longhorn PVC** |
| 접근 · LB | 노드 IP 직접 | **MetalLB L2 · Traefik** |
| 이미지 | 외부 레지스트리 | **Harbor (폐쇄망)** |
| 관측 | exporter 수동 연결 | **PLG + Langfuse** |

</div>

<div class="pj-fixes">
  <div class="pj-fix">
    <p class="pj-fix__q">Trouble · SeaweedFS 볼륨 성능 저하</p>
    <p class="pj-fix__why"><b>원인</b>볼륨 55/56 사용, 83 B/s까지 저하 — <code>.git</code> 소형 파일이 원인</p>
    <p class="pj-fix__how"><b>해결</b>XFS 분리 + hf cli로 모델 다운로드 방식 변경</p>
  </div>
  <div class="pj-fix">
    <p class="pj-fix__q">Trouble · 라이선스</p>
    <p class="pj-fix__why"><b>원인</b>MinIO의 AGPL v3 라이선스</p>
    <p class="pj-fix__how"><b>해결</b>SeaweedFS(Apache 2.0)로 전환</p>
    <span class="pj-fix__r">AGPL<br>회피</span>
  </div>
</div>

k8s 전환 15개 작업 중 14개를 마쳐, k8s + Harbor + 기본 모델 4종으로 구성된 폐쇄망 완제품을 만들었습니다.

## 결론 — 운영을 제품으로 만들다

- **학습** — 비개발자도 어댑터를 만들고 즉시 서빙 · 비교 → 학습 지원 공수 30% 이상 절감
- **서빙** — 측정 기반 GPU 사양 · 단일 게이트웨이 · 무중단 모델 등록
- **운영** — k8s 표준 + 관측성 → 장애 대응 1분 이내, 폐쇄망 설치 번들

<p class="pj-note"><b>배운 점</b>먼저 작게 검증(Swarm)하고 한계를 측정한 뒤 표준(k8s)으로 옮기는 것이, 처음부터 크게 짓는 것보다 빠릅니다.</p>
