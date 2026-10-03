mkTitle=(ld,xo)=>{
L=[]
for(const t of [[74,20],[92,28],[230,34],[262,24],[290,18]]){for(let wy=150-t[1]+4;wy<146;wy+=8){L.push([(t[0]+3)*4,wy*4,8,12])}}
s=scr(ld?"Title/loading":"Title/default","title-bg.png",L)
top(s)
p=bx(s,260,36,760,{pad:20,ai:"center",gap:0,name:"Logo plate"})
tx(p,"PORTFOLIO",{fontSize:76,lineHeight:1})
tx(p,"QUEST",{fontSize:76,lineHeight:1,fill:"$cursor"})
tx(p,"Devansh Choudhary, Frontend Engineer",{fontSize:24,fill:"$muted"})
cw=fr(s,{name:"Press Start strip",x:0,y:340,width:W,layout:"horizontal",justifyContent:"center"})
cp=fr(cw,{name:"Press Start pill",fill:"$ink",stroke:"$panel",strokeWidth:4,strokeAlignment:"inner",cornerRadius:"$radius-game",padding:[8,24],layout:"horizontal",gap:16,alignItems:"center"})
if(ld){tx(cp,"Loading game files",{fontSize:22,fill:"$panel"});tk=fr(cp,{name:"Progress track",width:200,height:16,fill:"$panel-2",cornerRadius:4,padding:3});Insert(tk,{type:"rectangle",name:"Progress fill",width:120,height:10,fill:"$starter-react",cornerRadius:2});tx(cp,"63%",{fontSize:22,fill:"$panel"})}else{tx(cp,"Press Start",{fontSize:28,fill:"$panel"})}
m=bx(s,440,408,400,{pad:16,gap:4,name:"Title menu"})
if(ld){row(m,"New Game",false,{col:"$muted"});row(m,"Continue",false,{col:"$muted"});row(m,"Options",false);row(m,"Recruiter Mode",true,{sub:"Plain resume, one page."})}
else{row(m,"New Game",false);row(m,"Continue",true,{sub:"Badges 3 / 5, 12:40"});row(m,"Options",false);row(m,"Recruiter Mode",false,{sub:"Plain resume, one page."})}
done(s,ld?"Title/loading":"Title/default",xo)
}
mkTitle(false,2800)
mkTitle(true,30400)
