"""WARP-L1 analysis, fixed before the run. Usage: python3 -I warp_l1_test.py <out.json>"""
import json, sys, random
d = json.load(open(sys.argv[1])); I = d['INPUT']; S0 = d['sham']['zones']; W = d['windows']
def frac3(z): return z.count('3') / len(z)
def bouts(z):
    b, n = [], 0
    for c in z:
        if c == '3': n += 1
        elif n: b.append(n); n = 0
    if n: b.append(n)
    return sum(b) / len(b) if b else 0.0
def eff(z, part):  # |dwell fraction - sham's| over the input or the after period
    sl = slice(0, I) if part == 'in' else slice(I, None)
    return abs(frac3(z[sl]) - frac3(S0[sl]))
def signflip(x, n=100000, seed=20261110):
    r = random.Random(seed); obs = sum(x) / len(x); ge = 0
    for _ in range(n):
        if sum(v if r.random() < .5 else -v for v in x) / len(x) >= obs - 1e-15: ge += 1
    return (ge + 1) / (n + 1)
print('checkpoint', d['checkpointSha256'], 'stream', d['streamSha256'], 'sham repeat identical:', d['shamRepeat'])
leave = sum(1 for w in W for a in ('stream', 'swap', 'uniform') if set(w[a]['zones']) - set('36')) + (1 if set(S0) - set('36') else 0)
print('runs leaving the Warp {3,6}:', leave)
W1 = sum(w['stream']['zones'] != S0 for w in W)
W4 = sum(w['stream']['zones'][I:] != S0[I:] for w in W)
x2 = [eff(w['stream']['zones'], 'in') - eff(w['swap']['zones'], 'in') for w in W]
x3 = [eff(w['stream']['zones'], 'in') - eff(w['uniform']['zones'], 'in') for w in W]
p2, p3 = signflip(x2), signflip(x3)
print(f"W1 the Outside reaches her (stream path differs from sham): {W1} of {len(W)}; supported (>=9 of 10): {W1 >= 9}")
print(f"W2 Warp attention matters (|stream-sham| > |swap-sham|, input period): mean {sum(x2)/len(x2):+.4f}, positive {sum(v>0 for v in x2)} of {len(W)}, p={p2:.4f}; supported (p<0.01 and >=8 of 10 positive): {p2 < 0.01 and sum(v>0 for v in x2) >= 8}")
print(f"W3 the stream's form matters beyond uniform attention (|stream-sham| > |uniform-sham|): mean {sum(x3)/len(x3):+.4f}, positive {sum(v>0 for v in x3)} of {len(W)}, p={p3:.4f}; supported (p<0.01 and >=8 of 10 positive): {p3 < 0.01 and sum(v>0 for v in x3) >= 8}")
print(f"W4 she stays displaced after the Outside is withdrawn (steps {I+1}-{I+d['AFTER']} differ from sham): {W4} of {len(W)}; supported (>=9 of 10): {W4 >= 9}")
print('\nDescriptive: zone-3 dwell fraction (input / after) and mean bout at 3; admitted Outside encounters; queue at end of input and at end')
print(f" sham     {frac3(S0[:I]):.3f} / {frac3(S0[I:]):.3f}  bout {bouts(S0):.2f}")
for w in W:
    row = ' '.join(f"{a[:2]} {frac3(w[a]['zones'][:I]):.3f}/{frac3(w[a]['zones'][I:]):.3f} b{bouts(w[a]['zones']):.2f} adm{w[a]['admitted']:2d} q{w[a]['queueAtInput']}/{w[a]['queueAtEnd']}" for a in ('stream', 'swap', 'uniform'))
    print(f" w{w['window']:02d}  {row}")
