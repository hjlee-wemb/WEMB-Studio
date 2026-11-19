# 3D 장면 JPG(하늘이 구워짐) → 하늘을 투명하게 뺀 PNG. 하늘 = 바탕 사진(base)과 같은 픽셀(7x7 평균 차이로 잡음 제거).
# k=1 이면 라이트용(설비 색 그대로), k<1 이면 다크용(설비를 k 배로 누름). 바탕은 화면이 따로 깔므로 화면비가 바뀌어도 이음매가 없다.
# GDI+ 는 한글 경로에 저장을 못 한다 — 임시 폴더에서 돌리고 옮길 것.
param([string]$scene,[string]$base,[string]$dst,[int]$ox,[int]$oy,[double]$k)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class SC {
  static byte[] Px(Bitmap b,out int st){var o=new Bitmap(b.Width,b.Height,PixelFormat.Format32bppArgb);using(var g=Graphics.FromImage(o))g.DrawImage(b,0,0,b.Width,b.Height);var d=o.LockBits(new Rectangle(0,0,o.Width,o.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);st=d.Stride;var p=new byte[st*o.Height];Marshal.Copy(d.Scan0,p,0,p.Length);o.UnlockBits(d);return p;}
  public static string Run(string scene,string bas,string dst,int ox,int oy,double kk){
    var S=new Bitmap(scene);var B=new Bitmap(bas);int ss,bs;var s=Px(S,out ss);var b=Px(B,out bs);
    int W=S.Width,H=S.Height; var o=new Bitmap(W,H,PixelFormat.Format32bppArgb); var od=o.LockBits(new Rectangle(0,0,W,H),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb); var op=new byte[od.Stride*H];
    long hist0=0,hist1=0; var DF=new double[W*H]; for(int y=0;y<H;y++)for(int x=0;x<W;x++){int i=y*ss+x*4,j=(y+oy)*bs+(x+ox)*4; DF[y*W+x]=Math.Abs(s[i]-b[j])+Math.Abs(s[i+1]-b[j+1])+Math.Abs(s[i+2]-b[j+2]);} var M=new double[W*H]; int R=3; for(int y=0;y<H;y++)for(int x=0;x<W;x++){double t=0;int c=0;for(int yy=Math.Max(0,y-R);yy<=Math.Min(H-1,y+R);yy++)for(int xx=Math.Max(0,x-R);xx<=Math.Min(W-1,x+R);xx++){double v=DF[yy*W+xx];t+=v;c++;} M[y*W+x]=t/c;}
    for(int y=0;y<H;y++)for(int x=0;x<W;x++){int i=y*ss+x*4,j=(y+oy)*bs+(x+ox)*4,q=y*od.Stride+x*4;
      double df=Math.Max(M[y*W+x], DF[y*W+x]>60?DF[y*W+x]:0);
      double a=Math.Max(0,Math.Min(1,(df-16)/22.0)); if(a<0.5)hist0++;else hist1++;
      for(int c=0;c<3;c++){double v=s[i+c]*kk; op[q+c]=(byte)Math.Max(0,Math.Min(255,Math.Round(v)));} op[q+3]=(byte)Math.Round(a*255);}
    Marshal.Copy(op,0,od.Scan0,op.Length);o.UnlockBits(od);o.Save(dst,ImageFormat.Png);return "bg="+hist0+" obj="+hist1;
  }
}
"@
[SC]::Run($scene,$base,$dst,$ox,$oy,$k)
