/* 여러 장의 같은 영역을 세로로 이어 붙인다(변형 상태 대조용). 인자: x y w h out scale files... */
const fs=require('fs'),PNG=require('./png.js');
const [,,X,Y,W,H,out,SC,...files]=process.argv;
const x=+X,y=+Y,w=+W,h=+H,s=+SC;
const ow=w*s, cellH=h*s, oh=(cellH+4)*files.length;
const o=Buffer.alloc(ow*oh*4,0);
files.forEach((f,n)=>{
  const img=PNG.decode(fs.readFileSync(f)); const dy=n*(cellH+4);
  for(let j=0;j<cellH;j++)for(let i=0;i<ow;i++){
    const sx=x+((i/s)|0), sy=y+((j/s)|0);
    if(sx>=img.w||sy>=img.h)continue;
    const si=(sy*img.w+sx)*4, di=((j+dy)*ow+i)*4;
    o[di]=img.data[si];o[di+1]=img.data[si+1];o[di+2]=img.data[si+2];o[di+3]=255;
  }
  if(n<files.length-1)for(let i=0;i<ow;i++)for(let k=0;k<4;k++){const di=((dy+cellH+k)*ow+i)*4;o[di]=255;o[di+1]=80;o[di+2]=0;o[di+3]=255;}
});
fs.writeFileSync(out,PNG.encode(ow,oh,o));
console.log('wrote',out,ow+'x'+oh);
