const HOURS_PER_MONTH = 730;
const DEFAULT_USD_INR = 83.5;

const DEFAULT_PRICING = {
  aws: {
    name: "AWS",
    perfScore: 95,
    stack: {
      media: "Amazon Chime SDK + Global Accelerator",
      compute: "EKS/ECS on c7g instances",
      postgres: "RDS PostgreSQL Multi-AZ",
      redis: "ElastiCache for Redis",
      object: "S3 Standard + lifecycle",
      monitoring: {
        native: "CloudWatch + X-Ray",
        datadog: "Datadog APM + logs",
        grafana: "Amazon Managed Grafana + Prometheus"
      }
    },
    rates: {
      mediaMinute: 0.0026,
      vcpuHour: 0.041,
      postgresStorageGbMonth: 0.115,
      postgresBase: 690,
      redisGbHour: 0.021,
      objectGbMonth: 0.024,
      egressGb: 0.083,
      monitoring: { native: 380, datadog: 2900, grafana: 1200 }
    }
  },
  azure: {
    name: "Azure",
    perfScore: 94,
    stack: {
      media: "Azure Communication Services",
      compute: "AKS on Dsv5-series",
      postgres: "Azure Database for PostgreSQL Flexible Server",
      redis: "Azure Cache for Redis",
      object: "Blob Hot tier + lifecycle",
      monitoring: {
        native: "Azure Monitor + App Insights",
        datadog: "Datadog for Azure",
        grafana: "Managed Grafana + Azure Monitor workspace"
      }
    },
    rates: {
      mediaMinute: 0.0029,
      vcpuHour: 0.043,
      postgresStorageGbMonth: 0.122,
      postgresBase: 720,
      redisGbHour: 0.023,
      objectGbMonth: 0.022,
      egressGb: 0.087,
      monitoring: { native: 420, datadog: 2950, grafana: 1250 }
    }
  },
  gcp: {
    name: "GCP",
    perfScore: 93,
    stack: {
      media: "WebRTC SFU on Compute + Cloud Load Balancing",
      compute: "GKE on C3/N2 mix",
      postgres: "Cloud SQL for PostgreSQL HA",
      redis: "Memorystore for Redis",
      object: "Cloud Storage Standard + lifecycle",
      monitoring: {
        native: "Cloud Monitoring + Trace",
        datadog: "Datadog on GCP",
        grafana: "Managed Service for Prometheus + Grafana"
      }
    },
    rates: {
      mediaMinute: 0.0024,
      vcpuHour: 0.039,
      postgresStorageGbMonth: 0.118,
      postgresBase: 700,
      redisGbHour: 0.0205,
      objectGbMonth: 0.021,
      egressGb: 0.079,
      monitoring: { native: 360, datadog: 2850, grafana: 1180 }
    }
  }
};

const PROVIDERS = ["aws", "azure", "gcp"];

const formatMoney = (value, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);

const clonePricing = () => JSON.parse(JSON.stringify(DEFAULT_PRICING));

function getInputs() {
  return {
    sessions: Number(document.getElementById("sessions").value) || 0,
    minutesPerSession: Number(document.getElementById("minutesPerSession").value) || 0,
    peakConcurrency: Number(document.getElementById("peakConcurrency").value) || 0,
    computeCores: Number(document.getElementById("computeCores").value) || 0,
    dbStorageGb: Number(document.getElementById("dbStorageGb").value) || 0,
    redisGb: Number(document.getElementById("redisGb").value) || 0,
    objectTb: Number(document.getElementById("objectTb").value) || 0,
    egressTb: Number(document.getElementById("egressTb").value) || 0,
    monitoringMode: document.getElementById("monitoringMode").value
  };
}

function assertLivePricingShape(data) {
  for (const provider of PROVIDERS) {
    const rates = data?.[provider]?.rates;
    if (!rates) {
      throw new Error(`Missing rates for ${provider}`);
    }

    const required = [
      "mediaMinute",
      "vcpuHour",
      "postgresStorageGbMonth",
      "postgresBase",
      "redisGbHour",
      "objectGbMonth",
      "egressGb"
    ];

    required.forEach((key) => {
      if (typeof rates[key] !== "number") {
        throw new Error(`Invalid or missing ${provider}.rates.${key}`);
      }
    });

    ["native", "datadog", "grafana"].forEach((mode) => {
      if (typeof rates.monitoring?.[mode] !== "number") {
        throw new Error(`Invalid or missing ${provider}.rates.monitoring.${mode}`);
      }
    });
  }
}

