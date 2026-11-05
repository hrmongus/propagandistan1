import json,time,urllib.request,urllib.parse,re,unicodedata,os
def get(u):
    t=time.time();d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"fpk-spike"}),timeout=15));return d,time.time()-t
def norm(s): s=unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode().lower();return re.sub(r"[^a-z0-9]+"," ",re.sub(r"\(.*?\)|\[.*?\]| - .*","",s)).strip()
ts=json.load(open("testset.json"));res=[]
for t in ts:
    r=dict(id=t["id"],cat=t["cat"],artist=t["artist"],name=t["name"],isrc=t["isrc"])
    raw,_=get("https://api.deezer.com/track/isrc:"+t["isrc"]) if t["isrc"] else ({"error":1},0)
    r["isrc_raw_ok"]="error" not in raw
    d,dt=get("https://api.deezer.com/track/isrc:"+t["isrc"].upper()) if t["isrc"] else ({"error":1},0)
    r["t_isrc"]=round(dt,2)
    if "error" not in d: r["via"]="isrc"
    else:
        q=f'artist:"{t["artist"]}" track:"{t["name"]}"'
        s,dt=get("https://api.deezer.com/search?"+urllib.parse.urlencode({"q":q}));r["t_search"]=round(dt,2);d=None
        for c in s.get("data",[]):
            if norm(c["artist"]["name"])==norm(t["artist"]) and (norm(c["title"]) in norm(t["name"]) or norm(t["name"]) in norm(c["title"])):
                d,_=get(f"https://api.deezer.com/track/{c['id']}");r["via"]="search";break
        if d is None: r["via"]=None
    if r["via"]:
        r.update(deezer_id=d["id"],preview=d.get("preview"),duration=d.get("duration"),bpm=d.get("bpm"),dz_title=d["title"],dz_artist=d["artist"]["name"],dz_isrc=d.get("isrc"))
        if d.get("preview"):
            t0=time.time();b=urllib.request.urlopen(d["preview"],timeout=20).read();r["dl_s"]=round(time.time()-t0,2);r["bytes"]=len(b)
            open(f"mp3/{t['id']}.mp3","wb").write(b)
    res.append(r);print(f"{t['cat']:14} {str(r['via']):6} raw_isrc_ok={r['isrc_raw_ok']!s:5} bpm={r.get('bpm')} dur={r.get('duration')} prev={'Y' if r.get('preview') else 'N'} {r.get('bytes','')} | {t['artist'][:20]} - {t['name'][:30]}")
json.dump(res,open("deezer.json","w"),indent=1)
m=sum(1 for r in res if r["via"]);p=sum(1 for r in res if r.get("preview"))
print(f"\nmatched {m}/{len(res)} ({m/len(res):.0%}); with preview {p}/{len(res)}; via isrc {sum(r['via']=='isrc' for r in res)}, via search {sum(r['via']=='search' for r in res)}")
print("sample preview url:",next(r["preview"] for r in res if r.get("preview")))
