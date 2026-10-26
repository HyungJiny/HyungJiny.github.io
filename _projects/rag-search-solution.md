---
title: "RAG 기반 AI 검색 솔루션 개발 및 운영"
order: 3
period: "2021.08 — 2024.06"
org: "(주)바이브컴퍼니 · AI연구소"
role: "책임 연구원"
outcome: "KLUE Recall@5 76.20% → 88.24%, 누적 60개 이상 서비스 납품 및 PoC"
tags: ["Hybrid Search", "RAG", "MSA", "LangChain", "MCP"]
---

<p class="pj-lead">외부 LLM·검색 API를 쓸 수 없는 공공기관을 위해, 보안 문서를 사내에서 정확하게 찾는 한국어 하이브리드 검색 기반 RAG 솔루션 <strong>VAIV SearchGPT</strong>를 개발·운영했습니다.</p>

<div class="pj-stats">
  <div class="pj-stat"><span class="pj-stat__v">60+</span><span class="pj-stat__k">누적 납품 · PoC</span><span class="pj-stat__s">NIA 64건 포함</span></div>
  <div class="pj-stat"><span class="pj-stat__v">10+</span><span class="pj-stat__k">공공기관 RAG 도입</span><span class="pj-stat__s">외교부 · 경찰청 …</span></div>
  <div class="pj-stat"><span class="pj-stat__v">88.2%</span><span class="pj-stat__k">KLUE Recall@5</span><span class="pj-stat__s">76.20 → 88.24</span></div>
  <div class="pj-stat"><span class="pj-stat__v">95.4%</span><span class="pj-stat__k">KorQuAD Recall@5</span><span class="pj-stat__s">0.3B 리랭커</span></div>
  <div class="pj-stat"><span class="pj-stat__v">+51%</span><span class="pj-stat__k">검색 처리량 (RPS)</span><span class="pj-stat__s">7.5 → 11.4 · 동시 64명</span></div>
</div>

<dl class="pj-meta">
  <div><dt>기간</dt><dd>2021.08 — 2025.12<br>v1 2021–24 · v2 2024.11–</dd></div>
  <div><dt>역할</dt><dd>검색 백엔드 · 알고리즘 · 아키텍처</dd></div>
  <div><dt>적용처</dt><dd>외교부 · 경찰청 · 식약처 · 국회도서관 · 공인중개사협회 등</dd></div>
  <div><dt>기술</dt><dd>OpenSearch · Qdrant · BPR/DPR · MRC · FastAPI · Airflow</dd></div>
</dl>

## 문제 정의

<div class="pj-ps">
<div class="pj-card" markdown="1">
<span class="pj-card__label">문제 배경</span>

### 외부 API를 쓸 수 없는 공공기관

망분리 환경의 내부 문서를 온프레미스에서 색인·검색해야 하지만, 단일 검색 방식으로는 정확도에 한계가 있었습니다.

- **BM25** — 표현이 바뀌면 정답을 놓침
- **Dense** — 고유명사·숫자에 약함

</div>
<span class="pj-ps__arrow" aria-hidden="true">→</span>
<div class="pj-card pj-card--accent" markdown="1">
<span class="pj-card__label">문제 정의</span>

### 두 검색기의 상보성을 하나로

키워드 검색과 의미 검색을 결합해 정답 지문을 상위로 올리고, 어떤 기관에도 설치 가능한 구조로 만든다.

- Top-k 상위 하이브리드 랭킹
- 정답 위치를 짚는 MRC
- MSA · 단일 패키지 설치

</div>
</div>

## 역할

