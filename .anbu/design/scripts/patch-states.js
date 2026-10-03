b=Get(n=>n.name==="Patch Center/default/day"?n.id:undefined)[0]
vs=[["Patch Center/partial",1],["Patch Center/error",0]]
for(const v of vs){
c=Copy(b,document,{name:v[0]+"/day",x:12600,y:v[1]?1600:2400,theme:{time:"day"}})
em=Get(c,n=>n.name==="Input Your email"?n.id:undefined)[0]
ef=Get(c,n=>n.name==="Field Your email"?n.id:undefined)[0]
ems=Get(c,n=>n.name==="ada@company.com"?n.id:undefined)[0]
ms=Get(c,n=>n.name==="Input Message"?n.id:undefined)[0]
f=Get(c,n=>n.name==="Box inner"?n.id:undefined)[0]
Update(ems,{content:"ada@company",fill:"$ink"})
Update(em,{stroke:"$cursor"})
Update(ms,{height:56})
o=Get(c,n=>n.name==="Contact form"?n.id:undefined)[0]
Update(o,{y:196})
t=Get(c,n=>n.type==="text"&&n.content==="Patch Center"&&n.fontSize>40?n.id:undefined)[0]
if(t){Update(t,{fontSize:36})}
if(v[1]){tx(ef,"That email needs an @ and a domain, like name@company.com.",{fontSize:17,fill:"$ink",textGrowth:"fixed-width",width:"fill_container"})}
else{Update(ems,{content:"ada@company.com"});Update(em,{stroke:"$ink"});ba=fr(f,{name:"Error banner",width:"fill_container",fill:"$panel-2",stroke:"$cursor",strokeWidth:4,strokeAlignment:"inner",cornerRadius:4,padding:12});tx(ba,"Message not sent. Your text is still here. Try again, or use the address below.",{fontSize:19,textGrowth:"fixed-width",width:"fill_container"});ac=Get(c,n=>n.name==="Actions"?n.id:undefined)[0];Move(ba,f,4)}
n=Copy(c,document,{name:v[0]+"/night",x:12600,y:v[1]?2400-1600+1600+800:3200,theme:{time:"night"}})
Export([c,n],"png","raw")
Print("EXPORT",v[0],"day",c)
Print("EXPORT",v[0],"night",n)
}
