// 문제 은행 자동 점검: node tools/check_bank.js [파일이름 ...]
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','app','data','bank');
const units=JSON.parse(fs.readFileSync(path.join(__dirname,'..','app','data','units.json'))).units;
const norm=s=>String(s).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
// 중1(Part 1) 단원 문제에 나오면 안 되는 중2 심화 표현 — 정규식(소문자·구두점 제거된 문장에 적용)
const G2_ONLY={
 "1-06":["don't have to","doesn't have to","need to","needs to","used to","use to","will have to","need not"],
 "1-07":["\\b(and|or) (you|you'll|you will|i|we|he|she|they|it) (will|'ll|can|may|might|won't|miss|get|be|catch|lose)\\b"],
 "1-14":["\\bit('s| is| was) \\w+ (for|of) \\w+ to\\b","\\bit('s| is| was) (not )?\\w+ to\\b","\\b(how|what|where|when|which|whether) to\\b","\\b(for|of) (me|him|her|us|them|you|\\w+) to\\b"],
 "1-15":["in order to","so as to","\\btoo \\w+ (for \\w+ )?to\\b","\\w+ enough (for \\w+ )?to\\b"],
 "1-16":["one of the","\\bthe (more|less|\\w+er) \\w+[^.]* the (more|less|\\w+er)\\b","\\b(much|even|far|a lot|still) (more|less|\\w+er)\\b","\\bas \\w+ as\\b","\\bno other\\b","\\bthan any other\\b"],
 "1-18":["\\b(to|for|of) (me|him|her|us|them|you|my|his|her|our|their|the)\\b"],
 "1-19":["\\b(want|wants|wanted|tell|tells|told|ask|asks|asked|advise|advised|allow|allowed|expect|expected|order|ordered|get|got) \\w+ to\\b","\\b(make|makes|made|have|has|had|let|lets) (me|him|her|us|them|you|\\w+) \\w+\\b(?! (happy|sad|angry|a|an|the|famous|clean|warm|cool|busy|tired|full|proud|rich|strong|healthy|nervous|excited|bored|upset|safe|quiet|comfortable|special|better|hungry|sleepy|calm|smart|sick))","\\b(see|sees|saw|hear|hears|heard|watch|watches|watched|feel|feels|felt|notice|noticed|listen to|listened to|look at|looked at) (me|him|her|us|them|you|\\w+) (\\w+ing|\\w+)\\b(?! (very|so|too|happy|sad|is|was|are|were|and|but|yesterday|last|today|on|in|at|every|at))","\\bhelp(s|ed)? \\w+ (to )?\\w+\\b"],
 "1-20":["\\bit('s| is| was) (true|clear|certain|important|strange|surprising|possible|sad|lucky|a pity|a fact) that\\b","\\bthe fact that\\b","\\bthat \\w+ (is|was|are|were) (true|clear|important)\\b"],
 "1-21":["\\bif\\b","\\balthough\\b","\\bthough\\b","\\bwhile\\b","\\bsince\\b","\\bunless\\b","\\beven if\\b"],
 "1-22":["\\bsome\\b","\\bany\\b","(?<!a )\\bfew\\b","(?<!a )\\blittle\\b"],
 "1-23":["\\b(some|any|no|every)thing \\w+ to \\w+"]
};
const MIN={choice:10,error:4,blank:5,fix:5,arrange:5,total:30};
const only=process.argv.slice(2);
let bad=0;const say=m=>{bad++;console.log('  ✗ '+m);};
const allIds=new Set();
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&(!only.length||only.some(o=>f.includes(o)))).sort();
for(const f of files){
  let b;try{b=JSON.parse(fs.readFileSync(path.join(dir,f)));}catch(e){console.log(f);say('JSON 문법 오류: '+e.message);continue;}
  const u=units.find(u=>u.id===b.unit);
  console.log(`${f}: ${b.questions.length}문제`);
  if(f!==b.unit+'.json')say('파일 이름과 unit이 다름');
  if(!u) say('units.json에 없는 단원 '+b.unit); else {if(u.grade!==b.grade) say('학년 불일치'); if(u.title!==b.title) say('title이 units.json과 다름');}
  const cnt={};
  for(const q of b.questions){
    cnt[q.type]=(cnt[q.type]||0)+1;
    if(allIds.has(q.id))say('id 중복 '+q.id);allIds.add(q.id);
    if(!String(q.id).startsWith(b.unit+'-'))say(q.id+' id가 단원 id로 시작하지 않음');
    if(!q.e||!q.ref)say(q.id+' 해설/근거 없음');
    if(q.e&&!/(요|죠)[.!?)]*$/.test(q.e.trim()))say(q.id+' 해설이 ~요 체로 끝나지 않음');
    const allText=[q.q,q.ko,q.e,...(q.o||[]),...(q.ans||[]),...(q.words||[])].filter(Boolean).join(' ');
    if(/<(?!\/?(br|b|u)>)[a-z]/i.test(allText))say(q.id+' 허용되지 않는 태그');
    if(q.type==='choice'||q.type==='error'){
      if(!q.q)say(q.id+' q 없음');
      if(!Array.isArray(q.o)||q.o.length!==5)say(q.id+' 보기 5개 아님');
      else{ if(new Set(q.o.map(norm)).size!==5)say(q.id+' 보기 중복'); if(!(Number.isInteger(q.a)&&q.a>=0&&q.a<5))say(q.id+' 정답 번호 오류'); }
    } else if(['blank','fix','arrange'].includes(q.type)){
      if(!Array.isArray(q.ans)||!q.ans.length||q.ans.some(a=>!String(a).trim()))say(q.id+' 정답 없음');
      if(q.type!=='arrange'&&!q.q)say(q.id+' q 없음');
      if(q.type==='fix'){
        if(!q.wrong||!q.q.includes(q.wrong))say(q.id+' 틀린 부분이 문장에 없음');
        else if(q.q.split(q.wrong).length>2)say(q.id+' 틀린 부분이 문장에 두 번 이상 나옴');
        if(!q.ko)say(q.id+' fix에는 ko(우리말) 필수');
        if(q.ans&&q.ans.some(a=>norm(a)===norm(q.wrong)))say(q.id+' 정답이 틀린 부분과 같음');
      }
      if(q.type==='arrange'){
        if(!q.ko)say(q.id+' arrange에는 ko 필수');
        if(!Array.isArray(q.words)||q.words.length<3)say(q.id+' words 3개 이상 필요');
        else if(!q.cond){
          const w=norm(q.words.join(' ')).split(' ').sort().join(' ');
          q.ans.forEach(an=>{const a=norm(an).split(' ').sort().join(' '); if(w!==a)say(q.id+' 배열 단어와 정답이 다름: ['+w+'] / ['+a+']');});
        }
      }
      if(q.type==='blank'){
        const n=(q.q.match(/____/g)||[]).length;
        if(!n)say(q.id+' 빈칸(____) 없음');
      }
    } else say(q.id+' 알 수 없는 유형 '+q.type);
    if(b.grade===1&&G2_ONLY[b.unit]){
      const text=norm([q.q,...(q.o||[]),...(q.ans||[]),...(q.words||[])].filter(Boolean).join(' . '));
      for(const k of G2_ONLY[b.unit]){const re=new RegExp(k.includes('\\')?k:'\\b'+k.replace(/'/g,"'")+'\\b'); const m=text.match(re); if(m)say(q.id+' 중1 문제에 중2 심화로 보이는 표현: "'+m[0]+'"');}
    }
  }
  for(const t of ['choice','error','blank','fix','arrange']) if((cnt[t]||0)<MIN[t])say(`${t} 유형이 ${MIN[t]}개보다 적음 (${cnt[t]||0})`);
  if(b.questions.length<MIN.total)say(`전체 ${MIN.total}개보다 적음`);
  console.log('  유형별:',JSON.stringify(cnt));
}
console.log(bad?`문제 ${bad}건`:'모두 통과');process.exit(bad?1:0);
