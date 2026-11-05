// 문제 은행 자동 점검: node tools/check_bank.js
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','app','data','bank');
const units=JSON.parse(fs.readFileSync(path.join(__dirname,'..','app','data','units.json'))).units;
const norm=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
// 중1 문제에 나오면 안 되는 중2 심화 표현 (단원별)
const G2_ONLY={"1-06":["don't have to","doesn't have to","need to","used to","use to","will have to"]};
let bad=0;const say=m=>{bad++;console.log('  ✗ '+m);};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
  const b=JSON.parse(fs.readFileSync(path.join(dir,f)));
  const u=units.find(u=>u.id===b.unit);
  console.log(`${f}: ${b.questions.length}문제`);
  if(!u) say('units.json에 없는 단원 '+b.unit); else if(u.grade!==b.grade) say('학년 불일치');
  const ids=new Set(),cnt={};
  for(const q of b.questions){
    cnt[q.type]=(cnt[q.type]||0)+1;
    if(ids.has(q.id))say('id 중복 '+q.id);ids.add(q.id);
    if(!q.e||!q.ref)say(q.id+' 해설/근거 없음');
    if(q.type==='choice'||q.type==='error'){
      if(!Array.isArray(q.o)||q.o.length!==5)say(q.id+' 보기 5개 아님');
      if(new Set(q.o).size!==q.o.length)say(q.id+' 보기 중복');
      if(!(q.a>=0&&q.a<q.o.length))say(q.id+' 정답 번호 오류');
    } else if(['blank','fix','arrange'].includes(q.type)){
      if(!q.ans||!q.ans.length)say(q.id+' 정답 없음');
      if(q.type==='fix'&&!q.q.includes(q.wrong))say(q.id+' 틀린 부분이 문장에 없음');
      if(q.type==='arrange'&&!q.cond){
        const w=norm(q.words.join(' ')).split(' ').sort().join(' ');
        const a=norm(q.ans[0]).split(' ').sort().join(' ');
        if(w!==a)say(q.id+' 배열 단어와 정답이 다름: '+w+' / '+a);
      }
    } else say(q.id+' 알 수 없는 유형 '+q.type);
    if(b.grade===1&&G2_ONLY[b.unit]){
      const text=norm(JSON.stringify([q.q,q.o,q.ans,q.words]));
      for(const k of G2_ONLY[b.unit]) if((' '+text+' ').includes(' '+norm(k)+' '))say(q.id+' 중1 문제에 중2 심화 표현: '+k);
    }
  }
  console.log('  유형별:',JSON.stringify(cnt));
}
console.log(bad?`문제 ${bad}건`:'모두 통과');process.exit(bad?1:0);
