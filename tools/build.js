// 문제 은행 + 화면 틀 → app/index.html 한 파일로 합치기:  node tools/build.js
const fs=require('fs'),path=require('path');
const app=path.join(__dirname,'..','app');
const units=JSON.parse(fs.readFileSync(path.join(app,'data','units.json')));
const bank={};
for(const f of fs.readdirSync(path.join(app,'data','bank')).filter(f=>f.endsWith('.json')).sort()){
  const b=JSON.parse(fs.readFileSync(path.join(app,'data','bank',f)));
  const lv=b.level==='hard'?'hard':'basic';
  bank[b.unit]=(bank[b.unit]||[]).concat(b.questions.map(q=>({...q,lv})));
}
const data=JSON.stringify({units:units.units,publishers:units.publishers,bank}).replace(/<\//g,'<\\/');
const html=fs.readFileSync(path.join(app,'src','template.html'),'utf8').replace('__DATA__',data);
fs.writeFileSync(path.join(app,'index.html'),html);
console.log(`index.html 생성: 단원 ${Object.keys(bank).length}개, 문제 ${Object.values(bank).reduce((s,b)=>s+b.length,0)}개, ${(html.length/1024).toFixed(0)}KB`);
