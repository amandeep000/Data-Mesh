# ─── Stage 1: Build ───────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir hatch

COPY apps/ingestion/pyproject.toml ./
RUN pip install --no-cache-dir --prefix=/install .

# ─── Stage 2: Runtime ─────────────────────────────────────────
FROM python:3.12-slim AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 ingestion \
  && adduser --system --uid 1001 --gid 1001 ingestion

COPY --from=builder /install /usr/local
COPY --chown=ingestion:ingestion apps/ingestion/src ./src

USER ingestion

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

CMD ["python", "-m", "src.main"]
