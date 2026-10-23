# syntax=docker/dockerfile:1
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN adduser --disabled-password --gecos "" --uid 10001 app && chown -R app:app /app
USER app

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8001/api/v1/health').status==200 else 1)"

ENTRYPOINT ["./entrypoint.sh"]
# One process per container: the in-memory rate limiter relies on it. Scale with more containers + Redis.
# Forwarded IP headers are handled by the app (ANALYTICS_TRUST_PROXY_HEADERS), not trusted blindly.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
