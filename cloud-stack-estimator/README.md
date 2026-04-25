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
- Optional live pricing JSON fetch with fallback to in-app constants.

## Run locally

```bash
cd cloud-stack-estimator
python3 -m http.server 8080
```

Open <http://localhost:8080>.

## Live pricing mode (with caveat)

- Enable **Use live pricing JSON** in the app.
- Provide a URL that returns JSON schema compatible with `live-pricing.example.json`.
- CORS must allow browser requests from your app origin.
- If fetch/schema fails, app automatically falls back to in-app pricing constants.

## Notes

- This tool is planning-grade, not a billing quote.
- Final costs depend on region, committed use discounts, data transfer profile, and AI provider usage (STT/TTS/LLM).
- Tune constants in `app.js` to match negotiated contracts and real production metrics.
