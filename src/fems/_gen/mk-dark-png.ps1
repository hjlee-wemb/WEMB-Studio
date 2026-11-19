param([string]$src, [string]$dst, [string]$mode)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class DK {
  static void Hsl(double r,double g,double b,out double h,out double s,out double l){double mx=Math.Max(r,Math.Max(g,b)),mn=Math.Min(r,Math.Min(g,b)),d=mx-mn;l=(mx+mn)/2;h=0;s=0;if(d>1e-9){s=d/(1-Math.Abs(2*l-1));if(mx==r)h=((g-b)/d+(g<b?6:0));else if(mx==g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}}
  static void Rgb(double h,double s,double l,out double r,out double g,out double b){double c=(1-Math.Abs(2*l-1))*s,hp=((h%360)+360)%360/60,m=l-c/2,q=c*(1-Math.Abs(hp%2-1));double[] t=hp<1?new[]{c,q,0}:hp<2?new[]{q,c,0}:hp<3?new[]{0,c,q}:hp<4?new[]{0,q,c}:hp<5?new[]{q,0,c}:new[]{c,0,q};r=t[0]+m;g=t[1]+m;b=t[2]+m;}
  static byte B(double v){return (byte)Math.Max(0,Math.Min(255,Math.Round(v*255)));}
  public static void Run(string src,string dst,string mode){
    var bmp=new Bitmap(src); var o=new Bitmap(bmp.Width,bmp.Height,PixelFormat.Format32bppArgb);
    using(var gr=Graphics.FromImage(o)) gr.DrawImage(bmp,0,0,bmp.Width,bmp.Height);
    var rc=new Rectangle(0,0,o.Width,o.Height); var bd=o.LockBits(rc,ImageLockMode.ReadWrite,PixelFormat.Format32bppArgb);
    int n=bd.Stride*o.Height; var px=new byte[n]; Marshal.Copy(bd.Scan0,px,0,n);
    for(int i=0;i<n;i+=4){ double b=px[i]/255.0,g=px[i+1]/255.0,r=px[i+2]/255.0,h,s,l; Hsl(r,g,b,out h,out s,out l); double nr,ng,nb;
      if(mode=="bg2"){ double y=0.2126*r+0.7152*g+0.0722*b, k=1.15, w=Math.Max(0,y-0.84)*0.9; nr=0.055+(r-y)*k+w; ng=0.066+(g-y)*k+w; nb=0.09+(b-y)*k+w; } else if(mode=="bg"){ double ss=s*(1-Math.Abs(2*l-1)); /* 실제 채도량(chroma) */
        double L2=0.055+Math.Max(0,ss-0.05)*0.9+Math.Max(0,l-0.86)*0.55; double S2=Math.Min(0.75,0.18+ss*3.2);
        if(ss<0.04){h=218;S2=0.12;} Rgb(h,S2,Math.Min(0.4,L2),out nr,out ng,out nb);
      } else { /* glass: 흰 유리 → 그래파이트 유리, 밝을수록 어둡게 */
        double L2=0.085+(1-l)*0.5; Rgb(218,0.10,L2,out nr,out ng,out nb);
      }
      px[i]=B(nb);px[i+1]=B(ng);px[i+2]=B(nr); }
    Marshal.Copy(px,0,bd.Scan0,n); o.UnlockBits(bd); o.Save(dst,ImageFormat.Png); bmp.Dispose(); o.Dispose();
  }
}
"@
[DK]::Run($src,$dst,$mode)
