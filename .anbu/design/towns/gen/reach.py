import json,os,collections
D='/home/devansh/developer/personal/projects/portfolio-quest/public/maps'
SPR=['mom','librarian','student','core','design','monorepo','cross','backend','analyst','editor','manager','reception','designer','robot','ghost']
for f in sorted(os.listdir(D)):
  m=json.load(open(os.path.join(D,f))); town=f[:-5]; W,H=m['width'],m['height']
  L={l['name']:l for l in m['layers']}
  coll_gids=set()
  for ts in m['tilesets']:
    for t in ts.get('tiles',[]):
      if any(p['name']=='ge_collide' and p['value'] for p in t.get('properties',[])): coll_gids.add(ts['firstgid']+t['id'])
  def blocked_tile(x,y):
    i=y*W+x
    if L['collide']['data'][i]: return True
    for n in ('ground','things'):
      if n in L and L[n]['data'][i] in coll_gids: return True
    return False
  objs=[]
  for l in m['layers']:
    for o in l.get('objects',[]) or []:
      p={q['name']:q['value'] for q in o.get('properties',[])}
      objs.append((l['name'],o.get('name',''),int(o['x']//16),int(o['y']//16),p))
  npc_tiles={(x,y) for ln,n,x,y,p in objs if ln=='npcs'}
  sign_tiles={(x,y) for ln,n,x,y,p in objs if ln in('signs','items')}
  warps={(x,y):p for ln,n,x,y,p in objs if p.get('kind')=='warp'}
  spawns={n:(x,y) for ln,n,x,y,p in objs if ln=='warps' and p.get('kind') in('spawn','door')}
  ground_l=L['ground']['data']
  def walk(x,y): return 0<=x<W and 0<=y<H and ground_l[y*W+x]!=0 and not blocked_tile(x,y) and (x,y) not in npc_tiles and (x,y) not in sign_tiles
  ge_vs_e2e=[(x,y) for y in range(H) for x in range(W) if ground_l[y*W+x] and not L['collide']['data'][y*W+x] and blocked_tile(x,y)]
  if 'default' not in spawns: print(town,'NO DEFAULT SPAWN'); continue
  seen={spawns['default']}; q=collections.deque([spawns['default']])
  while q:
    c=q.popleft()
    if c in warps:
      p=warps[c]
      if p.get('to')==town and p.get('spawn') in spawns:
        t=spawns[p['spawn']]
        if t not in seen: seen.add(t); q.append(t)
      continue
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
      n=(c[0]+dx,c[1]+dy)
      if n not in seen and walk(*n): seen.add(n); q.append(n)
  bad=[]
  for ln,n,x,y,p in objs:
    if ln in('npcs','signs','items'):
      if not any((x+dx,y+dy) in seen and (x+dx,y+dy) not in warps for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): bad.append(f'{ln}/{n}@{x},{y}')
    elif p.get('kind')=='warp' and (x,y) not in seen: bad.append(f'warp {n}@{x},{y}->{p.get("to")}')
  sprites=[(n,p.get('sprite')) for ln,n,x,y,p in objs if ln=='npcs' and p.get('sprite') not in SPR]
  regs=[r.split(',') for r in next((pp['value'] for pp in m.get('properties',[]) if pp['name']=='regions'),'').split(';') if r]
  def inreg(x,y): return any(int(a)<=x<int(a)+int(c) and int(b)<=y<int(b)+int(d) for a,b,c,d,*_ in regs)
  noreg=[t for t in seen if regs and not inreg(*t)]
  print(town,'reached',len(seen),'unreachable:',bad,'badsprites:',sprites,'tiles w/o region:',len(noreg),noreg[:3],'ge-only-collide:',len(ge_vs_e2e))
