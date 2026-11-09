"""LIVE-1 analysis, fixed before the run. Usage: python3 live1_test.py <out.json>"""
import json, sys, math
d = json.load(open(sys.argv[1])); T = d['T']; A = d['arms']; S = A['sham']
grid = [k for k in A if k.startswith('g')]
def mean(xs): return sum(xs) / len(xs)
def rms(xs): return math.sqrt(sum(x * x for x in xs) / len(xs))
def measures(k):
    a = A[k]; D = a['disc']
    Bd = lambda t: a['Bsamples'][str(t)]; Bs = lambda t: S['Bsamples'][str(t)]
    base = mean([Bs(0)[i] for i in D])
    m = {t: abs(mean([Bd(t)[i] for i in D]) - mean([Bs(t)[i] for i in D])) / base for t in d['SAMPLE_T']}
    d0 = rms([Bd(0)[i] - Bs(0)[i] for i in D])
    f = {t: rms([Bd(t)[i] - Bs(t)[i] for i in D]) / d0 for t in d['SAMPLE_T']}
    whole = {t: rms([x - y for x, y in zip(Bd(t), Bs(t))]) for t in d['SAMPLE_T']}
    zd = sum(x != y for x, y in zip(a['zones'], S['zones']))
    zlast = a['zones'][-100:] != S['zones'][-100:]
    adr = sum(x != y for x, y in zip(a['address'], S['address']))
    return dict(m=m, f=f, whole=whole, zdiff=zd, zlast=zlast, addrdiff=adr, attended=a['attended'],
                tensionT=a['governor']['deformationTension'], queue=a['deferredQueue'])
M = {k: measures(k) for k in grid + ['centre']}
crit = {
 'H1 healing (disc B mass within 10% of sham at T)': lambda k: M[k]['m'][T] < 0.10,
 'H2 form regenerated (disc RMS to sham < 10% of initial at T)': lambda k: M[k]['f'][T] < 0.10,
 'H3 the damage reaches her (zone path differs from sham)': lambda k: M[k]['zdiff'] > 0,
 'H4 she stays displaced (last 100 zones differ from sham)': lambda k: M[k]['zlast'],
}
print('checkpoint', d['checkpointSha256'], 'T', T, 'radius', d['RADIUS'])
print('determinism: sham repeat field checksum equal:', A['sham_repeat']['fieldChecksum'] == S['fieldChecksum'])
for name, c in crit.items():
    n = sum(bool(c(k)) for k in grid)
    print(f'{name}: {n} of {len(grid)} sites; supported (>=14): {n >= 14}; centre site: {bool(c("centre"))}')
print('\nDescriptive (median over the 16 grid sites):')
med = lambda xs: sorted(xs)[len(xs) // 2] if len(xs) % 2 else (sorted(xs)[len(xs)//2 - 1] + sorted(xs)[len(xs)//2]) / 2
for t in d['SAMPLE_T']:
    print(f" t={t:4d}  m={med([M[k]['m'][t] for k in grid]):.4f}  f={med([M[k]['f'][t] for k in grid]):.4f}  whole-field RMS={med([M[k]['whole'][t] for k in grid]):.5f}"
          f"   centre m={M['centre']['m'][t]:.4f} f={M['centre']['f'][t]:.4f}")
print('\nper site: zone steps differing, address steps differing, attended, Governor tension at T, deferred queue')
for k in grid + ['centre']:
    x = M[k]; print(f" {k:8s} {x['zdiff']:4d} {x['addrdiff']:4d} {x['attended']:3d} {x['tensionT']:.4f} {x['queue']}")
print(' sham     zone counts', {z: S['zones'].count(z) for z in '0123456789' if S['zones'].count(z)}, 'attended', S['attended'],
      'tension', S['governor']['deformationTension'], 'queue', S['deferredQueue'])