- **하이브리드 랭킹 설계** — BM25 + DPR/BPR 점수 융합(RankFusion)과 MRC answerability 재정렬을 실험·채택
- **동시 요청 Timeout 해결** — 요청 1건이 9개 도메인을 따로 검색해 스레드 63개를 점유하던 구조를 한 번의 통합 검색으로 변경
- **v2 API 재설계** — PR × Reranker 9개 조합, 도메인별 `weight`·`required_size`, `search_after` + PIT 페이지네이션
- **비동기 전환 (공동)** — AsyncOpenSearch·AsyncQdrant 병렬 호출로 처리량 +51%
- **MSA 구조 설계** — Search · Input · BPR · MRC를 독립 컨테이너 API로 분리, Nginx 라우팅으로 모델 서버만 따로 증설
- **멀티 어댑터 구조** 도입으로 추론 성능 향상 및 GPU 자원 사용 최적화

## 아키텍처 — 동기 모놀리스에서 조합형 비동기 파이프라인으로

<div class="table-wrap" markdown="1">

| 단계 | v1 · 2023 — 동기 · 고정 파이프라인 | v2 · 2024.11 — 비동기 · 조합형 |
|---|---|---|
| API | Search API (sync) · Gunicorn · 도메인별 thread | Search API (async) · FastAPI · asyncio · orjson |
| ① 후보 검색 | OpenSearch BM25 → BPR API 쿼리 임베딩 → Milvus (순차) | OpenSearch BM25 ∥ Qdrant Dense (e5 / BPR) — `asyncio.gather` 병렬 |
| ② 점수 병합 | Hybrid 고정 병합 (BM25×1.3 + BPR) | PR 선택 (bm25 · bpr · hybrid) + weight 가중합 · `required_size` |
| ③ 재정렬 | MRC API answerability 재정렬 (항상 수행) | Reranker → MRC API (none · fusion · rerank) |
| ④ 응답 | 원문 조회(MariaDB) → 응답 | 응답 → VAIVGeM 검색 요약 (RAG) · DB 없이 동작 |
| 성능 | 7.5 RPS · 64명 p95 9.97s · 동시 6명 이상 Timeout | **11.4 RPS (+51%)** · 64명 p95 **5.69s (−43%)** · 9개 검색 조합 |

</div>

## 검색 정확도 — 정답 지문 Top-1 적중률 2.1배

KorQuAD 1.0 (5,764문항) 기준으로 BM25 : Dense 점수 조합 비율과 MRC 병합 방식을 단계별로 직접 튜닝해 최적 조합을 골랐고, v2에서는 이를 도메인별 `weight` 파라미터로 제품화했습니다.

<div class="table-wrap" markdown="1">

| 단계 | 변경 내용 | Top-1 | Top-5 |
|---|---|---|---|
| BM25 (2021.12) | 키워드 검색 단독 | 42.97 | 80.43 |
| + DPR Hybrid | Hard Negative 학습 | 76.46 | 94.14 |
| + BPR · MRC | BM25×1.3 : BPR 비율 조정 | **90.15** | **96.34** |

</div>

MRC 재정렬 단독 효과는 KorQuAD Top-1 79.79 → 82.38, KLUE Top-1 66.69 → 72.06입니다.

### 벡터 DB 선정 실험 (wiki 10만 passage)

<div class="table-wrap" markdown="1">

| 항목 | Qdrant | pgvector | pgvecto.rs |
|---|---|---|---|
| Top-10 (Dense) | **73.13** | 68.60 | 68.60 |
| 적재 시간 | **30s** | 56s | 33s |
| 디스크 | **597MB** | 786MB | 835MB |

</div>

정확도·속도 모두 앞선 Qdrant를 표준으로 정하고, PostgreSQL을 쓰는 고객사는 pgvector로 대응했습니다.

## 문제 해결

