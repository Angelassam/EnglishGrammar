// 단원 안에서 같은 영어 문장이 여러 문제에 반복되는지 찾기: node tools/dup_check.js [단원id ...]
// 출력: 단원별로 반복 문장과 그 문장을 쓰는 문제 id 목록 (blank/arrange가 다른 유형과 겹치는 경우를 특히 표시)
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','app','data','bank');
const norm=s=>String(s).toLowerCase().replace(/[’‘]/g,"'").replace(/<[^>]+>/g,' ').replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
// 문제에서 '핵심 문장'(정답이 들어간 완성 문장)들을 뽑기
function sentences(q){
  const out=[];
  const eng=s=>norm(s).split(' ').filter(w=>/^[a-z0-9']+$/.test(w)).length>=4;
  if(q.type==='choice'){ const s=q.q.replace(/____/g,q.o[q.a]); for(const seg of s.split('<br>')) if(eng(seg)) out.push(norm(seg)); }
  else if(q.type==='error'){ q.o.forEach((o,i)=>{ if(i!==q.a&&eng(o)) out.push(norm(o)); }); }
  else if(q.type==='blank'){ for(const a of q.ans){ const s=q.q.replace(/____( ____)*/,a).replace(/\([^)]*\)\s*$/,''); for(const seg of s.split('<br>')) if(eng(seg)) out.push(norm(seg)); } }
  else if(q.type==='fix'){ for(const a of q.ans){ const s=q.q.replace(q.wrong,a); if(eng(s)) out.push(norm(s)); } }
  else if(q.type==='arrange'){ for(const a of q.ans) if(eng(a)) out.push(norm(a)); }
  return [...new Set(out)];
}
const only=process.argv.slice(2);
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&(!only.length||only.some(o=>f.includes(o)))).sort();
let total=0;
for(const f of files){
  const b=JSON.parse(fs.readFileSync(path.join(dir,f)));
  const map={};
  for(const q of b.questions) for(const s of sentences(q)) (map[s]=map[s]||[]).push(q.id);
  const dups=Object.entries(map).filter(([s,ids])=>ids.length>1);
  const flagged=dups.filter(([s,ids])=>ids.some(id=>/-(b|a)\d+$/.test(id)));
  total+=flagged.length;
  console.log(`${f}: 반복 문장 ${dups.length}개 (빈칸·배열 포함 ${flagged.length}개)`);
  for(const [s,ids] of flagged) console.log(`  "${s}"  ← ${ids.join(', ')}`);
}
console.log(`빈칸·배열이 겹치는 문장: ${total}개`);
