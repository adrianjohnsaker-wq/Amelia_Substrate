import json, numpy as np, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
plt.rcParams.update({"font.family":"DejaVu Sans","font.size":8.5})
R=[json.loads(l) for l in open("raw_records.jsonl")]
a=json.load(open("analysis.json"))
fig,ax=plt.subplots(1,2,figsize=(7.4,3.0))
x=[r for r in R if r["phase"]=="R-XLI"]; cs=sorted(set(r["c"] for r in x))
for key,col,lab in [("composite","#2b5c8a","composite"),("hingeOccupancy","#4f8a3b","hinge occupancy")]:
    m=[np.mean([r[key] for r in x if r["c"]==c]) for c in cs]; s=[np.std([r[key] for r in x if r["c"]==c],ddof=1) for c in cs]
    ax[0].errorbar(cs,m,yerr=s,fmt="o-",ms=3,lw=1,capsize=2,color=col,label=lab)
y=[r for r in R if r["phase"]=="R-XLI-R" and r["condition"]!="P9"]
cy=sorted(set(r["c"] for r in y))
ax[0].plot(cy,[np.mean([r["composite"] for r in y if r["c"]==c]) for c in cy],"s",ms=4,mfc="none",color="#b5562c",label="R-XLI-R composite")
ax[0].axvline(a["R-XLI"]["knee"]["c"],ls="--",color="#777",lw=0.8)
ax[0].text(a["R-XLI"]["knee"]["c"]+0.002,0.26,"knee rule\noutput",fontsize=7,color="#555")
ax[0].set_xlabel("manipulated-arc coefficient c"); ax[0].set_ylabel("mean ± SD (20 seeds)"); ax[0].set_ylim(0.24,0.48)
ax[0].legend(fontsize=6.8,frameon=False,loc="lower right"); ax[0].set_title("(a) R-XLI sweep and R-XLI-R resample",loc="left",fontsize=8.5)
conds=["low","knee","high","untargeted control"]; bc=a["R-XL"]["byCondition"]
cols={"hinge-stratum":"#4f8a3b","bifurcation-dissolution":"#b5562c","metabolic-integration":"#8a6a2b"}
bottom=np.zeros(4)
for reg,col in cols.items():
    v=np.array([bc[c]["regions"][reg] for c in conds]); ax[1].bar(range(4),v,bottom=bottom,color=col,label=reg,width=0.6); bottom+=v
ax[1].set_xticks(range(4)); ax[1].set_xticklabels(["low\nc=0.0015","knee\nc=0.0718","high\nc=0.1512","untargeted\nc=0.0718"],fontsize=7)
ax[1].set_ylabel("runs (of 20)"); ax[1].legend(fontsize=6.5,frameon=False,loc="upper center",bbox_to_anchor=(0.5,-0.22),ncol=3); ax[1].set_ylim(0,20)
ax[1].set_title("(b) R-XL region assignments",loc="left",fontsize=8.5)
plt.tight_layout(); plt.savefig("/home/claude/rev/fig3_replication.png",dpi=300,bbox_inches="tight")
