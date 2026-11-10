"""R-series analysis. Applies the sealed protocol rules to raw_records.jsonl."""
import json, hashlib, sys
import numpy as np
from scipy import stats

base = sys.argv[1] if len(sys.argv) > 1 else "."
raw = open(f"{base}/raw_records.jsonl", "rb").read()
assert hashlib.sha256(raw).hexdigest() == open(f"{base}/raw_records.sha256").read().split()[0]
R = [json.loads(l) for l in raw.decode().splitlines() if l.strip()]
M = ["fieldConfidence", "hingeOccupancy", "morphogeneticTransitionScore", "recaptureScore", "boundaryMargin", "composite"]
out = {}

def summ(rows):
    d = {"n": len(rows), "hingeRate": sum(r["region"] == "hinge-stratum" for r in rows) / len(rows),
         "recaptureEvents": sum(r["region"] == "bifurcation-dissolution" for r in rows),
         "regions": {k: sum(r["region"] == k for r in rows) for k in ["hinge-stratum", "bifurcation-dissolution", "metabolic-integration"]},
         "gamma": {k: sum(r["gammaTrajectory"] == k for r in rows) for k in ["directional", "stabilized", "oscillatory"]}}
    for m in M:
        v = np.array([r[m] for r in rows]); d[m] = {"mean": float(v.mean()), "sd": float(v.std(ddof=1))}
    return d

def phase(p): return [r for r in R if r["phase"] == p]

# R-XXXIX
x = phase("R-XXXIX")
out["R-XXXIX"] = {"overall": summ(x), "byCondition": {c: summ([r for r in x if r["condition"] == c]) for c in dict.fromkeys(r["condition"] for r in x)}}

# R-XL
x = phase("R-XL")
by = {c: [r for r in x if r["condition"] == c] for c in ["low", "knee", "high", "untargeted control"]}
sens = [r for r in x if r["condition"] in ("low", "knee", "high")]
rho, p = stats.spearmanr([r["c"] for r in sens], [r["hingeOccupancy"] for r in sens])
k, u = by["knee"], by["untargeted control"]
tab = [[sum(r["region"] == "hinge-stratum" for r in k), len(k) - sum(r["region"] == "hinge-stratum" for r in k)],
       [sum(r["region"] == "hinge-stratum" for r in u), len(u) - sum(r["region"] == "hinge-stratum" for r in u)]]
_, pf = stats.fisher_exact(tab, alternative="greater")
out["R-XL"] = {"byCondition": {c: summ(v) for c, v in by.items()},
               "coefficientSensitivity": {"spearmanRho": float(rho), "p": float(p), "passed": bool(rho > 0 and p < 0.05)},
               "nonCircularity": {"kneeHinge": tab[0][0], "untargetedHinge": tab[1][0], "fisherP_oneSided": float(pf),
                                  "passed": bool(tab[0][0] / 20 > tab[1][0] / 20 and pf < 0.05)}}

# R-XLI
x = phase("R-XLI")
cs = sorted(set(r["c"] for r in x))
curve = [{"c": c, **summ([r for r in x if r["c"] == c])} for c in cs]
mc = np.array([pt["composite"]["mean"] for pt in curve])
second = np.abs(mc[2:] - 2 * mc[1:-1] + mc[:-2])
knee_i = int(np.argmax(second)) + 1
out["R-XLI"] = {"curve": curve, "knee": {"c": cs[knee_i], "index": knee_i}}

# R-XLI-R
x = phase("R-XLI-R")
names = [f"P{i}" for i in range(1, 10)]
pts = {n: [r for r in x if r["condition"] == n] for n in names}
s_rows = {n: summ(v) | {"c": v[0]["c"]} for n, v in pts.items()}
order = names[:8]  # P1-P8 in coefficient order
means = [s_rows[n]["composite"]["mean"] for n in order]
cvals = [s_rows[n]["c"] for n in order]
rng = np.random.default_rng(20261110)
plateaus = []
for i in range(len(order)):
    for j in range(i + 3, len(order)):
        seg = means[i:j + 1]
        if max(seg) - min(seg) <= 0.005:
            runs = [r for n in order[i:j + 1] for r in pts[n]]
            cc = np.array([r["c"] for r in runs]); yy = np.array([r["composite"] for r in runs])
            boots = []
            for _ in range(2000):
                idx = rng.integers(0, len(runs), len(runs))
                boots.append(np.polyfit(cc[idx], yy[idx], 1)[0])
            lo, hi = np.percentile(boots, [2.5, 97.5])
            if lo <= 0 <= hi:
                plateaus.append({"from": order[i], "to": order[j], "span": float(max(seg) - min(seg)), "slopeCI": [float(lo), float(hi)], "length": j - i + 1})
best = max(plateaus, key=lambda p: (p["length"], -p["span"])) if plateaus else None
cal = [r for r in x if r["replicate"] <= 10]
val = [r for r in x if r["replicate"] > 10]
thr = {m: float(np.percentile([r[m] for r in cal], 5)) for m in ["fieldConfidence", "hingeOccupancy", "morphogeneticTransitionScore", "boundaryMargin"]}
thr["recaptureScore"] = float(np.percentile([r["recaptureScore"] for r in cal], 95))
def meets(r): return (all(r[m] >= thr[m] for m in ["fieldConfidence", "hingeOccupancy", "morphogeneticTransitionScore", "boundaryMargin"]) and r["recaptureScore"] <= thr["recaptureScore"])
out["R-XLI-R"] = {"points": s_rows, "plateauDetected": best is not None, "plateau": best, "allPlateaus": plateaus,
                  "thresholds": thr, "calibrationPass": sum(map(meets, cal)) / len(cal), "validationPass": sum(map(meets, val)) / len(val),
                  "validationN": len(val), "validationHingeRate": sum(r["region"] == "hinge-stratum" for r in val) / len(val)}
json.dump(out, open(f"{base}/analysis.json", "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "R-XLI"}, indent=1)[:6000])
print("XLI knee", out["R-XLI"]["knee"]); print([(round(p["c"],4), round(p["composite"]["mean"],4), p["hingeRate"]) for p in curve])