async function resolvePricing(useLivePricing, livePricingUrl) {
  if (!useLivePricing) {
    return {
      pricing: clonePricing(),
      label: "Using default in-app pricing constants."
    };
  }

  try {
    const response = await fetch(livePricingUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    assertLivePricingShape(payload);

    const merged = clonePricing();
    PROVIDERS.forEach((provider) => {
      merged[provider].rates = {
        ...merged[provider].rates,
        ...payload[provider].rates,
        monitoring: {
          ...merged[provider].rates.monitoring,
          ...payload[provider].rates.monitoring
        }
      };
      merged[provider].perfScore = payload[provider].perfScore || merged[provider].perfScore;
      merged[provider].name = payload[provider].name || merged[provider].name;
      merged[provider].stack = {
        ...merged[provider].stack,
        ...payload[provider].stack,
        monitoring: {
          ...merged[provider].stack.monitoring,
          ...payload[provider].stack?.monitoring
        }
      };
    });

    return {
      pricing: merged,
      label: `Live pricing loaded from ${livePricingUrl}.`
    };
  } catch (error) {
    return {
      pricing: clonePricing(),
      label: `Live pricing unavailable (${error.message}). Using default constants.`
    };
  }
}

function estimateProviderCost(provider, inputs) {
  const { rates } = provider;
  const monthlyMinutes = inputs.sessions * inputs.minutesPerSession;
  const objectGb = inputs.objectTb * 1024;
  const egressGb = inputs.egressTb * 1024;

  const mediaCost = monthlyMinutes * rates.mediaMinute;
  const computeCost =
    (inputs.computeCores + Math.max(0, inputs.peakConcurrency - 150) * 0.02) *
    rates.vcpuHour *
    HOURS_PER_MONTH;
  const postgresCost = rates.postgresBase + inputs.dbStorageGb * rates.postgresStorageGbMonth;
  const redisCost = inputs.redisGb * rates.redisGbHour * HOURS_PER_MONTH;
  const objectCost = objectGb * rates.objectGbMonth;
  const egressCost = egressGb * rates.egressGb;
  const monitoringCost = rates.monitoring[inputs.monitoringMode];

  const totalUsd =
    mediaCost + computeCost + postgresCost + redisCost + objectCost + egressCost + monitoringCost;

  return {
    totalUsd,
    breakdown: {
      mediaCost,
      computeCost,
      postgresCost,
      redisCost,
      objectCost,
      egressCost,
      monitoringCost
    }
  };
}

function recommendationText(results) {
  const bestCost = results.reduce((acc, item) => (item.totalUsd < acc.totalUsd ? item : acc));
  const bestBlend = results.reduce(
    (acc, item) => {
      const score = (item.perfScore / 100) * 0.45 + (bestCost.totalUsd / item.totalUsd) * 0.55;
      return score > acc.score ? { item, score } : acc;
    },
    { item: results[0], score: 0 }
  );

  return `Lowest estimated cost: ${bestCost.name}. Best cost-performance blend: ${bestBlend.item.name}.`;
}

function render(results, usdInr, fxLabel, pricingLabel) {
  const cards = document.getElementById("resultCards");
  cards.innerHTML = "";

  results
    .sort((a, b) => a.totalUsd - b.totalUsd)
    .forEach((result) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <h3>${result.name} (Perf ${result.perfScore}/100)</h3>
        <div class="total">${formatMoney(result.totalUsd, "USD")}</div>
        <div class="sub">${formatMoney(result.totalUsd * usdInr, "INR")}/month</div>
        <ul class="metrics">
          <li>Real-time media: ${result.stack.media}</li>
          <li>Compute: ${result.stack.compute}</li>
          <li>PostgreSQL: ${result.stack.postgres}</li>
          <li>Redis/cache: ${result.stack.redis}</li>
          <li>Object storage: ${result.stack.object}</li>
          <li>Monitoring: ${result.stack.monitoring[result.monitoringMode]}</li>
        </ul>
      `;
      cards.appendChild(card);
    });

  document.getElementById("recommendation").textContent = recommendationText(results);
  document.getElementById("fxMeta").textContent = fxLabel;
  document.getElementById("pricingMeta").textContent = pricingLabel;
}

async function resolveFxRate(useLive) {
  if (!useLive) {
    return {
      rate: DEFAULT_USD_INR,
      label: `Using fallback FX rate: 1 USD = ${DEFAULT_USD_INR} INR.`
    };
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const inr = data?.rates?.INR;
    if (!inr || Number.isNaN(Number(inr))) throw new Error("Invalid INR rate");

    return {
      rate: Number(inr),
      label: `Live FX loaded (${new Date().toLocaleString()}): 1 USD = ${Number(inr).toFixed(2)} INR.`
    };
  } catch (_error) {
    return {
      rate: DEFAULT_USD_INR,
      label: `Live FX unavailable. Falling back to 1 USD = ${DEFAULT_USD_INR} INR.`
    };
  }
}

async function recalculate() {
  const inputs = getInputs();
  const useLiveFx = document.getElementById("liveFx").checked;
  const useLivePricing = document.getElementById("useLivePricing").checked;
  const livePricingUrl = document.getElementById("livePricingUrl").value.trim();

  const [fx, pricingData] = await Promise.all([
    resolveFxRate(useLiveFx),
    resolvePricing(useLivePricing, livePricingUrl)
  ]);

  const results = Object.values(pricingData.pricing).map((provider) => {
    const estimate = estimateProviderCost(provider, inputs);
    return {
      name: provider.name,
      perfScore: provider.perfScore,
      stack: provider.stack,
      monitoringMode: inputs.monitoringMode,
      ...estimate
    };
  });

  render(results, fx.rate, fx.label, pricingData.label);
}

document.getElementById("calculateBtn").addEventListener("click", recalculate);
recalculate();
