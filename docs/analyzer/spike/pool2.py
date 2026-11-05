import json,re,urllib.request,concurrent.futures as cf
exec(open('pool.py').read().split("cats=")[0])
def ml(aid):
    try:
        h=urllib.request.urlopen(urllib.request.Request("https://open.spotify.com/artist/"+aid,headers={"User-Agent":"Mozilla/5.0"}),timeout=15).read().decode("utf8","ignore")
        m=re.search(r'Artist · ([0-9.,]+)([KM]?) monthly',h);n=float(m.group(1).replace(",",""));return int(n*{"":1,"K":1e3,"M":1e6}[m.group(2)])
    except Exception: return None
cats={"rap/trap":["trap","rap","drill"],"acoustic/folk":["acoustic","folk"],"instrumental":["instrumental","lofi"],"non-English":["español","deutsch","français","italiano"],"indie/pop":["indie","pop","rnb"],"new":[""]}
albs=[]
for cat,ws in cats.items():
    for w in ws:
        q=("tag:new " if cat=="new" else "tag:hipster ")+w+("" if cat=="new" else " year:2024-2026")
        for off in (0,10,20):
            try: d=sp("search",q=q.strip(),type="album",limit=10,offset=off)
            except Exception as e: print("err",q,e);continue
            for a in d["albums"]["items"]: albs.append(dict(cat=cat,q=q,album_id=a["id"],album=a["name"],artist=a["artists"][0]["name"],artist_id=a["artists"][0]["id"],release=a["release_date"]))
print(len(albs))
with cf.ThreadPoolExecutor(8) as ex: m=dict(zip({a["artist_id"] for a in albs},ex.map(ml,{a["artist_id"] for a in albs})))
for a in albs: a["ml"]=m[a["artist_id"]]
json.dump(albs,open("albs.json","w"))
import collections
print(collections.Counter(a["cat"] for a in albs if a["ml"] and 300<=a["ml"]<=5000))
