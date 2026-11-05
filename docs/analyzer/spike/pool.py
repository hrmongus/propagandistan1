import json,os,re,time,random,base64,urllib.request,urllib.parse,concurrent.futures as cf
def tok():
    r=urllib.request.Request("https://accounts.spotify.com/api/token",data=b"grant_type=client_credentials",headers={"Authorization":"Basic "+base64.b64encode(f"{os.environ['SPOTIFY_CLIENT_ID']}:{os.environ['SPOTIFY_CLIENT_SECRET']}".encode()).decode()})
    return json.load(urllib.request.urlopen(r))["access_token"]
AT=tok()
def sp(path,**q):
    u="https://api.spotify.com/v1/"+path+"?"+urllib.parse.urlencode(q)
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"Authorization":"Bearer "+AT})))
cats={"rap/trap":["trap year:2025-2026","rap year:2025-2026","drill year:2025-2026"],
"acoustic/folk":["acoustic year:2025-2026","folk year:2025-2026","singer songwriter year:2025-2026"],
"instrumental":["instrumental year:2025-2026","lofi beat year:2025-2026","ambient piano year:2025-2026"],
"non-English":["español year:2025-2026","deutschrap year:2025-2026","chanson year:2025-2026","k-indie year:2025-2026","sertanejo year:2025-2026"],
"indie/pop":["indie pop year:2025-2026","bedroom pop year:2025-2026","alt rock year:2025-2026","rnb year:2025-2026","hyperpop year:2025-2026","emo year:2025-2026"]}
pool=[]
for cat,qs in cats.items():
    for q in qs:
        for off in (200,400,600,800):
            try: d=sp("search",q=q,type="track",limit=10,offset=off)
            except Exception as e: print("err",q,off,e); continue
            for t in d["tracks"]["items"]:
                pool.append(dict(cat=cat,q=q,id=t["id"],name=t["name"],artist=t["artists"][0]["name"],artist_id=t["artists"][0]["id"],isrc=(t.get("external_ids")or{}).get("isrc"),release=t["album"]["release_date"]))
# new releases: album search tag:new
for q in ["tag:new rap","tag:new indie","tag:new acoustic","tag:new pop","tag:new trap"]:
    for off in (100,300,500):
        try: d=sp("search",q=q,type="album",limit=10,offset=off)
        except Exception as e: print("err",q,e); continue
        for a in d["albums"]["items"]:
            pool.append(dict(cat="new",q=q,album_id=a["id"],name=a["name"],artist=a["artists"][0]["name"],artist_id=a["artists"][0]["id"],release=a["release_date"]))
arts={p["artist_id"] for p in pool}
print(len(pool),"tracks",len(arts),"artists")
def ml(aid):
    try:
        h=urllib.request.urlopen(urllib.request.Request("https://open.spotify.com/artist/"+aid,headers={"User-Agent":"Mozilla/5.0"}),timeout=15).read().decode("utf8","ignore")
        m=re.search(r'Artist · ([0-9.,]+)([KM]?) monthly listeners',h)
        if not m: return None
        n=float(m.group(1).replace(",",""));return int(n*{"":1,"K":1e3,"M":1e6}[m.group(2)])
    except Exception as e: return None
with cf.ThreadPoolExecutor(8) as ex: mls=dict(zip(arts,ex.map(ml,arts)))
for p in pool: p["ml"]=mls[p["artist_id"]]
json.dump(pool,open("pool.json","w"))
import collections
for c in collections.Counter(p["cat"] for p in pool if p["ml"] is not None and 200<=p["ml"]<=5000).items(): print(c)
print("ml unknown:",sum(v is None for v in mls.values()))
