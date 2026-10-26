---
title: "RAG 솔루션 SaaS 전환 및 성능 최적화"
order: 2
period: "2024.05 — 2025.01"
org: "(주)바이브컴퍼니 · AI연구소"
role: "책임 연구원"
outcome: "TTA 인증 취득, 서비스 가용성 99.99% 확보, 인프라 비용 50% 절감"
tags: ["NKS", "Kubernetes", "RAG", "비동기 처리"]
---

<p class="pj-lead">설치형(On-Premise) RAG 솔루션 VAIV SearchGPT를 NAVER Cloud Kubernetes 기반 구독형 SaaS로 전환하고, 공인 시험 기준을 통과하도록 성능과 비용을 최적화했습니다.</p>

<div class="pj-stats">
  <div class="pj-stat"><span class="pj-stat__v">2종</span><span class="pj-stat__k">시험 · 인증 취득</span><span class="pj-stat__s">TTA SW 시험 · 클라우드 서비스 확인제</span></div>
  <div class="pj-stat"><span class="pj-stat__v">99.99%</span><span class="pj-stat__k">서비스 가용성</span><span class="pj-stat__s">p50 &lt;1s · p99 &lt;3s (50명)</span></div>
  <div class="pj-stat"><span class="pj-stat__v">−50%</span><span class="pj-stat__k">클라우드 인프라 비용</span><span class="pj-stat__s">프로젝트 초기 대비</span></div>
  <div class="pj-stat"><span class="pj-stat__v">22.7</span><span class="pj-stat__k">RPS · TTA 동시 100명</span><span class="pj-stat__s">목표 20 · 실패 0%</span></div>
</div>

<dl class="pj-meta">
  <div><dt>기간</dt><dd>2024.05 — 2025.01 (9개월)</dd></div>
  <div><dt>역할</dt><dd>마이그레이션 주도 · 성능 · 비용 최적화</dd></div>
  <div><dt>플랫폼</dt><dd>NAVER Cloud · NKS (Kubernetes)</dd></div>
  <div><dt>기술</dt><dd>Kubernetes · Helm · HPA · asyncio · Locust · Grafana</dd></div>
</dl>

## 문제 정의

<div class="pj-ps">
<div class="pj-card" markdown="1">
<span class="pj-card__label">문제 배경</span>

### 설치형 → 구독형 전환

유망 SaaS 개발육성 지원사업에 참여했지만, 설치형 구조 그대로는 클라우드에서 확장도 응답 속도도 부족했습니다.

- **Scale** — 모놀리식이라 인스턴스 단위로만 확장
- **Deps** — MariaDB 등 무거운 의존성
- **Perf** — 1인 부하에서도 RPS 0.6 · p95 7.6초

</div>
<span class="pj-ps__arrow" aria-hidden="true">→</span>
<div class="pj-card pj-card--accent" markdown="1">
<span class="pj-card__label">문제 정의</span>

### 공인 시험 기준을 통과하는 SaaS

가볍게 쪼개 Pod 단위로 확장하고, 공인 시험의 성능 지표를 충족한다.

- 응답시간 평균 ≤ 1.5초
- 동시 100명 · 20 TPS
- 비용 효율적인 클라우드 구성

</div>
</div>

## 역할

- **MSA 분해** — Input · Search · BPR · MRC API를 Git Subtree/Submodule로 분리해 Pod 단위로 수평 확장
- **의존성 축소 · 경량화** — MariaDB에 의존하던 6개 기능을 OpenSearch `_id` 기반으로 옮겨 DB 제거, 저장소 3종 → 2종
- **NCP 구성** — VPC/Subnet/NAT, NKS, Bastion, Helm(bitnami)으로 OpenSearch 노드 역할 분리 배포, HPA·CronJob 스케일링
- **성능 최적화** — 부하 테스트 → 프로파일링 → 병목 수정 사이클 반복, TTA 시나리오·시연 담당
- **비용 최적화** — GPU가 필요한 BPR/MRC/LLM은 On-Prem + Nginx로 연결, 08–20시 스케줄링, Kubernetes Event 알림 시스템 개발

## 아키텍처 — 상태는 DB에, API는 무상태로 수평 확장

<div class="table-wrap" markdown="1">

| 영역 | 구성 |
|---|---|
| Client | SearchGPT Front · Front API · 고객사 API |
| NKS · API | Search API (Pod ×6 · HPA) · Input API (Collection Manager) |
| NKS · Data | OpenSearch Cluster (Helm · master / data 노드 분리) · Qdrant Cluster (3 노드) |
| On-Prem GPU | BPR API (Pod ×2) · MRC API (Pod ×6) · VAIVGeM (LLM · STS) |
| Ops | Grafana Pod health · Fluentd → OpenSearch Dashboard · Slack 알림 (K8s Event) |

</div>

- **Scale** — HPA + CronJob으로 API Pod 2 → 4 자동 확장 시연
- **Cost** — GPU 워크로드만 On-Prem으로 연결하고 클라우드는 CPU 노드만 사용
- **Lightweight** — MariaDB를 없애 저장소를 OpenSearch · Qdrant 두 클러스터로 단순화

## 측정 → 프로파일링 → 수정

지연의 대부분은 병목 두 곳에서 나왔습니다. 감이 아니라 프로파일러로 찾았습니다.

<div class="pj-fixes">
  <div class="pj-fix">
    <p class="pj-fix__q">Bottleneck 1 · 점수 병합</p>
    <p class="pj-fix__why"><b>원인</b>O(n²) 리스트 탐색</p>
    <p class="pj-fix__how"><b>해결</b>dict 기반 O(n) 조회로 변경</p>
    <span class="pj-fix__r">39.2ms<br>→ 1.3ms</span>
  </div>
  <div class="pj-fix">
    <p class="pj-fix__q">Bottleneck 2 · OpenSearch scroll</p>
    <p class="pj-fix__why"><b>원인</b>size 1,000 요청에 24,210건 반환</p>
    <p class="pj-fix__how"><b>해결</b>요청 크기만큼만 가져오도록 조회 방식 수정</p>
    <span class="pj-fix__r">794ms<br>→ 77.5ms</span>
  </div>
</div>

<p class="pj-note"><b>결론</b>TTA 시험(2024.12)에서 동시 100명 · 22.7 RPS · 실패 0% · 평균 응답 1.386초(목표 1.5초)로 목표 전 항목을 충족했습니다.</p>
