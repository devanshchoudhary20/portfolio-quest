s=scr("Trainer Card/default","lab2-bg.png")
top(s)
b=bx(s,80,88,1120,{h:600,pad:24,gap:16,name:"Trainer card"})
t=fr(b,{name:"Identity",layout:"horizontal",gap:32,width:"fill_container"})
w=fr(t,{name:"Photo well",width:208,height:272,fill:"$panel-2",cornerRadius:4,justifyContent:"center",alignItems:"center"})
Insert(w,{type:"rectangle",name:"Devansh photo",width:192,height:256,fill:{type:"image",url:"./assets/avatar-photo-x4.png",mode:"stretch"}})
r=fr(t,{name:"Facts",layout:"vertical",gap:10,width:"fill_container"})
tx(r,"Devansh Choudhary",{fontSize:64,lineHeight:1})
tx(r,"Frontend Engineer",{fontSize:32,fill:"$muted"})
for(const q of [["Money","400 coins (400+ LeetCode problems solved)"],["Education","B.Tech, Mechanical Engineering, IIT Patna, 2019 to 2023"],["Now","Member of Technical Staff, Frontend, TestMu AI"],["Time","12:40"]]){const k=fr(r,{name:"Fact "+q[0],layout:"horizontal",gap:16,width:"fill_container"});tx(k,q[0],{fontSize:22,fill:"$muted",textGrowth:"fixed-width",width:130});tx(k,q[1],{fontSize:26,textGrowth:"fixed-width",width:"fill_container"})}
tx(b,"Badges 3 / 5",{fontSize:30})
bg=fr(b,{name:"Badge row",layout:"horizontal",width:"fill_container",justifyContent:"space_between"})
for(const q of [["Core","$starter-react"],["Design System and A11y","$line"],["Monorepo and Tooling","$starter-node"],["Cross-stack and AI",null],["Backend",null]]){const c=fr(bg,{name:"Badge "+q[0],layout:"vertical",gap:8,alignItems:"center",width:200});const e=fr(c,{name:"Badge disc",width:72,height:72,cornerRadius:36,...(q[1]?{fill:q[1],stroke:"$ink",strokeWidth:4,strokeAlignment:"inner"}:{stroke:"$muted",strokeWidth:4,strokeAlignment:"inner"})});tx(c,q[0],{fontSize:20,textGrowth:"fixed-width",width:"fill_container",textAlign:"center",fill:q[1]?"$ink":"$muted"})}
done(s,"Trainer Card/default",11200)
