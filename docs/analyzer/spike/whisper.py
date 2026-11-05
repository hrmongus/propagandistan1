import json,time,re,os,concurrent.futures as cf
from openai import OpenAI
c=OpenAI()
ts=json.load(open("testset.json"));an=json.load(open("analysis.json"))
GARBAGE=re.compile(r"(thank(s| you) for watching|subscribe|like and subscribe|amara\.org|subtitles by|transcribed by|♪|music\)|\[music\]|www\.|\.com)",re.I)
def instrumental(segs,text):
    if not segs or not text.strip(): return True,"empty"
    dur=sum(s["end"]-s["start"] for s in segs) or 1
    nsp=sum(s["no_speech_prob"]*(s["end"]-s["start"]) for s in segs)/dur
    lp=sum(s["avg_logprob"]*(s["end"]-s["start"]) for s in segs)/dur
    cr=max(s["compression_ratio"] for s in segs)
    words=re.findall(r"[\w']+",text);uniq=len(set(w.lower() for w in words))/max(1,len(words))
    if GARBAGE.search(text) and len(words)<15: return True,"garbage phrase"
    if nsp>0.6: return True,f"no_speech {nsp:.2f}"
    if lp<-1.0: return True,f"logprob {lp:.2f}"
    if len(words)>=8 and uniq<0.3: return True,f"repetition {uniq:.2f}"
    if len(words)<4: return True,"too few words"
    return False,f"nsp {nsp:.2f} lp {lp:.2f} cr {cr:.1f} uniq {uniq:.2f}"
def lyric_line(segs,h0,h1):
    best=max(segs,key=lambda s:max(0,min(s["end"],h1)-max(s["start"],h0)),default=None)
    if not best: return None
    w=best["text"].strip().split()
    if len(w)<4:  # extend with next segment
        i=segs.index(best);w+=(segs[i+1]["text"].split() if i+1<len(segs) else [])
    return " ".join(w[:12]) if len(w)>=4 else None
def run(t):
    f=f"mp3/{t['id']}.mp3"
    if not os.path.exists(f): return None
    a=an[t["id"]];out=dict(id=t["id"])
    t0=time.time();r=c.audio.transcriptions.create(model="whisper-1",file=open(f,"rb"),response_format="verbose_json",timestamp_granularities=["segment"]);out["t_w1"]=round(time.time()-t0,2)
    segs=[dict(start=s.start,end=s.end,text=s.text,no_speech_prob=s.no_speech_prob,avg_logprob=s.avg_logprob,compression_ratio=s.compression_ratio) for s in (r.segments or [])]
    out["w1_text"]=r.text;out["w1_lang"]=r.language;out["segs"]=segs
    out["instrumental"],out["why"]=instrumental(segs,r.text)
    out["lyric_line"]=None if out["instrumental"] else lyric_line(segs,a["hook_start"],a["hook_end"])
    t0=time.time()
    try: r2=c.audio.transcriptions.create(model="gpt-4o-mini-transcribe",file=open(f,"rb"),response_format="json");out["mini_text"]=r2.text
    except Exception as e: out["mini_text"]="ERR "+str(e)[:120]
    out["t_mini"]=round(time.time()-t0,2)
    return out
with cf.ThreadPoolExecutor(6) as ex: res=[x for x in ex.map(run,ts) if x]
json.dump(res,open("whisper.json","w"),indent=1,ensure_ascii=False)
tm={t["id"]:t for t in ts}
for r in res:
    t=tm[r["id"]];print(f"\n## {t['cat']} | {t['artist']} - {t['name']}  [{r['w1_lang']}, w1 {r['t_w1']}s, mini {r['t_mini']}s]  instrumental={r['instrumental']} ({r['why']})")
    print("  whisper-1:",r["w1_text"][:220].replace("\n"," "));print("  4o-mini  :",r["mini_text"][:220].replace("\n"," "));print("  LYRIC LINE:",r["lyric_line"])
