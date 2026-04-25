# Voice Agent Infra Cost Estimator (AWS vs Azure vs GCP)

A lightweight web app to compare monthly infrastructure cost for a premium voice-agent SaaS stack.

## Features

- Compare **AWS / Azure / GCP** monthly cost side-by-side.
- Show totals in **USD and INR**.
- Includes stack suggestions for:
  - real-time media
  - compute
  - PostgreSQL
  - Redis/cache
  - object storage
  - monitoring (native / Datadog / Grafana)
- Recommends the most cost-effective provider while maintaining strong performance scoring.
- Optional live USD→INR rate fetch.

## Run locally

```bash
cd cloud-stack-estimator
python3 -m http.server 8080
```

Open <http://localhost:8080>.

## Notes

- This tool is planning-grade, not a billing quote.
- Final costs depend on region, committed use discounts, data transfer profile, and AI provider usage (STT/TTS/LLM).
- Tune constants in `app.js` to match negotiated contracts and real production metrics.
