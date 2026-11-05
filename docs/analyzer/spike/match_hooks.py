import json,time,math,concurrent.futures as cf
from openai import OpenAI
AES=json.load(open("aesthetics.json"))
def energy(rms_db): return max(0,min(100,round((rms_db+24)/17*100)))
def dist(x,lo,hi,soft): return 0 if lo<=x<=hi else min(abs(x-lo),abs(x-hi))/soft
def match(e,bpm,mode):
    out=[]
    for a in AES:
        # tempo: also accept half/double time (trap is often read at half speed)
        def cd(x,lo,hi): c=(lo+hi)/2; return abs(x-c)/((hi-lo)/2)  # 0 at center, 1 at edge
        dt=min(cd(b,*a["tempo"]) for b in (bpm,bpm*2,bpm/2))+(0.15 if min((abs(b-bpm),b) for b in (bpm,bpm*2,bpm/2))[0] else 0)
        de=cd(e,*a["energy"])
        dm=0 if a["mode"]==mode else (0.35 if a["mode"]=="any" else 0.8)
        s=math.exp(-(0.5*de**2+0.35*dt**2+dm**2))
        out.append((a["name"],a["pack"],s))
    top=max(s for *_,s in out)
    # rescale: top lands 80–94 depending on how clean the fit is, rest scale relative
    topPct=80+14*top
    return sorted([(n,p,round(topPct*s/top)) for n,p,s in out],key=lambda x:-x[2])
c=OpenAI()
SCHEMA={"type":"object","additionalProperties":False,"required":["hooks"],"properties":{"hooks":{"type":"array","minItems":3,"maxItems":3,"items":{"type":"string"}}}}
def hooks(ctx):
    sys_p=("You write on-screen text hooks for TikTok/Reels fan-page edits of a song. Return exactly 3 hooks. Rules: all lowercase; at most 10 words each; "
           "POV or scenario style that makes a viewer stop scrolling (e.g. 'pov: 2am, empty highway, this comes on'); match the song's mood and the aesthetic; "
           "speak to the target audience and listening moment; no hashtags, no emojis, no artist or song names, never name the aesthetic itself (show it through concrete images, places, outfits, objects), avoid cliches like 'when the beat drops' or 'hits different', no slurs.")
    t=time.time()
    r=c.chat.completions.create(model="gpt-4.1-mini",temperature=0.9,messages=[{"role":"system","content":sys_p},{"role":"user","content":json.dumps(ctx)}],
        response_format={"type":"json_schema","json_schema":{"name":"hooks","strict":True,"schema":SCHEMA}})
    d=json.loads(r.choices[0].message.content);u=r.usage
    return d["hooks"],round(time.time()-t,2),u.prompt_tokens,u.completion_tokens
if __name__=="__main__":
    an=json.load(open("analysis.json"));ts=json.load(open("testset.json"))
    rows=[]
    for t in ts:
        a=an.get(t["id"])
        if not a: continue
        e=energy(a["rms_db"]);m=match(e,a["bpm"],a["mode"])
        rows.append((t,a,e,m))
        print(f"{t['cat'][:13]:13} E{e:3} {a['bpm']:6} {a['mode']:5} | "+" · ".join(f"{n} {p}%" for n,_,p in m[:3])+f"  …last: {m[-1][0]} {m[-1][2]}%  | {t['name'][:26]}")
    # hooks: one set per top-3 aesthetic, sample audience
    aud=[dict(age="18-24",gender="mostly female",region="US",moment="late night drive"),dict(age="16-20",gender="mixed",region="UK",moment="getting ready to go out"),dict(age="25-34",gender="mostly male",region="Germany",moment="gym")]
    jobs=[]
    for i,(t,a,e,m) in enumerate(rows):
        for n,p,_ in m[:3]:
            jobs.append((t,n,dict(mood=a["mood"],bpm=a["bpm"],energy=e,aesthetic=n,**aud[i%3])))
    with cf.ThreadPoolExecutor(8) as ex: out=list(ex.map(lambda j:(j,hooks(j[2])),jobs))
    lat=sorted(o[1][1] for o in out);pi=sum(o[1][2] for o in out);po=sum(o[1][3] for o in out)
    json.dump([dict(track=j[0]["id"],aesthetic=j[1],ctx=j[2],hooks=h[0],s=h[1]) for j,h in out],open("hooks.json","w"),indent=1)
    import statistics;print(f"\n{len(out)} calls, all valid JSON; latency p50 {statistics.median(lat)}s max {lat[-1]}s; avg tokens in {pi/len(out):.0f} out {po/len(out):.0f}")
    over=[x for j,h in out for x in h[0] if len(x.split())>10 or x!=x.lower()];print("rule violations (>10 words or not lowercase):",over)
    for j,h in out[:30:3]: print(f"  [{j[1]} / {j[2]['mood']} / {j[2]['moment']}]  "+"  |  ".join(h[0]))
