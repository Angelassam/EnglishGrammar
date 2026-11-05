// 문제 은행을 사람이 읽기 쉬운 미리보기(.md)로 만들기: node tools/preview.js
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','app');
const {units,publishers}=JSON.parse(fs.readFileSync(path.join(root,'data','units.json')));
const pub=Object.fromEntries(publishers.map(p=>[p.id,p.name]));
const clean=s=>(s||'').replace(/<br>/g,' / ').replace(/<\/?[bu]>/g,'**');
const N='①②③④⑤',TYPE={choice:'객관식 (알맞은 말 고르기)',error:'객관식 (어법상 틀린 것 고르기)',blank:'빈칸 채우기',fix:'틀린 부분 고쳐 쓰기',arrange:'배열·영작'};
// 단원 목록
let L='# 단원 목록\n\n자동 생성 파일이에요 (tools/preview.js). 원본: app/data/units.json\n\n';
for(const g of [1,2]){
  L+=`## 중${g} (${units.filter(u=>u.grade===g).length}개 단원)\n\n| 번호 | 단원 | 문서 | 교과서 (출판사 Lesson) |\n|---|---|---|---|\n`;
  for(const u of units.filter(u=>u.grade===g)){
    const tb=Object.entries(u.textbooks).map(([p,l])=>`${p} ${l.join('·')}`).join(', ');
    L+=`| ${u.id} | ${u.title} | ${u.doc}${u.part?` (Part ${u.part})`:''} | ${tb} |\n`;
  }
  L+='\n';
}
fs.mkdirSync(path.join(root,'미리보기'),{recursive:true});
fs.writeFileSync(path.join(root,'미리보기','00_단원목록.md'),L);
// 문제 은행
for(const f of fs.readdirSync(path.join(root,'data','bank')).filter(f=>f.endsWith('.json'))){
  const b=JSON.parse(fs.readFileSync(path.join(root,'data','bank',f)));
  let s=`# [${b.unit}] ${b.title} — 중${b.grade}\n\n근거 문서: ${b.source} · 총 ${b.questions.length}문제\n\n※ 여기서는 정답이 모두 ①에 있지만, 앱에서는 보기 순서가 매번 무작위로 섞여요.\n\n`;
  for(const t of Object.keys(TYPE)){
    const qs=b.questions.filter(q=>q.type===t); if(!qs.length)continue;
    s+=`## ${TYPE[t]} (${qs.length})\n\n`;
    qs.forEach((q,i)=>{
      s+=`**${i+1}.** `;
      if(t==='arrange') s+=`${q.ko}  \n[ ${q.words.join(' / ')} ]${q.cond?' — '+q.cond:''}  \n`;
      else s+=clean(q.q)+'  \n';
      if(q.ko&&t!=='arrange') s+=`(${q.ko})  \n`;
      if(q.o) s+=q.o.map((o,j)=>`${N[j]} ${o}`).join('  \n')+'  \n';
      const ans=q.o?`${N[q.a]} ${q.o[q.a]}`:(t==='fix'?`${q.wrong} → ${q.ans.join(' / ')}`:q.ans.join(' / '));
      s+=`> **정답** ${ans}  \n> **해설** ${q.e}  \n> 근거: ${q.ref}\n\n`;
    });
  }
  fs.writeFileSync(path.join(root,'미리보기',f.replace('.json','.md')),s);
}
console.log('미리보기 생성 완료');
