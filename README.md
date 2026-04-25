# CloudCost – Voice Agent Infra Cost Estimator

This repo contains a lightweight static web app to compare estimated monthly infrastructure costs across **AWS**, **Azure**, and **GCP** for a premium voice-agent SaaS stack.

## Quick start (local)

```bash
git clone https://github.com/piyushtamaskar21/cloudcost.git
cd cloudcost/cloud-stack-estimator
python3 -m http.server 8080
```

Then open: <http://localhost:8080>

## Project layout

- `cloud-stack-estimator/index.html` – UI and inputs
- `cloud-stack-estimator/styles.css` – app styling
- `cloud-stack-estimator/app.js` – pricing constants + estimator logic

## Notes

- This is planning-grade and not a billing quote.
- Update constants in `cloud-stack-estimator/app.js` for your region/discount profile.
