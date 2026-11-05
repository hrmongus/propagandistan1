import json,random
exec(open('pool.py').read().split("cats=")[0])
random.seed(7)
albs=json.load(open("albs.json"));pool=json.load(open("pool.json"))
want={"rap/trap":5,"acoustic/folk":4,"instrumental":4,"non-English":5,"indie/pop":4}
out=[];seen=set()
def add_album(a,cat):
    tr=sp(f"albums/{a['album_id']}/tracks",limit=10)["items"]
    if not tr: return False
    t=sp("tracks/"+tr[0]["id"])
    out.append(dict(cat=cat,id=t["id"],name=t["name"],artist=t["artists"][0]["name"],artist_id=t["artists"][0]["id"],isrc=(t.get("external_ids")or{}).get("isrc"),release=t["album"]["release_date"],ml=a["ml"],duration_ms=t["duration_ms"],artwork=(t["album"]["images"] or [{}])[0].get("url"),source="pool"))
    seen.add(a["artist_id"]);return True
for t in ["4hWnpdm0As7Ruegjv2XD6W","05ne02VCMleIvY0SzuPR9E","08tsKE0fl1yaSTUPCfHxl4"]:
    d=sp("tracks/"+t);out.append(dict(cat="owner-pick",id=t,name=d["name"],artist=d["artists"][0]["name"],artist_id=d["artists"][0]["id"],isrc=d["external_ids"].get("isrc"),release=d["album"]["release_date"],ml=None,duration_ms=d["duration_ms"],artwork=d["album"]["images"][0]["url"],source="owner"));seen.add(d["artists"][0]["id"])
for cat,n in want.items():
    c=[a for a in albs if a["cat"]==cat and a["ml"] and 300<=a["ml"]<=5000];random.shuffle(c);k=0
    for a in c:
        if k==n: break
        if a["artist_id"] in seen: continue
        k+=add_album(a,cat)
new=[a for a in pool+albs if a["cat"]=="new" and a.get("album_id") and a["ml"] and 300<=a["ml"]<=10000 and a["release"]>="2026-10-29"];random.shuffle(new);k=0
for a in new:
    if k==3: break
    if a["artist_id"] in seen: continue
    k+=add_album(a,"new (≤7d)")
json.dump(out,open("testset.json","w"),indent=1)
for t in out: print(f"{t['cat']:14} {t['ml'] or '':>6} {t['release']:10} {t['isrc'] or '-':13} {t['artist'][:22]:22} | {t['name'][:40]}")
print(len(out))
