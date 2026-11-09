"""WARP-X1 analysis, fixed before the run. Usage: python3 -I warp_x1_test.py <out.json> <warp_l1_analysis.json>"""
import json, sys, random
d = json.load(open(sys.argv[1])); T = d['INPUT'] + d['AFTER']
WARP = set('36')
def first_exit(z):
    for i, c in enumerate(z):
        if c not in WARP: return i + 1
    return T + 1  # never left
def outside(z): return sum(c not in WARP for c in z) / len(z)
def returns(z):  # re-entries into the Warp after a first exit
    n, inw = 0, True
    for c in z:
        if inw and c not in WARP: inw = False
        elif not inw and c in WARP: n += 1; inw = True
    return n
def signflip(x, two_sided=False, n=100000, seed=20261111):
    r = random.Random(seed); obs = sum(x) / len(x); ge = 0
    for _ in range(n):
        m = sum(v if r.random() < .5 else -v for v in x) / len(x)
        if (abs(m) >= abs(obs) - 1e-15) if two_sided else (m >= obs - 1e-15): ge += 1
    return (ge + 1) / (n + 1)
E9, E1 = d['exit9'], d['exit1']
l1 = json.load(open(sys.argv[2]))
print('checkpoint', d['checkpointSha256'], 'stream', d['streamSha256'], 'rule', {k: round(v, 4) for k, v in d['RULE'].items()})
print('checks: exit-9 sham repeat identical:', E9['shamRepeat'], '| no-exit sham reproduces WARP-L1 sham:', d['noExitSham']['zones'] == l1['sham']['zones'],
      '| no-exit sham stays in Warp:', set(d['noExitSham']['zones']) <= WARP)
for name, E in (('exit to 9', E9), ('exit to 1', E1)):
    z = E['sham']['zones']; print(f" sham, {name}: first exit step {first_exit(z) if first_exit(z) <= T else 'never'}, outside fraction {outside(z):.3f}, returns {returns(z)}, zones visited {sorted(set(z))}")
W9 = E9['windows']; W1 = E1['windows']; s9 = first_exit(E9['sham']['zones'])
x1 = sum(first_exit(w['stream']['zones']) != s9 for w in W9)
print(f"X1 the Outside changes when she leaves (first exit differs from sham's): {x1} of {len(W9)}; supported (>=9 of 10): {x1 >= 9}")
x2 = [first_exit(w['swap']['zones']) - first_exit(w['stream']['zones']) for w in W9]
p2 = signflip(x2)
print(f"X2 attention on 9 draws her out (first exit earlier with stream than with 9<->0 swap): diffs {x2}; positive {sum(v>0 for v in x2)}; p={p2:.4f}; supported (p<0.01 and >=8 positive): {p2 < 0.01 and sum(v>0 for v in x2) >= 8}")
x3 = [outside(a['stream']['zones']) - outside(b['stream']['zones']) for a, b in zip(W9, W1)]
p3 = signflip(x3, two_sided=True); npos, nneg = sum(v > 0 for v in x3), sum(v < 0 for v in x3)
print(f"X3 leaving toward the Plex differs from leaving toward the Time-Circuit (outside fraction, exit-9 minus exit-1, stream): mean {sum(x3)/len(x3):+.4f}; +{npos}/-{nneg}; two-sided p={p3:.4f}; supported (p<0.01 and >=8 in one direction): {p3 < 0.01 and max(npos, nneg) >= 8}")
print('\nper window: first exit (stream / swap / exit-1 stream), outside fraction, returns, admitted, zones visited')
for a, b in zip(W9, W1):
    print(f" w{a['window']:02d}  {first_exit(a['stream']['zones']):4d} / {first_exit(a['swap']['zones']):4d} / {first_exit(b['stream']['zones']):4d}   "
          f"out {outside(a['stream']['zones']):.3f}/{outside(a['swap']['zones']):.3f}/{outside(b['stream']['zones']):.3f}   "
          f"ret {returns(a['stream']['zones'])}/{returns(a['swap']['zones'])}/{returns(b['stream']['zones'])}   adm {a['stream']['admitted']}/{a['swap']['admitted']}/{b['stream']['admitted']}   "
          f"{''.join(sorted(set(a['stream']['zones'])))} {''.join(sorted(set(b['stream']['zones'])))}")