<div class="pj-fixes">
  <div class="pj-fix">
    <p class="pj-fix__q">동시 6명 이상 요청 시 Timeout(500)</p>
    <p class="pj-fix__why"><b>원인</b>요청 1건이 9개 도메인을 따로 검색해 스레드 63개 점유 (한도 61)</p>
    <p class="pj-fix__how"><b>해결</b>9개 도메인을 한 번의 검색 요청으로 묶어 처리</p>
    <span class="pj-fix__r">동시 50명<br>에러 0</span>
  </div>
  <div class="pj-fix">
    <p class="pj-fix__q">문서 많은 도메인에 점수가 묻힘</p>
    <p class="pj-fix__why"><b>원인</b>BM25 점수 분포가 도메인(문서셋)마다 달라 특정 도메인 점수가 현저히 낮음</p>
    <p class="pj-fix__how"><b>해결</b>도메인별 가중치(weight) · 최소 포함 수(required_size) 파라미터 추가</p>
    <span class="pj-fix__r">R@1<br>87.9 → 88.6</span>
  </div>
  <div class="pj-fix">
    <p class="pj-fix__q">BM25·BPR 단독 사용 요구</p>
    <p class="pj-fix__why"><b>원인</b>검색 동작이 hybrid + MRC 일체형으로 고정</p>
    <p class="pj-fix__how"><b>해결</b>후보 검색(PR) 3종 × 재정렬 3종, 9개 조합으로 분리</p>
    <span class="pj-fix__r">고객별<br>튜닝 가능</span>
  </div>
  <div class="pj-fix">
    <p class="pj-fix__q">Reranker 점수 0.1 이하 분별력 부족</p>
    <p class="pj-fix__why"><b>원인</b>범용 Reranker를 고객 도메인 데이터로 다시 학습할 도구가 없음</p>
    <p class="pj-fix__how"><b>해결</b>코드 없이 bge-reranker를 학습하는 Reranker-FT 앱 개발</p>
    <span class="pj-fix__r">v0.0.1<br>납품</span>
  </div>
  <div class="pj-fix">
    <p class="pj-fix__q">한쪽 검색 결과가 0건이면 응답 30초</p>
    <p class="pj-fix__why"><b>원인</b>병합 함수가 조기 반환하며 후보 1,000개를 그대로 MRC로 전달</p>
    <p class="pj-fix__how"><b>해결</b>요청한 개수만큼만 넘기도록 수정</p>
    <span class="pj-fix__r">30.6s<br>→ 0.26s</span>
  </div>
</div>

<p class="pj-note"><b>결론</b>고정 파이프라인을 조합 가능한 파라미터로 바꿔, 새 도메인·고객사를 코드 수정 없이 튜닝할 수 있는 검색 엔진으로 정착시켰습니다.</p>

## 확장 — Agentic Search · MCP

2025.05부터는 검색 엔진을 에이전트의 도구로 만들었습니다. LangGraph와 FastMCP로 사용자 질의 의도를 분석하고, 다중 도메인·파라미터를 스스로 고르는 검색 에이전트를 설계·구현했습니다.

<ol class="pj-flow">
  <li><strong>질의 분석 · 의도 파악</strong> — 검색 필요 여부와 의존성을 분석합니다. 즉답 가능한 질의는 검색 없이 바로 답변해 불필요한 검색 비용을 줄입니다.</li>
  <li><strong>검색 전략 수립</strong> — 다중 쿼리를 생성하고 실행 순서를 결정합니다.</li>
  <li><strong>병렬 수집</strong> — Send API로 수집 노드를 N개 동적으로 만들어 VAIVSearch MCP를 호출하고, 결과가 부족하면 노드가 스스로 재질의합니다.</li>
  <li><strong>Merge</strong> — 결과를 통합하고 중복 제거 후 다시 정렬합니다.</li>
  <li><strong>답변 생성</strong> — LLM이 출처와 추론 근거를 포함해 답변을 합성합니다.</li>
</ol>

- **MCP 도구화** — FastMCP `@mcp.tool`로 검색 · 날짜 계산 · Text2SQL 도구를 노출하고 `MultiServerMCPClient`로 통합
- **파라미터 자동 선택** — 수집 노드마다 도메인 · PR × Reranker · weight를 골라 호출. v2 조합형 API의 파라미터가 그대로 에이전트의 행동 공간이 됨
- **성과** — 외교부 · 공인중개사협회 등 **4곳 PoC 적용**, 폐쇄망 환경에서 오픈 모델(Qwen3 · gpt-oss)로 Agent 최적화
