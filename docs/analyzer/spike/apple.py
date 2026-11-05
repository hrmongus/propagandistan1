import json,time,urllib.request,urllib.parse,re,unicodedata
import urllib.error
def get(u,tries=4):
    time.sleep(3.5)
    for i in range(tries):
        try: return _get(u)
        except urllib.error.HTTPError as e:
            if e.code!=403 or i==tries-1: raise
            print("  403, backing off 60s",flush=True);time.sleep(60)
def _get(u):
    t=time.time();d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"fpk-spike"}),timeout=15));return d,time.time()-t
def norm(s): s=unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode().lower();return re.sub(r"[^a-z0-9]+"," ",re.sub(r"\(.*?\)|\[.*?\]| - .*","",s)).strip()
ts=json.load(open("testset.json"));dz={r["id"]:r for r in json.load(open("deezer.json"))};res=[]
d,_=get("https://itunes.apple.com/lookup?isrc="+ts[0]["isrc"]);print("isrc lookup test:",d.get("resultCount"),d.get("errorMessage"))
for t in ts:
    r=dict(id=t["id"],cat=t["cat"],artist=t["artist"],name=t["name"])
    hit=None
    for country in ("US","DE"):
        s,dt=get("https://itunes.apple.com/search?"+urllib.parse.urlencode({"term":f'{t["artist"]} {re.sub(r" - .*","",t["name"])}',"entity":"song","limit":25,"country":country}))
        for c in s.get("results",[]):
            if norm(c.get("artistName",""))==norm(t["artist"]) and (norm(c["trackName"]) in norm(t["name"]) or norm(t["name"]) in norm(c["trackName"])):
                hit=c;r["country"]=country;break
        if hit: break
    r["t"]=round(dt,2)
    if hit:
        r.update(apple_id=hit["trackId"],preview=hit.get("previewUrl"),dur_ms=hit.get("trackTimeMillis"))
        if r["preview"]:
            b=urllib.request.urlopen(r["preview"],timeout=20).read();r["bytes"]=len(b);open(f"mp3/apple_{t['id']}.m4a","wb").write(b)
    r["deezer"]=bool(dz[t["id"]].get("preview"))
    res.append(r);print(flush=True);print(f"{t['cat']:14} apple={'Y' if r.get('preview') else 'N'} deezer={'Y' if r['deezer'] else 'N'} {r.get('country','')} {r['t']}s | {t['artist'][:20]} - {t['name'][:30]}")
json.dump(res,open("apple.json","w"),indent=1)
a=sum(bool(r.get("preview")) for r in res);d=sum(r["deezer"] for r in res);both=sum(bool(r.get("preview")) or r["deezer"] for r in res)
print(f"\napple {a}/28 ({a/28:.0%}) deezer {d}/28 ({d/28:.0%}) either {both}/28 ({both/28:.0%})")
print("sample:",next(r["preview"] for r in res if r.get("preview")))
