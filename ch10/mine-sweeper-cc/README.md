# 지뢰 찾기 (Minesweeper)

React 19 + TypeScript + Vite로 만든 지뢰 찾기 게임. Tauri로 데스크톱 앱도 빌드할 수 있다.

## 기능

- 난이도 3단계: 하(9x9, 지뢰 10) / 중(16x16, 지뢰 40) / 상(16x30, 지뢰 99)
- 첫 클릭은 항상 안전 (지뢰가 피해서 배치됨)
- 점수 계산: `기본점수(난이도) - 경과시간 × 난이도별 페널티`, 최소 100점
- 브라우저 localStorage에 최고 점수 Top 5 저장

## 실행

```bash
npm install
npm run dev        # 웹 개발 서버
npm run build       # 웹 프로덕션 빌드
```

## 데스크톱 앱 (Tauri)

Rust 툴체인이 필요하다 (https://rustup.rs 에서 설치).

```bash
npm run tauri dev    # 데스크톱 앱 개발 실행
npm run tauri build  # 데스크톱 앱 빌드
```
