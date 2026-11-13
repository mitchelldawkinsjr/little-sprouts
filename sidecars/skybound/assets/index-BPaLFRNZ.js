(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();const _c="180",Dd=0,ou=1,Nd=2,ef=0,tf=1,vc=2,oi=3,Xn=0,jt=1,Pt=2,fi=0,Is=1,ml=2,au=3,lu=4,Ud=5,Zi=100,Fd=101,Od=102,Bd=103,zd=104,kd=200,Hd=201,Vd=202,Gd=203,gl=204,_l=205,Wd=206,Xd=207,Yd=208,qd=209,Kd=210,$d=211,jd=212,Zd=213,Jd=214,vl=0,xl=1,yl=2,Fs=3,Ml=4,Sl=5,bl=6,El=7,nf=0,Qd=1,ep=2,Li=0,sf=1,rf=2,of=3,oa=4,af=5,lf=6,cf=7,cu="attached",tp="detached",uf=300,Os=301,Bs=302,Xo=303,Tl=304,aa=306,hn=1e3,Hn=1001,Yo=1002,Zt=1003,hf=1004,gr=1005,Lt=1006,Oo=1007,Ln=1008,Yn=1009,ff=1010,df=1011,Pr=1012,xc=1013,ts=1014,nn=1015,cn=1016,yc=1017,Mc=1018,Lr=1020,pf=35902,mf=35899,gf=1021,_f=1022,xn=1023,Ir=1026,Dr=1027,Sc=1028,bc=1029,vf=1030,Ec=1031,Tc=1033,Bo=33776,zo=33777,ko=33778,Ho=33779,wl=35840,Al=35841,Rl=35842,Cl=35843,Pl=36196,Ll=37492,Il=37496,Dl=37808,Nl=37809,Ul=37810,Fl=37811,Ol=37812,Bl=37813,zl=37814,kl=37815,Hl=37816,Vl=37817,Gl=37818,Wl=37819,Xl=37820,Yl=37821,ql=36492,Kl=36494,$l=36495,jl=36283,Zl=36284,Jl=36285,Ql=36286,Nr=2300,Ur=2301,Ma=2302,uu=2400,hu=2401,fu=2402,np=2500,ip=0,xf=1,ec=2,sp=3200,rp=3201,yf=0,op=1,Ri="",xt="srgb",Yt="srgb-linear",qo="linear",ct="srgb",as=7680,du=519,ap=512,lp=513,cp=514,Mf=515,up=516,hp=517,fp=518,dp=519,tc=35044,pu="300 es",Vn=2e3,Ko=2001;class $s{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const s=n[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}}const Bt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let mu=1234567;const yr=Math.PI/180,zs=180/Math.PI;function yn(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Bt[i&255]+Bt[i>>8&255]+Bt[i>>16&255]+Bt[i>>24&255]+"-"+Bt[e&255]+Bt[e>>8&255]+"-"+Bt[e>>16&15|64]+Bt[e>>24&255]+"-"+Bt[t&63|128]+Bt[t>>8&255]+"-"+Bt[t>>16&255]+Bt[t>>24&255]+Bt[n&255]+Bt[n>>8&255]+Bt[n>>16&255]+Bt[n>>24&255]).toLowerCase()}function $e(i,e,t){return Math.max(e,Math.min(t,i))}function wc(i,e){return(i%e+e)%e}function pp(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function mp(i,e,t){return i!==e?(t-i)/(e-i):0}function Mr(i,e,t){return(1-t)*i+t*e}function gp(i,e,t,n){return Mr(i,e,1-Math.exp(-t*n))}function _p(i,e=1){return e-Math.abs(wc(i,e*2)-e)}function vp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function xp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function yp(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Mp(i,e){return i+Math.random()*(e-i)}function Sp(i){return i*(.5-Math.random())}function bp(i){i!==void 0&&(mu=i);let e=mu+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ep(i){return i*yr}function Tp(i){return i*zs}function wp(i){return(i&i-1)===0&&i!==0}function Ap(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Rp(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Cp(i,e,t,n,s){const r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+n)/2),u=o((e+n)/2),h=r((e-n)/2),f=o((e-n)/2),d=r((n-e)/2),_=o((n-e)/2);switch(s){case"XYX":i.set(a*u,l*h,l*f,a*c);break;case"YZY":i.set(l*f,a*u,l*h,a*c);break;case"ZXZ":i.set(l*h,l*f,a*u,a*c);break;case"XZX":i.set(a*u,l*_,l*d,a*c);break;case"YXY":i.set(l*d,a*u,l*_,a*c);break;case"ZYZ":i.set(l*_,l*d,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Pn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function ut(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Xr={DEG2RAD:yr,RAD2DEG:zs,generateUUID:yn,clamp:$e,euclideanModulo:wc,mapLinear:pp,inverseLerp:mp,lerp:Mr,damp:gp,pingpong:_p,smoothstep:vp,smootherstep:xp,randInt:yp,randFloat:Mp,randFloatSpread:Sp,seededRandom:bp,degToRad:Ep,radToDeg:Tp,isPowerOfTwo:wp,ceilPowerOfTwo:Ap,floorPowerOfTwo:Rp,setQuaternionFromProperEuler:Cp,normalize:ut,denormalize:Pn};class ie{constructor(e=0,t=0){ie.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=$e(this.x,e.x,t.x),this.y=$e(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=$e(this.x,e,t),this.y=$e(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar($e(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos($e(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ui{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let l=n[s+0],c=n[s+1],u=n[s+2],h=n[s+3];const f=r[o+0],d=r[o+1],_=r[o+2],x=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=f,e[t+1]=d,e[t+2]=_,e[t+3]=x;return}if(h!==x||l!==f||c!==d||u!==_){let m=1-a;const p=l*f+c*d+u*_+h*x,b=p>=0?1:-1,M=1-p*p;if(M>Number.EPSILON){const w=Math.sqrt(M),C=Math.atan2(w,p*b);m=Math.sin(m*C)/w,a=Math.sin(a*C)/w}const v=a*b;if(l=l*m+f*v,c=c*m+d*v,u=u*m+_*v,h=h*m+x*v,m===1-a){const w=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=w,c*=w,u*=w,h*=w}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],u=n[s+3],h=r[o],f=r[o+1],d=r[o+2],_=r[o+3];return e[t]=a*_+u*h+l*d-c*f,e[t+1]=l*_+u*f+c*h-a*d,e[t+2]=c*_+u*d+a*f-l*h,e[t+3]=u*_-a*h-l*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(s/2),h=a(r/2),f=l(n/2),d=l(s/2),_=l(r/2);switch(o){case"XYZ":this._x=f*u*h+c*d*_,this._y=c*d*h-f*u*_,this._z=c*u*_+f*d*h,this._w=c*u*h-f*d*_;break;case"YXZ":this._x=f*u*h+c*d*_,this._y=c*d*h-f*u*_,this._z=c*u*_-f*d*h,this._w=c*u*h+f*d*_;break;case"ZXY":this._x=f*u*h-c*d*_,this._y=c*d*h+f*u*_,this._z=c*u*_+f*d*h,this._w=c*u*h-f*d*_;break;case"ZYX":this._x=f*u*h-c*d*_,this._y=c*d*h+f*u*_,this._z=c*u*_-f*d*h,this._w=c*u*h+f*d*_;break;case"YZX":this._x=f*u*h+c*d*_,this._y=c*d*h+f*u*_,this._z=c*u*_-f*d*h,this._w=c*u*h-f*d*_;break;case"XZY":this._x=f*u*h-c*d*_,this._y=c*d*h-f*u*_,this._z=c*u*_+f*d*h,this._w=c*u*h+f*d*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],h=t[10],f=n+a+h;if(f>0){const d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(u-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>h){const d=2*Math.sqrt(1+n-a-h);this._w=(u-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>h){const d=2*Math.sqrt(1+a-n-h);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+u)/d}else{const d=2*Math.sqrt(1+h-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs($e(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-s*a,this._w=o*u-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const d=1-t;return this._w=d*o+t*this._w,this._x=d*n+t*this._x,this._y=d*s+t*this._y,this._z=d*r+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-t)*u)/c,f=Math.sin(t*u)/c;return this._w=o*h+this._w*f,this._x=n*h+this._x*f,this._y=s*h+this._y*f,this._z=r*h+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(e=0,t=0,n=0){I.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(gu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(gu.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*n),u=2*(a*t-r*s),h=2*(r*n-o*t);return this.x=t+l*c+o*h-a*u,this.y=n+l*u+a*c-r*h,this.z=s+l*h+r*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=$e(this.x,e.x,t.x),this.y=$e(this.y,e.y,t.y),this.z=$e(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=$e(this.x,e,t),this.y=$e(this.y,e,t),this.z=$e(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar($e(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Sa.copy(this).projectOnVector(e),this.sub(Sa)}reflect(e){return this.sub(Sa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos($e(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Sa=new I,gu=new Ui;class Ke{constructor(e,t,n,s,r,o,a,l,c){Ke.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,c)}set(e,t,n,s,r,o,a,l,c){const u=this.elements;return u[0]=e,u[1]=s,u[2]=a,u[3]=t,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],f=n[2],d=n[5],_=n[8],x=s[0],m=s[3],p=s[6],b=s[1],M=s[4],v=s[7],w=s[2],C=s[5],R=s[8];return r[0]=o*x+a*b+l*w,r[3]=o*m+a*M+l*C,r[6]=o*p+a*v+l*R,r[1]=c*x+u*b+h*w,r[4]=c*m+u*M+h*C,r[7]=c*p+u*v+h*R,r[2]=f*x+d*b+_*w,r[5]=f*m+d*M+_*C,r[8]=f*p+d*v+_*R,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-n*r*u+n*a*l+s*r*c-s*o*l}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=u*o-a*c,f=a*l-u*r,d=c*r-o*l,_=t*h+n*f+s*d;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/_;return e[0]=h*x,e[1]=(s*c-u*n)*x,e[2]=(a*n-s*o)*x,e[3]=f*x,e[4]=(u*t-s*l)*x,e[5]=(s*r-a*t)*x,e[6]=d*x,e[7]=(n*l-c*t)*x,e[8]=(o*t-n*r)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(ba.makeScale(e,t)),this}rotate(e){return this.premultiply(ba.makeRotation(-e)),this}translate(e,t){return this.premultiply(ba.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ba=new Ke;function Sf(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Fr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Pp(){const i=Fr("canvas");return i.style.display="block",i}const _u={};function Or(i){i in _u||(_u[i]=!0,console.warn(i))}function Lp(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const vu=new Ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xu=new Ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ip(){const i={enabled:!0,workingColorSpace:Yt,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===ct&&(s.r=di(s.r),s.g=di(s.g),s.b=di(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===ct&&(s.r=Ds(s.r),s.g=Ds(s.g),s.b=Ds(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Ri?qo:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Or("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Or("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Yt]:{primaries:e,whitePoint:n,transfer:qo,toXYZ:vu,fromXYZ:xu,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:xt},outputColorSpaceConfig:{drawingBufferColorSpace:xt}},[xt]:{primaries:e,whitePoint:n,transfer:ct,toXYZ:vu,fromXYZ:xu,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:xt}}}),i}const et=Ip();function di(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ds(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let ls;class Dp{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement=="undefined")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ls===void 0&&(ls=Fr("canvas")),ls.width=e.width,ls.height=e.height;const s=ls.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=ls}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement!="undefined"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&e instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&e instanceof ImageBitmap){const t=Fr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=di(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(di(t[n]/255)*255):t[n]=di(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Np=0;class Ac{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Np++}),this.uuid=yn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement!="undefined"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Ea(s[o].image)):r.push(Ea(s[o]))}else r=Ea(s);n.url=r}return t||(e.images[this.uuid]=n),n}}function Ea(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?Dp.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Up=0;const Ta=new I;class It extends $s{constructor(e=It.DEFAULT_IMAGE,t=It.DEFAULT_MAPPING,n=Hn,s=Hn,r=Lt,o=Ln,a=xn,l=Yn,c=It.DEFAULT_ANISOTROPY,u=Ri){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Up++}),this.uuid=yn(),this.name="",this.source=new Ac(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ie(0,0),this.repeat=new ie(1,1),this.center=new ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Ta).x}get height(){return this.source.getSize(Ta).y}get depth(){return this.source.getSize(Ta).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==uf)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case hn:e.x=e.x-Math.floor(e.x);break;case Hn:e.x=e.x<0?0:1;break;case Yo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case hn:e.y=e.y-Math.floor(e.y);break;case Hn:e.y=e.y<0?0:1;break;case Yo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}It.DEFAULT_IMAGE=null;It.DEFAULT_MAPPING=uf;It.DEFAULT_ANISOTROPY=1;class tt{constructor(e=0,t=0,n=0,s=1){tt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r;const l=e.elements,c=l[0],u=l[4],h=l[8],f=l[1],d=l[5],_=l[9],x=l[2],m=l[6],p=l[10];if(Math.abs(u-f)<.01&&Math.abs(h-x)<.01&&Math.abs(_-m)<.01){if(Math.abs(u+f)<.1&&Math.abs(h+x)<.1&&Math.abs(_+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const M=(c+1)/2,v=(d+1)/2,w=(p+1)/2,C=(u+f)/4,R=(h+x)/4,A=(_+m)/4;return M>v&&M>w?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=C/n,r=R/n):v>w?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=C/s,r=A/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=R/r,s=A/r),this.set(n,s,r,t),this}let b=Math.sqrt((m-_)*(m-_)+(h-x)*(h-x)+(f-u)*(f-u));return Math.abs(b)<.001&&(b=1),this.x=(m-_)/b,this.y=(h-x)/b,this.z=(f-u)/b,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=$e(this.x,e.x,t.x),this.y=$e(this.y,e.y,t.y),this.z=$e(this.z,e.z,t.z),this.w=$e(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=$e(this.x,e,t),this.y=$e(this.y,e,t),this.z=$e(this.z,e,t),this.w=$e(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar($e(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Fp extends $s{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Lt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new tt(0,0,e,t),this.scissorTest=!1,this.viewport=new tt(0,0,e,t);const s={width:e,height:t,depth:n.depth},r=new It(s);this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){const t={minFilter:Lt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ac(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Mn extends Fp{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class bf extends It{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=Hn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Op extends It{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=Hn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class jn{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(En.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(En.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=En.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,En):En.fromBufferAttribute(r,o),En.applyMatrix4(e.matrixWorld),this.expandByPoint(En);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Zr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Zr.copy(n.boundingBox)),Zr.applyMatrix4(e.matrixWorld),this.union(Zr)}const s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,En),En.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ir),Jr.subVectors(this.max,ir),cs.subVectors(e.a,ir),us.subVectors(e.b,ir),hs.subVectors(e.c,ir),mi.subVectors(us,cs),gi.subVectors(hs,us),zi.subVectors(cs,hs);let t=[0,-mi.z,mi.y,0,-gi.z,gi.y,0,-zi.z,zi.y,mi.z,0,-mi.x,gi.z,0,-gi.x,zi.z,0,-zi.x,-mi.y,mi.x,0,-gi.y,gi.x,0,-zi.y,zi.x,0];return!wa(t,cs,us,hs,Jr)||(t=[1,0,0,0,1,0,0,0,1],!wa(t,cs,us,hs,Jr))?!1:(Qr.crossVectors(mi,gi),t=[Qr.x,Qr.y,Qr.z],wa(t,cs,us,hs,Jr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,En).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(En).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ei[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ei[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ei[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ei[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ei[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ei[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ei[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ei[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ei),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const ei=[new I,new I,new I,new I,new I,new I,new I,new I],En=new I,Zr=new jn,cs=new I,us=new I,hs=new I,mi=new I,gi=new I,zi=new I,ir=new I,Jr=new I,Qr=new I,ki=new I;function wa(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ki.fromArray(i,r);const a=s.x*Math.abs(ki.x)+s.y*Math.abs(ki.y)+s.z*Math.abs(ki.z),l=e.dot(ki),c=t.dot(ki),u=n.dot(ki);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Bp=new jn,sr=new I,Aa=new I;class Zn{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Bp.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;sr.subVectors(e,this.center);const t=sr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(sr,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Aa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(sr.copy(e.center).add(Aa)),this.expandByPoint(sr.copy(e.center).sub(Aa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const ti=new I,Ra=new I,eo=new I,_i=new I,Ca=new I,to=new I,Pa=new I;class la{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ti)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=ti.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ti.copy(this.origin).addScaledVector(this.direction,t),ti.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Ra.copy(e).add(t).multiplyScalar(.5),eo.copy(t).sub(e).normalize(),_i.copy(this.origin).sub(Ra);const r=e.distanceTo(t)*.5,o=-this.direction.dot(eo),a=_i.dot(this.direction),l=-_i.dot(eo),c=_i.lengthSq(),u=Math.abs(1-o*o);let h,f,d,_;if(u>0)if(h=o*l-a,f=o*a-l,_=r*u,h>=0)if(f>=-_)if(f<=_){const x=1/u;h*=x,f*=x,d=h*(h+o*f+2*a)+f*(o*h+f+2*l)+c}else f=r,h=Math.max(0,-(o*f+a)),d=-h*h+f*(f+2*l)+c;else f=-r,h=Math.max(0,-(o*f+a)),d=-h*h+f*(f+2*l)+c;else f<=-_?(h=Math.max(0,-(-o*r+a)),f=h>0?-r:Math.min(Math.max(-r,-l),r),d=-h*h+f*(f+2*l)+c):f<=_?(h=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(h=Math.max(0,-(o*r+a)),f=h>0?r:Math.min(Math.max(-r,-l),r),d=-h*h+f*(f+2*l)+c);else f=o>0?-r:r,h=Math.max(0,-(o*f+a)),d=-h*h+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(Ra).addScaledVector(eo,f),d}intersectSphere(e,t){ti.subVectors(e.center,this.origin);const n=ti.dot(this.direction),s=ti.dot(ti)-n*n,r=e.radius*e.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,f=this.origin;return c>=0?(n=(e.min.x-f.x)*c,s=(e.max.x-f.x)*c):(n=(e.max.x-f.x)*c,s=(e.min.x-f.x)*c),u>=0?(r=(e.min.y-f.y)*u,o=(e.max.y-f.y)*u):(r=(e.max.y-f.y)*u,o=(e.min.y-f.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(e.min.z-f.z)*h,l=(e.max.z-f.z)*h):(a=(e.max.z-f.z)*h,l=(e.min.z-f.z)*h),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ti)!==null}intersectTriangle(e,t,n,s,r){Ca.subVectors(t,e),to.subVectors(n,e),Pa.crossVectors(Ca,to);let o=this.direction.dot(Pa),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;_i.subVectors(this.origin,e);const l=a*this.direction.dot(to.crossVectors(_i,to));if(l<0)return null;const c=a*this.direction.dot(Ca.cross(_i));if(c<0||l+c>o)return null;const u=-a*_i.dot(Pa);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class He{constructor(e,t,n,s,r,o,a,l,c,u,h,f,d,_,x,m){He.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,c,u,h,f,d,_,x,m)}set(e,t,n,s,r,o,a,l,c,u,h,f,d,_,x,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=u,p[10]=h,p[14]=f,p[3]=d,p[7]=_,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new He().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,s=1/fs.setFromMatrixColumn(e,0).length(),r=1/fs.setFromMatrixColumn(e,1).length(),o=1/fs.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const f=o*u,d=o*h,_=a*u,x=a*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=d+_*c,t[5]=f-x*c,t[9]=-a*l,t[2]=x-f*c,t[6]=_+d*c,t[10]=o*l}else if(e.order==="YXZ"){const f=l*u,d=l*h,_=c*u,x=c*h;t[0]=f+x*a,t[4]=_*a-d,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=d*a-_,t[6]=x+f*a,t[10]=o*l}else if(e.order==="ZXY"){const f=l*u,d=l*h,_=c*u,x=c*h;t[0]=f-x*a,t[4]=-o*h,t[8]=_+d*a,t[1]=d+_*a,t[5]=o*u,t[9]=x-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const f=o*u,d=o*h,_=a*u,x=a*h;t[0]=l*u,t[4]=_*c-d,t[8]=f*c+x,t[1]=l*h,t[5]=x*c+f,t[9]=d*c-_,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const f=o*l,d=o*c,_=a*l,x=a*c;t[0]=l*u,t[4]=x-f*h,t[8]=_*h+d,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=d*h+_,t[10]=f-x*h}else if(e.order==="XZY"){const f=o*l,d=o*c,_=a*l,x=a*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=f*h+x,t[5]=o*u,t[9]=d*h-_,t[2]=_*h-d,t[6]=a*u,t[10]=x*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(zp,e,kp)}lookAt(e,t,n){const s=this.elements;return on.subVectors(e,t),on.lengthSq()===0&&(on.z=1),on.normalize(),vi.crossVectors(n,on),vi.lengthSq()===0&&(Math.abs(n.z)===1?on.x+=1e-4:on.z+=1e-4,on.normalize(),vi.crossVectors(n,on)),vi.normalize(),no.crossVectors(on,vi),s[0]=vi.x,s[4]=no.x,s[8]=on.x,s[1]=vi.y,s[5]=no.y,s[9]=on.y,s[2]=vi.z,s[6]=no.z,s[10]=on.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],f=n[9],d=n[13],_=n[2],x=n[6],m=n[10],p=n[14],b=n[3],M=n[7],v=n[11],w=n[15],C=s[0],R=s[4],A=s[8],g=s[12],y=s[1],S=s[5],N=s[9],D=s[13],P=s[2],U=s[6],O=s[10],W=s[14],H=s[3],Z=s[7],ae=s[11],z=s[15];return r[0]=o*C+a*y+l*P+c*H,r[4]=o*R+a*S+l*U+c*Z,r[8]=o*A+a*N+l*O+c*ae,r[12]=o*g+a*D+l*W+c*z,r[1]=u*C+h*y+f*P+d*H,r[5]=u*R+h*S+f*U+d*Z,r[9]=u*A+h*N+f*O+d*ae,r[13]=u*g+h*D+f*W+d*z,r[2]=_*C+x*y+m*P+p*H,r[6]=_*R+x*S+m*U+p*Z,r[10]=_*A+x*N+m*O+p*ae,r[14]=_*g+x*D+m*W+p*z,r[3]=b*C+M*y+v*P+w*H,r[7]=b*R+M*S+v*U+w*Z,r[11]=b*A+M*N+v*O+w*ae,r[15]=b*g+M*D+v*W+w*z,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],h=e[6],f=e[10],d=e[14],_=e[3],x=e[7],m=e[11],p=e[15];return _*(+r*l*h-s*c*h-r*a*f+n*c*f+s*a*d-n*l*d)+x*(+t*l*d-t*c*f+r*o*f-s*o*d+s*c*u-r*l*u)+m*(+t*c*h-t*a*d-r*o*h+n*o*d+r*a*u-n*c*u)+p*(-s*a*u-t*l*h+t*a*f+s*o*h-n*o*f+n*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=e[9],f=e[10],d=e[11],_=e[12],x=e[13],m=e[14],p=e[15],b=h*m*c-x*f*c+x*l*d-a*m*d-h*l*p+a*f*p,M=_*f*c-u*m*c-_*l*d+o*m*d+u*l*p-o*f*p,v=u*x*c-_*h*c+_*a*d-o*x*d-u*a*p+o*h*p,w=_*h*l-u*x*l-_*a*f+o*x*f+u*a*m-o*h*m,C=t*b+n*M+s*v+r*w;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const R=1/C;return e[0]=b*R,e[1]=(x*f*r-h*m*r-x*s*d+n*m*d+h*s*p-n*f*p)*R,e[2]=(a*m*r-x*l*r+x*s*c-n*m*c-a*s*p+n*l*p)*R,e[3]=(h*l*r-a*f*r-h*s*c+n*f*c+a*s*d-n*l*d)*R,e[4]=M*R,e[5]=(u*m*r-_*f*r+_*s*d-t*m*d-u*s*p+t*f*p)*R,e[6]=(_*l*r-o*m*r-_*s*c+t*m*c+o*s*p-t*l*p)*R,e[7]=(o*f*r-u*l*r+u*s*c-t*f*c-o*s*d+t*l*d)*R,e[8]=v*R,e[9]=(_*h*r-u*x*r-_*n*d+t*x*d+u*n*p-t*h*p)*R,e[10]=(o*x*r-_*a*r+_*n*c-t*x*c-o*n*p+t*a*p)*R,e[11]=(u*a*r-o*h*r-u*n*c+t*h*c+o*n*d-t*a*d)*R,e[12]=w*R,e[13]=(u*x*s-_*h*s+_*n*f-t*x*f-u*n*m+t*h*m)*R,e[14]=(_*a*s-o*x*s-_*n*l+t*x*l+o*n*m-t*a*m)*R,e[15]=(o*h*s-u*a*s+u*n*l-t*h*l-o*n*f+t*a*f)*R,this}scale(e){const t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+n,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,u=o+o,h=a+a,f=r*c,d=r*u,_=r*h,x=o*u,m=o*h,p=a*h,b=l*c,M=l*u,v=l*h,w=n.x,C=n.y,R=n.z;return s[0]=(1-(x+p))*w,s[1]=(d+v)*w,s[2]=(_-M)*w,s[3]=0,s[4]=(d-v)*C,s[5]=(1-(f+p))*C,s[6]=(m+b)*C,s[7]=0,s[8]=(_+M)*R,s[9]=(m-b)*R,s[10]=(1-(f+x))*R,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;let r=fs.set(s[0],s[1],s[2]).length();const o=fs.set(s[4],s[5],s[6]).length(),a=fs.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Tn.copy(this);const c=1/r,u=1/o,h=1/a;return Tn.elements[0]*=c,Tn.elements[1]*=c,Tn.elements[2]*=c,Tn.elements[4]*=u,Tn.elements[5]*=u,Tn.elements[6]*=u,Tn.elements[8]*=h,Tn.elements[9]*=h,Tn.elements[10]*=h,t.setFromRotationMatrix(Tn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=Vn,l=!1){const c=this.elements,u=2*r/(t-e),h=2*r/(n-s),f=(t+e)/(t-e),d=(n+s)/(n-s);let _,x;if(l)_=r/(o-r),x=o*r/(o-r);else if(a===Vn)_=-(o+r)/(o-r),x=-2*o*r/(o-r);else if(a===Ko)_=-o/(o-r),x=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=h,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=Vn,l=!1){const c=this.elements,u=2/(t-e),h=2/(n-s),f=-(t+e)/(t-e),d=-(n+s)/(n-s);let _,x;if(l)_=1/(o-r),x=o/(o-r);else if(a===Vn)_=-2/(o-r),x=-(o+r)/(o-r);else if(a===Ko)_=-1/(o-r),x=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=h,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=_,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const fs=new I,Tn=new He,zp=new I(0,0,0),kp=new I(1,1,1),vi=new I,no=new I,on=new I,yu=new He,Mu=new Ui;class qn{constructor(e=0,t=0,n=0,s=qn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],h=s[2],f=s[6],d=s[10];switch(t){case"XYZ":this._y=Math.asin($e(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-$e(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin($e(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-$e(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin($e(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-$e(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return yu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(yu,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Mu.setFromEuler(this),this.setFromQuaternion(Mu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}qn.DEFAULT_ORDER="XYZ";class Ef{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Hp=0;const Su=new I,ds=new Ui,ni=new He,io=new I,rr=new I,Vp=new I,Gp=new Ui,bu=new I(1,0,0),Eu=new I(0,1,0),Tu=new I(0,0,1),wu={type:"added"},Wp={type:"removed"},ps={type:"childadded",child:null},La={type:"childremoved",child:null};class mt extends $s{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Hp++}),this.uuid=yn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=mt.DEFAULT_UP.clone();const e=new I,t=new qn,n=new Ui,s=new I(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new He},normalMatrix:{value:new Ke}}),this.matrix=new He,this.matrixWorld=new He,this.matrixAutoUpdate=mt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ef,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ds.setFromAxisAngle(e,t),this.quaternion.multiply(ds),this}rotateOnWorldAxis(e,t){return ds.setFromAxisAngle(e,t),this.quaternion.premultiply(ds),this}rotateX(e){return this.rotateOnAxis(bu,e)}rotateY(e){return this.rotateOnAxis(Eu,e)}rotateZ(e){return this.rotateOnAxis(Tu,e)}translateOnAxis(e,t){return Su.copy(e).applyQuaternion(this.quaternion),this.position.add(Su.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(bu,e)}translateY(e){return this.translateOnAxis(Eu,e)}translateZ(e){return this.translateOnAxis(Tu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ni.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?io.copy(e):io.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),rr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ni.lookAt(rr,io,this.up):ni.lookAt(io,rr,this.up),this.quaternion.setFromRotationMatrix(ni),s&&(ni.extractRotation(s.matrixWorld),ds.setFromRotationMatrix(ni),this.quaternion.premultiply(ds.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(wu),ps.child=e,this.dispatchEvent(ps),ps.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Wp),La.child=e,this.dispatchEvent(La),La.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ni.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ni.multiply(e.parent.matrixWorld)),e.applyMatrix4(ni),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(wu),ps.child=e,this.dispatchEvent(ps),ps.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(rr,e,Vp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(rr,Gp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];r(e.shapes,h)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),f=o(e.skeletons),d=o(e.animations),_=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),_.length>0&&(n.nodes=_)}return n.object=s,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}mt.DEFAULT_UP=new I(0,1,0);mt.DEFAULT_MATRIX_AUTO_UPDATE=!0;mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const wn=new I,ii=new I,Ia=new I,si=new I,ms=new I,gs=new I,Au=new I,Da=new I,Na=new I,Ua=new I,Fa=new tt,Oa=new tt,Ba=new tt;class _n{constructor(e=new I,t=new I,n=new I){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),wn.subVectors(e,t),s.cross(wn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){wn.subVectors(s,t),ii.subVectors(n,t),Ia.subVectors(e,t);const o=wn.dot(wn),a=wn.dot(ii),l=wn.dot(Ia),c=ii.dot(ii),u=ii.dot(Ia),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const f=1/h,d=(c*l-a*u)*f,_=(o*u-a*l)*f;return r.set(1-d-_,_,d)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,si)===null?!1:si.x>=0&&si.y>=0&&si.x+si.y<=1}static getInterpolation(e,t,n,s,r,o,a,l){return this.getBarycoord(e,t,n,s,si)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,si.x),l.addScaledVector(o,si.y),l.addScaledVector(a,si.z),l)}static getInterpolatedAttribute(e,t,n,s,r,o){return Fa.setScalar(0),Oa.setScalar(0),Ba.setScalar(0),Fa.fromBufferAttribute(e,t),Oa.fromBufferAttribute(e,n),Ba.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Fa,r.x),o.addScaledVector(Oa,r.y),o.addScaledVector(Ba,r.z),o}static isFrontFacing(e,t,n,s){return wn.subVectors(n,t),ii.subVectors(e,t),wn.cross(ii).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return wn.subVectors(this.c,this.b),ii.subVectors(this.a,this.b),wn.cross(ii).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return _n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return _n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return _n.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return _n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return _n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,r=this.c;let o,a;ms.subVectors(s,n),gs.subVectors(r,n),Da.subVectors(e,n);const l=ms.dot(Da),c=gs.dot(Da);if(l<=0&&c<=0)return t.copy(n);Na.subVectors(e,s);const u=ms.dot(Na),h=gs.dot(Na);if(u>=0&&h<=u)return t.copy(s);const f=l*h-u*c;if(f<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(n).addScaledVector(ms,o);Ua.subVectors(e,r);const d=ms.dot(Ua),_=gs.dot(Ua);if(_>=0&&d<=_)return t.copy(r);const x=d*c-l*_;if(x<=0&&c>=0&&_<=0)return a=c/(c-_),t.copy(n).addScaledVector(gs,a);const m=u*_-d*h;if(m<=0&&h-u>=0&&d-_>=0)return Au.subVectors(r,s),a=(h-u)/(h-u+(d-_)),t.copy(s).addScaledVector(Au,a);const p=1/(m+x+f);return o=x*p,a=f*p,t.copy(n).addScaledVector(ms,o).addScaledVector(gs,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Tf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},xi={h:0,s:0,l:0},so={h:0,s:0,l:0};function za(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class De{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,et.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=et.workingColorSpace){return this.r=e,this.g=t,this.b=n,et.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=et.workingColorSpace){if(e=wc(e,1),t=$e(t,0,1),n=$e(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=za(o,r,e+1/3),this.g=za(o,r,e),this.b=za(o,r,e-1/3)}return et.colorSpaceToWorking(this,s),this}setStyle(e,t=xt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xt){const n=Tf[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=di(e.r),this.g=di(e.g),this.b=di(e.b),this}copyLinearToSRGB(e){return this.r=Ds(e.r),this.g=Ds(e.g),this.b=Ds(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xt){return et.workingToColorSpace(zt.copy(this),e),Math.round($e(zt.r*255,0,255))*65536+Math.round($e(zt.g*255,0,255))*256+Math.round($e(zt.b*255,0,255))}getHexString(e=xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=et.workingColorSpace){et.workingToColorSpace(zt.copy(this),t);const n=zt.r,s=zt.g,r=zt.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(s-r)/h+(s<r?6:0);break;case s:l=(r-n)/h+2;break;case r:l=(n-s)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=et.workingColorSpace){return et.workingToColorSpace(zt.copy(this),t),e.r=zt.r,e.g=zt.g,e.b=zt.b,e}getStyle(e=xt){et.workingToColorSpace(zt.copy(this),e);const t=zt.r,n=zt.g,s=zt.b;return e!==xt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(xi),this.setHSL(xi.h+e,xi.s+t,xi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(xi),e.getHSL(so);const n=Mr(xi.h,so.h,t),s=Mr(xi.s,so.s,t),r=Mr(xi.l,so.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const zt=new De;De.NAMES=Tf;let Xp=0;class Dn extends $s{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xp++}),this.uuid=yn(),this.name="",this.type="Material",this.blending=Is,this.side=Xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=gl,this.blendDst=_l,this.blendEquation=Zi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new De(0,0,0),this.blendAlpha=0,this.depthFunc=Fs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=du,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=as,this.stencilZFail=as,this.stencilZPass=as,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Is&&(n.blending=this.blending),this.side!==Xn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==gl&&(n.blendSrc=this.blendSrc),this.blendDst!==_l&&(n.blendDst=this.blendDst),this.blendEquation!==Zi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Fs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==du&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==as&&(n.stencilFail=this.stencilFail),this.stencilZFail!==as&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==as&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(t){const r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class un extends Dn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=nf,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const li=Yp();function Yp(){const i=new ArrayBuffer(4),e=new Float32Array(i),t=new Uint32Array(i),n=new Uint32Array(512),s=new Uint32Array(512);for(let l=0;l<256;++l){const c=l-127;c<-27?(n[l]=0,n[l|256]=32768,s[l]=24,s[l|256]=24):c<-14?(n[l]=1024>>-c-14,n[l|256]=1024>>-c-14|32768,s[l]=-c-1,s[l|256]=-c-1):c<=15?(n[l]=c+15<<10,n[l|256]=c+15<<10|32768,s[l]=13,s[l|256]=13):c<128?(n[l]=31744,n[l|256]=64512,s[l]=24,s[l|256]=24):(n[l]=31744,n[l|256]=64512,s[l]=13,s[l|256]=13)}const r=new Uint32Array(2048),o=new Uint32Array(64),a=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,u=0;for(;(c&8388608)===0;)c<<=1,u-=8388608;c&=-8388609,u+=947912704,r[l]=c|u}for(let l=1024;l<2048;++l)r[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)o[l]=l<<23;o[31]=1199570944,o[32]=2147483648;for(let l=33;l<63;++l)o[l]=2147483648+(l-32<<23);o[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(a[l]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:s,mantissaTable:r,exponentTable:o,offsetTable:a}}function qp(i){Math.abs(i)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),i=$e(i,-65504,65504),li.floatView[0]=i;const e=li.uint32View[0],t=e>>23&511;return li.baseTable[t]+((e&8388607)>>li.shiftTable[t])}function Kp(i){const e=i>>10;return li.uint32View[0]=li.mantissaTable[li.offsetTable[e]+(i&1023)]+li.exponentTable[e],li.floatView[0]}class ro{static toHalfFloat(e){return qp(e)}static fromHalfFloat(e){return Kp(e)}}const At=new I,oo=new ie;let $p=0;class Jt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:$p++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=tc,this.updateRanges=[],this.gpuType=nn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)oo.fromBufferAttribute(this,t),oo.applyMatrix3(e),this.setXY(t,oo.x,oo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)At.fromBufferAttribute(this,t),At.applyMatrix3(e),this.setXYZ(t,At.x,At.y,At.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)At.fromBufferAttribute(this,t),At.applyMatrix4(e),this.setXYZ(t,At.x,At.y,At.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)At.fromBufferAttribute(this,t),At.applyNormalMatrix(e),this.setXYZ(t,At.x,At.y,At.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)At.fromBufferAttribute(this,t),At.transformDirection(e),this.setXYZ(t,At.x,At.y,At.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Pn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=ut(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Pn(t,this.array)),t}setX(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Pn(t,this.array)),t}setY(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Pn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Pn(t,this.array)),t}setW(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),s=ut(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),s=ut(s,this.array),r=ut(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==tc&&(e.usage=this.usage),e}}class wf extends Jt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Af extends Jt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Xe extends Jt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let jp=0;const pn=new He,ka=new mt,_s=new I,an=new jn,or=new jn,Ut=new I;class Mt extends $s{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:jp++}),this.uuid=yn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sf(e)?Af:wf)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ke().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return pn.makeRotationFromQuaternion(e),this.applyMatrix4(pn),this}rotateX(e){return pn.makeRotationX(e),this.applyMatrix4(pn),this}rotateY(e){return pn.makeRotationY(e),this.applyMatrix4(pn),this}rotateZ(e){return pn.makeRotationZ(e),this.applyMatrix4(pn),this}translate(e,t,n){return pn.makeTranslation(e,t,n),this.applyMatrix4(pn),this}scale(e,t,n){return pn.makeScale(e,t,n),this.applyMatrix4(pn),this}lookAt(e){return ka.lookAt(e),ka.updateMatrix(),this.applyMatrix4(ka.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(_s).negate(),this.translate(_s.x,_s.y,_s.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let s=0,r=e.length;s<r;s++){const o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Xe(n,3))}else{const n=Math.min(e.length,t.count);for(let s=0;s<n;s++){const r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new jn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const r=t[n];an.setFromBufferAttribute(r),this.morphTargetsRelative?(Ut.addVectors(this.boundingBox.min,an.min),this.boundingBox.expandByPoint(Ut),Ut.addVectors(this.boundingBox.max,an.max),this.boundingBox.expandByPoint(Ut)):(this.boundingBox.expandByPoint(an.min),this.boundingBox.expandByPoint(an.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Zn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){const n=this.boundingSphere.center;if(an.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];or.setFromBufferAttribute(a),this.morphTargetsRelative?(Ut.addVectors(an.min,or.min),an.expandByPoint(Ut),Ut.addVectors(an.max,or.max),an.expandByPoint(Ut)):(an.expandByPoint(or.min),an.expandByPoint(or.max))}an.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Ut.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Ut));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Ut.fromBufferAttribute(a,c),l&&(_s.fromBufferAttribute(e,c),Ut.add(_s)),s=Math.max(s,n.distanceToSquared(Ut))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Jt(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let A=0;A<n.count;A++)a[A]=new I,l[A]=new I;const c=new I,u=new I,h=new I,f=new ie,d=new ie,_=new ie,x=new I,m=new I;function p(A,g,y){c.fromBufferAttribute(n,A),u.fromBufferAttribute(n,g),h.fromBufferAttribute(n,y),f.fromBufferAttribute(r,A),d.fromBufferAttribute(r,g),_.fromBufferAttribute(r,y),u.sub(c),h.sub(c),d.sub(f),_.sub(f);const S=1/(d.x*_.y-_.x*d.y);isFinite(S)&&(x.copy(u).multiplyScalar(_.y).addScaledVector(h,-d.y).multiplyScalar(S),m.copy(h).multiplyScalar(d.x).addScaledVector(u,-_.x).multiplyScalar(S),a[A].add(x),a[g].add(x),a[y].add(x),l[A].add(m),l[g].add(m),l[y].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let A=0,g=b.length;A<g;++A){const y=b[A],S=y.start,N=y.count;for(let D=S,P=S+N;D<P;D+=3)p(e.getX(D+0),e.getX(D+1),e.getX(D+2))}const M=new I,v=new I,w=new I,C=new I;function R(A){w.fromBufferAttribute(s,A),C.copy(w);const g=a[A];M.copy(g),M.sub(w.multiplyScalar(w.dot(g))).normalize(),v.crossVectors(C,g);const S=v.dot(l[A])<0?-1:1;o.setXYZW(A,M.x,M.y,M.z,S)}for(let A=0,g=b.length;A<g;++A){const y=b[A],S=y.start,N=y.count;for(let D=S,P=S+N;D<P;D+=3)R(e.getX(D+0)),R(e.getX(D+1)),R(e.getX(D+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Jt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);const s=new I,r=new I,o=new I,a=new I,l=new I,c=new I,u=new I,h=new I;if(e)for(let f=0,d=e.count;f<d;f+=3){const _=e.getX(f+0),x=e.getX(f+1),m=e.getX(f+2);s.fromBufferAttribute(t,_),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,_),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(_,a.x,a.y,a.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(f+0,u.x,u.y,u.z),n.setXYZ(f+1,u.x,u.y,u.z),n.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ut.fromBufferAttribute(e,t),Ut.normalize(),e.setXYZ(t,Ut.x,Ut.y,Ut.z)}toNonIndexed(){function e(a,l){const c=a.array,u=a.itemSize,h=a.normalized,f=new c.constructor(l.length*u);let d=0,_=0;for(let x=0,m=l.length;x<m;x++){a.isInterleavedBufferAttribute?d=l[x]*a.data.stride+a.offset:d=l[x]*u;for(let p=0;p<u;p++)f[_++]=c[d++]}return new Jt(f,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Mt,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=e(l,n);t.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){const f=c[u],d=e(f,n);l.push(d)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,f=c.length;h<f;h++){const d=c[h];u.push(d.toJSON(e.data))}u.length>0&&(s[l]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const s=e.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(t))}const r=e.morphAttributes;for(const c in r){const u=[],h=r[c];for(let f=0,d=h.length;f<d;f++)u.push(h[f].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ru=new He,Hi=new la,ao=new Zn,Cu=new I,lo=new I,co=new I,uo=new I,Ha=new I,ho=new I,Pu=new I,fo=new I;class Rt extends mt{constructor(e=new Mt,t=new un){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const a=this.morphTargetInfluences;if(r&&a){ho.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=a[l],h=r[l];u!==0&&(Ha.fromBufferAttribute(h,e),o?ho.addScaledVector(Ha,u):ho.addScaledVector(Ha.sub(t),u))}t.add(ho)}return t}raycast(e,t){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ao.copy(n.boundingSphere),ao.applyMatrix4(r),Hi.copy(e.ray).recast(e.near),!(ao.containsPoint(Hi.origin)===!1&&(Hi.intersectSphere(ao,Cu)===null||Hi.origin.distanceToSquared(Cu)>(e.far-e.near)**2))&&(Ru.copy(r).invert(),Hi.copy(e.ray).applyMatrix4(Ru),!(n.boundingBox!==null&&Hi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Hi)))}_computeIntersections(e,t,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let _=0,x=f.length;_<x;_++){const m=f[_],p=o[m.materialIndex],b=Math.max(m.start,d.start),M=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,w=M;v<w;v+=3){const C=a.getX(v),R=a.getX(v+1),A=a.getX(v+2);s=po(this,p,e,n,c,u,h,C,R,A),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const _=Math.max(0,d.start),x=Math.min(a.count,d.start+d.count);for(let m=_,p=x;m<p;m+=3){const b=a.getX(m),M=a.getX(m+1),v=a.getX(m+2);s=po(this,o,e,n,c,u,h,b,M,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let _=0,x=f.length;_<x;_++){const m=f[_],p=o[m.materialIndex],b=Math.max(m.start,d.start),M=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,w=M;v<w;v+=3){const C=v,R=v+1,A=v+2;s=po(this,p,e,n,c,u,h,C,R,A),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const _=Math.max(0,d.start),x=Math.min(l.count,d.start+d.count);for(let m=_,p=x;m<p;m+=3){const b=m,M=m+1,v=m+2;s=po(this,o,e,n,c,u,h,b,M,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}}function Zp(i,e,t,n,s,r,o,a){let l;if(e.side===jt?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,e.side===Xn,a),l===null)return null;fo.copy(a),fo.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(fo);return c<t.near||c>t.far?null:{distance:c,point:fo.clone(),object:i}}function po(i,e,t,n,s,r,o,a,l,c){i.getVertexPosition(a,lo),i.getVertexPosition(l,co),i.getVertexPosition(c,uo);const u=Zp(i,e,t,n,lo,co,uo,Pu);if(u){const h=new I;_n.getBarycoord(Pu,lo,co,uo,h),s&&(u.uv=_n.getInterpolatedAttribute(s,a,l,c,h,new ie)),r&&(u.uv1=_n.getInterpolatedAttribute(r,a,l,c,h,new ie)),o&&(u.normal=_n.getInterpolatedAttribute(o,a,l,c,h,new I),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const f={a,b:l,c,normal:new I,materialIndex:0};_n.getNormal(lo,co,uo,f.normal),u.face=f,u.barycoord=h}return u}class Fi extends Mt{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],u=[],h=[];let f=0,d=0;_("z","y","x",-1,-1,n,t,e,o,r,0),_("z","y","x",1,-1,n,t,-e,o,r,1),_("x","z","y",1,1,e,n,t,s,o,2),_("x","z","y",1,-1,e,n,-t,s,o,3),_("x","y","z",1,-1,e,t,n,s,r,4),_("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Xe(c,3)),this.setAttribute("normal",new Xe(u,3)),this.setAttribute("uv",new Xe(h,2));function _(x,m,p,b,M,v,w,C,R,A,g){const y=v/R,S=w/A,N=v/2,D=w/2,P=C/2,U=R+1,O=A+1;let W=0,H=0;const Z=new I;for(let ae=0;ae<O;ae++){const z=ae*S-D;for(let Q=0;Q<U;Q++){const re=Q*y-N;Z[x]=re*b,Z[m]=z*M,Z[p]=P,c.push(Z.x,Z.y,Z.z),Z[x]=0,Z[m]=0,Z[p]=C>0?1:-1,u.push(Z.x,Z.y,Z.z),h.push(Q/R),h.push(1-ae/A),W+=1}}for(let ae=0;ae<A;ae++)for(let z=0;z<R;z++){const Q=f+z+U*ae,re=f+z+U*(ae+1),de=f+(z+1)+U*(ae+1),Re=f+(z+1)+U*ae;l.push(Q,re,Re),l.push(re,de,Re),H+=6}a.addGroup(d,H,g),d+=H,f+=W}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function ks(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function $t(i){const e={};for(let t=0;t<i.length;t++){const n=ks(i[t]);for(const s in n)e[s]=n[s]}return e}function Jp(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Rf(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:et.workingColorSpace}const Di={clone:ks,merge:$t};var Qp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,em=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ot extends Dn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Qp,this.fragmentShader=em,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ks(e.uniforms),this.uniformsGroups=Jp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Cf extends mt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new He,this.projectionMatrix=new He,this.projectionMatrixInverse=new He,this.coordinateSystem=Vn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const yi=new I,Lu=new ie,Iu=new ie;class Ht extends Cf{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=zs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(yr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return zs*2*Math.atan(Math.tan(yr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){yi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(yi.x,yi.y).multiplyScalar(-e/yi.z),yi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(yi.x,yi.y).multiplyScalar(-e/yi.z)}getViewSize(e,t){return this.getViewBounds(e,Lu,Iu),t.subVectors(Iu,Lu)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(yr*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const vs=-90,xs=1;class tm extends mt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Ht(vs,xs,e,t);s.layers=this.layers,this.add(s);const r=new Ht(vs,xs,e,t);r.layers=this.layers,this.add(r);const o=new Ht(vs,xs,e,t);o.layers=this.layers,this.add(o);const a=new Ht(vs,xs,e,t);a.layers=this.layers,this.add(a);const l=new Ht(vs,xs,e,t);l.layers=this.layers,this.add(l);const c=new Ht(vs,xs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,l]=t;for(const c of t)this.remove(c);if(e===Vn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ko)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,u]=this.children,h=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,c),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,u),e.setRenderTarget(h,f,d),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class Pf extends It{constructor(e=[],t=Os,n,s,r,o,a,l,c,u){super(e,t,n,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class nm extends Mn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Pf(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Fi(5,5,5),r=new Ot({name:"CubemapFromEquirect",uniforms:ks(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:jt,blending:fi});r.uniforms.tEquirect.value=t;const o=new Rt(s,r),a=t.minFilter;return t.minFilter===Ln&&(t.minFilter=Lt),new tm(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}}class Vt extends mt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const im={type:"move"};class Va{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Vt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Vt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Vt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const x of e.hand.values()){const m=t.getJointPose(x,n),p=this._getHandJoint(c,x);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],f=u.position.distanceTo(h.position),d=.02,_=.005;c.inputState.pinching&&f>d+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(im)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Vt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Rc{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new De(e),this.density=t}clone(){return new Rc(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Cc{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new De(e),this.near=t,this.far=n}clone(){return new Cc(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class sm extends mt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qn,this.environmentIntensity=1,this.environmentRotation=new qn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Lf{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=tc,this.updateRanges=[],this.version=0,this.uuid=yn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=yn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=yn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Kt=new I;class Br{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.applyMatrix4(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.applyNormalMatrix(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.transformDirection(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Pn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=ut(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Pn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Pn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Pn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Pn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),s=ut(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),n=ut(n,this.array),s=ut(s,this.array),r=ut(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new Jt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Br(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Pc extends Dn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new De(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}let ys;const ar=new I,Ms=new I,Ss=new I,bs=new ie,lr=new ie,If=new He,mo=new I,cr=new I,go=new I,Du=new ie,Ga=new ie,Nu=new ie;class Df extends mt{constructor(e=new Pc){if(super(),this.isSprite=!0,this.type="Sprite",ys===void 0){ys=new Mt;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Lf(t,5);ys.setIndex([0,1,2,0,2,3]),ys.setAttribute("position",new Br(n,3,0,!1)),ys.setAttribute("uv",new Br(n,2,3,!1))}this.geometry=ys,this.material=e,this.center=new ie(.5,.5),this.count=1}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ms.setFromMatrixScale(this.matrixWorld),If.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Ss.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ms.multiplyScalar(-Ss.z);const n=this.material.rotation;let s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));const o=this.center;_o(mo.set(-.5,-.5,0),Ss,o,Ms,s,r),_o(cr.set(.5,-.5,0),Ss,o,Ms,s,r),_o(go.set(.5,.5,0),Ss,o,Ms,s,r),Du.set(0,0),Ga.set(1,0),Nu.set(1,1);let a=e.ray.intersectTriangle(mo,cr,go,!1,ar);if(a===null&&(_o(cr.set(-.5,.5,0),Ss,o,Ms,s,r),Ga.set(0,1),a=e.ray.intersectTriangle(mo,go,cr,!1,ar),a===null))return;const l=e.ray.origin.distanceTo(ar);l<e.near||l>e.far||t.push({distance:l,point:ar.clone(),uv:_n.getInterpolation(ar,mo,cr,go,Du,Ga,Nu,new ie),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}}function _o(i,e,t,n,s,r){bs.subVectors(i,t).addScalar(.5).multiply(n),s!==void 0?(lr.x=r*bs.x-s*bs.y,lr.y=s*bs.x+r*bs.y):lr.copy(bs),i.copy(e),i.x+=lr.x,i.y+=lr.y,i.applyMatrix4(If)}const Uu=new I,Fu=new tt,Ou=new tt,rm=new I,Bu=new He,vo=new I,Wa=new Zn,zu=new He,Xa=new la;class om extends Rt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=cu,this.bindMatrix=new He,this.bindMatrixInverse=new He,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new jn),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,vo),this.boundingBox.expandByPoint(vo)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Zn),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,vo),this.boundingSphere.expandByPoint(vo)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Wa.copy(this.boundingSphere),Wa.applyMatrix4(s),e.ray.intersectsSphere(Wa)!==!1&&(zu.copy(s).invert(),Xa.copy(e.ray).applyMatrix4(zu),!(this.boundingBox!==null&&Xa.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Xa)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new tt,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);const r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===cu?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===tp?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const n=this.skeleton,s=this.geometry;Fu.fromBufferAttribute(s.attributes.skinIndex,e),Ou.fromBufferAttribute(s.attributes.skinWeight,e),Uu.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){const o=Ou.getComponent(r);if(o!==0){const a=Fu.getComponent(r);Bu.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(rm.copy(Uu).applyMatrix4(Bu),o)}}return t.applyMatrix4(this.bindMatrixInverse)}}class Nf extends mt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Lc extends It{constructor(e=null,t=1,n=1,s,r,o,a,l,c=Zt,u=Zt,h,f){super(null,o,a,l,c,u,s,r,h,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ku=new He,am=new He;class Ic{constructor(e=[],t=[]){this.uuid=yn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new He)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new He;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=e.length;r<o;r++){const a=e[r]?e[r].matrixWorld:am;ku.multiplyMatrices(a,t[r]),ku.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new Ic(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new Lc(t,e,e,xn,nn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){const r=e.bones[n];let o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new Nf),this.bones.push(o),this.boneInverses.push(new He().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){const o=t[s];e.bones.push(o.uuid);const a=n[s];e.boneInverses.push(a.toArray())}return e}}class nc extends Jt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Es=new He,Hu=new He,xo=[],Vu=new jn,lm=new He,ur=new Rt,hr=new Zn;class Uf extends Rt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new nc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,lm)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new jn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Es),Vu.copy(e.boundingBox).applyMatrix4(Es),this.boundingBox.union(Vu)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Zn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Es),hr.copy(e.boundingSphere).applyMatrix4(Es),this.boundingSphere.union(hr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){const n=this.matrixWorld,s=this.count;if(ur.geometry=this.geometry,ur.material=this.material,ur.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),hr.copy(this.boundingSphere),hr.applyMatrix4(n),e.ray.intersectsSphere(hr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Es),Hu.multiplyMatrices(n,Es),ur.matrixWorld=Hu,ur.raycast(e,xo);for(let o=0,a=xo.length;o<a;o++){const l=xo[o];l.instanceId=r,l.object=this,t.push(l)}xo.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new nc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Lc(new Float32Array(s*this.count),s,this.count,Sc,nn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=s*e;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Ya=new I,cm=new I,um=new Ke;class Ei{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=Ya.subVectors(n,t).cross(cm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Ya),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||um.getNormalMatrix(e),s=this.coplanarPoint(Ya).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Vi=new Zn,hm=new ie(.5,.5),yo=new I;class Dc{constructor(e=new Ei,t=new Ei,n=new Ei,s=new Ei,r=new Ei,o=new Ei){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Vn,n=!1){const s=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],u=r[4],h=r[5],f=r[6],d=r[7],_=r[8],x=r[9],m=r[10],p=r[11],b=r[12],M=r[13],v=r[14],w=r[15];if(s[0].setComponents(c-o,d-u,p-_,w-b).normalize(),s[1].setComponents(c+o,d+u,p+_,w+b).normalize(),s[2].setComponents(c+a,d+h,p+x,w+M).normalize(),s[3].setComponents(c-a,d-h,p-x,w-M).normalize(),n)s[4].setComponents(l,f,m,v).normalize(),s[5].setComponents(c-l,d-f,p-m,w-v).normalize();else if(s[4].setComponents(c-l,d-f,p-m,w-v).normalize(),t===Vn)s[5].setComponents(c+l,d+f,p+m,w+v).normalize();else if(t===Ko)s[5].setComponents(l,f,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Vi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Vi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Vi)}intersectsSprite(e){Vi.center.set(0,0,0);const t=hm.distanceTo(e.center);return Vi.radius=.7071067811865476+t,Vi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Vi)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(yo.x=s.normal.x>0?e.max.x:e.min.x,yo.y=s.normal.y>0?e.max.y:e.min.y,yo.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(yo)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Ff extends Dn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new De(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const $o=new I,jo=new I,Gu=new He,fr=new la,Mo=new Zn,qa=new I,Wu=new I;class Nc extends mt{constructor(e=new Mt,t=new Ff){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)$o.fromBufferAttribute(t,s-1),jo.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=$o.distanceTo(jo);e.setAttribute("lineDistance",new Xe(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Mo.copy(n.boundingSphere),Mo.applyMatrix4(s),Mo.radius+=r,e.ray.intersectsSphere(Mo)===!1)return;Gu.copy(s).invert(),fr.copy(e.ray).applyMatrix4(Gu);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=n.index,f=n.attributes.position;if(u!==null){const d=Math.max(0,o.start),_=Math.min(u.count,o.start+o.count);for(let x=d,m=_-1;x<m;x+=c){const p=u.getX(x),b=u.getX(x+1),M=So(this,e,fr,l,p,b,x);M&&t.push(M)}if(this.isLineLoop){const x=u.getX(_-1),m=u.getX(d),p=So(this,e,fr,l,x,m,_-1);p&&t.push(p)}}else{const d=Math.max(0,o.start),_=Math.min(f.count,o.start+o.count);for(let x=d,m=_-1;x<m;x+=c){const p=So(this,e,fr,l,x,x+1,x);p&&t.push(p)}if(this.isLineLoop){const x=So(this,e,fr,l,_-1,d,_-1);x&&t.push(x)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function So(i,e,t,n,s,r,o){const a=i.geometry.attributes.position;if($o.fromBufferAttribute(a,s),jo.fromBufferAttribute(a,r),t.distanceSqToSegment($o,jo,qa,Wu)>n)return;qa.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(qa);if(!(c<e.near||c>e.far))return{distance:c,point:Wu.clone().applyMatrix4(i.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:i}}const Xu=new I,Yu=new I;class fm extends Nc{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)Xu.fromBufferAttribute(t,s),Yu.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Xu.distanceTo(Yu);e.setAttribute("lineDistance",new Xe(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class dm extends Nc{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class Of extends Dn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new De(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const qu=new He,ic=new la,bo=new Zn,Eo=new I;class pm extends mt{constructor(e=new Mt,t=new Of){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),bo.copy(n.boundingSphere),bo.applyMatrix4(s),bo.radius+=r,e.ray.intersectsSphere(bo)===!1)return;qu.copy(s).invert(),ic.copy(e.ray).applyMatrix4(qu);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){const f=Math.max(0,o.start),d=Math.min(c.count,o.start+o.count);for(let _=f,x=d;_<x;_++){const m=c.getX(_);Eo.fromBufferAttribute(h,m),Ku(Eo,m,l,s,e,t,this)}}else{const f=Math.max(0,o.start),d=Math.min(h.count,o.start+o.count);for(let _=f,x=d;_<x;_++)Eo.fromBufferAttribute(h,_),Ku(Eo,_,l,s,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function Ku(i,e,t,n,s,r,o){const a=ic.distanceSqToPoint(i);if(a<t){const l=new I;ic.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}class Zo extends It{constructor(e,t,n,s,r,o,a,l,c){super(e,t,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Bf extends It{constructor(e,t,n=ts,s,r,o,a=Zt,l=Zt,c,u=Ir,h=1){if(u!==Ir&&u!==Dr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:e,height:t,depth:h};super(f,s,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ac(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class zf extends It{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Uc extends Mt{constructor(e=1,t=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:s,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));const o=[],a=[],l=[],c=[],u=t/2,h=Math.PI/2*e,f=t,d=2*h+f,_=n*2+r,x=s+1,m=new I,p=new I;for(let b=0;b<=_;b++){let M=0,v=0,w=0,C=0;if(b<=n){const g=b/n,y=g*Math.PI/2;v=-u-e*Math.cos(y),w=e*Math.sin(y),C=-e*Math.cos(y),M=g*h}else if(b<=n+r){const g=(b-n)/r;v=-u+g*t,w=e,C=0,M=h+g*f}else{const g=(b-n-r)/n,y=g*Math.PI/2;v=u+e*Math.sin(y),w=e*Math.cos(y),C=e*Math.sin(y),M=h+f+g*h}const R=Math.max(0,Math.min(1,M/d));let A=0;b===0?A=.5/s:b===_&&(A=-.5/s);for(let g=0;g<=s;g++){const y=g/s,S=y*Math.PI*2,N=Math.sin(S),D=Math.cos(S);p.x=-w*D,p.y=v,p.z=w*N,a.push(p.x,p.y,p.z),m.set(-w*D,C,w*N),m.normalize(),l.push(m.x,m.y,m.z),c.push(y+A,R)}if(b>0){const g=(b-1)*x;for(let y=0;y<s;y++){const S=g+y,N=g+y+1,D=b*x+y,P=b*x+y+1;o.push(S,N,D),o.push(N,P,D)}}}this.setIndex(o),this.setAttribute("position",new Xe(a,3)),this.setAttribute("normal",new Xe(l,3)),this.setAttribute("uv",new Xe(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Uc(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}}class ca extends Mt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);const r=[],o=[],a=[],l=[],c=new I,u=new ie;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let h=0,f=3;h<=t;h++,f+=3){const d=n+h/t*s;c.x=e*Math.cos(d),c.y=e*Math.sin(d),o.push(c.x,c.y,c.z),a.push(0,0,1),u.x=(o[f]/e+1)/2,u.y=(o[f+1]/e+1)/2,l.push(u.x,u.y)}for(let h=1;h<=t;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new Xe(o,3)),this.setAttribute("normal",new Xe(a,3)),this.setAttribute("uv",new Xe(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ca(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class ui extends Mt{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const u=[],h=[],f=[],d=[];let _=0;const x=[],m=n/2;let p=0;b(),o===!1&&(e>0&&M(!0),t>0&&M(!1)),this.setIndex(u),this.setAttribute("position",new Xe(h,3)),this.setAttribute("normal",new Xe(f,3)),this.setAttribute("uv",new Xe(d,2));function b(){const v=new I,w=new I;let C=0;const R=(t-e)/n;for(let A=0;A<=r;A++){const g=[],y=A/r,S=y*(t-e)+e;for(let N=0;N<=s;N++){const D=N/s,P=D*l+a,U=Math.sin(P),O=Math.cos(P);w.x=S*U,w.y=-y*n+m,w.z=S*O,h.push(w.x,w.y,w.z),v.set(U,R,O).normalize(),f.push(v.x,v.y,v.z),d.push(D,1-y),g.push(_++)}x.push(g)}for(let A=0;A<s;A++)for(let g=0;g<r;g++){const y=x[g][A],S=x[g+1][A],N=x[g+1][A+1],D=x[g][A+1];(e>0||g!==0)&&(u.push(y,S,D),C+=3),(t>0||g!==r-1)&&(u.push(S,N,D),C+=3)}c.addGroup(p,C,0),p+=C}function M(v){const w=_,C=new ie,R=new I;let A=0;const g=v===!0?e:t,y=v===!0?1:-1;for(let N=1;N<=s;N++)h.push(0,m*y,0),f.push(0,y,0),d.push(.5,.5),_++;const S=_;for(let N=0;N<=s;N++){const P=N/s*l+a,U=Math.cos(P),O=Math.sin(P);R.x=g*O,R.y=m*y,R.z=g*U,h.push(R.x,R.y,R.z),f.push(0,y,0),C.x=U*.5+.5,C.y=O*.5*y+.5,d.push(C.x,C.y),_++}for(let N=0;N<s;N++){const D=w+N,P=S+N;v===!0?u.push(P,P+1,D):u.push(P+1,P,D),A+=3}c.addGroup(p,A,v===!0?1:2),p+=A}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ui(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Ti extends ui{constructor(e=1,t=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new Ti(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Fc extends Mt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};const r=[],o=[];a(s),c(n),u(),this.setAttribute("position",new Xe(r,3)),this.setAttribute("normal",new Xe(r.slice(),3)),this.setAttribute("uv",new Xe(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(b){const M=new I,v=new I,w=new I;for(let C=0;C<t.length;C+=3)d(t[C+0],M),d(t[C+1],v),d(t[C+2],w),l(M,v,w,b)}function l(b,M,v,w){const C=w+1,R=[];for(let A=0;A<=C;A++){R[A]=[];const g=b.clone().lerp(v,A/C),y=M.clone().lerp(v,A/C),S=C-A;for(let N=0;N<=S;N++)N===0&&A===C?R[A][N]=g:R[A][N]=g.clone().lerp(y,N/S)}for(let A=0;A<C;A++)for(let g=0;g<2*(C-A)-1;g++){const y=Math.floor(g/2);g%2===0?(f(R[A][y+1]),f(R[A+1][y]),f(R[A][y])):(f(R[A][y+1]),f(R[A+1][y+1]),f(R[A+1][y]))}}function c(b){const M=new I;for(let v=0;v<r.length;v+=3)M.x=r[v+0],M.y=r[v+1],M.z=r[v+2],M.normalize().multiplyScalar(b),r[v+0]=M.x,r[v+1]=M.y,r[v+2]=M.z}function u(){const b=new I;for(let M=0;M<r.length;M+=3){b.x=r[M+0],b.y=r[M+1],b.z=r[M+2];const v=m(b)/2/Math.PI+.5,w=p(b)/Math.PI+.5;o.push(v,1-w)}_(),h()}function h(){for(let b=0;b<o.length;b+=6){const M=o[b+0],v=o[b+2],w=o[b+4],C=Math.max(M,v,w),R=Math.min(M,v,w);C>.9&&R<.1&&(M<.2&&(o[b+0]+=1),v<.2&&(o[b+2]+=1),w<.2&&(o[b+4]+=1))}}function f(b){r.push(b.x,b.y,b.z)}function d(b,M){const v=b*3;M.x=e[v+0],M.y=e[v+1],M.z=e[v+2]}function _(){const b=new I,M=new I,v=new I,w=new I,C=new ie,R=new ie,A=new ie;for(let g=0,y=0;g<r.length;g+=9,y+=6){b.set(r[g+0],r[g+1],r[g+2]),M.set(r[g+3],r[g+4],r[g+5]),v.set(r[g+6],r[g+7],r[g+8]),C.set(o[y+0],o[y+1]),R.set(o[y+2],o[y+3]),A.set(o[y+4],o[y+5]),w.copy(b).add(M).add(v).divideScalar(3);const S=m(w);x(C,y+0,b,S),x(R,y+2,M,S),x(A,y+4,v,S)}}function x(b,M,v,w){w<0&&b.x===1&&(o[M]=b.x-1),v.x===0&&v.z===0&&(o[M]=w/2/Math.PI+.5)}function m(b){return Math.atan2(b.z,-b.x)}function p(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fc(e.vertices,e.indices,e.radius,e.details)}}class Jn{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){const n=this.getLengths();let s=0;const r=n.length;let o;t?o=t:o=e*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);const u=n[s],f=n[s+1]-u,d=(o-u)/f;return(s+d)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new ie:new I);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){const n=new I,s=[],r=[],o=[],a=new I,l=new He;for(let d=0;d<=e;d++){const _=d/e;s[d]=this.getTangentAt(_,new I)}r[0]=new I,o[0]=new I;let c=Number.MAX_VALUE;const u=Math.abs(s[0].x),h=Math.abs(s[0].y),f=Math.abs(s[0].z);u<=c&&(c=u,n.set(1,0,0)),h<=c&&(c=h,n.set(0,1,0)),f<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let d=1;d<=e;d++){if(r[d]=r[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(s[d-1],s[d]),a.length()>Number.EPSILON){a.normalize();const _=Math.acos($e(s[d-1].dot(s[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(a,_))}o[d].crossVectors(s[d],r[d])}if(t===!0){let d=Math.acos($e(r[0].dot(r[e]),-1,1));d/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(d=-d);for(let _=1;_<=e;_++)r[_].applyMatrix4(l.makeRotationAxis(s[_],d*_)),o[_].crossVectors(s[_],r[_])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}class Oc extends Jn{constructor(e=0,t=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new ie){const n=t,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+e*r;let l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*u-d*h+this.aX,c=f*h+d*u+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}}class mm extends Oc{constructor(e,t,n,s,r,o){super(e,t,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Bc(){let i=0,e=0,t=0,n=0;function s(r,o,a,l){i=r,e=a,t=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,u,h){let f=(o-r)/c-(a-r)/(c+u)+(a-o)/u,d=(a-o)/u-(l-o)/(u+h)+(l-a)/h;f*=u,d*=u,s(o,a,f,d)},calc:function(r){const o=r*r,a=o*r;return i+e*r+t*o+n*a}}}const To=new I,Ka=new Bc,$a=new Bc,ja=new Bc;class kf extends Jn{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new I){const n=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e;let a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,u;this.closed||a>0?c=s[(a-1)%r]:(To.subVectors(s[0],s[1]).add(s[0]),c=To);const h=s[a%r],f=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(To.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=To),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let _=Math.pow(c.distanceToSquared(h),d),x=Math.pow(h.distanceToSquared(f),d),m=Math.pow(f.distanceToSquared(u),d);x<1e-4&&(x=1),_<1e-4&&(_=x),m<1e-4&&(m=x),Ka.initNonuniformCatmullRom(c.x,h.x,f.x,u.x,_,x,m),$a.initNonuniformCatmullRom(c.y,h.y,f.y,u.y,_,x,m),ja.initNonuniformCatmullRom(c.z,h.z,f.z,u.z,_,x,m)}else this.curveType==="catmullrom"&&(Ka.initCatmullRom(c.x,h.x,f.x,u.x,this.tension),$a.initCatmullRom(c.y,h.y,f.y,u.y,this.tension),ja.initCatmullRom(c.z,h.z,f.z,u.z,this.tension));return n.set(Ka.calc(l),$a.calc(l),ja.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const s=e.points[t];this.points.push(new I().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}function $u(i,e,t,n,s){const r=(n-e)*.5,o=(s-t)*.5,a=i*i,l=i*a;return(2*t-2*n+r+o)*l+(-3*t+3*n-2*r-o)*a+r*i+t}function gm(i,e){const t=1-i;return t*t*e}function _m(i,e){return 2*(1-i)*i*e}function vm(i,e){return i*i*e}function Sr(i,e,t,n){return gm(i,e)+_m(i,t)+vm(i,n)}function xm(i,e){const t=1-i;return t*t*t*e}function ym(i,e){const t=1-i;return 3*t*t*i*e}function Mm(i,e){return 3*(1-i)*i*i*e}function Sm(i,e){return i*i*i*e}function br(i,e,t,n,s){return xm(i,e)+ym(i,t)+Mm(i,n)+Sm(i,s)}class Hf extends Jn{constructor(e=new ie,t=new ie,n=new ie,s=new ie){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new ie){const n=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(br(e,s.x,r.x,o.x,a.x),br(e,s.y,r.y,o.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class bm extends Jn{constructor(e=new I,t=new I,n=new I,s=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new I){const n=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(br(e,s.x,r.x,o.x,a.x),br(e,s.y,r.y,o.y,a.y),br(e,s.z,r.z,o.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class Vf extends Jn{constructor(e=new ie,t=new ie){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ie){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ie){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Em extends Jn{constructor(e=new I,t=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new I){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new I){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Gf extends Jn{constructor(e=new ie,t=new ie,n=new ie){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ie){const n=t,s=this.v0,r=this.v1,o=this.v2;return n.set(Sr(e,s.x,r.x,o.x),Sr(e,s.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Wf extends Jn{constructor(e=new I,t=new I,n=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new I){const n=t,s=this.v0,r=this.v1,o=this.v2;return n.set(Sr(e,s.x,r.x,o.x),Sr(e,s.y,r.y,o.y),Sr(e,s.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Xf extends Jn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ie){const n=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],u=s[o>s.length-2?s.length-1:o+1],h=s[o>s.length-3?s.length-1:o+2];return n.set($u(a,l.x,c.x,u.x,h.x),$u(a,l.y,c.y,u.y,h.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const s=e.points[t];this.points.push(s.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const s=e.points[t];this.points.push(new ie().fromArray(s))}return this}}var Jo=Object.freeze({__proto__:null,ArcCurve:mm,CatmullRomCurve3:kf,CubicBezierCurve:Hf,CubicBezierCurve3:bm,EllipseCurve:Oc,LineCurve:Vf,LineCurve3:Em,QuadraticBezierCurve:Gf,QuadraticBezierCurve3:Wf,SplineCurve:Xf});class Tm extends Jn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Jo[n](t,e))}return this}getPoint(e,t){const n=e*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){const u=l[c];n&&n.equals(u)||(t.push(u),n=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){const s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const s=e.curves[t];this.curves.push(new Jo[s.type]().fromJSON(s))}return this}}class ju extends Tm{constructor(e){super(),this.type="Path",this.currentPoint=new ie,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const n=new Vf(this.currentPoint.clone(),new ie(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,s){const r=new Gf(this.currentPoint.clone(),new ie(e,t),new ie(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(e,t,n,s,r,o){const a=new Hf(this.currentPoint.clone(),new ie(e,t),new ie(n,s),new ie(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),n=new Xf(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,s,r,o){const a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,n,s,r,o),this}absarc(e,t,n,s,r,o){return this.absellipse(e,t,n,n,s,r,o),this}ellipse(e,t,n,s,r,o,a,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+c,t+u,n,s,r,o,a,l),this}absellipse(e,t,n,s,r,o,a,l){const c=new Oc(e,t,n,s,r,o,a,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}}class Yf extends ju{constructor(e){super(e),this.uuid=yn(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let n=0,s=this.holes.length;n<s;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){const s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const s=e.holes[t];this.holes.push(new ju().fromJSON(s))}return this}}function wm(i,e,t=2){const n=e&&e.length,s=n?e[0]*t:i.length;let r=qf(i,0,s,t,!0);const o=[];if(!r||r.next===r.prev)return o;let a,l,c;if(n&&(r=Lm(i,e,r,t)),i.length>80*t){a=1/0,l=1/0;let u=-1/0,h=-1/0;for(let f=t;f<s;f+=t){const d=i[f],_=i[f+1];d<a&&(a=d),_<l&&(l=_),d>u&&(u=d),_>h&&(h=_)}c=Math.max(u-a,h-l),c=c!==0?32767/c:0}return zr(r,o,t,a,l,c,0),o}function qf(i,e,t,n,s){let r;if(s===Vm(i,e,t,n)>0)for(let o=e;o<t;o+=n)r=Zu(o/n|0,i[o],i[o+1],r);else for(let o=t-n;o>=e;o-=n)r=Zu(o/n|0,i[o],i[o+1],r);return r&&Hs(r,r.next)&&(Hr(r),r=r.next),r}function ns(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(Hs(t,t.next)||Et(t.prev,t,t.next)===0)){if(Hr(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function zr(i,e,t,n,s,r,o){if(!i)return;!o&&r&&Fm(i,n,s,r);let a=i;for(;i.prev!==i.next;){const l=i.prev,c=i.next;if(r?Rm(i,n,s,r):Am(i)){e.push(l.i,i.i,c.i),Hr(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=Cm(ns(i),e),zr(i,e,t,n,s,r,2)):o===2&&Pm(i,e,t,n,s,r):zr(ns(i),e,t,n,s,r,1);break}}}function Am(i){const e=i.prev,t=i,n=i.next;if(Et(e,t,n)>=0)return!1;const s=e.x,r=t.x,o=n.x,a=e.y,l=t.y,c=n.y,u=Math.min(s,r,o),h=Math.min(a,l,c),f=Math.max(s,r,o),d=Math.max(a,l,c);let _=n.next;for(;_!==e;){if(_.x>=u&&_.x<=f&&_.y>=h&&_.y<=d&&_r(s,a,r,l,o,c,_.x,_.y)&&Et(_.prev,_,_.next)>=0)return!1;_=_.next}return!0}function Rm(i,e,t,n){const s=i.prev,r=i,o=i.next;if(Et(s,r,o)>=0)return!1;const a=s.x,l=r.x,c=o.x,u=s.y,h=r.y,f=o.y,d=Math.min(a,l,c),_=Math.min(u,h,f),x=Math.max(a,l,c),m=Math.max(u,h,f),p=sc(d,_,e,t,n),b=sc(x,m,e,t,n);let M=i.prevZ,v=i.nextZ;for(;M&&M.z>=p&&v&&v.z<=b;){if(M.x>=d&&M.x<=x&&M.y>=_&&M.y<=m&&M!==s&&M!==o&&_r(a,u,l,h,c,f,M.x,M.y)&&Et(M.prev,M,M.next)>=0||(M=M.prevZ,v.x>=d&&v.x<=x&&v.y>=_&&v.y<=m&&v!==s&&v!==o&&_r(a,u,l,h,c,f,v.x,v.y)&&Et(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;M&&M.z>=p;){if(M.x>=d&&M.x<=x&&M.y>=_&&M.y<=m&&M!==s&&M!==o&&_r(a,u,l,h,c,f,M.x,M.y)&&Et(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;v&&v.z<=b;){if(v.x>=d&&v.x<=x&&v.y>=_&&v.y<=m&&v!==s&&v!==o&&_r(a,u,l,h,c,f,v.x,v.y)&&Et(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function Cm(i,e){let t=i;do{const n=t.prev,s=t.next.next;!Hs(n,s)&&$f(n,t,t.next,s)&&kr(n,s)&&kr(s,n)&&(e.push(n.i,t.i,s.i),Hr(t),Hr(t.next),t=i=s),t=t.next}while(t!==i);return ns(t)}function Pm(i,e,t,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&zm(o,a)){let l=jf(o,a);o=ns(o,o.next),l=ns(l,l.next),zr(o,e,t,n,s,r,0),zr(l,e,t,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function Lm(i,e,t,n){const s=[];for(let r=0,o=e.length;r<o;r++){const a=e[r]*n,l=r<o-1?e[r+1]*n:i.length,c=qf(i,a,l,n,!1);c===c.next&&(c.steiner=!0),s.push(Bm(c))}s.sort(Im);for(let r=0;r<s.length;r++)t=Dm(s[r],t);return t}function Im(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=n-s}return t}function Dm(i,e){const t=Nm(i,e);if(!t)return e;const n=jf(t,i);return ns(n,n.next),ns(t,t.next)}function Nm(i,e){let t=e;const n=i.x,s=i.y;let r=-1/0,o;if(Hs(i,t))return t;do{if(Hs(i,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){const h=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(h<=n&&h>r&&(r=h,o=t.x<t.next.x?t:t.next,h===n))return o}t=t.next}while(t!==e);if(!o)return null;const a=o,l=o.x,c=o.y;let u=1/0;t=o;do{if(n>=t.x&&t.x>=l&&n!==t.x&&Kf(s<c?n:r,s,l,c,s<c?r:n,s,t.x,t.y)){const h=Math.abs(s-t.y)/(n-t.x);kr(t,i)&&(h<u||h===u&&(t.x>o.x||t.x===o.x&&Um(o,t)))&&(o=t,u=h)}t=t.next}while(t!==a);return o}function Um(i,e){return Et(i.prev,i,e.prev)<0&&Et(e.next,i,i.next)<0}function Fm(i,e,t,n){let s=i;do s.z===0&&(s.z=sc(s.x,s.y,e,t,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Om(s)}function Om(i){let e,t=1;do{let n=i,s;i=null;let r=null;for(e=0;n;){e++;let o=n,a=0;for(let c=0;c<t&&(a++,o=o.nextZ,!!o);c++);let l=t;for(;a>0||l>0&&o;)a!==0&&(l===0||!o||n.z<=o.z)?(s=n,n=n.nextZ,a--):(s=o,o=o.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=o}r.nextZ=null,t*=2}while(e>1);return i}function sc(i,e,t,n,s){return i=(i-t)*s|0,e=(e-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function Bm(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function Kf(i,e,t,n,s,r,o,a){return(s-o)*(e-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(s-o)*(n-a)}function _r(i,e,t,n,s,r,o,a){return!(i===o&&e===a)&&Kf(i,e,t,n,s,r,o,a)}function zm(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!km(i,e)&&(kr(i,e)&&kr(e,i)&&Hm(i,e)&&(Et(i.prev,i,e.prev)||Et(i,e.prev,e))||Hs(i,e)&&Et(i.prev,i,i.next)>0&&Et(e.prev,e,e.next)>0)}function Et(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function Hs(i,e){return i.x===e.x&&i.y===e.y}function $f(i,e,t,n){const s=Ao(Et(i,e,t)),r=Ao(Et(i,e,n)),o=Ao(Et(t,n,i)),a=Ao(Et(t,n,e));return!!(s!==r&&o!==a||s===0&&wo(i,t,e)||r===0&&wo(i,n,e)||o===0&&wo(t,i,n)||a===0&&wo(t,e,n))}function wo(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function Ao(i){return i>0?1:i<0?-1:0}function km(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&$f(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function kr(i,e){return Et(i.prev,i,i.next)<0?Et(i,e,i.next)>=0&&Et(i,i.prev,e)>=0:Et(i,e,i.prev)<0||Et(i,i.next,e)<0}function Hm(i,e){let t=i,n=!1;const s=(i.x+e.x)/2,r=(i.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function jf(i,e){const t=rc(i.i,i.x,i.y),n=rc(e.i,e.x,e.y),s=i.next,r=e.prev;return i.next=e,e.prev=i,t.next=s,s.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function Zu(i,e,t,n){const s=rc(i,e,t);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Hr(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function rc(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Vm(i,e,t,n){let s=0;for(let r=e,o=t-n;r<t;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}class Gm{static triangulate(e,t,n=2){return wm(e,t,n)}}class Cs{static area(e){const t=e.length;let n=0;for(let s=t-1,r=0;r<t;s=r++)n+=e[s].x*e[r].y-e[r].x*e[s].y;return n*.5}static isClockWise(e){return Cs.area(e)<0}static triangulateShape(e,t){const n=[],s=[],r=[];Ju(e),Qu(n,e);let o=e.length;t.forEach(Ju);for(let l=0;l<t.length;l++)s.push(o),o+=t[l].length,Qu(n,t[l]);const a=Gm.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}}function Ju(i){const e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function Qu(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}class zc extends Mt{constructor(e=new Yf([new ie(.5,.5),new ie(-.5,.5),new ie(-.5,-.5),new ie(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];const n=this,s=[],r=[];for(let a=0,l=e.length;a<l;a++){const c=e[a];o(c)}this.setAttribute("position",new Xe(s,3)),this.setAttribute("uv",new Xe(r,2)),this.computeVertexNormals();function o(a){const l=[],c=t.curveSegments!==void 0?t.curveSegments:12,u=t.steps!==void 0?t.steps:1,h=t.depth!==void 0?t.depth:1;let f=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,_=t.bevelSize!==void 0?t.bevelSize:d-.1,x=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3;const p=t.extrudePath,b=t.UVGenerator!==void 0?t.UVGenerator:Wm;let M,v=!1,w,C,R,A;p&&(M=p.getSpacedPoints(u),v=!0,f=!1,w=p.computeFrenetFrames(u,!1),C=new I,R=new I,A=new I),f||(m=0,d=0,_=0,x=0);const g=a.extractPoints(c);let y=g.shape;const S=g.holes;if(!Cs.isClockWise(y)){y=y.reverse();for(let se=0,te=S.length;se<te;se++){const j=S[se];Cs.isClockWise(j)&&(S[se]=j.reverse())}}function D(se){const j=10000000000000001e-36;let J=se[0];for(let ge=1;ge<=se.length;ge++){const le=ge%se.length,_e=se[le],Ve=_e.x-J.x,ke=_e.y-J.y,L=Ve*Ve+ke*ke,E=Math.max(Math.abs(_e.x),Math.abs(_e.y),Math.abs(J.x),Math.abs(J.y)),G=j*E*E;if(L<=G){se.splice(le,1),ge--;continue}J=_e}}D(y),S.forEach(D);const P=S.length,U=y;for(let se=0;se<P;se++){const te=S[se];y=y.concat(te)}function O(se,te,j){return te||console.error("THREE.ExtrudeGeometry: vec does not exist"),se.clone().addScaledVector(te,j)}const W=y.length;function H(se,te,j){let J,ge,le;const _e=se.x-te.x,Ve=se.y-te.y,ke=j.x-se.x,L=j.y-se.y,E=_e*_e+Ve*Ve,G=_e*L-Ve*ke;if(Math.abs(G)>Number.EPSILON){const K=Math.sqrt(E),oe=Math.sqrt(ke*ke+L*L),$=te.x-Ve/K,Ie=te.y+_e/K,pe=j.x-L/oe,Ce=j.y+ke/oe,Pe=((pe-$)*L-(Ce-Ie)*ke)/(_e*L-Ve*ke);J=$+_e*Pe-se.x,ge=Ie+Ve*Pe-se.y;const ce=J*J+ge*ge;if(ce<=2)return new ie(J,ge);le=Math.sqrt(ce/2)}else{let K=!1;_e>Number.EPSILON?ke>Number.EPSILON&&(K=!0):_e<-Number.EPSILON?ke<-Number.EPSILON&&(K=!0):Math.sign(Ve)===Math.sign(L)&&(K=!0),K?(J=-Ve,ge=_e,le=Math.sqrt(E)):(J=_e,ge=Ve,le=Math.sqrt(E/2))}return new ie(J/le,ge/le)}const Z=[];for(let se=0,te=U.length,j=te-1,J=se+1;se<te;se++,j++,J++)j===te&&(j=0),J===te&&(J=0),Z[se]=H(U[se],U[j],U[J]);const ae=[];let z,Q=Z.concat();for(let se=0,te=P;se<te;se++){const j=S[se];z=[];for(let J=0,ge=j.length,le=ge-1,_e=J+1;J<ge;J++,le++,_e++)le===ge&&(le=0),_e===ge&&(_e=0),z[J]=H(j[J],j[le],j[_e]);ae.push(z),Q=Q.concat(z)}let re;if(m===0)re=Cs.triangulateShape(U,S);else{const se=[],te=[];for(let j=0;j<m;j++){const J=j/m,ge=d*Math.cos(J*Math.PI/2),le=_*Math.sin(J*Math.PI/2)+x;for(let _e=0,Ve=U.length;_e<Ve;_e++){const ke=O(U[_e],Z[_e],le);Me(ke.x,ke.y,-ge),J===0&&se.push(ke)}for(let _e=0,Ve=P;_e<Ve;_e++){const ke=S[_e];z=ae[_e];const L=[];for(let E=0,G=ke.length;E<G;E++){const K=O(ke[E],z[E],le);Me(K.x,K.y,-ge),J===0&&L.push(K)}J===0&&te.push(L)}}re=Cs.triangulateShape(se,te)}const de=re.length,Re=_+x;for(let se=0;se<W;se++){const te=f?O(y[se],Q[se],Re):y[se];v?(R.copy(w.normals[0]).multiplyScalar(te.x),C.copy(w.binormals[0]).multiplyScalar(te.y),A.copy(M[0]).add(R).add(C),Me(A.x,A.y,A.z)):Me(te.x,te.y,0)}for(let se=1;se<=u;se++)for(let te=0;te<W;te++){const j=f?O(y[te],Q[te],Re):y[te];v?(R.copy(w.normals[se]).multiplyScalar(j.x),C.copy(w.binormals[se]).multiplyScalar(j.y),A.copy(M[se]).add(R).add(C),Me(A.x,A.y,A.z)):Me(j.x,j.y,h/u*se)}for(let se=m-1;se>=0;se--){const te=se/m,j=d*Math.cos(te*Math.PI/2),J=_*Math.sin(te*Math.PI/2)+x;for(let ge=0,le=U.length;ge<le;ge++){const _e=O(U[ge],Z[ge],J);Me(_e.x,_e.y,h+j)}for(let ge=0,le=S.length;ge<le;ge++){const _e=S[ge];z=ae[ge];for(let Ve=0,ke=_e.length;Ve<ke;Ve++){const L=O(_e[Ve],z[Ve],J);v?Me(L.x,L.y+M[u-1].y,M[u-1].x+j):Me(L.x,L.y,h+j)}}}q(),ee();function q(){const se=s.length/3;if(f){let te=0,j=W*te;for(let J=0;J<de;J++){const ge=re[J];ye(ge[2]+j,ge[1]+j,ge[0]+j)}te=u+m*2,j=W*te;for(let J=0;J<de;J++){const ge=re[J];ye(ge[0]+j,ge[1]+j,ge[2]+j)}}else{for(let te=0;te<de;te++){const j=re[te];ye(j[2],j[1],j[0])}for(let te=0;te<de;te++){const j=re[te];ye(j[0]+W*u,j[1]+W*u,j[2]+W*u)}}n.addGroup(se,s.length/3-se,0)}function ee(){const se=s.length/3;let te=0;me(U,te),te+=U.length;for(let j=0,J=S.length;j<J;j++){const ge=S[j];me(ge,te),te+=ge.length}n.addGroup(se,s.length/3-se,1)}function me(se,te){let j=se.length;for(;--j>=0;){const J=j;let ge=j-1;ge<0&&(ge=se.length-1);for(let le=0,_e=u+m*2;le<_e;le++){const Ve=W*le,ke=W*(le+1),L=te+J+Ve,E=te+ge+Ve,G=te+ge+ke,K=te+J+ke;Ze(L,E,G,K)}}}function Me(se,te,j){l.push(se),l.push(te),l.push(j)}function ye(se,te,j){at(se),at(te),at(j);const J=s.length/3,ge=b.generateTopUV(n,s,J-3,J-2,J-1);F(ge[0]),F(ge[1]),F(ge[2])}function Ze(se,te,j,J){at(se),at(te),at(J),at(te),at(j),at(J);const ge=s.length/3,le=b.generateSideWallUV(n,s,ge-6,ge-3,ge-2,ge-1);F(le[0]),F(le[1]),F(le[3]),F(le[1]),F(le[2]),F(le[3])}function at(se){s.push(l[se*3+0]),s.push(l[se*3+1]),s.push(l[se*3+2])}function F(se){r.push(se.x),r.push(se.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Xm(t,n,e)}static fromJSON(e,t){const n=[];for(let r=0,o=e.shapes.length;r<o;r++){const a=t[e.shapes[r]];n.push(a)}const s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new Jo[s.type]().fromJSON(s)),new zc(n,e.options)}}const Wm={generateTopUV:function(i,e,t,n,s){const r=e[t*3],o=e[t*3+1],a=e[n*3],l=e[n*3+1],c=e[s*3],u=e[s*3+1];return[new ie(r,o),new ie(a,l),new ie(c,u)]},generateSideWallUV:function(i,e,t,n,s,r){const o=e[t*3],a=e[t*3+1],l=e[t*3+2],c=e[n*3],u=e[n*3+1],h=e[n*3+2],f=e[s*3],d=e[s*3+1],_=e[s*3+2],x=e[r*3],m=e[r*3+1],p=e[r*3+2];return Math.abs(a-u)<Math.abs(o-c)?[new ie(o,1-l),new ie(c,1-h),new ie(f,1-_),new ie(x,1-p)]:[new ie(a,1-l),new ie(u,1-h),new ie(d,1-_),new ie(m,1-p)]}};function Xm(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];t.shapes.push(r.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}class kc extends Mt{constructor(e=[new ie(0,-.5),new ie(.5,0),new ie(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=$e(s,0,Math.PI*2);const r=[],o=[],a=[],l=[],c=[],u=1/t,h=new I,f=new ie,d=new I,_=new I,x=new I;let m=0,p=0;for(let b=0;b<=e.length-1;b++)switch(b){case 0:m=e[b+1].x-e[b].x,p=e[b+1].y-e[b].y,d.x=p*1,d.y=-m,d.z=p*0,x.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(x.x,x.y,x.z);break;default:m=e[b+1].x-e[b].x,p=e[b+1].y-e[b].y,d.x=p*1,d.y=-m,d.z=p*0,_.copy(d),d.x+=x.x,d.y+=x.y,d.z+=x.z,d.normalize(),l.push(d.x,d.y,d.z),x.copy(_)}for(let b=0;b<=t;b++){const M=n+b*u*s,v=Math.sin(M),w=Math.cos(M);for(let C=0;C<=e.length-1;C++){h.x=e[C].x*v,h.y=e[C].y,h.z=e[C].x*w,o.push(h.x,h.y,h.z),f.x=b/t,f.y=C/(e.length-1),a.push(f.x,f.y);const R=l[3*C+0]*v,A=l[3*C+1],g=l[3*C+0]*w;c.push(R,A,g)}}for(let b=0;b<t;b++)for(let M=0;M<e.length-1;M++){const v=M+b*e.length,w=v,C=v+e.length,R=v+e.length+1,A=v+1;r.push(w,C,A),r.push(R,A,C)}this.setIndex(r),this.setAttribute("position",new Xe(o,3)),this.setAttribute("uv",new Xe(a,2)),this.setAttribute("normal",new Xe(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new kc(e.points,e.segments,e.phiStart,e.phiLength)}}class Qo extends Fc{constructor(e=1,t=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Qo(e.radius,e.detail)}}class Gn extends Mt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(s),c=a+1,u=l+1,h=e/a,f=t/l,d=[],_=[],x=[],m=[];for(let p=0;p<u;p++){const b=p*f-o;for(let M=0;M<c;M++){const v=M*h-r;_.push(v,-b,0),x.push(0,0,1),m.push(M/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<a;b++){const M=b+c*p,v=b+c*(p+1),w=b+1+c*(p+1),C=b+1+c*p;d.push(M,v,C),d.push(v,w,C)}this.setIndex(d),this.setAttribute("position",new Xe(_,3)),this.setAttribute("normal",new Xe(x,3)),this.setAttribute("uv",new Xe(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Gn(e.width,e.height,e.widthSegments,e.heightSegments)}}class js extends Mt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new I,f=new I,d=[],_=[],x=[],m=[];for(let p=0;p<=n;p++){const b=[],M=p/n;let v=0;p===0&&o===0?v=.5/t:p===n&&l===Math.PI&&(v=-.5/t);for(let w=0;w<=t;w++){const C=w/t;h.x=-e*Math.cos(s+C*r)*Math.sin(o+M*a),h.y=e*Math.cos(o+M*a),h.z=e*Math.sin(s+C*r)*Math.sin(o+M*a),_.push(h.x,h.y,h.z),f.copy(h).normalize(),x.push(f.x,f.y,f.z),m.push(C+v,1-M),b.push(c++)}u.push(b)}for(let p=0;p<n;p++)for(let b=0;b<t;b++){const M=u[p][b+1],v=u[p][b],w=u[p+1][b],C=u[p+1][b+1];(p!==0||o>0)&&d.push(M,v,C),(p!==n-1||l<Math.PI)&&d.push(v,w,C)}this.setIndex(d),this.setAttribute("position",new Xe(_,3)),this.setAttribute("normal",new Xe(x,3)),this.setAttribute("uv",new Xe(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new js(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class tn extends Mt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],l=[],c=[],u=new I,h=new I,f=new I;for(let d=0;d<=n;d++)for(let _=0;_<=s;_++){const x=_/s*r,m=d/n*Math.PI*2;h.x=(e+t*Math.cos(m))*Math.cos(x),h.y=(e+t*Math.cos(m))*Math.sin(x),h.z=t*Math.sin(m),a.push(h.x,h.y,h.z),u.x=e*Math.cos(x),u.y=e*Math.sin(x),f.subVectors(h,u).normalize(),l.push(f.x,f.y,f.z),c.push(_/s),c.push(d/n)}for(let d=1;d<=n;d++)for(let _=1;_<=s;_++){const x=(s+1)*d+_-1,m=(s+1)*(d-1)+_-1,p=(s+1)*(d-1)+_,b=(s+1)*d+_;o.push(x,m,b),o.push(m,p,b)}this.setIndex(o),this.setAttribute("position",new Xe(a,3)),this.setAttribute("normal",new Xe(l,3)),this.setAttribute("uv",new Xe(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tn(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class Hc extends Mt{constructor(e=new Wf(new I(-1,-1,0),new I(-1,1,0),new I(1,1,0)),t=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:s,closed:r};const o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new I,l=new I,c=new ie;let u=new I;const h=[],f=[],d=[],_=[];x(),this.setIndex(_),this.setAttribute("position",new Xe(h,3)),this.setAttribute("normal",new Xe(f,3)),this.setAttribute("uv",new Xe(d,2));function x(){for(let M=0;M<t;M++)m(M);m(r===!1?t:0),b(),p()}function m(M){u=e.getPointAt(M/t,u);const v=o.normals[M],w=o.binormals[M];for(let C=0;C<=s;C++){const R=C/s*Math.PI*2,A=Math.sin(R),g=-Math.cos(R);l.x=g*v.x+A*w.x,l.y=g*v.y+A*w.y,l.z=g*v.z+A*w.z,l.normalize(),f.push(l.x,l.y,l.z),a.x=u.x+n*l.x,a.y=u.y+n*l.y,a.z=u.z+n*l.z,h.push(a.x,a.y,a.z)}}function p(){for(let M=1;M<=t;M++)for(let v=1;v<=s;v++){const w=(s+1)*(M-1)+(v-1),C=(s+1)*M+(v-1),R=(s+1)*M+v,A=(s+1)*(M-1)+v;_.push(w,C,A),_.push(C,R,A)}}function b(){for(let M=0;M<=t;M++)for(let v=0;v<=s;v++)c.x=M/t,c.y=v/s,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new Hc(new Jo[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}}class Ym extends Ot{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Kn extends Dn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new De(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=yf,this.normalScale=new ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Un extends Kn{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ie(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return $e(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new De(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new De(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new De(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class qm extends Dn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=sp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Km extends Dn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Ro(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function $m(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function jm(i){function e(s,r){return i[s]-i[r]}const t=i.length,n=new Array(t);for(let s=0;s!==t;++s)n[s]=s;return n.sort(e),n}function eh(i,e,t){const n=i.length,s=new i.constructor(n);for(let r=0,o=0;o!==n;++r){const a=t[r]*e;for(let l=0;l!==e;++l)s[o++]=i[a+l]}return s}function Zf(i,e,t,n){let s=1,r=i[0];for(;r!==void 0&&r[n]===void 0;)r=i[s++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push(...o)),r=i[s++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=i[s++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=i[s++];while(r!==void 0)}class Yr{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){const a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){const a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class Zm extends Yr{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:uu,endingEnd:uu}}intervalChanged_(e,t,n){const s=this.parameterPositions;let r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case hu:r=e,a=2*t-n;break;case fu:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case hu:o=e,l=2*n-t;break;case fu:o=1,l=n+s[1]-s[0];break;default:o=e-1,l=t}const c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this._offsetPrev,h=this._offsetNext,f=this._weightPrev,d=this._weightNext,_=(n-t)/(s-t),x=_*_,m=x*_,p=-f*m+2*f*x-f*_,b=(1+f)*m+(-1.5-2*f)*x+(-.5+f)*_+1,M=(-1-d)*m+(1.5+d)*x+.5*_,v=d*m-d*x;for(let w=0;w!==a;++w)r[w]=p*o[u+w]+b*o[c+w]+M*o[l+w]+v*o[h+w];return r}}class Jm extends Yr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=(n-t)/(s-t),h=1-u;for(let f=0;f!==a;++f)r[f]=o[c+f]*h+o[l+f]*u;return r}}class Qm extends Yr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}}class Fn{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ro(t,this.TimeBufferType),this.values=Ro(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Ro(e.times,Array),values:Ro(e.values,Array)};const s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Qm(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Jm(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Zm(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Nr:t=this.InterpolantFactoryMethodDiscrete;break;case Ur:t=this.InterpolantFactoryMethodLinear;break;case Ma:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Nr;case this.InterpolantFactoryMethodLinear:return Ur;case this.InterpolantFactoryMethodSmooth:return Ma}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){const n=this.times,s=n.length;let r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);const a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){const l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&$m(s))for(let a=0,l=s.length;a!==l;++a){const c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Ma,r=e.length-1;let o=1;for(let a=1;a<r;++a){let l=!1;const c=e[a],u=e[a+1];if(c!==u&&(a!==1||c!==e[0]))if(s)l=!0;else{const h=a*n,f=h-n,d=h+n;for(let _=0;_!==n;++_){const x=t[h+_];if(x!==t[f+_]||x!==t[d+_]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];const h=a*n,f=o*n;for(let d=0;d!==n;++d)t[f+d]=t[h+d]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}}Fn.prototype.ValueTypeName="";Fn.prototype.TimeBufferType=Float32Array;Fn.prototype.ValueBufferType=Float32Array;Fn.prototype.DefaultInterpolation=Ur;class Zs extends Fn{constructor(e,t,n){super(e,t,n)}}Zs.prototype.ValueTypeName="bool";Zs.prototype.ValueBufferType=Array;Zs.prototype.DefaultInterpolation=Nr;Zs.prototype.InterpolantFactoryMethodLinear=void 0;Zs.prototype.InterpolantFactoryMethodSmooth=void 0;class Jf extends Fn{constructor(e,t,n,s){super(e,t,n,s)}}Jf.prototype.ValueTypeName="color";class Vs extends Fn{constructor(e,t,n,s){super(e,t,n,s)}}Vs.prototype.ValueTypeName="number";class eg extends Yr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(s-t);let c=e*a;for(let u=c+a;c!==u;c+=4)Ui.slerpFlat(r,0,o,c-a,o,c,l);return r}}class Gs extends Fn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new eg(this.times,this.values,this.getValueSize(),e)}}Gs.prototype.ValueTypeName="quaternion";Gs.prototype.InterpolantFactoryMethodSmooth=void 0;class Js extends Fn{constructor(e,t,n){super(e,t,n)}}Js.prototype.ValueTypeName="string";Js.prototype.ValueBufferType=Array;Js.prototype.DefaultInterpolation=Nr;Js.prototype.InterpolantFactoryMethodLinear=void 0;Js.prototype.InterpolantFactoryMethodSmooth=void 0;class Ws extends Fn{constructor(e,t,n,s){super(e,t,n,s)}}Ws.prototype.ValueTypeName="vector";class tg{constructor(e="",t=-1,n=[],s=np){this.name=e,this.tracks=n,this.duration=t,this.blendMode=s,this.uuid=yn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,s=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(ig(n[o]).scale(s));const r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){const t=[],n=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,o=n.length;r!==o;++r)t.push(Fn.toJSON(n[r]));return s}static CreateFromMorphTargetSequence(e,t,n,s){const r=t.length,o=[];for(let a=0;a<r;a++){let l=[],c=[];l.push((a+r-1)%r,a,(a+1)%r),c.push(0,1,0);const u=jm(l);l=eh(l,1,u),c=eh(c,1,u),!s&&l[0]===0&&(l.push(r),c.push(c[0])),o.push(new Vs(".morphTargetInfluences["+t[a].name+"]",l,c).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const s=e;n=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<n.length;s++)if(n[s].name===t)return n[s];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const s={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,l=e.length;a<l;a++){const c=e[a],u=c.name.match(r);if(u&&u.length>1){const h=u[1];let f=s[h];f||(s[h]=f=[]),f.push(c)}}const o=[];for(const a in s)o.push(this.CreateFromMorphTargetSequence(a,s[a],t,n));return o}static parseAnimation(e,t){if(console.warn("THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(h,f,d,_,x){if(d.length!==0){const m=[],p=[];Zf(d,m,p,_),m.length!==0&&x.push(new h(f,m,p))}},s=[],r=e.name||"default",o=e.fps||30,a=e.blendMode;let l=e.length||-1;const c=e.hierarchy||[];for(let h=0;h<c.length;h++){const f=c[h].keys;if(!(!f||f.length===0))if(f[0].morphTargets){const d={};let _;for(_=0;_<f.length;_++)if(f[_].morphTargets)for(let x=0;x<f[_].morphTargets.length;x++)d[f[_].morphTargets[x]]=-1;for(const x in d){const m=[],p=[];for(let b=0;b!==f[_].morphTargets.length;++b){const M=f[_];m.push(M.time),p.push(M.morphTarget===x?1:0)}s.push(new Vs(".morphTargetInfluence["+x+"]",m,p))}l=d.length*o}else{const d=".bones["+t[h].name+"]";n(Ws,d+".position",f,"pos",s),n(Gs,d+".quaternion",f,"rot",s),n(Ws,d+".scale",f,"scl",s)}}return s.length===0?null:new this(r,l,s,a)}resetDuration(){const e=this.tracks;let t=0;for(let n=0,s=e.length;n!==s;++n){const r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());const t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function ng(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Vs;case"vector":case"vector2":case"vector3":case"vector4":return Ws;case"color":return Jf;case"quaternion":return Gs;case"bool":case"boolean":return Zs;case"string":return Js}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function ig(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=ng(i.type);if(i.times===void 0){const t=[],n=[];Zf(i.keys,t,n,"value"),i.times=t,i.values=n}return e.parse!==void 0?e.parse(i):new e(i.name,i.times,i.values,i.interpolation)}const hi={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(this.files[i]=e)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};class sg{constructor(e,t,n){const s=this;let r=!1,o=0,a=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){const h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,f=c.length;h<f;h+=2){const d=c[h],_=c[h+1];if(d.global&&(d.lastIndex=0),d.test(u))return _}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}}const rg=new sg;class ss{constructor(e){this.manager=e!==void 0?e:rg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}ss.DEFAULT_MATERIAL_NAME="__DEFAULT";const ri={};class og extends Error{constructor(e,t){super(e),this.response=t}}class Vc extends ss{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=hi.get(`file:${e}`);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(ri[e]!==void 0){ri[e].push({onLoad:t,onProgress:n,onError:s});return}ri[e]=[],ri[e].push({onLoad:t,onProgress:n,onError:s});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,l=this.responseType;fetch(o).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream=="undefined"||c.body===void 0||c.body.getReader===void 0)return c;const u=ri[e],h=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=f?parseInt(f):0,_=d!==0;let x=0;const m=new ReadableStream({start(p){b();function b(){h.read().then(({done:M,value:v})=>{if(M)p.close();else{x+=v.byteLength;const w=new ProgressEvent("progress",{lengthComputable:_,loaded:x,total:d});for(let C=0,R=u.length;C<R;C++){const A=u[C];A.onProgress&&A.onProgress(w)}p.enqueue(v),b()}},M=>{p.error(M)})}}});return new Response(m)}else throw new og(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return c.json();default:if(a==="")return c.text();{const h=/charset="?([^;"\s]*)"?/i.exec(a),f=h&&h[1]?h[1].toLowerCase():void 0,d=new TextDecoder(f);return c.arrayBuffer().then(_=>d.decode(_))}}}).then(c=>{hi.add(`file:${e}`,c);const u=ri[e];delete ri[e];for(let h=0,f=u.length;h<f;h++){const d=u[h];d.onLoad&&d.onLoad(c)}}).catch(c=>{const u=ri[e];if(u===void 0)throw this.manager.itemError(e),c;delete ri[e];for(let h=0,f=u.length;h<f;h++){const d=u[h];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Ts=new WeakMap;class ag extends ss{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,o=hi.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let h=Ts.get(o);h===void 0&&(h=[],Ts.set(o,h)),h.push({onLoad:t,onError:s})}return o}const a=Fr("img");function l(){u(),t&&t(this);const h=Ts.get(this)||[];for(let f=0;f<h.length;f++){const d=h[f];d.onLoad&&d.onLoad(this)}Ts.delete(this),r.manager.itemEnd(e)}function c(h){u(),s&&s(h),hi.remove(`image:${e}`);const f=Ts.get(this)||[];for(let d=0;d<f.length;d++){const _=f[d];_.onError&&_.onError(h)}Ts.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),hi.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}}class lg extends ss{constructor(e){super(e)}load(e,t,n,s){const r=this,o=new Lc,a=new Vc(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(r.withCredentials),a.load(e,function(l){let c;try{c=r.parse(l)}catch(u){if(s!==void 0)s(u);else{console.error(u);return}}c.image!==void 0?o.image=c.image:c.data!==void 0&&(o.image.width=c.width,o.image.height=c.height,o.image.data=c.data),o.wrapS=c.wrapS!==void 0?c.wrapS:Hn,o.wrapT=c.wrapT!==void 0?c.wrapT:Hn,o.magFilter=c.magFilter!==void 0?c.magFilter:Lt,o.minFilter=c.minFilter!==void 0?c.minFilter:Lt,o.anisotropy=c.anisotropy!==void 0?c.anisotropy:1,c.colorSpace!==void 0&&(o.colorSpace=c.colorSpace),c.flipY!==void 0&&(o.flipY=c.flipY),c.format!==void 0&&(o.format=c.format),c.type!==void 0&&(o.type=c.type),c.mipmaps!==void 0&&(o.mipmaps=c.mipmaps,o.minFilter=Ln),c.mipmapCount===1&&(o.minFilter=Lt),c.generateMipmaps!==void 0&&(o.generateMipmaps=c.generateMipmaps),o.needsUpdate=!0,t&&t(o,c)},n,s),o}}class ea extends ss{constructor(e){super(e)}load(e,t,n,s){const r=new It,o=new ag(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}}class ua extends mt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new De(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}class cg extends ua{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(mt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new De(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const Za=new He,th=new I,nh=new I;class Gc{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ie(512,512),this.mapType=Yn,this.map=null,this.mapPass=null,this.matrix=new He,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Dc,this._frameExtents=new ie(1,1),this._viewportCount=1,this._viewports=[new tt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;th.setFromMatrixPosition(e.matrixWorld),t.position.copy(th),nh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(nh),t.updateMatrixWorld(),Za.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Za,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Za)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class ug extends Gc{constructor(){super(new Ht(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,n=zs*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class hg extends ua{constructor(e,t,n=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(mt.DEFAULT_UP),this.updateMatrix(),this.target=new mt,this.distance=n,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new ug}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const ih=new He,dr=new I,Ja=new I;class fg extends Gc{constructor(){super(new Ht(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ie(4,2),this._viewportCount=6,this._viewports=[new tt(2,1,1,1),new tt(0,1,1,1),new tt(3,1,1,1),new tt(1,1,1,1),new tt(3,0,1,1),new tt(1,0,1,1)],this._cubeDirections=[new I(1,0,0),new I(-1,0,0),new I(0,0,1),new I(0,0,-1),new I(0,1,0),new I(0,-1,0)],this._cubeUps=[new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,0,1),new I(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),dr.setFromMatrixPosition(e.matrixWorld),n.position.copy(dr),Ja.copy(n.position),Ja.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Ja),n.updateMatrixWorld(),s.makeTranslation(-dr.x,-dr.y,-dr.z),ih.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ih,n.coordinateSystem,n.reversedDepth)}}class Qf extends ua{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new fg}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class ha extends Cf{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-e,o=n+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class dg extends Gc{constructor(){super(new ha(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ed extends ua{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(mt.DEFAULT_UP),this.updateMatrix(),this.target=new mt,this.shadow=new dg}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Er{static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}const Qa=new WeakMap;class pg extends ss{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap=="undefined"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch=="undefined"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,o=hi.get(`image-bitmap:${e}`);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(c=>{if(Qa.has(o)===!0)s&&s(Qa.get(o)),r.manager.itemError(e),r.manager.itemEnd(e);else return t&&t(c),r.manager.itemEnd(e),c});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const l=fetch(e,a).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(c){return hi.add(`image-bitmap:${e}`,c),t&&t(c),r.manager.itemEnd(e),c}).catch(function(c){s&&s(c),Qa.set(l,c),hi.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});hi.add(`image-bitmap:${e}`,l),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}class mg extends Ht{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class td{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}const Wc="\\[\\]\\.:\\/",gg=new RegExp("["+Wc+"]","g"),Xc="[^"+Wc+"]",_g="[^"+Wc.replace("\\.","")+"]",vg=/((?:WC+[\/:])*)/.source.replace("WC",Xc),xg=/(WCOD+)?/.source.replace("WCOD",_g),yg=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Xc),Mg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Xc),Sg=new RegExp("^"+vg+xg+yg+Mg+"$"),bg=["material","materials","bones","map"];class Eg{constructor(e,t,n){const s=n||ht.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();const n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){const n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class ht{constructor(e,t,n){this.path=t,this.parsedPath=n||ht.parseTrackName(t),this.node=ht.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new ht.Composite(e,t,n):new ht(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(gg,"")}static parseTrackName(e){const t=Sg.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){const r=n.nodeName.substring(s+1);bg.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(r){for(let o=0;o<r.length;o++){const a=r[o];if(a.name===t||a.uuid===t)return a;const l=n(a.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,s=t.propertyName;let r=t.propertyIndex;if(e||(e=ht.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}const o=e[s];if(o===void 0){const c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}ht.Composite=Eg;ht.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ht.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ht.prototype.GetterByBindingType=[ht.prototype._getValue_direct,ht.prototype._getValue_array,ht.prototype._getValue_arrayElement,ht.prototype._getValue_toArray];ht.prototype.SetterByBindingTypeAndVersioning=[[ht.prototype._setValue_direct,ht.prototype._setValue_direct_setNeedsUpdate,ht.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ht.prototype._setValue_array,ht.prototype._setValue_array_setNeedsUpdate,ht.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ht.prototype._setValue_arrayElement,ht.prototype._setValue_arrayElement_setNeedsUpdate,ht.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ht.prototype._setValue_fromArray,ht.prototype._setValue_fromArray_setNeedsUpdate,ht.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];function sh(i,e,t,n){const s=Tg(n);switch(t){case gf:return i*e;case Sc:return i*e/s.components*s.byteLength;case bc:return i*e/s.components*s.byteLength;case vf:return i*e*2/s.components*s.byteLength;case Ec:return i*e*2/s.components*s.byteLength;case _f:return i*e*3/s.components*s.byteLength;case xn:return i*e*4/s.components*s.byteLength;case Tc:return i*e*4/s.components*s.byteLength;case Bo:case zo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ko:case Ho:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Al:case Cl:return Math.max(i,16)*Math.max(e,8)/4;case wl:case Rl:return Math.max(i,8)*Math.max(e,8)/2;case Pl:case Ll:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Il:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Dl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Nl:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Ul:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Fl:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ol:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Bl:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case zl:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case kl:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Hl:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Vl:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Gl:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Wl:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Xl:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Yl:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case ql:case Kl:case $l:return Math.ceil(i/4)*Math.ceil(e/4)*16;case jl:case Zl:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Jl:case Ql:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Tg(i){switch(i){case Yn:case ff:return{byteLength:1,components:1};case Pr:case df:case cn:return{byteLength:2,components:1};case yc:case Mc:return{byteLength:2,components:4};case ts:case xc:case nn:return{byteLength:4,components:1};case pf:case mf:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:_c}}));typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=_c);function nd(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function wg(i){const e=new WeakMap;function t(a,l){const c=a.array,u=a.usage,h=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,u),a.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array!="undefined"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){const u=l.array,h=l.updateRanges;if(i.bindBuffer(c,a),h.length===0)i.bufferSubData(c,0,u);else{h.sort((d,_)=>d.start-_.start);let f=0;for(let d=1;d<h.length;d++){const _=h[f],x=h[d];x.start<=_.start+_.count+1?_.count=Math.max(_.count,x.start+x.count-_.start):(++f,h[f]=x)}h.length=f+1;for(let d=0,_=h.length;d<_;d++){const x=h[d];i.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=e.get(a);l&&(i.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Ag=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Rg=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Cg=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Pg=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Lg=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ig=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Dg=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ng=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ug=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Fg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Og=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Bg=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,zg=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,kg=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Hg=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Vg=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Gg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Wg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Xg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Yg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,qg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Kg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,$g=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,jg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Zg=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Jg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Qg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,e0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,t0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,n0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,i0="gl_FragColor = linearToOutputTexel( gl_FragColor );",s0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,r0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,o0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,a0=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,l0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,c0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,u0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,h0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,f0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,d0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,p0=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,m0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,g0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,_0=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,v0=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,x0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,y0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,M0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,S0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,b0=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,E0=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,T0=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,w0=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,A0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,R0=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,C0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,P0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,L0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,I0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,D0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,N0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,U0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,F0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,O0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,B0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,z0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,k0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,H0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,V0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,G0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,W0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,X0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Y0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,q0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,K0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,$0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,j0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Z0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,J0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Q0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,e_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,t_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,n_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,i_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,s_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,r_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,o_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,a_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,l_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,c_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,u_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,h_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,f_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,d_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,p_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,m_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,g_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,__=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,v_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,x_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,y_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,M_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,S_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,b_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,E_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,T_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const w_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,A_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,R_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,C_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,P_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,L_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,I_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,D_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,N_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,U_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,F_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,O_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,B_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,z_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,k_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,H_=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,V_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,G_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,W_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,X_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Y_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,q_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,K_=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$_=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,j_=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Z_=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,J_=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Q_=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ev=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,tv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,nv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,iv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,je={alphahash_fragment:Ag,alphahash_pars_fragment:Rg,alphamap_fragment:Cg,alphamap_pars_fragment:Pg,alphatest_fragment:Lg,alphatest_pars_fragment:Ig,aomap_fragment:Dg,aomap_pars_fragment:Ng,batching_pars_vertex:Ug,batching_vertex:Fg,begin_vertex:Og,beginnormal_vertex:Bg,bsdfs:zg,iridescence_fragment:kg,bumpmap_pars_fragment:Hg,clipping_planes_fragment:Vg,clipping_planes_pars_fragment:Gg,clipping_planes_pars_vertex:Wg,clipping_planes_vertex:Xg,color_fragment:Yg,color_pars_fragment:qg,color_pars_vertex:Kg,color_vertex:$g,common:jg,cube_uv_reflection_fragment:Zg,defaultnormal_vertex:Jg,displacementmap_pars_vertex:Qg,displacementmap_vertex:e0,emissivemap_fragment:t0,emissivemap_pars_fragment:n0,colorspace_fragment:i0,colorspace_pars_fragment:s0,envmap_fragment:r0,envmap_common_pars_fragment:o0,envmap_pars_fragment:a0,envmap_pars_vertex:l0,envmap_physical_pars_fragment:x0,envmap_vertex:c0,fog_vertex:u0,fog_pars_vertex:h0,fog_fragment:f0,fog_pars_fragment:d0,gradientmap_pars_fragment:p0,lightmap_pars_fragment:m0,lights_lambert_fragment:g0,lights_lambert_pars_fragment:_0,lights_pars_begin:v0,lights_toon_fragment:y0,lights_toon_pars_fragment:M0,lights_phong_fragment:S0,lights_phong_pars_fragment:b0,lights_physical_fragment:E0,lights_physical_pars_fragment:T0,lights_fragment_begin:w0,lights_fragment_maps:A0,lights_fragment_end:R0,logdepthbuf_fragment:C0,logdepthbuf_pars_fragment:P0,logdepthbuf_pars_vertex:L0,logdepthbuf_vertex:I0,map_fragment:D0,map_pars_fragment:N0,map_particle_fragment:U0,map_particle_pars_fragment:F0,metalnessmap_fragment:O0,metalnessmap_pars_fragment:B0,morphinstance_vertex:z0,morphcolor_vertex:k0,morphnormal_vertex:H0,morphtarget_pars_vertex:V0,morphtarget_vertex:G0,normal_fragment_begin:W0,normal_fragment_maps:X0,normal_pars_fragment:Y0,normal_pars_vertex:q0,normal_vertex:K0,normalmap_pars_fragment:$0,clearcoat_normal_fragment_begin:j0,clearcoat_normal_fragment_maps:Z0,clearcoat_pars_fragment:J0,iridescence_pars_fragment:Q0,opaque_fragment:e_,packing:t_,premultiplied_alpha_fragment:n_,project_vertex:i_,dithering_fragment:s_,dithering_pars_fragment:r_,roughnessmap_fragment:o_,roughnessmap_pars_fragment:a_,shadowmap_pars_fragment:l_,shadowmap_pars_vertex:c_,shadowmap_vertex:u_,shadowmask_pars_fragment:h_,skinbase_vertex:f_,skinning_pars_vertex:d_,skinning_vertex:p_,skinnormal_vertex:m_,specularmap_fragment:g_,specularmap_pars_fragment:__,tonemapping_fragment:v_,tonemapping_pars_fragment:x_,transmission_fragment:y_,transmission_pars_fragment:M_,uv_pars_fragment:S_,uv_pars_vertex:b_,uv_vertex:E_,worldpos_vertex:T_,background_vert:w_,background_frag:A_,backgroundCube_vert:R_,backgroundCube_frag:C_,cube_vert:P_,cube_frag:L_,depth_vert:I_,depth_frag:D_,distanceRGBA_vert:N_,distanceRGBA_frag:U_,equirect_vert:F_,equirect_frag:O_,linedashed_vert:B_,linedashed_frag:z_,meshbasic_vert:k_,meshbasic_frag:H_,meshlambert_vert:V_,meshlambert_frag:G_,meshmatcap_vert:W_,meshmatcap_frag:X_,meshnormal_vert:Y_,meshnormal_frag:q_,meshphong_vert:K_,meshphong_frag:$_,meshphysical_vert:j_,meshphysical_frag:Z_,meshtoon_vert:J_,meshtoon_frag:Q_,points_vert:ev,points_frag:tv,shadow_vert:nv,shadow_frag:iv,sprite_vert:sv,sprite_frag:rv},xe={common:{diffuse:{value:new De(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ke},alphaMap:{value:null},alphaMapTransform:{value:new Ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ke}},envmap:{envMap:{value:null},envMapRotation:{value:new Ke},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ke},normalScale:{value:new ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new De(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new De(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ke},alphaTest:{value:0},uvTransform:{value:new Ke}},sprite:{diffuse:{value:new De(16777215)},opacity:{value:1},center:{value:new ie(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ke},alphaMap:{value:null},alphaMapTransform:{value:new Ke},alphaTest:{value:0}}},kn={basic:{uniforms:$t([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.fog]),vertexShader:je.meshbasic_vert,fragmentShader:je.meshbasic_frag},lambert:{uniforms:$t([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,xe.lights,{emissive:{value:new De(0)}}]),vertexShader:je.meshlambert_vert,fragmentShader:je.meshlambert_frag},phong:{uniforms:$t([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,xe.lights,{emissive:{value:new De(0)},specular:{value:new De(1118481)},shininess:{value:30}}]),vertexShader:je.meshphong_vert,fragmentShader:je.meshphong_frag},standard:{uniforms:$t([xe.common,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.roughnessmap,xe.metalnessmap,xe.fog,xe.lights,{emissive:{value:new De(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:je.meshphysical_vert,fragmentShader:je.meshphysical_frag},toon:{uniforms:$t([xe.common,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.gradientmap,xe.fog,xe.lights,{emissive:{value:new De(0)}}]),vertexShader:je.meshtoon_vert,fragmentShader:je.meshtoon_frag},matcap:{uniforms:$t([xe.common,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,{matcap:{value:null}}]),vertexShader:je.meshmatcap_vert,fragmentShader:je.meshmatcap_frag},points:{uniforms:$t([xe.points,xe.fog]),vertexShader:je.points_vert,fragmentShader:je.points_frag},dashed:{uniforms:$t([xe.common,xe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:je.linedashed_vert,fragmentShader:je.linedashed_frag},depth:{uniforms:$t([xe.common,xe.displacementmap]),vertexShader:je.depth_vert,fragmentShader:je.depth_frag},normal:{uniforms:$t([xe.common,xe.bumpmap,xe.normalmap,xe.displacementmap,{opacity:{value:1}}]),vertexShader:je.meshnormal_vert,fragmentShader:je.meshnormal_frag},sprite:{uniforms:$t([xe.sprite,xe.fog]),vertexShader:je.sprite_vert,fragmentShader:je.sprite_frag},background:{uniforms:{uvTransform:{value:new Ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:je.background_vert,fragmentShader:je.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ke}},vertexShader:je.backgroundCube_vert,fragmentShader:je.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:je.cube_vert,fragmentShader:je.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:je.equirect_vert,fragmentShader:je.equirect_frag},distanceRGBA:{uniforms:$t([xe.common,xe.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:je.distanceRGBA_vert,fragmentShader:je.distanceRGBA_frag},shadow:{uniforms:$t([xe.lights,xe.fog,{color:{value:new De(0)},opacity:{value:1}}]),vertexShader:je.shadow_vert,fragmentShader:je.shadow_frag}};kn.physical={uniforms:$t([kn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ke},clearcoatNormalScale:{value:new ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ke},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ke},sheen:{value:0},sheenColor:{value:new De(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ke},transmissionSamplerSize:{value:new ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ke},attenuationDistance:{value:0},attenuationColor:{value:new De(0)},specularColor:{value:new De(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ke},anisotropyVector:{value:new ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ke}}]),vertexShader:je.meshphysical_vert,fragmentShader:je.meshphysical_frag};const Co={r:0,b:0,g:0},Gi=new qn,ov=new He;function av(i,e,t,n,s,r,o){const a=new De(0);let l=r===!0?0:1,c,u,h=null,f=0,d=null;function _(M){let v=M.isScene===!0?M.background:null;return v&&v.isTexture&&(v=(M.backgroundBlurriness>0?t:e).get(v)),v}function x(M){let v=!1;const w=_(M);w===null?p(a,l):w&&w.isColor&&(p(w,1),v=!0);const C=i.xr.getEnvironmentBlendMode();C==="additive"?n.buffers.color.setClear(0,0,0,1,o):C==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(M,v){const w=_(v);w&&(w.isCubeTexture||w.mapping===aa)?(u===void 0&&(u=new Rt(new Fi(1,1,1),new Ot({name:"BackgroundCubeMaterial",uniforms:ks(kn.backgroundCube.uniforms),vertexShader:kn.backgroundCube.vertexShader,fragmentShader:kn.backgroundCube.fragmentShader,side:jt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(C,R,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),Gi.copy(v.backgroundRotation),Gi.x*=-1,Gi.y*=-1,Gi.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Gi.y*=-1,Gi.z*=-1),u.material.uniforms.envMap.value=w,u.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(ov.makeRotationFromEuler(Gi)),u.material.toneMapped=et.getTransfer(w.colorSpace)!==ct,(h!==w||f!==w.version||d!==i.toneMapping)&&(u.material.needsUpdate=!0,h=w,f=w.version,d=i.toneMapping),u.layers.enableAll(),M.unshift(u,u.geometry,u.material,0,0,null)):w&&w.isTexture&&(c===void 0&&(c=new Rt(new Gn(2,2),new Ot({name:"BackgroundMaterial",uniforms:ks(kn.background.uniforms),vertexShader:kn.background.vertexShader,fragmentShader:kn.background.fragmentShader,side:Xn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=w,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=et.getTransfer(w.colorSpace)!==ct,w.matrixAutoUpdate===!0&&w.updateMatrix(),c.material.uniforms.uvTransform.value.copy(w.matrix),(h!==w||f!==w.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,h=w,f=w.version,d=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function p(M,v){M.getRGB(Co,Rf(i)),n.buffers.color.setClear(Co.r,Co.g,Co.b,v,o)}function b(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,v=1){a.set(M),l=v,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,p(a,l)},render:x,addToRenderList:m,dispose:b}}function lv(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null);let r=s,o=!1;function a(y,S,N,D,P){let U=!1;const O=h(D,N,S);r!==O&&(r=O,c(r.object)),U=d(y,D,N,P),U&&_(y,D,N,P),P!==null&&e.update(P,i.ELEMENT_ARRAY_BUFFER),(U||o)&&(o=!1,v(y,S,N,D),P!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(P).buffer))}function l(){return i.createVertexArray()}function c(y){return i.bindVertexArray(y)}function u(y){return i.deleteVertexArray(y)}function h(y,S,N){const D=N.wireframe===!0;let P=n[y.id];P===void 0&&(P={},n[y.id]=P);let U=P[S.id];U===void 0&&(U={},P[S.id]=U);let O=U[D];return O===void 0&&(O=f(l()),U[D]=O),O}function f(y){const S=[],N=[],D=[];for(let P=0;P<t;P++)S[P]=0,N[P]=0,D[P]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:S,enabledAttributes:N,attributeDivisors:D,object:y,attributes:{},index:null}}function d(y,S,N,D){const P=r.attributes,U=S.attributes;let O=0;const W=N.getAttributes();for(const H in W)if(W[H].location>=0){const ae=P[H];let z=U[H];if(z===void 0&&(H==="instanceMatrix"&&y.instanceMatrix&&(z=y.instanceMatrix),H==="instanceColor"&&y.instanceColor&&(z=y.instanceColor)),ae===void 0||ae.attribute!==z||z&&ae.data!==z.data)return!0;O++}return r.attributesNum!==O||r.index!==D}function _(y,S,N,D){const P={},U=S.attributes;let O=0;const W=N.getAttributes();for(const H in W)if(W[H].location>=0){let ae=U[H];ae===void 0&&(H==="instanceMatrix"&&y.instanceMatrix&&(ae=y.instanceMatrix),H==="instanceColor"&&y.instanceColor&&(ae=y.instanceColor));const z={};z.attribute=ae,ae&&ae.data&&(z.data=ae.data),P[H]=z,O++}r.attributes=P,r.attributesNum=O,r.index=D}function x(){const y=r.newAttributes;for(let S=0,N=y.length;S<N;S++)y[S]=0}function m(y){p(y,0)}function p(y,S){const N=r.newAttributes,D=r.enabledAttributes,P=r.attributeDivisors;N[y]=1,D[y]===0&&(i.enableVertexAttribArray(y),D[y]=1),P[y]!==S&&(i.vertexAttribDivisor(y,S),P[y]=S)}function b(){const y=r.newAttributes,S=r.enabledAttributes;for(let N=0,D=S.length;N<D;N++)S[N]!==y[N]&&(i.disableVertexAttribArray(N),S[N]=0)}function M(y,S,N,D,P,U,O){O===!0?i.vertexAttribIPointer(y,S,N,P,U):i.vertexAttribPointer(y,S,N,D,P,U)}function v(y,S,N,D){x();const P=D.attributes,U=N.getAttributes(),O=S.defaultAttributeValues;for(const W in U){const H=U[W];if(H.location>=0){let Z=P[W];if(Z===void 0&&(W==="instanceMatrix"&&y.instanceMatrix&&(Z=y.instanceMatrix),W==="instanceColor"&&y.instanceColor&&(Z=y.instanceColor)),Z!==void 0){const ae=Z.normalized,z=Z.itemSize,Q=e.get(Z);if(Q===void 0)continue;const re=Q.buffer,de=Q.type,Re=Q.bytesPerElement,q=de===i.INT||de===i.UNSIGNED_INT||Z.gpuType===xc;if(Z.isInterleavedBufferAttribute){const ee=Z.data,me=ee.stride,Me=Z.offset;if(ee.isInstancedInterleavedBuffer){for(let ye=0;ye<H.locationSize;ye++)p(H.location+ye,ee.meshPerAttribute);y.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let ye=0;ye<H.locationSize;ye++)m(H.location+ye);i.bindBuffer(i.ARRAY_BUFFER,re);for(let ye=0;ye<H.locationSize;ye++)M(H.location+ye,z/H.locationSize,de,ae,me*Re,(Me+z/H.locationSize*ye)*Re,q)}else{if(Z.isInstancedBufferAttribute){for(let ee=0;ee<H.locationSize;ee++)p(H.location+ee,Z.meshPerAttribute);y.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let ee=0;ee<H.locationSize;ee++)m(H.location+ee);i.bindBuffer(i.ARRAY_BUFFER,re);for(let ee=0;ee<H.locationSize;ee++)M(H.location+ee,z/H.locationSize,de,ae,z*Re,z/H.locationSize*ee*Re,q)}}else if(O!==void 0){const ae=O[W];if(ae!==void 0)switch(ae.length){case 2:i.vertexAttrib2fv(H.location,ae);break;case 3:i.vertexAttrib3fv(H.location,ae);break;case 4:i.vertexAttrib4fv(H.location,ae);break;default:i.vertexAttrib1fv(H.location,ae)}}}}b()}function w(){A();for(const y in n){const S=n[y];for(const N in S){const D=S[N];for(const P in D)u(D[P].object),delete D[P];delete S[N]}delete n[y]}}function C(y){if(n[y.id]===void 0)return;const S=n[y.id];for(const N in S){const D=S[N];for(const P in D)u(D[P].object),delete D[P];delete S[N]}delete n[y.id]}function R(y){for(const S in n){const N=n[S];if(N[y.id]===void 0)continue;const D=N[y.id];for(const P in D)u(D[P].object),delete D[P];delete N[y.id]}}function A(){g(),o=!0,r!==s&&(r=s,c(r.object))}function g(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:A,resetDefaultState:g,dispose:w,releaseStatesOfGeometry:C,releaseStatesOfProgram:R,initAttributes:x,enableAttribute:m,disableUnusedAttributes:b}}function cv(i,e,t){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),t.update(u,n,1)}function o(c,u,h){h!==0&&(i.drawArraysInstanced(n,c,u,h),t.update(u,n,h))}function a(c,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let d=0;for(let _=0;_<h;_++)d+=u[_];t.update(d,n,1)}function l(c,u,h,f){if(h===0)return;const d=e.get("WEBGL_multi_draw");if(d===null)for(let _=0;_<c.length;_++)o(c[_],u[_],f[_]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,u,0,f,0,h);let _=0;for(let x=0;x<h;x++)_+=u[x]*f[x];t.update(_,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function uv(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(R){return!(R!==xn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(R){const A=R===cn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Yn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==nn&&!A)}function l(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=_>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:_,maxTextureSize:x,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:M,maxFragmentUniforms:v,vertexTextures:w,maxSamples:C}}function hv(i){const e=this;let t=null,n=0,s=!1,r=!1;const o=new Ei,a=new Ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f){const d=h.length!==0||f||n!==0||s;return s=f,n=h.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,f){t=u(h,f,0)},this.setState=function(h,f,d){const _=h.clippingPlanes,x=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||_===null||_.length===0||r&&!m)r?u(null):c();else{const b=r?0:n,M=b*4;let v=p.clippingState||null;l.value=v,v=u(_,f,M,d);for(let w=0;w!==M;++w)v[w]=t[w];p.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,f,d,_){const x=h!==null?h.length:0;let m=null;if(x!==0){if(m=l.value,_!==!0||m===null){const p=d+x*4,b=f.matrixWorldInverse;a.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let M=0,v=d;M!==x;++M,v+=4)o.copy(h[M]).applyMatrix4(b,a),o.normal.toArray(m,v),m[v+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}function fv(i){let e=new WeakMap;function t(o,a){return a===Xo?o.mapping=Os:a===Tl&&(o.mapping=Bs),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Xo||a===Tl)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new nm(l.height);return c.fromEquirectangularTexture(i,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}const Ps=4,rh=[.125,.215,.35,.446,.526,.582],Ji=20,el=new ha,oh=new De;let tl=null,nl=0,il=0,sl=!1;const $i=(1+Math.sqrt(5))/2,ws=1/$i,ah=[new I(-$i,ws,0),new I($i,ws,0),new I(-ws,0,$i),new I(ws,0,$i),new I(0,$i,-ws),new I(0,$i,ws),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)],dv=new I;class lh{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100,r={}){const{size:o=256,position:a=dv}=r;tl=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),sl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=uh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(tl,nl,il),this._renderer.xr.enabled=sl,e.scissorTest=!1,Po(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Os||e.mapping===Bs?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),tl=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),sl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Lt,minFilter:Lt,generateMipmaps:!1,type:cn,format:xn,colorSpace:Yt,depthBuffer:!1},s=ch(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ch(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=pv(r)),this._blurMaterial=mv(r,e,t)}return s}_compileMaterial(e){const t=new Rt(this._lodPlanes[0],e);this._renderer.compile(t,el)}_sceneToCubeUV(e,t,n,s,r){const l=new Ht(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,f=h.autoClear,d=h.toneMapping;h.getClearColor(oh),h.toneMapping=Li,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(s),h.clearDepth(),h.setRenderTarget(null));const x=new un({name:"PMREM.Background",side:jt,depthWrite:!1,depthTest:!1}),m=new Rt(new Fi,x);let p=!1;const b=e.background;b?b.isColor&&(x.color.copy(b),e.background=null,p=!0):(x.color.copy(oh),p=!0);for(let M=0;M<6;M++){const v=M%3;v===0?(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[M],r.y,r.z)):v===1?(l.up.set(0,0,c[M]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[M],r.z)):(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[M]));const w=this._cubeSize;Po(s,v*w,M>2?w:0,w,w),h.setRenderTarget(s),p&&h.render(m,l),h.render(e,l)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=d,h.autoClear=f,e.background=b}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===Os||e.mapping===Bs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=hh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=uh());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new Rt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const l=this._cubeSize;Po(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,el)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=ah[(s-r-1)%ah.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Rt(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*Ji-1),x=r/_,m=isFinite(r)?1+Math.floor(u*x):Ji;m>Ji&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ji}`);const p=[];let b=0;for(let R=0;R<Ji;++R){const A=R/x,g=Math.exp(-A*A/2);p.push(g),R===0?b+=g:R<m&&(b+=2*g)}for(let R=0;R<p.length;R++)p[R]=p[R]/b;f.envMap.value=e.texture,f.samples.value=m,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:M}=this;f.dTheta.value=_,f.mipInt.value=M-n;const v=this._sizeLods[s],w=3*v*(s>M-Ps?s-M+Ps:0),C=4*(this._cubeSize-v);Po(t,w,C,3*v,2*v),l.setRenderTarget(t),l.render(h,el)}}function pv(i){const e=[],t=[],n=[];let s=i;const r=i-Ps+1+rh.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);t.push(a);let l=1/a;o>i-Ps?l=rh[o-i+Ps-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,h=1+c,f=[u,u,h,u,h,h,u,u,h,h,u,h],d=6,_=6,x=3,m=2,p=1,b=new Float32Array(x*_*d),M=new Float32Array(m*_*d),v=new Float32Array(p*_*d);for(let C=0;C<d;C++){const R=C%3*2/3-1,A=C>2?0:-1,g=[R,A,0,R+2/3,A,0,R+2/3,A+1,0,R,A,0,R+2/3,A+1,0,R,A+1,0];b.set(g,x*_*C),M.set(f,m*_*C);const y=[C,C,C,C,C,C];v.set(y,p*_*C)}const w=new Mt;w.setAttribute("position",new Jt(b,x)),w.setAttribute("uv",new Jt(M,m)),w.setAttribute("faceIndex",new Jt(v,p)),e.push(w),s>Ps&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function ch(i,e,t){const n=new Mn(i,e,t);return n.texture.mapping=aa,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Po(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function mv(i,e,t){const n=new Float32Array(Ji),s=new I(0,1,0);return new Ot({name:"SphericalGaussianBlur",defines:{n:Ji,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Yc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:fi,depthTest:!1,depthWrite:!1})}function uh(){return new Ot({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Yc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:fi,depthTest:!1,depthWrite:!1})}function hh(){return new Ot({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Yc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:fi,depthTest:!1,depthWrite:!1})}function Yc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function gv(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Xo||l===Tl,u=l===Os||l===Bs;if(c||u){let h=e.get(a);const f=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return t===null&&(t=new lh(i)),h=c?t.fromEquirectangular(a,h):t.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),h.texture;if(h!==void 0)return h.texture;{const d=a.image;return c&&d&&d.height>0||u&&d&&s(d)?(t===null&&(t=new lh(i)),h=c?t.fromEquirectangular(a):t.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function _v(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const s=t(n);return s===null&&Or("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function vv(i,e,t,n){const s={},r=new WeakMap;function o(h){const f=h.target;f.index!==null&&e.remove(f.index);for(const _ in f.attributes)e.remove(f.attributes[_]);f.removeEventListener("dispose",o),delete s[f.id];const d=r.get(f);d&&(e.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(h,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,t.memory.geometries++),f}function l(h){const f=h.attributes;for(const d in f)e.update(f[d],i.ARRAY_BUFFER)}function c(h){const f=[],d=h.index,_=h.attributes.position;let x=0;if(d!==null){const b=d.array;x=d.version;for(let M=0,v=b.length;M<v;M+=3){const w=b[M+0],C=b[M+1],R=b[M+2];f.push(w,C,C,R,R,w)}}else if(_!==void 0){const b=_.array;x=_.version;for(let M=0,v=b.length/3-1;M<v;M+=3){const w=M+0,C=M+1,R=M+2;f.push(w,C,C,R,R,w)}}else return;const m=new(Sf(f)?Af:wf)(f,1);m.version=x;const p=r.get(h);p&&e.remove(p),r.set(h,m)}function u(h){const f=r.get(h);if(f){const d=h.index;d!==null&&f.version<d.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function xv(i,e,t){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,d){i.drawElements(n,d,r,f*o),t.update(d,n,1)}function c(f,d,_){_!==0&&(i.drawElementsInstanced(n,d,r,f*o,_),t.update(d,n,_))}function u(f,d,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,_);let m=0;for(let p=0;p<_;p++)m+=d[p];t.update(m,n,1)}function h(f,d,_,x){if(_===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<f.length;p++)c(f[p]/o,d[p],x[p]);else{m.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,x,0,_);let p=0;for(let b=0;b<_;b++)p+=d[b]*x[b];t.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function yv(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Mv(i,e,t){const n=new WeakMap,s=new tt;function r(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let f=n.get(a);if(f===void 0||f.count!==h){let y=function(){A.dispose(),n.delete(a),a.removeEventListener("dispose",y)};var d=y;f!==void 0&&f.texture.dispose();const _=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],b=a.morphAttributes.normal||[],M=a.morphAttributes.color||[];let v=0;_===!0&&(v=1),x===!0&&(v=2),m===!0&&(v=3);let w=a.attributes.position.count*v,C=1;w>e.maxTextureSize&&(C=Math.ceil(w/e.maxTextureSize),w=e.maxTextureSize);const R=new Float32Array(w*C*4*h),A=new bf(R,w,C,h);A.type=nn,A.needsUpdate=!0;const g=v*4;for(let S=0;S<h;S++){const N=p[S],D=b[S],P=M[S],U=w*C*4*S;for(let O=0;O<N.count;O++){const W=O*g;_===!0&&(s.fromBufferAttribute(N,O),R[U+W+0]=s.x,R[U+W+1]=s.y,R[U+W+2]=s.z,R[U+W+3]=0),x===!0&&(s.fromBufferAttribute(D,O),R[U+W+4]=s.x,R[U+W+5]=s.y,R[U+W+6]=s.z,R[U+W+7]=0),m===!0&&(s.fromBufferAttribute(P,O),R[U+W+8]=s.x,R[U+W+9]=s.y,R[U+W+10]=s.z,R[U+W+11]=P.itemSize===4?s.w:1)}}f={count:h,texture:A,size:new ie(w,C)},n.set(a,f),a.addEventListener("dispose",y)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let _=0;for(let m=0;m<c.length;m++)_+=c[m];const x=a.morphTargetsRelative?1:1-_;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Sv(i,e,t,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,h=e.get(l,u);if(s.get(h)!==c&&(e.update(h),s.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return h}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}const id=new It,fh=new Bf(1,1),sd=new bf,rd=new Op,od=new Pf,dh=[],ph=[],mh=new Float32Array(16),gh=new Float32Array(9),_h=new Float32Array(4);function Qs(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let r=dh[s];if(r===void 0&&(r=new Float32Array(s),dh[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function Dt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Nt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function fa(i,e){let t=ph[e];t===void 0&&(t=new Int32Array(e),ph[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function bv(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Ev(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Dt(t,e))return;i.uniform2fv(this.addr,e),Nt(t,e)}}function Tv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Dt(t,e))return;i.uniform3fv(this.addr,e),Nt(t,e)}}function wv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Dt(t,e))return;i.uniform4fv(this.addr,e),Nt(t,e)}}function Av(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Dt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Nt(t,e)}else{if(Dt(t,n))return;_h.set(n),i.uniformMatrix2fv(this.addr,!1,_h),Nt(t,n)}}function Rv(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Dt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Nt(t,e)}else{if(Dt(t,n))return;gh.set(n),i.uniformMatrix3fv(this.addr,!1,gh),Nt(t,n)}}function Cv(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Dt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Nt(t,e)}else{if(Dt(t,n))return;mh.set(n),i.uniformMatrix4fv(this.addr,!1,mh),Nt(t,n)}}function Pv(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Lv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Dt(t,e))return;i.uniform2iv(this.addr,e),Nt(t,e)}}function Iv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Dt(t,e))return;i.uniform3iv(this.addr,e),Nt(t,e)}}function Dv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Dt(t,e))return;i.uniform4iv(this.addr,e),Nt(t,e)}}function Nv(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Uv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Dt(t,e))return;i.uniform2uiv(this.addr,e),Nt(t,e)}}function Fv(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Dt(t,e))return;i.uniform3uiv(this.addr,e),Nt(t,e)}}function Ov(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Dt(t,e))return;i.uniform4uiv(this.addr,e),Nt(t,e)}}function Bv(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(fh.compareFunction=Mf,r=fh):r=id,t.setTexture2D(e||r,s)}function zv(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||rd,s)}function kv(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||od,s)}function Hv(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||sd,s)}function Vv(i){switch(i){case 5126:return bv;case 35664:return Ev;case 35665:return Tv;case 35666:return wv;case 35674:return Av;case 35675:return Rv;case 35676:return Cv;case 5124:case 35670:return Pv;case 35667:case 35671:return Lv;case 35668:case 35672:return Iv;case 35669:case 35673:return Dv;case 5125:return Nv;case 36294:return Uv;case 36295:return Fv;case 36296:return Ov;case 35678:case 36198:case 36298:case 36306:case 35682:return Bv;case 35679:case 36299:case 36307:return zv;case 35680:case 36300:case 36308:case 36293:return kv;case 36289:case 36303:case 36311:case 36292:return Hv}}function Gv(i,e){i.uniform1fv(this.addr,e)}function Wv(i,e){const t=Qs(e,this.size,2);i.uniform2fv(this.addr,t)}function Xv(i,e){const t=Qs(e,this.size,3);i.uniform3fv(this.addr,t)}function Yv(i,e){const t=Qs(e,this.size,4);i.uniform4fv(this.addr,t)}function qv(i,e){const t=Qs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Kv(i,e){const t=Qs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function $v(i,e){const t=Qs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function jv(i,e){i.uniform1iv(this.addr,e)}function Zv(i,e){i.uniform2iv(this.addr,e)}function Jv(i,e){i.uniform3iv(this.addr,e)}function Qv(i,e){i.uniform4iv(this.addr,e)}function ex(i,e){i.uniform1uiv(this.addr,e)}function tx(i,e){i.uniform2uiv(this.addr,e)}function nx(i,e){i.uniform3uiv(this.addr,e)}function ix(i,e){i.uniform4uiv(this.addr,e)}function sx(i,e,t){const n=this.cache,s=e.length,r=fa(t,s);Dt(n,r)||(i.uniform1iv(this.addr,r),Nt(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||id,r[o])}function rx(i,e,t){const n=this.cache,s=e.length,r=fa(t,s);Dt(n,r)||(i.uniform1iv(this.addr,r),Nt(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||rd,r[o])}function ox(i,e,t){const n=this.cache,s=e.length,r=fa(t,s);Dt(n,r)||(i.uniform1iv(this.addr,r),Nt(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||od,r[o])}function ax(i,e,t){const n=this.cache,s=e.length,r=fa(t,s);Dt(n,r)||(i.uniform1iv(this.addr,r),Nt(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||sd,r[o])}function lx(i){switch(i){case 5126:return Gv;case 35664:return Wv;case 35665:return Xv;case 35666:return Yv;case 35674:return qv;case 35675:return Kv;case 35676:return $v;case 5124:case 35670:return jv;case 35667:case 35671:return Zv;case 35668:case 35672:return Jv;case 35669:case 35673:return Qv;case 5125:return ex;case 36294:return tx;case 36295:return nx;case 36296:return ix;case 35678:case 36198:case 36298:case 36306:case 35682:return sx;case 35679:case 36299:case 36307:return rx;case 35680:case 36300:case 36308:case 36293:return ox;case 36289:case 36303:case 36311:case 36292:return ax}}class cx{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Vv(t.type)}}class ux{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=lx(t.type)}}class hx{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(e,t[a.id],n)}}}const rl=/(\w+)(\])?(\[|\.)?/g;function vh(i,e){i.seq.push(e),i.map[e.id]=e}function fx(i,e,t){const n=i.name,s=n.length;for(rl.lastIndex=0;;){const r=rl.exec(n),o=rl.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){vh(t,c===void 0?new cx(a,i,e):new ux(a,i,e));break}else{let h=t.map[a];h===void 0&&(h=new hx(a),vh(t,h)),t=h}}}class Vo{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);fx(r,o,this)}}setValue(e,t,n,s){const r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){const a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,r=e.length;s!==r;++s){const o=e[s];o.id in t&&n.push(o)}return n}}function xh(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const dx=37297;let px=0;function mx(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}const yh=new Ke;function gx(i){et._getMatrix(yh,et.workingColorSpace,i);const e=`mat3( ${yh.elements.map(t=>t.toFixed(4))} )`;switch(et.getTransfer(i)){case qo:return[e,"LinearTransferOETF"];case ct:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Mh(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const o=/ERROR: 0:(\d+)/.exec(r);if(o){const a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+mx(i.getShaderSource(e),a)}else return r}function _x(i,e){const t=gx(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function vx(i,e){let t;switch(e){case sf:t="Linear";break;case rf:t="Reinhard";break;case of:t="Cineon";break;case oa:t="ACESFilmic";break;case lf:t="AgX";break;case cf:t="Neutral";break;case af:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Lo=new I;function xx(){et.getLuminanceCoefficients(Lo);const i=Lo.x.toFixed(4),e=Lo.y.toFixed(4),t=Lo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function yx(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(vr).join(`
`)}function Mx(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Sx(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(e,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function vr(i){return i!==""}function Sh(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function bh(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const bx=/^[ \t]*#include +<([\w\d./]+)>/gm;function oc(i){return i.replace(bx,Tx)}const Ex=new Map;function Tx(i,e){let t=je[e];if(t===void 0){const n=Ex.get(e);if(n!==void 0)t=je[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return oc(t)}const wx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Eh(i){return i.replace(wx,Ax)}function Ax(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Th(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Rx(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===tf?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===vc?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===oi&&(e="SHADOWMAP_TYPE_VSM"),e}function Cx(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Os:case Bs:e="ENVMAP_TYPE_CUBE";break;case aa:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Px(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Bs&&(e="ENVMAP_MODE_REFRACTION"),e}function Lx(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case nf:e="ENVMAP_BLENDING_MULTIPLY";break;case Qd:e="ENVMAP_BLENDING_MIX";break;case ep:e="ENVMAP_BLENDING_ADD";break}return e}function Ix(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Dx(i,e,t,n){const s=i.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=Rx(t),c=Cx(t),u=Px(t),h=Lx(t),f=Ix(t),d=yx(t),_=Mx(r),x=s.createProgram();let m,p,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(vr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(vr).join(`
`),p.length>0&&(p+=`
`)):(m=[Th(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(vr).join(`
`),p=[Th(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Li?"#define TONE_MAPPING":"",t.toneMapping!==Li?je.tonemapping_pars_fragment:"",t.toneMapping!==Li?vx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",je.colorspace_pars_fragment,_x("linearToOutputTexel",t.outputColorSpace),xx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(vr).join(`
`)),o=oc(o),o=Sh(o,t),o=bh(o,t),a=oc(a),a=Sh(a,t),a=bh(a,t),o=Eh(o),a=Eh(a),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===pu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===pu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const M=b+m+o,v=b+p+a,w=xh(s,s.VERTEX_SHADER,M),C=xh(s,s.FRAGMENT_SHADER,v);s.attachShader(x,w),s.attachShader(x,C),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function R(S){if(i.debug.checkShaderErrors){const N=s.getProgramInfoLog(x)||"",D=s.getShaderInfoLog(w)||"",P=s.getShaderInfoLog(C)||"",U=N.trim(),O=D.trim(),W=P.trim();let H=!0,Z=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,w,C);else{const ae=Mh(s,w,"vertex"),z=Mh(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+S.name+`
Material Type: `+S.type+`

Program Info Log: `+U+`
`+ae+`
`+z)}else U!==""?console.warn("THREE.WebGLProgram: Program Info Log:",U):(O===""||W==="")&&(Z=!1);Z&&(S.diagnostics={runnable:H,programLog:U,vertexShader:{log:O,prefix:m},fragmentShader:{log:W,prefix:p}})}s.deleteShader(w),s.deleteShader(C),A=new Vo(s,x),g=Sx(s,x)}let A;this.getUniforms=function(){return A===void 0&&R(this),A};let g;this.getAttributes=function(){return g===void 0&&R(this),g};let y=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=s.getProgramParameter(x,dx)),y},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=px++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=w,this.fragmentShader=C,this}let Nx=0;class Ux{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Fx(e),t.set(e,n)),n}}class Fx{constructor(e){this.id=Nx++,this.code=e,this.usedTimes=0}}function Ox(i,e,t,n,s,r,o){const a=new Ef,l=new Ux,c=new Set,u=[],h=s.logarithmicDepthBuffer,f=s.vertexTextures;let d=s.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(g){return c.add(g),g===0?"uv":`uv${g}`}function m(g,y,S,N,D){const P=N.fog,U=D.geometry,O=g.isMeshStandardMaterial?N.environment:null,W=(g.isMeshStandardMaterial?t:e).get(g.envMap||O),H=W&&W.mapping===aa?W.image.height:null,Z=_[g.type];g.precision!==null&&(d=s.getMaxPrecision(g.precision),d!==g.precision&&console.warn("THREE.WebGLProgram.getParameters:",g.precision,"not supported, using",d,"instead."));const ae=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,z=ae!==void 0?ae.length:0;let Q=0;U.morphAttributes.position!==void 0&&(Q=1),U.morphAttributes.normal!==void 0&&(Q=2),U.morphAttributes.color!==void 0&&(Q=3);let re,de,Re,q;if(Z){const it=kn[Z];re=it.vertexShader,de=it.fragmentShader}else re=g.vertexShader,de=g.fragmentShader,l.update(g),Re=l.getVertexShaderID(g),q=l.getFragmentShaderID(g);const ee=i.getRenderTarget(),me=i.state.buffers.depth.getReversed(),Me=D.isInstancedMesh===!0,ye=D.isBatchedMesh===!0,Ze=!!g.map,at=!!g.matcap,F=!!W,se=!!g.aoMap,te=!!g.lightMap,j=!!g.bumpMap,J=!!g.normalMap,ge=!!g.displacementMap,le=!!g.emissiveMap,_e=!!g.metalnessMap,Ve=!!g.roughnessMap,ke=g.anisotropy>0,L=g.clearcoat>0,E=g.dispersion>0,G=g.iridescence>0,K=g.sheen>0,oe=g.transmission>0,$=ke&&!!g.anisotropyMap,Ie=L&&!!g.clearcoatMap,pe=L&&!!g.clearcoatNormalMap,Ce=L&&!!g.clearcoatRoughnessMap,Pe=G&&!!g.iridescenceMap,ce=G&&!!g.iridescenceThicknessMap,Ee=K&&!!g.sheenColorMap,Be=K&&!!g.sheenRoughnessMap,Ne=!!g.specularMap,Se=!!g.specularColorMap,qe=!!g.specularIntensityMap,B=oe&&!!g.transmissionMap,fe=oe&&!!g.thicknessMap,ve=!!g.gradientMap,we=!!g.alphaMap,ue=g.alphaTest>0,ne=!!g.alphaHash,Le=!!g.extensions;let Ge=Li;g.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Ge=i.toneMapping);const gt={shaderID:Z,shaderType:g.type,shaderName:g.name,vertexShader:re,fragmentShader:de,defines:g.defines,customVertexShaderID:Re,customFragmentShaderID:q,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:d,batching:ye,batchingColor:ye&&D._colorsTexture!==null,instancing:Me,instancingColor:Me&&D.instanceColor!==null,instancingMorph:Me&&D.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:ee===null?i.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:Yt,alphaToCoverage:!!g.alphaToCoverage,map:Ze,matcap:at,envMap:F,envMapMode:F&&W.mapping,envMapCubeUVHeight:H,aoMap:se,lightMap:te,bumpMap:j,normalMap:J,displacementMap:f&&ge,emissiveMap:le,normalMapObjectSpace:J&&g.normalMapType===op,normalMapTangentSpace:J&&g.normalMapType===yf,metalnessMap:_e,roughnessMap:Ve,anisotropy:ke,anisotropyMap:$,clearcoat:L,clearcoatMap:Ie,clearcoatNormalMap:pe,clearcoatRoughnessMap:Ce,dispersion:E,iridescence:G,iridescenceMap:Pe,iridescenceThicknessMap:ce,sheen:K,sheenColorMap:Ee,sheenRoughnessMap:Be,specularMap:Ne,specularColorMap:Se,specularIntensityMap:qe,transmission:oe,transmissionMap:B,thicknessMap:fe,gradientMap:ve,opaque:g.transparent===!1&&g.blending===Is&&g.alphaToCoverage===!1,alphaMap:we,alphaTest:ue,alphaHash:ne,combine:g.combine,mapUv:Ze&&x(g.map.channel),aoMapUv:se&&x(g.aoMap.channel),lightMapUv:te&&x(g.lightMap.channel),bumpMapUv:j&&x(g.bumpMap.channel),normalMapUv:J&&x(g.normalMap.channel),displacementMapUv:ge&&x(g.displacementMap.channel),emissiveMapUv:le&&x(g.emissiveMap.channel),metalnessMapUv:_e&&x(g.metalnessMap.channel),roughnessMapUv:Ve&&x(g.roughnessMap.channel),anisotropyMapUv:$&&x(g.anisotropyMap.channel),clearcoatMapUv:Ie&&x(g.clearcoatMap.channel),clearcoatNormalMapUv:pe&&x(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ce&&x(g.clearcoatRoughnessMap.channel),iridescenceMapUv:Pe&&x(g.iridescenceMap.channel),iridescenceThicknessMapUv:ce&&x(g.iridescenceThicknessMap.channel),sheenColorMapUv:Ee&&x(g.sheenColorMap.channel),sheenRoughnessMapUv:Be&&x(g.sheenRoughnessMap.channel),specularMapUv:Ne&&x(g.specularMap.channel),specularColorMapUv:Se&&x(g.specularColorMap.channel),specularIntensityMapUv:qe&&x(g.specularIntensityMap.channel),transmissionMapUv:B&&x(g.transmissionMap.channel),thicknessMapUv:fe&&x(g.thicknessMap.channel),alphaMapUv:we&&x(g.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(J||ke),vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!U.attributes.uv&&(Ze||we),fog:!!P,useFog:g.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:g.flatShading===!0&&g.wireframe===!1,sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:me,skinning:D.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:z,morphTextureStride:Q,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&S.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ge,decodeVideoTexture:Ze&&g.map.isVideoTexture===!0&&et.getTransfer(g.map.colorSpace)===ct,decodeVideoTextureEmissive:le&&g.emissiveMap.isVideoTexture===!0&&et.getTransfer(g.emissiveMap.colorSpace)===ct,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===Pt,flipSided:g.side===jt,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:Le&&g.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Le&&g.extensions.multiDraw===!0||ye)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return gt.vertexUv1s=c.has(1),gt.vertexUv2s=c.has(2),gt.vertexUv3s=c.has(3),c.clear(),gt}function p(g){const y=[];if(g.shaderID?y.push(g.shaderID):(y.push(g.customVertexShaderID),y.push(g.customFragmentShaderID)),g.defines!==void 0)for(const S in g.defines)y.push(S),y.push(g.defines[S]);return g.isRawShaderMaterial===!1&&(b(y,g),M(y,g),y.push(i.outputColorSpace)),y.push(g.customProgramCacheKey),y.join()}function b(g,y){g.push(y.precision),g.push(y.outputColorSpace),g.push(y.envMapMode),g.push(y.envMapCubeUVHeight),g.push(y.mapUv),g.push(y.alphaMapUv),g.push(y.lightMapUv),g.push(y.aoMapUv),g.push(y.bumpMapUv),g.push(y.normalMapUv),g.push(y.displacementMapUv),g.push(y.emissiveMapUv),g.push(y.metalnessMapUv),g.push(y.roughnessMapUv),g.push(y.anisotropyMapUv),g.push(y.clearcoatMapUv),g.push(y.clearcoatNormalMapUv),g.push(y.clearcoatRoughnessMapUv),g.push(y.iridescenceMapUv),g.push(y.iridescenceThicknessMapUv),g.push(y.sheenColorMapUv),g.push(y.sheenRoughnessMapUv),g.push(y.specularMapUv),g.push(y.specularColorMapUv),g.push(y.specularIntensityMapUv),g.push(y.transmissionMapUv),g.push(y.thicknessMapUv),g.push(y.combine),g.push(y.fogExp2),g.push(y.sizeAttenuation),g.push(y.morphTargetsCount),g.push(y.morphAttributeCount),g.push(y.numDirLights),g.push(y.numPointLights),g.push(y.numSpotLights),g.push(y.numSpotLightMaps),g.push(y.numHemiLights),g.push(y.numRectAreaLights),g.push(y.numDirLightShadows),g.push(y.numPointLightShadows),g.push(y.numSpotLightShadows),g.push(y.numSpotLightShadowsWithMaps),g.push(y.numLightProbes),g.push(y.shadowMapType),g.push(y.toneMapping),g.push(y.numClippingPlanes),g.push(y.numClipIntersection),g.push(y.depthPacking)}function M(g,y){a.disableAll(),y.supportsVertexTextures&&a.enable(0),y.instancing&&a.enable(1),y.instancingColor&&a.enable(2),y.instancingMorph&&a.enable(3),y.matcap&&a.enable(4),y.envMap&&a.enable(5),y.normalMapObjectSpace&&a.enable(6),y.normalMapTangentSpace&&a.enable(7),y.clearcoat&&a.enable(8),y.iridescence&&a.enable(9),y.alphaTest&&a.enable(10),y.vertexColors&&a.enable(11),y.vertexAlphas&&a.enable(12),y.vertexUv1s&&a.enable(13),y.vertexUv2s&&a.enable(14),y.vertexUv3s&&a.enable(15),y.vertexTangents&&a.enable(16),y.anisotropy&&a.enable(17),y.alphaHash&&a.enable(18),y.batching&&a.enable(19),y.dispersion&&a.enable(20),y.batchingColor&&a.enable(21),y.gradientMap&&a.enable(22),g.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reversedDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),g.push(a.mask)}function v(g){const y=_[g.type];let S;if(y){const N=kn[y];S=Di.clone(N.uniforms)}else S=g.uniforms;return S}function w(g,y){let S;for(let N=0,D=u.length;N<D;N++){const P=u[N];if(P.cacheKey===y){S=P,++S.usedTimes;break}}return S===void 0&&(S=new Dx(i,y,g,r),u.push(S)),S}function C(g){if(--g.usedTimes===0){const y=u.indexOf(g);u[y]=u[u.length-1],u.pop(),g.destroy()}}function R(g){l.remove(g)}function A(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:v,acquireProgram:w,releaseProgram:C,releaseShaderCache:R,programs:u,dispose:A}}function Bx(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function zx(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function wh(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Ah(){const i=[];let e=0;const t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(h,f,d,_,x,m){let p=i[e];return p===void 0?(p={id:h.id,object:h,geometry:f,material:d,groupOrder:_,renderOrder:h.renderOrder,z:x,group:m},i[e]=p):(p.id=h.id,p.object=h,p.geometry=f,p.material=d,p.groupOrder=_,p.renderOrder=h.renderOrder,p.z=x,p.group=m),e++,p}function a(h,f,d,_,x,m){const p=o(h,f,d,_,x,m);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):t.push(p)}function l(h,f,d,_,x,m){const p=o(h,f,d,_,x,m);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):t.unshift(p)}function c(h,f){t.length>1&&t.sort(h||zx),n.length>1&&n.sort(f||wh),s.length>1&&s.sort(f||wh)}function u(){for(let h=e,f=i.length;h<f;h++){const d=i[h];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function kx(){let i=new WeakMap;function e(n,s){const r=i.get(n);let o;return r===void 0?(o=new Ah,i.set(n,[o])):s>=r.length?(o=new Ah,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function Hx(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new De};break;case"SpotLight":t={position:new I,direction:new I,color:new De,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new De,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new De,groundColor:new De};break;case"RectAreaLight":t={color:new De,position:new I,halfWidth:new I,halfHeight:new I};break}return i[e.id]=t,t}}}function Vx(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Gx=0;function Wx(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Xx(i){const e=new Hx,t=Vx(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new I);const s=new I,r=new He,o=new He;function a(c){let u=0,h=0,f=0;for(let g=0;g<9;g++)n.probe[g].set(0,0,0);let d=0,_=0,x=0,m=0,p=0,b=0,M=0,v=0,w=0,C=0,R=0;c.sort(Wx);for(let g=0,y=c.length;g<y;g++){const S=c[g],N=S.color,D=S.intensity,P=S.distance,U=S.shadow&&S.shadow.map?S.shadow.map.texture:null;if(S.isAmbientLight)u+=N.r*D,h+=N.g*D,f+=N.b*D;else if(S.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(S.sh.coefficients[O],D);R++}else if(S.isDirectionalLight){const O=e.get(S);if(O.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){const W=S.shadow,H=t.get(S);H.shadowIntensity=W.intensity,H.shadowBias=W.bias,H.shadowNormalBias=W.normalBias,H.shadowRadius=W.radius,H.shadowMapSize=W.mapSize,n.directionalShadow[d]=H,n.directionalShadowMap[d]=U,n.directionalShadowMatrix[d]=S.shadow.matrix,b++}n.directional[d]=O,d++}else if(S.isSpotLight){const O=e.get(S);O.position.setFromMatrixPosition(S.matrixWorld),O.color.copy(N).multiplyScalar(D),O.distance=P,O.coneCos=Math.cos(S.angle),O.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),O.decay=S.decay,n.spot[x]=O;const W=S.shadow;if(S.map&&(n.spotLightMap[w]=S.map,w++,W.updateMatrices(S),S.castShadow&&C++),n.spotLightMatrix[x]=W.matrix,S.castShadow){const H=t.get(S);H.shadowIntensity=W.intensity,H.shadowBias=W.bias,H.shadowNormalBias=W.normalBias,H.shadowRadius=W.radius,H.shadowMapSize=W.mapSize,n.spotShadow[x]=H,n.spotShadowMap[x]=U,v++}x++}else if(S.isRectAreaLight){const O=e.get(S);O.color.copy(N).multiplyScalar(D),O.halfWidth.set(S.width*.5,0,0),O.halfHeight.set(0,S.height*.5,0),n.rectArea[m]=O,m++}else if(S.isPointLight){const O=e.get(S);if(O.color.copy(S.color).multiplyScalar(S.intensity),O.distance=S.distance,O.decay=S.decay,S.castShadow){const W=S.shadow,H=t.get(S);H.shadowIntensity=W.intensity,H.shadowBias=W.bias,H.shadowNormalBias=W.normalBias,H.shadowRadius=W.radius,H.shadowMapSize=W.mapSize,H.shadowCameraNear=W.camera.near,H.shadowCameraFar=W.camera.far,n.pointShadow[_]=H,n.pointShadowMap[_]=U,n.pointShadowMatrix[_]=S.shadow.matrix,M++}n.point[_]=O,_++}else if(S.isHemisphereLight){const O=e.get(S);O.skyColor.copy(S.color).multiplyScalar(D),O.groundColor.copy(S.groundColor).multiplyScalar(D),n.hemi[p]=O,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=xe.LTC_FLOAT_1,n.rectAreaLTC2=xe.LTC_FLOAT_2):(n.rectAreaLTC1=xe.LTC_HALF_1,n.rectAreaLTC2=xe.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=f;const A=n.hash;(A.directionalLength!==d||A.pointLength!==_||A.spotLength!==x||A.rectAreaLength!==m||A.hemiLength!==p||A.numDirectionalShadows!==b||A.numPointShadows!==M||A.numSpotShadows!==v||A.numSpotMaps!==w||A.numLightProbes!==R)&&(n.directional.length=d,n.spot.length=x,n.rectArea.length=m,n.point.length=_,n.hemi.length=p,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=v+w-C,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=R,A.directionalLength=d,A.pointLength=_,A.spotLength=x,A.rectAreaLength=m,A.hemiLength=p,A.numDirectionalShadows=b,A.numPointShadows=M,A.numSpotShadows=v,A.numSpotMaps=w,A.numLightProbes=R,n.version=Gx++)}function l(c,u){let h=0,f=0,d=0,_=0,x=0;const m=u.matrixWorldInverse;for(let p=0,b=c.length;p<b;p++){const M=c[p];if(M.isDirectionalLight){const v=n.directional[h];v.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),h++}else if(M.isSpotLight){const v=n.spot[d];v.position.setFromMatrixPosition(M.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),d++}else if(M.isRectAreaLight){const v=n.rectArea[_];v.position.setFromMatrixPosition(M.matrixWorld),v.position.applyMatrix4(m),o.identity(),r.copy(M.matrixWorld),r.premultiply(m),o.extractRotation(r),v.halfWidth.set(M.width*.5,0,0),v.halfHeight.set(0,M.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),_++}else if(M.isPointLight){const v=n.point[f];v.position.setFromMatrixPosition(M.matrixWorld),v.position.applyMatrix4(m),f++}else if(M.isHemisphereLight){const v=n.hemi[x];v.direction.setFromMatrixPosition(M.matrixWorld),v.direction.transformDirection(m),x++}}}return{setup:a,setupView:l,state:n}}function Rh(i){const e=new Xx(i),t=[],n=[];function s(u){c.camera=u,t.length=0,n.length=0}function r(u){t.push(u)}function o(u){n.push(u)}function a(){e.setup(t)}function l(u){e.setupView(t,u)}const c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function Yx(i){let e=new WeakMap;function t(s,r=0){const o=e.get(s);let a;return o===void 0?(a=new Rh(i),e.set(s,[a])):r>=o.length?(a=new Rh(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}const qx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Kx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function $x(i,e,t){let n=new Dc;const s=new ie,r=new ie,o=new tt,a=new qm({depthPacking:rp}),l=new Km,c={},u=t.maxTextureSize,h={[Xn]:jt,[jt]:Xn,[Pt]:Pt},f=new Ot({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ie},radius:{value:4}},vertexShader:qx,fragmentShader:Kx}),d=f.clone();d.defines.HORIZONTAL_PASS=1;const _=new Mt;_.setAttribute("position",new Jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new Rt(_,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=tf;let p=this.type;this.render=function(C,R,A){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||C.length===0)return;const g=i.getRenderTarget(),y=i.getActiveCubeFace(),S=i.getActiveMipmapLevel(),N=i.state;N.setBlending(fi),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const D=p!==oi&&this.type===oi,P=p===oi&&this.type!==oi;for(let U=0,O=C.length;U<O;U++){const W=C[U],H=W.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",W,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);const Z=H.getFrameExtents();if(s.multiply(Z),r.copy(H.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Z.x),s.x=r.x*Z.x,H.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Z.y),s.y=r.y*Z.y,H.mapSize.y=r.y)),H.map===null||D===!0||P===!0){const z=this.type!==oi?{minFilter:Zt,magFilter:Zt}:{};H.map!==null&&H.map.dispose(),H.map=new Mn(s.x,s.y,z),H.map.texture.name=W.name+".shadowMap",H.camera.updateProjectionMatrix()}i.setRenderTarget(H.map),i.clear();const ae=H.getViewportCount();for(let z=0;z<ae;z++){const Q=H.getViewport(z);o.set(r.x*Q.x,r.y*Q.y,r.x*Q.z,r.y*Q.w),N.viewport(o),H.updateMatrices(W,z),n=H.getFrustum(),v(R,A,H.camera,W,this.type)}H.isPointLightShadow!==!0&&this.type===oi&&b(H,A),H.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(g,y,S)};function b(C,R){const A=e.update(x);f.defines.VSM_SAMPLES!==C.blurSamples&&(f.defines.VSM_SAMPLES=C.blurSamples,d.defines.VSM_SAMPLES=C.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Mn(s.x,s.y)),f.uniforms.shadow_pass.value=C.map.texture,f.uniforms.resolution.value=C.mapSize,f.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(R,null,A,f,x,null),d.uniforms.shadow_pass.value=C.mapPass.texture,d.uniforms.resolution.value=C.mapSize,d.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(R,null,A,d,x,null)}function M(C,R,A,g){let y=null;const S=A.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(S!==void 0)y=S;else if(y=A.isPointLight===!0?l:a,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const N=y.uuid,D=R.uuid;let P=c[N];P===void 0&&(P={},c[N]=P);let U=P[D];U===void 0&&(U=y.clone(),P[D]=U,R.addEventListener("dispose",w)),y=U}if(y.visible=R.visible,y.wireframe=R.wireframe,g===oi?y.side=R.shadowSide!==null?R.shadowSide:R.side:y.side=R.shadowSide!==null?R.shadowSide:h[R.side],y.alphaMap=R.alphaMap,y.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,y.map=R.map,y.clipShadows=R.clipShadows,y.clippingPlanes=R.clippingPlanes,y.clipIntersection=R.clipIntersection,y.displacementMap=R.displacementMap,y.displacementScale=R.displacementScale,y.displacementBias=R.displacementBias,y.wireframeLinewidth=R.wireframeLinewidth,y.linewidth=R.linewidth,A.isPointLight===!0&&y.isMeshDistanceMaterial===!0){const N=i.properties.get(y);N.light=A}return y}function v(C,R,A,g,y){if(C.visible===!1)return;if(C.layers.test(R.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&y===oi)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(A.matrixWorldInverse,C.matrixWorld);const D=e.update(C),P=C.material;if(Array.isArray(P)){const U=D.groups;for(let O=0,W=U.length;O<W;O++){const H=U[O],Z=P[H.materialIndex];if(Z&&Z.visible){const ae=M(C,Z,g,y);C.onBeforeShadow(i,C,R,A,D,ae,H),i.renderBufferDirect(A,null,D,ae,C,H),C.onAfterShadow(i,C,R,A,D,ae,H)}}}else if(P.visible){const U=M(C,P,g,y);C.onBeforeShadow(i,C,R,A,D,U,null),i.renderBufferDirect(A,null,D,U,C,null),C.onAfterShadow(i,C,R,A,D,U,null)}}const N=C.children;for(let D=0,P=N.length;D<P;D++)v(N[D],R,A,g,y)}function w(C){C.target.removeEventListener("dispose",w);for(const A in c){const g=c[A],y=C.target.uuid;y in g&&(g[y].dispose(),delete g[y])}}}const jx={[vl]:xl,[yl]:bl,[Ml]:El,[Fs]:Sl,[xl]:vl,[bl]:yl,[El]:Ml,[Sl]:Fs};function Zx(i,e){function t(){let B=!1;const fe=new tt;let ve=null;const we=new tt(0,0,0,0);return{setMask:function(ue){ve!==ue&&!B&&(i.colorMask(ue,ue,ue,ue),ve=ue)},setLocked:function(ue){B=ue},setClear:function(ue,ne,Le,Ge,gt){gt===!0&&(ue*=Ge,ne*=Ge,Le*=Ge),fe.set(ue,ne,Le,Ge),we.equals(fe)===!1&&(i.clearColor(ue,ne,Le,Ge),we.copy(fe))},reset:function(){B=!1,ve=null,we.set(-1,0,0,0)}}}function n(){let B=!1,fe=!1,ve=null,we=null,ue=null;return{setReversed:function(ne){if(fe!==ne){const Le=e.get("EXT_clip_control");ne?Le.clipControlEXT(Le.LOWER_LEFT_EXT,Le.ZERO_TO_ONE_EXT):Le.clipControlEXT(Le.LOWER_LEFT_EXT,Le.NEGATIVE_ONE_TO_ONE_EXT),fe=ne;const Ge=ue;ue=null,this.setClear(Ge)}},getReversed:function(){return fe},setTest:function(ne){ne?ee(i.DEPTH_TEST):me(i.DEPTH_TEST)},setMask:function(ne){ve!==ne&&!B&&(i.depthMask(ne),ve=ne)},setFunc:function(ne){if(fe&&(ne=jx[ne]),we!==ne){switch(ne){case vl:i.depthFunc(i.NEVER);break;case xl:i.depthFunc(i.ALWAYS);break;case yl:i.depthFunc(i.LESS);break;case Fs:i.depthFunc(i.LEQUAL);break;case Ml:i.depthFunc(i.EQUAL);break;case Sl:i.depthFunc(i.GEQUAL);break;case bl:i.depthFunc(i.GREATER);break;case El:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}we=ne}},setLocked:function(ne){B=ne},setClear:function(ne){ue!==ne&&(fe&&(ne=1-ne),i.clearDepth(ne),ue=ne)},reset:function(){B=!1,ve=null,we=null,ue=null,fe=!1}}}function s(){let B=!1,fe=null,ve=null,we=null,ue=null,ne=null,Le=null,Ge=null,gt=null;return{setTest:function(it){B||(it?ee(i.STENCIL_TEST):me(i.STENCIL_TEST))},setMask:function(it){fe!==it&&!B&&(i.stencilMask(it),fe=it)},setFunc:function(it,Qn,On){(ve!==it||we!==Qn||ue!==On)&&(i.stencilFunc(it,Qn,On),ve=it,we=Qn,ue=On)},setOp:function(it,Qn,On){(ne!==it||Le!==Qn||Ge!==On)&&(i.stencilOp(it,Qn,On),ne=it,Le=Qn,Ge=On)},setLocked:function(it){B=it},setClear:function(it){gt!==it&&(i.clearStencil(it),gt=it)},reset:function(){B=!1,fe=null,ve=null,we=null,ue=null,ne=null,Le=null,Ge=null,gt=null}}}const r=new t,o=new n,a=new s,l=new WeakMap,c=new WeakMap;let u={},h={},f=new WeakMap,d=[],_=null,x=!1,m=null,p=null,b=null,M=null,v=null,w=null,C=null,R=new De(0,0,0),A=0,g=!1,y=null,S=null,N=null,D=null,P=null;const U=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let O=!1,W=0;const H=i.getParameter(i.VERSION);H.indexOf("WebGL")!==-1?(W=parseFloat(/^WebGL (\d)/.exec(H)[1]),O=W>=1):H.indexOf("OpenGL ES")!==-1&&(W=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),O=W>=2);let Z=null,ae={};const z=i.getParameter(i.SCISSOR_BOX),Q=i.getParameter(i.VIEWPORT),re=new tt().fromArray(z),de=new tt().fromArray(Q);function Re(B,fe,ve,we){const ue=new Uint8Array(4),ne=i.createTexture();i.bindTexture(B,ne),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Le=0;Le<ve;Le++)B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY?i.texImage3D(fe,0,i.RGBA,1,1,we,0,i.RGBA,i.UNSIGNED_BYTE,ue):i.texImage2D(fe+Le,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ue);return ne}const q={};q[i.TEXTURE_2D]=Re(i.TEXTURE_2D,i.TEXTURE_2D,1),q[i.TEXTURE_CUBE_MAP]=Re(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[i.TEXTURE_2D_ARRAY]=Re(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),q[i.TEXTURE_3D]=Re(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ee(i.DEPTH_TEST),o.setFunc(Fs),j(!1),J(ou),ee(i.CULL_FACE),se(fi);function ee(B){u[B]!==!0&&(i.enable(B),u[B]=!0)}function me(B){u[B]!==!1&&(i.disable(B),u[B]=!1)}function Me(B,fe){return h[B]!==fe?(i.bindFramebuffer(B,fe),h[B]=fe,B===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=fe),B===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=fe),!0):!1}function ye(B,fe){let ve=d,we=!1;if(B){ve=f.get(fe),ve===void 0&&(ve=[],f.set(fe,ve));const ue=B.textures;if(ve.length!==ue.length||ve[0]!==i.COLOR_ATTACHMENT0){for(let ne=0,Le=ue.length;ne<Le;ne++)ve[ne]=i.COLOR_ATTACHMENT0+ne;ve.length=ue.length,we=!0}}else ve[0]!==i.BACK&&(ve[0]=i.BACK,we=!0);we&&i.drawBuffers(ve)}function Ze(B){return _!==B?(i.useProgram(B),_=B,!0):!1}const at={[Zi]:i.FUNC_ADD,[Fd]:i.FUNC_SUBTRACT,[Od]:i.FUNC_REVERSE_SUBTRACT};at[Bd]=i.MIN,at[zd]=i.MAX;const F={[kd]:i.ZERO,[Hd]:i.ONE,[Vd]:i.SRC_COLOR,[gl]:i.SRC_ALPHA,[Kd]:i.SRC_ALPHA_SATURATE,[Yd]:i.DST_COLOR,[Wd]:i.DST_ALPHA,[Gd]:i.ONE_MINUS_SRC_COLOR,[_l]:i.ONE_MINUS_SRC_ALPHA,[qd]:i.ONE_MINUS_DST_COLOR,[Xd]:i.ONE_MINUS_DST_ALPHA,[$d]:i.CONSTANT_COLOR,[jd]:i.ONE_MINUS_CONSTANT_COLOR,[Zd]:i.CONSTANT_ALPHA,[Jd]:i.ONE_MINUS_CONSTANT_ALPHA};function se(B,fe,ve,we,ue,ne,Le,Ge,gt,it){if(B===fi){x===!0&&(me(i.BLEND),x=!1);return}if(x===!1&&(ee(i.BLEND),x=!0),B!==Ud){if(B!==m||it!==g){if((p!==Zi||v!==Zi)&&(i.blendEquation(i.FUNC_ADD),p=Zi,v=Zi),it)switch(B){case Is:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ml:i.blendFunc(i.ONE,i.ONE);break;case au:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case lu:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case Is:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ml:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case au:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case lu:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}b=null,M=null,w=null,C=null,R.set(0,0,0),A=0,m=B,g=it}return}ue=ue||fe,ne=ne||ve,Le=Le||we,(fe!==p||ue!==v)&&(i.blendEquationSeparate(at[fe],at[ue]),p=fe,v=ue),(ve!==b||we!==M||ne!==w||Le!==C)&&(i.blendFuncSeparate(F[ve],F[we],F[ne],F[Le]),b=ve,M=we,w=ne,C=Le),(Ge.equals(R)===!1||gt!==A)&&(i.blendColor(Ge.r,Ge.g,Ge.b,gt),R.copy(Ge),A=gt),m=B,g=!1}function te(B,fe){B.side===Pt?me(i.CULL_FACE):ee(i.CULL_FACE);let ve=B.side===jt;fe&&(ve=!ve),j(ve),B.blending===Is&&B.transparent===!1?se(fi):se(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),o.setFunc(B.depthFunc),o.setTest(B.depthTest),o.setMask(B.depthWrite),r.setMask(B.colorWrite);const we=B.stencilWrite;a.setTest(we),we&&(a.setMask(B.stencilWriteMask),a.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),a.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),le(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):me(i.SAMPLE_ALPHA_TO_COVERAGE)}function j(B){y!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),y=B)}function J(B){B!==Dd?(ee(i.CULL_FACE),B!==S&&(B===ou?i.cullFace(i.BACK):B===Nd?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):me(i.CULL_FACE),S=B}function ge(B){B!==N&&(O&&i.lineWidth(B),N=B)}function le(B,fe,ve){B?(ee(i.POLYGON_OFFSET_FILL),(D!==fe||P!==ve)&&(i.polygonOffset(fe,ve),D=fe,P=ve)):me(i.POLYGON_OFFSET_FILL)}function _e(B){B?ee(i.SCISSOR_TEST):me(i.SCISSOR_TEST)}function Ve(B){B===void 0&&(B=i.TEXTURE0+U-1),Z!==B&&(i.activeTexture(B),Z=B)}function ke(B,fe,ve){ve===void 0&&(Z===null?ve=i.TEXTURE0+U-1:ve=Z);let we=ae[ve];we===void 0&&(we={type:void 0,texture:void 0},ae[ve]=we),(we.type!==B||we.texture!==fe)&&(Z!==ve&&(i.activeTexture(ve),Z=ve),i.bindTexture(B,fe||q[B]),we.type=B,we.texture=fe)}function L(){const B=ae[Z];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function E(){try{i.compressedTexImage2D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function G(){try{i.compressedTexImage3D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function K(){try{i.texSubImage2D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function oe(){try{i.texSubImage3D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function $(){try{i.compressedTexSubImage2D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ie(){try{i.compressedTexSubImage3D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function pe(){try{i.texStorage2D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ce(){try{i.texStorage3D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Pe(){try{i.texImage2D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ce(){try{i.texImage3D(...arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ee(B){re.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),re.copy(B))}function Be(B){de.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),de.copy(B))}function Ne(B,fe){let ve=c.get(fe);ve===void 0&&(ve=new WeakMap,c.set(fe,ve));let we=ve.get(B);we===void 0&&(we=i.getUniformBlockIndex(fe,B.name),ve.set(B,we))}function Se(B,fe){const we=c.get(fe).get(B);l.get(fe)!==we&&(i.uniformBlockBinding(fe,we,B.__bindingPointIndex),l.set(fe,we))}function qe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},Z=null,ae={},h={},f=new WeakMap,d=[],_=null,x=!1,m=null,p=null,b=null,M=null,v=null,w=null,C=null,R=new De(0,0,0),A=0,g=!1,y=null,S=null,N=null,D=null,P=null,re.set(0,0,i.canvas.width,i.canvas.height),de.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ee,disable:me,bindFramebuffer:Me,drawBuffers:ye,useProgram:Ze,setBlending:se,setMaterial:te,setFlipSided:j,setCullFace:J,setLineWidth:ge,setPolygonOffset:le,setScissorTest:_e,activeTexture:Ve,bindTexture:ke,unbindTexture:L,compressedTexImage2D:E,compressedTexImage3D:G,texImage2D:Pe,texImage3D:ce,updateUBOMapping:Ne,uniformBlockBinding:Se,texStorage2D:pe,texStorage3D:Ce,texSubImage2D:K,texSubImage3D:oe,compressedTexSubImage2D:$,compressedTexSubImage3D:Ie,scissor:Ee,viewport:Be,reset:qe}}function Jx(i,e,t,n,s,r,o){const a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ie,u=new WeakMap;let h;const f=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(L,E){return d?new OffscreenCanvas(L,E):Fr("canvas")}function x(L,E,G){let K=1;const oe=ke(L);if((oe.width>G||oe.height>G)&&(K=G/Math.max(oe.width,oe.height)),K<1)if(typeof HTMLImageElement!="undefined"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&L instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&L instanceof ImageBitmap||typeof VideoFrame!="undefined"&&L instanceof VideoFrame){const $=Math.floor(K*oe.width),Ie=Math.floor(K*oe.height);h===void 0&&(h=_($,Ie));const pe=E?_($,Ie):h;return pe.width=$,pe.height=Ie,pe.getContext("2d").drawImage(L,0,0,$,Ie),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+oe.width+"x"+oe.height+") to ("+$+"x"+Ie+")."),pe}else return"data"in L&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+oe.width+"x"+oe.height+")."),L;return L}function m(L){return L.generateMipmaps}function p(L){i.generateMipmap(L)}function b(L){return L.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?i.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(L,E,G,K,oe=!1){if(L!==null){if(i[L]!==void 0)return i[L];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let $=E;if(E===i.RED&&(G===i.FLOAT&&($=i.R32F),G===i.HALF_FLOAT&&($=i.R16F),G===i.UNSIGNED_BYTE&&($=i.R8)),E===i.RED_INTEGER&&(G===i.UNSIGNED_BYTE&&($=i.R8UI),G===i.UNSIGNED_SHORT&&($=i.R16UI),G===i.UNSIGNED_INT&&($=i.R32UI),G===i.BYTE&&($=i.R8I),G===i.SHORT&&($=i.R16I),G===i.INT&&($=i.R32I)),E===i.RG&&(G===i.FLOAT&&($=i.RG32F),G===i.HALF_FLOAT&&($=i.RG16F),G===i.UNSIGNED_BYTE&&($=i.RG8)),E===i.RG_INTEGER&&(G===i.UNSIGNED_BYTE&&($=i.RG8UI),G===i.UNSIGNED_SHORT&&($=i.RG16UI),G===i.UNSIGNED_INT&&($=i.RG32UI),G===i.BYTE&&($=i.RG8I),G===i.SHORT&&($=i.RG16I),G===i.INT&&($=i.RG32I)),E===i.RGB_INTEGER&&(G===i.UNSIGNED_BYTE&&($=i.RGB8UI),G===i.UNSIGNED_SHORT&&($=i.RGB16UI),G===i.UNSIGNED_INT&&($=i.RGB32UI),G===i.BYTE&&($=i.RGB8I),G===i.SHORT&&($=i.RGB16I),G===i.INT&&($=i.RGB32I)),E===i.RGBA_INTEGER&&(G===i.UNSIGNED_BYTE&&($=i.RGBA8UI),G===i.UNSIGNED_SHORT&&($=i.RGBA16UI),G===i.UNSIGNED_INT&&($=i.RGBA32UI),G===i.BYTE&&($=i.RGBA8I),G===i.SHORT&&($=i.RGBA16I),G===i.INT&&($=i.RGBA32I)),E===i.RGB&&(G===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),G===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),E===i.RGBA){const Ie=oe?qo:et.getTransfer(K);G===i.FLOAT&&($=i.RGBA32F),G===i.HALF_FLOAT&&($=i.RGBA16F),G===i.UNSIGNED_BYTE&&($=Ie===ct?i.SRGB8_ALPHA8:i.RGBA8),G===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),G===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function v(L,E){let G;return L?E===null||E===ts||E===Lr?G=i.DEPTH24_STENCIL8:E===nn?G=i.DEPTH32F_STENCIL8:E===Pr&&(G=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===ts||E===Lr?G=i.DEPTH_COMPONENT24:E===nn?G=i.DEPTH_COMPONENT32F:E===Pr&&(G=i.DEPTH_COMPONENT16),G}function w(L,E){return m(L)===!0||L.isFramebufferTexture&&L.minFilter!==Zt&&L.minFilter!==Lt?Math.log2(Math.max(E.width,E.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?E.mipmaps.length:1}function C(L){const E=L.target;E.removeEventListener("dispose",C),A(E),E.isVideoTexture&&u.delete(E)}function R(L){const E=L.target;E.removeEventListener("dispose",R),y(E)}function A(L){const E=n.get(L);if(E.__webglInit===void 0)return;const G=L.source,K=f.get(G);if(K){const oe=K[E.__cacheKey];oe.usedTimes--,oe.usedTimes===0&&g(L),Object.keys(K).length===0&&f.delete(G)}n.remove(L)}function g(L){const E=n.get(L);i.deleteTexture(E.__webglTexture);const G=L.source,K=f.get(G);delete K[E.__cacheKey],o.memory.textures--}function y(L){const E=n.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),n.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(E.__webglFramebuffer[K]))for(let oe=0;oe<E.__webglFramebuffer[K].length;oe++)i.deleteFramebuffer(E.__webglFramebuffer[K][oe]);else i.deleteFramebuffer(E.__webglFramebuffer[K]);E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer[K])}else{if(Array.isArray(E.__webglFramebuffer))for(let K=0;K<E.__webglFramebuffer.length;K++)i.deleteFramebuffer(E.__webglFramebuffer[K]);else i.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&i.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let K=0;K<E.__webglColorRenderbuffer.length;K++)E.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(E.__webglColorRenderbuffer[K]);E.__webglDepthRenderbuffer&&i.deleteRenderbuffer(E.__webglDepthRenderbuffer)}const G=L.textures;for(let K=0,oe=G.length;K<oe;K++){const $=n.get(G[K]);$.__webglTexture&&(i.deleteTexture($.__webglTexture),o.memory.textures--),n.remove(G[K])}n.remove(L)}let S=0;function N(){S=0}function D(){const L=S;return L>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+L+" texture units while this GPU supports only "+s.maxTextures),S+=1,L}function P(L){const E=[];return E.push(L.wrapS),E.push(L.wrapT),E.push(L.wrapR||0),E.push(L.magFilter),E.push(L.minFilter),E.push(L.anisotropy),E.push(L.internalFormat),E.push(L.format),E.push(L.type),E.push(L.generateMipmaps),E.push(L.premultiplyAlpha),E.push(L.flipY),E.push(L.unpackAlignment),E.push(L.colorSpace),E.join()}function U(L,E){const G=n.get(L);if(L.isVideoTexture&&_e(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&G.__version!==L.version){const K=L.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(G,L,E);return}}else L.isExternalTexture&&(G.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,G.__webglTexture,i.TEXTURE0+E)}function O(L,E){const G=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&G.__version!==L.version){q(G,L,E);return}t.bindTexture(i.TEXTURE_2D_ARRAY,G.__webglTexture,i.TEXTURE0+E)}function W(L,E){const G=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&G.__version!==L.version){q(G,L,E);return}t.bindTexture(i.TEXTURE_3D,G.__webglTexture,i.TEXTURE0+E)}function H(L,E){const G=n.get(L);if(L.version>0&&G.__version!==L.version){ee(G,L,E);return}t.bindTexture(i.TEXTURE_CUBE_MAP,G.__webglTexture,i.TEXTURE0+E)}const Z={[hn]:i.REPEAT,[Hn]:i.CLAMP_TO_EDGE,[Yo]:i.MIRRORED_REPEAT},ae={[Zt]:i.NEAREST,[hf]:i.NEAREST_MIPMAP_NEAREST,[gr]:i.NEAREST_MIPMAP_LINEAR,[Lt]:i.LINEAR,[Oo]:i.LINEAR_MIPMAP_NEAREST,[Ln]:i.LINEAR_MIPMAP_LINEAR},z={[ap]:i.NEVER,[dp]:i.ALWAYS,[lp]:i.LESS,[Mf]:i.LEQUAL,[cp]:i.EQUAL,[fp]:i.GEQUAL,[up]:i.GREATER,[hp]:i.NOTEQUAL};function Q(L,E){if(E.type===nn&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===Lt||E.magFilter===Oo||E.magFilter===gr||E.magFilter===Ln||E.minFilter===Lt||E.minFilter===Oo||E.minFilter===gr||E.minFilter===Ln)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(L,i.TEXTURE_WRAP_S,Z[E.wrapS]),i.texParameteri(L,i.TEXTURE_WRAP_T,Z[E.wrapT]),(L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY)&&i.texParameteri(L,i.TEXTURE_WRAP_R,Z[E.wrapR]),i.texParameteri(L,i.TEXTURE_MAG_FILTER,ae[E.magFilter]),i.texParameteri(L,i.TEXTURE_MIN_FILTER,ae[E.minFilter]),E.compareFunction&&(i.texParameteri(L,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(L,i.TEXTURE_COMPARE_FUNC,z[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===Zt||E.minFilter!==gr&&E.minFilter!==Ln||E.type===nn&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||n.get(E).__currentAnisotropy){const G=e.get("EXT_texture_filter_anisotropic");i.texParameterf(L,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,s.getMaxAnisotropy())),n.get(E).__currentAnisotropy=E.anisotropy}}}function re(L,E){let G=!1;L.__webglInit===void 0&&(L.__webglInit=!0,E.addEventListener("dispose",C));const K=E.source;let oe=f.get(K);oe===void 0&&(oe={},f.set(K,oe));const $=P(E);if($!==L.__cacheKey){oe[$]===void 0&&(oe[$]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,G=!0),oe[$].usedTimes++;const Ie=oe[L.__cacheKey];Ie!==void 0&&(oe[L.__cacheKey].usedTimes--,Ie.usedTimes===0&&g(E)),L.__cacheKey=$,L.__webglTexture=oe[$].texture}return G}function de(L,E,G){return Math.floor(Math.floor(L/G)/E)}function Re(L,E,G,K){const $=L.updateRanges;if($.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,E.width,E.height,G,K,E.data);else{$.sort((ce,Ee)=>ce.start-Ee.start);let Ie=0;for(let ce=1;ce<$.length;ce++){const Ee=$[Ie],Be=$[ce],Ne=Ee.start+Ee.count,Se=de(Be.start,E.width,4),qe=de(Ee.start,E.width,4);Be.start<=Ne+1&&Se===qe&&de(Be.start+Be.count-1,E.width,4)===Se?Ee.count=Math.max(Ee.count,Be.start+Be.count-Ee.start):(++Ie,$[Ie]=Be)}$.length=Ie+1;const pe=i.getParameter(i.UNPACK_ROW_LENGTH),Ce=i.getParameter(i.UNPACK_SKIP_PIXELS),Pe=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,E.width);for(let ce=0,Ee=$.length;ce<Ee;ce++){const Be=$[ce],Ne=Math.floor(Be.start/4),Se=Math.ceil(Be.count/4),qe=Ne%E.width,B=Math.floor(Ne/E.width),fe=Se,ve=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,qe),i.pixelStorei(i.UNPACK_SKIP_ROWS,B),t.texSubImage2D(i.TEXTURE_2D,0,qe,B,fe,ve,G,K,E.data)}L.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,pe),i.pixelStorei(i.UNPACK_SKIP_PIXELS,Ce),i.pixelStorei(i.UNPACK_SKIP_ROWS,Pe)}}function q(L,E,G){let K=i.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(K=i.TEXTURE_2D_ARRAY),E.isData3DTexture&&(K=i.TEXTURE_3D);const oe=re(L,E),$=E.source;t.bindTexture(K,L.__webglTexture,i.TEXTURE0+G);const Ie=n.get($);if($.version!==Ie.__version||oe===!0){t.activeTexture(i.TEXTURE0+G);const pe=et.getPrimaries(et.workingColorSpace),Ce=E.colorSpace===Ri?null:et.getPrimaries(E.colorSpace),Pe=E.colorSpace===Ri||pe===Ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Pe);let ce=x(E.image,!1,s.maxTextureSize);ce=Ve(E,ce);const Ee=r.convert(E.format,E.colorSpace),Be=r.convert(E.type);let Ne=M(E.internalFormat,Ee,Be,E.colorSpace,E.isVideoTexture);Q(K,E);let Se;const qe=E.mipmaps,B=E.isVideoTexture!==!0,fe=Ie.__version===void 0||oe===!0,ve=$.dataReady,we=w(E,ce);if(E.isDepthTexture)Ne=v(E.format===Dr,E.type),fe&&(B?t.texStorage2D(i.TEXTURE_2D,1,Ne,ce.width,ce.height):t.texImage2D(i.TEXTURE_2D,0,Ne,ce.width,ce.height,0,Ee,Be,null));else if(E.isDataTexture)if(qe.length>0){B&&fe&&t.texStorage2D(i.TEXTURE_2D,we,Ne,qe[0].width,qe[0].height);for(let ue=0,ne=qe.length;ue<ne;ue++)Se=qe[ue],B?ve&&t.texSubImage2D(i.TEXTURE_2D,ue,0,0,Se.width,Se.height,Ee,Be,Se.data):t.texImage2D(i.TEXTURE_2D,ue,Ne,Se.width,Se.height,0,Ee,Be,Se.data);E.generateMipmaps=!1}else B?(fe&&t.texStorage2D(i.TEXTURE_2D,we,Ne,ce.width,ce.height),ve&&Re(E,ce,Ee,Be)):t.texImage2D(i.TEXTURE_2D,0,Ne,ce.width,ce.height,0,Ee,Be,ce.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){B&&fe&&t.texStorage3D(i.TEXTURE_2D_ARRAY,we,Ne,qe[0].width,qe[0].height,ce.depth);for(let ue=0,ne=qe.length;ue<ne;ue++)if(Se=qe[ue],E.format!==xn)if(Ee!==null)if(B){if(ve)if(E.layerUpdates.size>0){const Le=sh(Se.width,Se.height,E.format,E.type);for(const Ge of E.layerUpdates){const gt=Se.data.subarray(Ge*Le/Se.data.BYTES_PER_ELEMENT,(Ge+1)*Le/Se.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ue,0,0,Ge,Se.width,Se.height,1,Ee,gt)}E.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ue,0,0,0,Se.width,Se.height,ce.depth,Ee,Se.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ue,Ne,Se.width,Se.height,ce.depth,0,Se.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else B?ve&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ue,0,0,0,Se.width,Se.height,ce.depth,Ee,Be,Se.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ue,Ne,Se.width,Se.height,ce.depth,0,Ee,Be,Se.data)}else{B&&fe&&t.texStorage2D(i.TEXTURE_2D,we,Ne,qe[0].width,qe[0].height);for(let ue=0,ne=qe.length;ue<ne;ue++)Se=qe[ue],E.format!==xn?Ee!==null?B?ve&&t.compressedTexSubImage2D(i.TEXTURE_2D,ue,0,0,Se.width,Se.height,Ee,Se.data):t.compressedTexImage2D(i.TEXTURE_2D,ue,Ne,Se.width,Se.height,0,Se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):B?ve&&t.texSubImage2D(i.TEXTURE_2D,ue,0,0,Se.width,Se.height,Ee,Be,Se.data):t.texImage2D(i.TEXTURE_2D,ue,Ne,Se.width,Se.height,0,Ee,Be,Se.data)}else if(E.isDataArrayTexture)if(B){if(fe&&t.texStorage3D(i.TEXTURE_2D_ARRAY,we,Ne,ce.width,ce.height,ce.depth),ve)if(E.layerUpdates.size>0){const ue=sh(ce.width,ce.height,E.format,E.type);for(const ne of E.layerUpdates){const Le=ce.data.subarray(ne*ue/ce.data.BYTES_PER_ELEMENT,(ne+1)*ue/ce.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,ne,ce.width,ce.height,1,Ee,Be,Le)}E.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ce.width,ce.height,ce.depth,Ee,Be,ce.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Ne,ce.width,ce.height,ce.depth,0,Ee,Be,ce.data);else if(E.isData3DTexture)B?(fe&&t.texStorage3D(i.TEXTURE_3D,we,Ne,ce.width,ce.height,ce.depth),ve&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ce.width,ce.height,ce.depth,Ee,Be,ce.data)):t.texImage3D(i.TEXTURE_3D,0,Ne,ce.width,ce.height,ce.depth,0,Ee,Be,ce.data);else if(E.isFramebufferTexture){if(fe)if(B)t.texStorage2D(i.TEXTURE_2D,we,Ne,ce.width,ce.height);else{let ue=ce.width,ne=ce.height;for(let Le=0;Le<we;Le++)t.texImage2D(i.TEXTURE_2D,Le,Ne,ue,ne,0,Ee,Be,null),ue>>=1,ne>>=1}}else if(qe.length>0){if(B&&fe){const ue=ke(qe[0]);t.texStorage2D(i.TEXTURE_2D,we,Ne,ue.width,ue.height)}for(let ue=0,ne=qe.length;ue<ne;ue++)Se=qe[ue],B?ve&&t.texSubImage2D(i.TEXTURE_2D,ue,0,0,Ee,Be,Se):t.texImage2D(i.TEXTURE_2D,ue,Ne,Ee,Be,Se);E.generateMipmaps=!1}else if(B){if(fe){const ue=ke(ce);t.texStorage2D(i.TEXTURE_2D,we,Ne,ue.width,ue.height)}ve&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Ee,Be,ce)}else t.texImage2D(i.TEXTURE_2D,0,Ne,Ee,Be,ce);m(E)&&p(K),Ie.__version=$.version,E.onUpdate&&E.onUpdate(E)}L.__version=E.version}function ee(L,E,G){if(E.image.length!==6)return;const K=re(L,E),oe=E.source;t.bindTexture(i.TEXTURE_CUBE_MAP,L.__webglTexture,i.TEXTURE0+G);const $=n.get(oe);if(oe.version!==$.__version||K===!0){t.activeTexture(i.TEXTURE0+G);const Ie=et.getPrimaries(et.workingColorSpace),pe=E.colorSpace===Ri?null:et.getPrimaries(E.colorSpace),Ce=E.colorSpace===Ri||Ie===pe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce);const Pe=E.isCompressedTexture||E.image[0].isCompressedTexture,ce=E.image[0]&&E.image[0].isDataTexture,Ee=[];for(let ne=0;ne<6;ne++)!Pe&&!ce?Ee[ne]=x(E.image[ne],!0,s.maxCubemapSize):Ee[ne]=ce?E.image[ne].image:E.image[ne],Ee[ne]=Ve(E,Ee[ne]);const Be=Ee[0],Ne=r.convert(E.format,E.colorSpace),Se=r.convert(E.type),qe=M(E.internalFormat,Ne,Se,E.colorSpace),B=E.isVideoTexture!==!0,fe=$.__version===void 0||K===!0,ve=oe.dataReady;let we=w(E,Be);Q(i.TEXTURE_CUBE_MAP,E);let ue;if(Pe){B&&fe&&t.texStorage2D(i.TEXTURE_CUBE_MAP,we,qe,Be.width,Be.height);for(let ne=0;ne<6;ne++){ue=Ee[ne].mipmaps;for(let Le=0;Le<ue.length;Le++){const Ge=ue[Le];E.format!==xn?Ne!==null?B?ve&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le,0,0,Ge.width,Ge.height,Ne,Ge.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le,qe,Ge.width,Ge.height,0,Ge.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):B?ve&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le,0,0,Ge.width,Ge.height,Ne,Se,Ge.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le,qe,Ge.width,Ge.height,0,Ne,Se,Ge.data)}}}else{if(ue=E.mipmaps,B&&fe){ue.length>0&&we++;const ne=ke(Ee[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,we,qe,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(ce){B?ve&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Ee[ne].width,Ee[ne].height,Ne,Se,Ee[ne].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,qe,Ee[ne].width,Ee[ne].height,0,Ne,Se,Ee[ne].data);for(let Le=0;Le<ue.length;Le++){const gt=ue[Le].image[ne].image;B?ve&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le+1,0,0,gt.width,gt.height,Ne,Se,gt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le+1,qe,gt.width,gt.height,0,Ne,Se,gt.data)}}else{B?ve&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Ne,Se,Ee[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,qe,Ne,Se,Ee[ne]);for(let Le=0;Le<ue.length;Le++){const Ge=ue[Le];B?ve&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le+1,0,0,Ne,Se,Ge.image[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Le+1,qe,Ne,Se,Ge.image[ne])}}}m(E)&&p(i.TEXTURE_CUBE_MAP),$.__version=oe.version,E.onUpdate&&E.onUpdate(E)}L.__version=E.version}function me(L,E,G,K,oe,$){const Ie=r.convert(G.format,G.colorSpace),pe=r.convert(G.type),Ce=M(G.internalFormat,Ie,pe,G.colorSpace),Pe=n.get(E),ce=n.get(G);if(ce.__renderTarget=E,!Pe.__hasExternalTextures){const Ee=Math.max(1,E.width>>$),Be=Math.max(1,E.height>>$);oe===i.TEXTURE_3D||oe===i.TEXTURE_2D_ARRAY?t.texImage3D(oe,$,Ce,Ee,Be,E.depth,0,Ie,pe,null):t.texImage2D(oe,$,Ce,Ee,Be,0,Ie,pe,null)}t.bindFramebuffer(i.FRAMEBUFFER,L),le(E)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,oe,ce.__webglTexture,0,ge(E)):(oe===i.TEXTURE_2D||oe>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&oe<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,K,oe,ce.__webglTexture,$),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Me(L,E,G){if(i.bindRenderbuffer(i.RENDERBUFFER,L),E.depthBuffer){const K=E.depthTexture,oe=K&&K.isDepthTexture?K.type:null,$=v(E.stencilBuffer,oe),Ie=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,pe=ge(E);le(E)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe,$,E.width,E.height):G?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe,$,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,$,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ie,i.RENDERBUFFER,L)}else{const K=E.textures;for(let oe=0;oe<K.length;oe++){const $=K[oe],Ie=r.convert($.format,$.colorSpace),pe=r.convert($.type),Ce=M($.internalFormat,Ie,pe,$.colorSpace),Pe=ge(E);G&&le(E)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Pe,Ce,E.width,E.height):le(E)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Pe,Ce,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,Ce,E.width,E.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ye(L,E){if(E&&E.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,L),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const K=n.get(E.depthTexture);K.__renderTarget=E,(!K.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),U(E.depthTexture,0);const oe=K.__webglTexture,$=ge(E);if(E.depthTexture.format===Ir)le(E)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,oe,0,$):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,oe,0);else if(E.depthTexture.format===Dr)le(E)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,oe,0,$):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,oe,0);else throw new Error("Unknown depthTexture format")}function Ze(L){const E=n.get(L),G=L.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==L.depthTexture){const K=L.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),K){const oe=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,K.removeEventListener("dispose",oe)};K.addEventListener("dispose",oe),E.__depthDisposeCallback=oe}E.__boundDepthTexture=K}if(L.depthTexture&&!E.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");const K=L.texture.mipmaps;K&&K.length>0?ye(E.__webglFramebuffer[0],L):ye(E.__webglFramebuffer,L)}else if(G){E.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[K]),E.__webglDepthbuffer[K]===void 0)E.__webglDepthbuffer[K]=i.createRenderbuffer(),Me(E.__webglDepthbuffer[K],L,!1);else{const oe=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=E.__webglDepthbuffer[K];i.bindRenderbuffer(i.RENDERBUFFER,$),i.framebufferRenderbuffer(i.FRAMEBUFFER,oe,i.RENDERBUFFER,$)}}else{const K=L.texture.mipmaps;if(K&&K.length>0?t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=i.createRenderbuffer(),Me(E.__webglDepthbuffer,L,!1);else{const oe=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=E.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,$),i.framebufferRenderbuffer(i.FRAMEBUFFER,oe,i.RENDERBUFFER,$)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function at(L,E,G){const K=n.get(L);E!==void 0&&me(K.__webglFramebuffer,L,L.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),G!==void 0&&Ze(L)}function F(L){const E=L.texture,G=n.get(L),K=n.get(E);L.addEventListener("dispose",R);const oe=L.textures,$=L.isWebGLCubeRenderTarget===!0,Ie=oe.length>1;if(Ie||(K.__webglTexture===void 0&&(K.__webglTexture=i.createTexture()),K.__version=E.version,o.memory.textures++),$){G.__webglFramebuffer=[];for(let pe=0;pe<6;pe++)if(E.mipmaps&&E.mipmaps.length>0){G.__webglFramebuffer[pe]=[];for(let Ce=0;Ce<E.mipmaps.length;Ce++)G.__webglFramebuffer[pe][Ce]=i.createFramebuffer()}else G.__webglFramebuffer[pe]=i.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){G.__webglFramebuffer=[];for(let pe=0;pe<E.mipmaps.length;pe++)G.__webglFramebuffer[pe]=i.createFramebuffer()}else G.__webglFramebuffer=i.createFramebuffer();if(Ie)for(let pe=0,Ce=oe.length;pe<Ce;pe++){const Pe=n.get(oe[pe]);Pe.__webglTexture===void 0&&(Pe.__webglTexture=i.createTexture(),o.memory.textures++)}if(L.samples>0&&le(L)===!1){G.__webglMultisampledFramebuffer=i.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let pe=0;pe<oe.length;pe++){const Ce=oe[pe];G.__webglColorRenderbuffer[pe]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,G.__webglColorRenderbuffer[pe]);const Pe=r.convert(Ce.format,Ce.colorSpace),ce=r.convert(Ce.type),Ee=M(Ce.internalFormat,Pe,ce,Ce.colorSpace,L.isXRRenderTarget===!0),Be=ge(L);i.renderbufferStorageMultisample(i.RENDERBUFFER,Be,Ee,L.width,L.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+pe,i.RENDERBUFFER,G.__webglColorRenderbuffer[pe])}i.bindRenderbuffer(i.RENDERBUFFER,null),L.depthBuffer&&(G.__webglDepthRenderbuffer=i.createRenderbuffer(),Me(G.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if($){t.bindTexture(i.TEXTURE_CUBE_MAP,K.__webglTexture),Q(i.TEXTURE_CUBE_MAP,E);for(let pe=0;pe<6;pe++)if(E.mipmaps&&E.mipmaps.length>0)for(let Ce=0;Ce<E.mipmaps.length;Ce++)me(G.__webglFramebuffer[pe][Ce],L,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Ce);else me(G.__webglFramebuffer[pe],L,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0);m(E)&&p(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ie){for(let pe=0,Ce=oe.length;pe<Ce;pe++){const Pe=oe[pe],ce=n.get(Pe);let Ee=i.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(Ee=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Ee,ce.__webglTexture),Q(Ee,Pe),me(G.__webglFramebuffer,L,Pe,i.COLOR_ATTACHMENT0+pe,Ee,0),m(Pe)&&p(Ee)}t.unbindTexture()}else{let pe=i.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(pe=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(pe,K.__webglTexture),Q(pe,E),E.mipmaps&&E.mipmaps.length>0)for(let Ce=0;Ce<E.mipmaps.length;Ce++)me(G.__webglFramebuffer[Ce],L,E,i.COLOR_ATTACHMENT0,pe,Ce);else me(G.__webglFramebuffer,L,E,i.COLOR_ATTACHMENT0,pe,0);m(E)&&p(pe),t.unbindTexture()}L.depthBuffer&&Ze(L)}function se(L){const E=L.textures;for(let G=0,K=E.length;G<K;G++){const oe=E[G];if(m(oe)){const $=b(L),Ie=n.get(oe).__webglTexture;t.bindTexture($,Ie),p($),t.unbindTexture()}}}const te=[],j=[];function J(L){if(L.samples>0){if(le(L)===!1){const E=L.textures,G=L.width,K=L.height;let oe=i.COLOR_BUFFER_BIT;const $=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ie=n.get(L),pe=E.length>1;if(pe)for(let Pe=0;Pe<E.length;Pe++)t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Pe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Pe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Ie.__webglMultisampledFramebuffer);const Ce=L.texture.mipmaps;Ce&&Ce.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ie.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ie.__webglFramebuffer);for(let Pe=0;Pe<E.length;Pe++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(oe|=i.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(oe|=i.STENCIL_BUFFER_BIT)),pe){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ie.__webglColorRenderbuffer[Pe]);const ce=n.get(E[Pe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ce,0)}i.blitFramebuffer(0,0,G,K,0,0,G,K,oe,i.NEAREST),l===!0&&(te.length=0,j.length=0,te.push(i.COLOR_ATTACHMENT0+Pe),L.depthBuffer&&L.resolveDepthBuffer===!1&&(te.push($),j.push($),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,j)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,te))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),pe)for(let Pe=0;Pe<E.length;Pe++){t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Pe,i.RENDERBUFFER,Ie.__webglColorRenderbuffer[Pe]);const ce=n.get(E[Pe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Pe,i.TEXTURE_2D,ce,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ie.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.resolveDepthBuffer===!1&&l){const E=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[E])}}}function ge(L){return Math.min(s.maxSamples,L.samples)}function le(L){const E=n.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function _e(L){const E=o.render.frame;u.get(L)!==E&&(u.set(L,E),L.update())}function Ve(L,E){const G=L.colorSpace,K=L.format,oe=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||G!==Yt&&G!==Ri&&(et.getTransfer(G)===ct?(K!==xn||oe!==Yn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),E}function ke(L){return typeof HTMLImageElement!="undefined"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame!="undefined"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=D,this.resetTextureUnits=N,this.setTexture2D=U,this.setTexture2DArray=O,this.setTexture3D=W,this.setTextureCube=H,this.rebindTextures=at,this.setupRenderTarget=F,this.updateRenderTargetMipmap=se,this.updateMultisampleRenderTarget=J,this.setupDepthRenderbuffer=Ze,this.setupFrameBufferTexture=me,this.useMultisampledRTT=le}function Qx(i,e){function t(n,s=Ri){let r;const o=et.getTransfer(s);if(n===Yn)return i.UNSIGNED_BYTE;if(n===yc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Mc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===pf)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===mf)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===ff)return i.BYTE;if(n===df)return i.SHORT;if(n===Pr)return i.UNSIGNED_SHORT;if(n===xc)return i.INT;if(n===ts)return i.UNSIGNED_INT;if(n===nn)return i.FLOAT;if(n===cn)return i.HALF_FLOAT;if(n===gf)return i.ALPHA;if(n===_f)return i.RGB;if(n===xn)return i.RGBA;if(n===Ir)return i.DEPTH_COMPONENT;if(n===Dr)return i.DEPTH_STENCIL;if(n===Sc)return i.RED;if(n===bc)return i.RED_INTEGER;if(n===vf)return i.RG;if(n===Ec)return i.RG_INTEGER;if(n===Tc)return i.RGBA_INTEGER;if(n===Bo||n===zo||n===ko||n===Ho)if(o===ct)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Bo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===zo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ko)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ho)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Bo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===zo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ko)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ho)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===wl||n===Al||n===Rl||n===Cl)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===wl)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Al)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Rl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Cl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Pl||n===Ll||n===Il)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Pl||n===Ll)return o===ct?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Il)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Dl||n===Nl||n===Ul||n===Fl||n===Ol||n===Bl||n===zl||n===kl||n===Hl||n===Vl||n===Gl||n===Wl||n===Xl||n===Yl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Dl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Nl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ul)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Fl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ol)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Bl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===zl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===kl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Hl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Vl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Gl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Wl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Xl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Yl)return o===ct?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ql||n===Kl||n===$l)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===ql)return o===ct?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Kl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===$l)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===jl||n===Zl||n===Jl||n===Ql)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===jl)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Zl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Jl)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ql)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Lr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const ey=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ty=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class ny{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new zf(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new Ot({vertexShader:ey,fragmentShader:ty,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Rt(new Gn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class iy extends $s{constructor(e,t){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,f=null,d=null,_=null;const x=typeof XRWebGLBinding!="undefined",m=new ny,p={},b=t.getContextAttributes();let M=null,v=null;const w=[],C=[],R=new ie;let A=null;const g=new Ht;g.viewport=new tt;const y=new Ht;y.viewport=new tt;const S=[g,y],N=new mg;let D=null,P=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let ee=w[q];return ee===void 0&&(ee=new Va,w[q]=ee),ee.getTargetRaySpace()},this.getControllerGrip=function(q){let ee=w[q];return ee===void 0&&(ee=new Va,w[q]=ee),ee.getGripSpace()},this.getHand=function(q){let ee=w[q];return ee===void 0&&(ee=new Va,w[q]=ee),ee.getHandSpace()};function U(q){const ee=C.indexOf(q.inputSource);if(ee===-1)return;const me=w[ee];me!==void 0&&(me.update(q.inputSource,q.frame,c||o),me.dispatchEvent({type:q.type,data:q.inputSource}))}function O(){s.removeEventListener("select",U),s.removeEventListener("selectstart",U),s.removeEventListener("selectend",U),s.removeEventListener("squeeze",U),s.removeEventListener("squeezestart",U),s.removeEventListener("squeezeend",U),s.removeEventListener("end",O),s.removeEventListener("inputsourceschange",W);for(let q=0;q<w.length;q++){const ee=C[q];ee!==null&&(C[q]=null,w[q].disconnect(ee))}D=null,P=null,m.reset();for(const q in p)delete p[q];e.setRenderTarget(M),d=null,f=null,h=null,s=null,v=null,Re.stop(),n.isPresenting=!1,e.setPixelRatio(A),e.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return h===null&&x&&(h=new XRWebGLBinding(s,t)),h},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(M=e.getRenderTarget(),s.addEventListener("select",U),s.addEventListener("selectstart",U),s.addEventListener("selectend",U),s.addEventListener("squeeze",U),s.addEventListener("squeezestart",U),s.addEventListener("squeezeend",U),s.addEventListener("end",O),s.addEventListener("inputsourceschange",W),b.xrCompatible!==!0&&await t.makeXRCompatible(),A=e.getPixelRatio(),e.getSize(R),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let me=null,Me=null,ye=null;b.depth&&(ye=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,me=b.stencil?Dr:Ir,Me=b.stencil?Lr:ts);const Ze={colorFormat:t.RGBA8,depthFormat:ye,scaleFactor:r};h=this.getBinding(),f=h.createProjectionLayer(Ze),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),v=new Mn(f.textureWidth,f.textureHeight,{format:xn,type:Yn,depthTexture:new Bf(f.textureWidth,f.textureHeight,Me,void 0,void 0,void 0,void 0,void 0,void 0,me),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{const me={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,t,me),s.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new Mn(d.framebufferWidth,d.framebufferHeight,{format:xn,type:Yn,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Re.setContext(s),Re.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function W(q){for(let ee=0;ee<q.removed.length;ee++){const me=q.removed[ee],Me=C.indexOf(me);Me>=0&&(C[Me]=null,w[Me].disconnect(me))}for(let ee=0;ee<q.added.length;ee++){const me=q.added[ee];let Me=C.indexOf(me);if(Me===-1){for(let Ze=0;Ze<w.length;Ze++)if(Ze>=C.length){C.push(me),Me=Ze;break}else if(C[Ze]===null){C[Ze]=me,Me=Ze;break}if(Me===-1)break}const ye=w[Me];ye&&ye.connect(me)}}const H=new I,Z=new I;function ae(q,ee,me){H.setFromMatrixPosition(ee.matrixWorld),Z.setFromMatrixPosition(me.matrixWorld);const Me=H.distanceTo(Z),ye=ee.projectionMatrix.elements,Ze=me.projectionMatrix.elements,at=ye[14]/(ye[10]-1),F=ye[14]/(ye[10]+1),se=(ye[9]+1)/ye[5],te=(ye[9]-1)/ye[5],j=(ye[8]-1)/ye[0],J=(Ze[8]+1)/Ze[0],ge=at*j,le=at*J,_e=Me/(-j+J),Ve=_e*-j;if(ee.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Ve),q.translateZ(_e),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),ye[10]===-1)q.projectionMatrix.copy(ee.projectionMatrix),q.projectionMatrixInverse.copy(ee.projectionMatrixInverse);else{const ke=at+_e,L=F+_e,E=ge-Ve,G=le+(Me-Ve),K=se*F/L*ke,oe=te*F/L*ke;q.projectionMatrix.makePerspective(E,G,K,oe,ke,L),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function z(q,ee){ee===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(ee.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let ee=q.near,me=q.far;m.texture!==null&&(m.depthNear>0&&(ee=m.depthNear),m.depthFar>0&&(me=m.depthFar)),N.near=y.near=g.near=ee,N.far=y.far=g.far=me,(D!==N.near||P!==N.far)&&(s.updateRenderState({depthNear:N.near,depthFar:N.far}),D=N.near,P=N.far),N.layers.mask=q.layers.mask|6,g.layers.mask=N.layers.mask&3,y.layers.mask=N.layers.mask&5;const Me=q.parent,ye=N.cameras;z(N,Me);for(let Ze=0;Ze<ye.length;Ze++)z(ye[Ze],Me);ye.length===2?ae(N,g,y):N.projectionMatrix.copy(g.projectionMatrix),Q(q,N,Me)};function Q(q,ee,me){me===null?q.matrix.copy(ee.matrixWorld):(q.matrix.copy(me.matrixWorld),q.matrix.invert(),q.matrix.multiply(ee.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(ee.projectionMatrix),q.projectionMatrixInverse.copy(ee.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=zs*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(q){l=q,f!==null&&(f.fixedFoveation=q),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=q)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(N)},this.getCameraTexture=function(q){return p[q]};let re=null;function de(q,ee){if(u=ee.getViewerPose(c||o),_=ee,u!==null){const me=u.views;d!==null&&(e.setRenderTargetFramebuffer(v,d.framebuffer),e.setRenderTarget(v));let Me=!1;me.length!==N.cameras.length&&(N.cameras.length=0,Me=!0);for(let F=0;F<me.length;F++){const se=me[F];let te=null;if(d!==null)te=d.getViewport(se);else{const J=h.getViewSubImage(f,se);te=J.viewport,F===0&&(e.setRenderTargetTextures(v,J.colorTexture,J.depthStencilTexture),e.setRenderTarget(v))}let j=S[F];j===void 0&&(j=new Ht,j.layers.enable(F),j.viewport=new tt,S[F]=j),j.matrix.fromArray(se.transform.matrix),j.matrix.decompose(j.position,j.quaternion,j.scale),j.projectionMatrix.fromArray(se.projectionMatrix),j.projectionMatrixInverse.copy(j.projectionMatrix).invert(),j.viewport.set(te.x,te.y,te.width,te.height),F===0&&(N.matrix.copy(j.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Me===!0&&N.cameras.push(j)}const ye=s.enabledFeatures;if(ye&&ye.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){h=n.getBinding();const F=h.getDepthInformation(me[0]);F&&F.isValid&&F.texture&&m.init(F,s.renderState)}if(ye&&ye.includes("camera-access")&&x){e.state.unbindTexture(),h=n.getBinding();for(let F=0;F<me.length;F++){const se=me[F].camera;if(se){let te=p[se];te||(te=new zf,p[se]=te);const j=h.getCameraImage(se);te.sourceTexture=j}}}}for(let me=0;me<w.length;me++){const Me=C[me],ye=w[me];Me!==null&&ye!==void 0&&ye.update(Me,ee,c||o)}re&&re(q,ee),ee.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ee}),_=null}const Re=new nd;Re.setAnimationLoop(de),this.setAnimationLoop=function(q){re=q},this.dispose=function(){}}}const Wi=new qn,sy=new He;function ry(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Rf(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,b,M,v){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),f(m,p),p.isMeshPhysicalMaterial&&d(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),_(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),x(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,b,M):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===jt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===jt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const b=e.get(p),M=b.envMap,v=b.envMapRotation;M&&(m.envMap.value=M,Wi.copy(v),Wi.x*=-1,Wi.y*=-1,Wi.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Wi.y*=-1,Wi.z*=-1),m.envMapRotation.value.setFromMatrix4(sy.makeRotationFromEuler(Wi)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,b,M){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=M*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===jt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,p){p.matcap&&(m.matcap.value=p.matcap)}function x(m,p){const b=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function oy(i,e,t,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,M){const v=M.program;n.uniformBlockBinding(b,v)}function c(b,M){let v=s[b.id];v===void 0&&(_(b),v=u(b),s[b.id]=v,b.addEventListener("dispose",m));const w=M.program;n.updateUBOMapping(b,w);const C=e.render.frame;r[b.id]!==C&&(f(b),r[b.id]=C)}function u(b){const M=h();b.__bindingPointIndex=M;const v=i.createBuffer(),w=b.__size,C=b.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,w,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,v),v}function h(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(b){const M=s[b.id],v=b.uniforms,w=b.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let C=0,R=v.length;C<R;C++){const A=Array.isArray(v[C])?v[C]:[v[C]];for(let g=0,y=A.length;g<y;g++){const S=A[g];if(d(S,C,g,w)===!0){const N=S.__offset,D=Array.isArray(S.value)?S.value:[S.value];let P=0;for(let U=0;U<D.length;U++){const O=D[U],W=x(O);typeof O=="number"||typeof O=="boolean"?(S.__data[0]=O,i.bufferSubData(i.UNIFORM_BUFFER,N+P,S.__data)):O.isMatrix3?(S.__data[0]=O.elements[0],S.__data[1]=O.elements[1],S.__data[2]=O.elements[2],S.__data[3]=0,S.__data[4]=O.elements[3],S.__data[5]=O.elements[4],S.__data[6]=O.elements[5],S.__data[7]=0,S.__data[8]=O.elements[6],S.__data[9]=O.elements[7],S.__data[10]=O.elements[8],S.__data[11]=0):(O.toArray(S.__data,P),P+=W.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,N,S.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(b,M,v,w){const C=b.value,R=M+"_"+v;if(w[R]===void 0)return typeof C=="number"||typeof C=="boolean"?w[R]=C:w[R]=C.clone(),!0;{const A=w[R];if(typeof C=="number"||typeof C=="boolean"){if(A!==C)return w[R]=C,!0}else if(A.equals(C)===!1)return A.copy(C),!0}return!1}function _(b){const M=b.uniforms;let v=0;const w=16;for(let R=0,A=M.length;R<A;R++){const g=Array.isArray(M[R])?M[R]:[M[R]];for(let y=0,S=g.length;y<S;y++){const N=g[y],D=Array.isArray(N.value)?N.value:[N.value];for(let P=0,U=D.length;P<U;P++){const O=D[P],W=x(O),H=v%w,Z=H%W.boundary,ae=H+Z;v+=Z,ae!==0&&w-ae<W.storage&&(v+=w-ae),N.__data=new Float32Array(W.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=v,v+=W.storage}}}const C=v%w;return C>0&&(v+=w-C),b.__size=v,b.__cache={},this}function x(b){const M={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(M.boundary=4,M.storage=4):b.isVector2?(M.boundary=8,M.storage=8):b.isVector3||b.isColor?(M.boundary=16,M.storage=12):b.isVector4?(M.boundary=16,M.storage=16):b.isMatrix3?(M.boundary=48,M.storage=48):b.isMatrix4?(M.boundary=64,M.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),M}function m(b){const M=b.target;M.removeEventListener("dispose",m);const v=o.indexOf(M.__bindingPointIndex);o.splice(v,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function p(){for(const b in s)i.deleteBuffer(s[b]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}class ay{constructor(e={}){const{canvas:t=Pp(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext!="undefined"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;const _=new Uint32Array(4),x=new Int32Array(4);let m=null,p=null;const b=[],M=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Li,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const v=this;let w=!1;this._outputColorSpace=xt;let C=0,R=0,A=null,g=-1,y=null;const S=new tt,N=new tt;let D=null;const P=new De(0);let U=0,O=t.width,W=t.height,H=1,Z=null,ae=null;const z=new tt(0,0,O,W),Q=new tt(0,0,O,W);let re=!1;const de=new Dc;let Re=!1,q=!1;const ee=new He,me=new I,Me=new tt,ye={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ze=!1;function at(){return A===null?H:1}let F=n;function se(T,k){return t.getContext(T,k)}try{const T={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${_c}`),t.addEventListener("webglcontextlost",ve,!1),t.addEventListener("webglcontextrestored",we,!1),t.addEventListener("webglcontextcreationerror",ue,!1),F===null){const k="webgl2";if(F=se(k,T),F===null)throw se(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let te,j,J,ge,le,_e,Ve,ke,L,E,G,K,oe,$,Ie,pe,Ce,Pe,ce,Ee,Be,Ne,Se,qe;function B(){te=new _v(F),te.init(),Ne=new Qx(F,te),j=new uv(F,te,e,Ne),J=new Zx(F,te),j.reversedDepthBuffer&&f&&J.buffers.depth.setReversed(!0),ge=new yv(F),le=new Bx,_e=new Jx(F,te,J,le,j,Ne,ge),Ve=new fv(v),ke=new gv(v),L=new wg(F),Se=new lv(F,L),E=new vv(F,L,ge,Se),G=new Sv(F,E,L,ge),ce=new Mv(F,j,_e),pe=new hv(le),K=new Ox(v,Ve,ke,te,j,Se,pe),oe=new ry(v,le),$=new kx,Ie=new Yx(te),Pe=new av(v,Ve,ke,J,G,d,l),Ce=new $x(v,G,j),qe=new oy(F,ge,j,J),Ee=new cv(F,te,ge),Be=new xv(F,te,ge),ge.programs=K.programs,v.capabilities=j,v.extensions=te,v.properties=le,v.renderLists=$,v.shadowMap=Ce,v.state=J,v.info=ge}B();const fe=new iy(v,F);this.xr=fe,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const T=te.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=te.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(T){T!==void 0&&(H=T,this.setSize(O,W,!1))},this.getSize=function(T){return T.set(O,W)},this.setSize=function(T,k,X=!0){if(fe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}O=T,W=k,t.width=Math.floor(T*H),t.height=Math.floor(k*H),X===!0&&(t.style.width=T+"px",t.style.height=k+"px"),this.setViewport(0,0,T,k)},this.getDrawingBufferSize=function(T){return T.set(O*H,W*H).floor()},this.setDrawingBufferSize=function(T,k,X){O=T,W=k,H=X,t.width=Math.floor(T*X),t.height=Math.floor(k*X),this.setViewport(0,0,T,k)},this.getCurrentViewport=function(T){return T.copy(S)},this.getViewport=function(T){return T.copy(z)},this.setViewport=function(T,k,X,Y){T.isVector4?z.set(T.x,T.y,T.z,T.w):z.set(T,k,X,Y),J.viewport(S.copy(z).multiplyScalar(H).round())},this.getScissor=function(T){return T.copy(Q)},this.setScissor=function(T,k,X,Y){T.isVector4?Q.set(T.x,T.y,T.z,T.w):Q.set(T,k,X,Y),J.scissor(N.copy(Q).multiplyScalar(H).round())},this.getScissorTest=function(){return re},this.setScissorTest=function(T){J.setScissorTest(re=T)},this.setOpaqueSort=function(T){Z=T},this.setTransparentSort=function(T){ae=T},this.getClearColor=function(T){return T.copy(Pe.getClearColor())},this.setClearColor=function(){Pe.setClearColor(...arguments)},this.getClearAlpha=function(){return Pe.getClearAlpha()},this.setClearAlpha=function(){Pe.setClearAlpha(...arguments)},this.clear=function(T=!0,k=!0,X=!0){let Y=0;if(T){let V=!1;if(A!==null){const he=A.texture.format;V=he===Tc||he===Ec||he===bc}if(V){const he=A.texture.type,be=he===Yn||he===ts||he===Pr||he===Lr||he===yc||he===Mc,Ae=Pe.getClearColor(),Te=Pe.getClearAlpha(),Oe=Ae.r,ze=Ae.g,Ue=Ae.b;be?(_[0]=Oe,_[1]=ze,_[2]=Ue,_[3]=Te,F.clearBufferuiv(F.COLOR,0,_)):(x[0]=Oe,x[1]=ze,x[2]=Ue,x[3]=Te,F.clearBufferiv(F.COLOR,0,x))}else Y|=F.COLOR_BUFFER_BIT}k&&(Y|=F.DEPTH_BUFFER_BIT),X&&(Y|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ve,!1),t.removeEventListener("webglcontextrestored",we,!1),t.removeEventListener("webglcontextcreationerror",ue,!1),Pe.dispose(),$.dispose(),Ie.dispose(),le.dispose(),Ve.dispose(),ke.dispose(),G.dispose(),Se.dispose(),qe.dispose(),K.dispose(),fe.dispose(),fe.removeEventListener("sessionstart",On),fe.removeEventListener("sessionend",eu),Oi.stop()};function ve(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function we(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;const T=ge.autoReset,k=Ce.enabled,X=Ce.autoUpdate,Y=Ce.needsUpdate,V=Ce.type;B(),ge.autoReset=T,Ce.enabled=k,Ce.autoUpdate=X,Ce.needsUpdate=Y,Ce.type=V}function ue(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function ne(T){const k=T.target;k.removeEventListener("dispose",ne),Le(k)}function Le(T){Ge(T),le.remove(T)}function Ge(T){const k=le.get(T).programs;k!==void 0&&(k.forEach(function(X){K.releaseProgram(X)}),T.isShaderMaterial&&K.releaseShaderCache(T))}this.renderBufferDirect=function(T,k,X,Y,V,he){k===null&&(k=ye);const be=V.isMesh&&V.matrixWorld.determinant()<0,Ae=Ad(T,k,X,Y,V);J.setMaterial(Y,be);let Te=X.index,Oe=1;if(Y.wireframe===!0){if(Te=E.getWireframeAttribute(X),Te===void 0)return;Oe=2}const ze=X.drawRange,Ue=X.attributes.position;let Qe=ze.start*Oe,ft=(ze.start+ze.count)*Oe;he!==null&&(Qe=Math.max(Qe,he.start*Oe),ft=Math.min(ft,(he.start+he.count)*Oe)),Te!==null?(Qe=Math.max(Qe,0),ft=Math.min(ft,Te.count)):Ue!=null&&(Qe=Math.max(Qe,0),ft=Math.min(ft,Ue.count));const Tt=ft-Qe;if(Tt<0||Tt===1/0)return;Se.setup(V,Y,Ae,X,Te);let _t,pt=Ee;if(Te!==null&&(_t=L.get(Te),pt=Be,pt.setIndex(_t)),V.isMesh)Y.wireframe===!0?(J.setLineWidth(Y.wireframeLinewidth*at()),pt.setMode(F.LINES)):pt.setMode(F.TRIANGLES);else if(V.isLine){let Fe=Y.linewidth;Fe===void 0&&(Fe=1),J.setLineWidth(Fe*at()),V.isLineSegments?pt.setMode(F.LINES):V.isLineLoop?pt.setMode(F.LINE_LOOP):pt.setMode(F.LINE_STRIP)}else V.isPoints?pt.setMode(F.POINTS):V.isSprite&&pt.setMode(F.TRIANGLES);if(V.isBatchedMesh)if(V._multiDrawInstances!==null)Or("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),pt.renderMultiDrawInstances(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount,V._multiDrawInstances);else if(te.get("WEBGL_multi_draw"))pt.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{const Fe=V._multiDrawStarts,St=V._multiDrawCounts,nt=V._multiDrawCount,sn=Te?L.get(Te).bytesPerElement:1,os=le.get(Y).currentProgram.getUniforms();for(let rn=0;rn<nt;rn++)os.setValue(F,"_gl_DrawID",rn),pt.render(Fe[rn]/sn,St[rn])}else if(V.isInstancedMesh)pt.renderInstances(Qe,Tt,V.count);else if(X.isInstancedBufferGeometry){const Fe=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,St=Math.min(X.instanceCount,Fe);pt.renderInstances(Qe,Tt,St)}else pt.render(Qe,Tt)};function gt(T,k,X){T.transparent===!0&&T.side===Pt&&T.forceSinglePass===!1?(T.side=jt,T.needsUpdate=!0,jr(T,k,X),T.side=Xn,T.needsUpdate=!0,jr(T,k,X),T.side=Pt):jr(T,k,X)}this.compile=function(T,k,X=null){X===null&&(X=T),p=Ie.get(X),p.init(k),M.push(p),X.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(p.pushLight(V),V.castShadow&&p.pushShadow(V))}),T!==X&&T.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(p.pushLight(V),V.castShadow&&p.pushShadow(V))}),p.setupLights();const Y=new Set;return T.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;const he=V.material;if(he)if(Array.isArray(he))for(let be=0;be<he.length;be++){const Ae=he[be];gt(Ae,X,V),Y.add(Ae)}else gt(he,X,V),Y.add(he)}),p=M.pop(),Y},this.compileAsync=function(T,k,X=null){const Y=this.compile(T,k,X);return new Promise(V=>{function he(){if(Y.forEach(function(be){le.get(be).currentProgram.isReady()&&Y.delete(be)}),Y.size===0){V(T);return}setTimeout(he,10)}te.get("KHR_parallel_shader_compile")!==null?he():setTimeout(he,10)})};let it=null;function Qn(T){it&&it(T)}function On(){Oi.stop()}function eu(){Oi.start()}const Oi=new nd;Oi.setAnimationLoop(Qn),typeof self!="undefined"&&Oi.setContext(self),this.setAnimationLoop=function(T){it=T,fe.setAnimationLoop(T),T===null?Oi.stop():Oi.start()},fe.addEventListener("sessionstart",On),fe.addEventListener("sessionend",eu),this.render=function(T,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),fe.enabled===!0&&fe.isPresenting===!0&&(fe.cameraAutoUpdate===!0&&fe.updateCamera(k),k=fe.getCamera()),T.isScene===!0&&T.onBeforeRender(v,T,k,A),p=Ie.get(T,M.length),p.init(k),M.push(p),ee.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),de.setFromProjectionMatrix(ee,Vn,k.reversedDepth),q=this.localClippingEnabled,Re=pe.init(this.clippingPlanes,q),m=$.get(T,b.length),m.init(),b.push(m),fe.enabled===!0&&fe.isPresenting===!0){const he=v.xr.getDepthSensingMesh();he!==null&&xa(he,k,-1/0,v.sortObjects)}xa(T,k,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(Z,ae),Ze=fe.enabled===!1||fe.isPresenting===!1||fe.hasDepthSensing()===!1,Ze&&Pe.addToRenderList(m,T),this.info.render.frame++,Re===!0&&pe.beginShadows();const X=p.state.shadowsArray;Ce.render(X,T,k),Re===!0&&pe.endShadows(),this.info.autoReset===!0&&this.info.reset();const Y=m.opaque,V=m.transmissive;if(p.setupLights(),k.isArrayCamera){const he=k.cameras;if(V.length>0)for(let be=0,Ae=he.length;be<Ae;be++){const Te=he[be];nu(Y,V,T,Te)}Ze&&Pe.render(T);for(let be=0,Ae=he.length;be<Ae;be++){const Te=he[be];tu(m,T,Te,Te.viewport)}}else V.length>0&&nu(Y,V,T,k),Ze&&Pe.render(T),tu(m,T,k);A!==null&&R===0&&(_e.updateMultisampleRenderTarget(A),_e.updateRenderTargetMipmap(A)),T.isScene===!0&&T.onAfterRender(v,T,k),Se.resetDefaultState(),g=-1,y=null,M.pop(),M.length>0?(p=M[M.length-1],Re===!0&&pe.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,b.pop(),b.length>0?m=b[b.length-1]:m=null};function xa(T,k,X,Y){if(T.visible===!1)return;if(T.layers.test(k.layers)){if(T.isGroup)X=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(k);else if(T.isLight)p.pushLight(T),T.castShadow&&p.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||de.intersectsSprite(T)){Y&&Me.setFromMatrixPosition(T.matrixWorld).applyMatrix4(ee);const be=G.update(T),Ae=T.material;Ae.visible&&m.push(T,be,Ae,X,Me.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||de.intersectsObject(T))){const be=G.update(T),Ae=T.material;if(Y&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),Me.copy(T.boundingSphere.center)):(be.boundingSphere===null&&be.computeBoundingSphere(),Me.copy(be.boundingSphere.center)),Me.applyMatrix4(T.matrixWorld).applyMatrix4(ee)),Array.isArray(Ae)){const Te=be.groups;for(let Oe=0,ze=Te.length;Oe<ze;Oe++){const Ue=Te[Oe],Qe=Ae[Ue.materialIndex];Qe&&Qe.visible&&m.push(T,be,Qe,X,Me.z,Ue)}}else Ae.visible&&m.push(T,be,Ae,X,Me.z,null)}}const he=T.children;for(let be=0,Ae=he.length;be<Ae;be++)xa(he[be],k,X,Y)}function tu(T,k,X,Y){const V=T.opaque,he=T.transmissive,be=T.transparent;p.setupLightsView(X),Re===!0&&pe.setGlobalState(v.clippingPlanes,X),Y&&J.viewport(S.copy(Y)),V.length>0&&$r(V,k,X),he.length>0&&$r(he,k,X),be.length>0&&$r(be,k,X),J.buffers.depth.setTest(!0),J.buffers.depth.setMask(!0),J.buffers.color.setMask(!0),J.setPolygonOffset(!1)}function nu(T,k,X,Y){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[Y.id]===void 0&&(p.state.transmissionRenderTarget[Y.id]=new Mn(1,1,{generateMipmaps:!0,type:te.has("EXT_color_buffer_half_float")||te.has("EXT_color_buffer_float")?cn:Yn,minFilter:Ln,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:et.workingColorSpace}));const he=p.state.transmissionRenderTarget[Y.id],be=Y.viewport||S;he.setSize(be.z*v.transmissionResolutionScale,be.w*v.transmissionResolutionScale);const Ae=v.getRenderTarget(),Te=v.getActiveCubeFace(),Oe=v.getActiveMipmapLevel();v.setRenderTarget(he),v.getClearColor(P),U=v.getClearAlpha(),U<1&&v.setClearColor(16777215,.5),v.clear(),Ze&&Pe.render(X);const ze=v.toneMapping;v.toneMapping=Li;const Ue=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),p.setupLightsView(Y),Re===!0&&pe.setGlobalState(v.clippingPlanes,Y),$r(T,X,Y),_e.updateMultisampleRenderTarget(he),_e.updateRenderTargetMipmap(he),te.has("WEBGL_multisampled_render_to_texture")===!1){let Qe=!1;for(let ft=0,Tt=k.length;ft<Tt;ft++){const _t=k[ft],pt=_t.object,Fe=_t.geometry,St=_t.material,nt=_t.group;if(St.side===Pt&&pt.layers.test(Y.layers)){const sn=St.side;St.side=jt,St.needsUpdate=!0,iu(pt,X,Y,Fe,St,nt),St.side=sn,St.needsUpdate=!0,Qe=!0}}Qe===!0&&(_e.updateMultisampleRenderTarget(he),_e.updateRenderTargetMipmap(he))}v.setRenderTarget(Ae,Te,Oe),v.setClearColor(P,U),Ue!==void 0&&(Y.viewport=Ue),v.toneMapping=ze}function $r(T,k,X){const Y=k.isScene===!0?k.overrideMaterial:null;for(let V=0,he=T.length;V<he;V++){const be=T[V],Ae=be.object,Te=be.geometry,Oe=be.group;let ze=be.material;ze.allowOverride===!0&&Y!==null&&(ze=Y),Ae.layers.test(X.layers)&&iu(Ae,k,X,Te,ze,Oe)}}function iu(T,k,X,Y,V,he){T.onBeforeRender(v,k,X,Y,V,he),T.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),V.onBeforeRender(v,k,X,Y,T,he),V.transparent===!0&&V.side===Pt&&V.forceSinglePass===!1?(V.side=jt,V.needsUpdate=!0,v.renderBufferDirect(X,k,Y,V,T,he),V.side=Xn,V.needsUpdate=!0,v.renderBufferDirect(X,k,Y,V,T,he),V.side=Pt):v.renderBufferDirect(X,k,Y,V,T,he),T.onAfterRender(v,k,X,Y,V,he)}function jr(T,k,X){k.isScene!==!0&&(k=ye);const Y=le.get(T),V=p.state.lights,he=p.state.shadowsArray,be=V.state.version,Ae=K.getParameters(T,V.state,he,k,X),Te=K.getProgramCacheKey(Ae);let Oe=Y.programs;Y.environment=T.isMeshStandardMaterial?k.environment:null,Y.fog=k.fog,Y.envMap=(T.isMeshStandardMaterial?ke:Ve).get(T.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&T.envMap===null?k.environmentRotation:T.envMapRotation,Oe===void 0&&(T.addEventListener("dispose",ne),Oe=new Map,Y.programs=Oe);let ze=Oe.get(Te);if(ze!==void 0){if(Y.currentProgram===ze&&Y.lightsStateVersion===be)return ru(T,Ae),ze}else Ae.uniforms=K.getUniforms(T),T.onBeforeCompile(Ae,v),ze=K.acquireProgram(Ae,Te),Oe.set(Te,ze),Y.uniforms=Ae.uniforms;const Ue=Y.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Ue.clippingPlanes=pe.uniform),ru(T,Ae),Y.needsLights=Cd(T),Y.lightsStateVersion=be,Y.needsLights&&(Ue.ambientLightColor.value=V.state.ambient,Ue.lightProbe.value=V.state.probe,Ue.directionalLights.value=V.state.directional,Ue.directionalLightShadows.value=V.state.directionalShadow,Ue.spotLights.value=V.state.spot,Ue.spotLightShadows.value=V.state.spotShadow,Ue.rectAreaLights.value=V.state.rectArea,Ue.ltc_1.value=V.state.rectAreaLTC1,Ue.ltc_2.value=V.state.rectAreaLTC2,Ue.pointLights.value=V.state.point,Ue.pointLightShadows.value=V.state.pointShadow,Ue.hemisphereLights.value=V.state.hemi,Ue.directionalShadowMap.value=V.state.directionalShadowMap,Ue.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ue.spotShadowMap.value=V.state.spotShadowMap,Ue.spotLightMatrix.value=V.state.spotLightMatrix,Ue.spotLightMap.value=V.state.spotLightMap,Ue.pointShadowMap.value=V.state.pointShadowMap,Ue.pointShadowMatrix.value=V.state.pointShadowMatrix),Y.currentProgram=ze,Y.uniformsList=null,ze}function su(T){if(T.uniformsList===null){const k=T.currentProgram.getUniforms();T.uniformsList=Vo.seqWithValue(k.seq,T.uniforms)}return T.uniformsList}function ru(T,k){const X=le.get(T);X.outputColorSpace=k.outputColorSpace,X.batching=k.batching,X.batchingColor=k.batchingColor,X.instancing=k.instancing,X.instancingColor=k.instancingColor,X.instancingMorph=k.instancingMorph,X.skinning=k.skinning,X.morphTargets=k.morphTargets,X.morphNormals=k.morphNormals,X.morphColors=k.morphColors,X.morphTargetsCount=k.morphTargetsCount,X.numClippingPlanes=k.numClippingPlanes,X.numIntersection=k.numClipIntersection,X.vertexAlphas=k.vertexAlphas,X.vertexTangents=k.vertexTangents,X.toneMapping=k.toneMapping}function Ad(T,k,X,Y,V){k.isScene!==!0&&(k=ye),_e.resetTextureUnits();const he=k.fog,be=Y.isMeshStandardMaterial?k.environment:null,Ae=A===null?v.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Yt,Te=(Y.isMeshStandardMaterial?ke:Ve).get(Y.envMap||be),Oe=Y.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,ze=!!X.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),Ue=!!X.morphAttributes.position,Qe=!!X.morphAttributes.normal,ft=!!X.morphAttributes.color;let Tt=Li;Y.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Tt=v.toneMapping);const _t=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,pt=_t!==void 0?_t.length:0,Fe=le.get(Y),St=p.state.lights;if(Re===!0&&(q===!0||T!==y)){const qt=T===y&&Y.id===g;pe.setState(Y,T,qt)}let nt=!1;Y.version===Fe.__version?(Fe.needsLights&&Fe.lightsStateVersion!==St.state.version||Fe.outputColorSpace!==Ae||V.isBatchedMesh&&Fe.batching===!1||!V.isBatchedMesh&&Fe.batching===!0||V.isBatchedMesh&&Fe.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&Fe.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&Fe.instancing===!1||!V.isInstancedMesh&&Fe.instancing===!0||V.isSkinnedMesh&&Fe.skinning===!1||!V.isSkinnedMesh&&Fe.skinning===!0||V.isInstancedMesh&&Fe.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Fe.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Fe.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Fe.instancingMorph===!1&&V.morphTexture!==null||Fe.envMap!==Te||Y.fog===!0&&Fe.fog!==he||Fe.numClippingPlanes!==void 0&&(Fe.numClippingPlanes!==pe.numPlanes||Fe.numIntersection!==pe.numIntersection)||Fe.vertexAlphas!==Oe||Fe.vertexTangents!==ze||Fe.morphTargets!==Ue||Fe.morphNormals!==Qe||Fe.morphColors!==ft||Fe.toneMapping!==Tt||Fe.morphTargetsCount!==pt)&&(nt=!0):(nt=!0,Fe.__version=Y.version);let sn=Fe.currentProgram;nt===!0&&(sn=jr(Y,k,V));let os=!1,rn=!1,nr=!1;const bt=sn.getUniforms(),fn=Fe.uniforms;if(J.useProgram(sn.program)&&(os=!0,rn=!0,nr=!0),Y.id!==g&&(g=Y.id,rn=!0),os||y!==T){J.buffers.depth.getReversed()&&T.reversedDepth!==!0&&(T._reversedDepth=!0,T.updateProjectionMatrix()),bt.setValue(F,"projectionMatrix",T.projectionMatrix),bt.setValue(F,"viewMatrix",T.matrixWorldInverse);const Qt=bt.map.cameraPosition;Qt!==void 0&&Qt.setValue(F,me.setFromMatrixPosition(T.matrixWorld)),j.logarithmicDepthBuffer&&bt.setValue(F,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&bt.setValue(F,"isOrthographic",T.isOrthographicCamera===!0),y!==T&&(y=T,rn=!0,nr=!0)}if(V.isSkinnedMesh){bt.setOptional(F,V,"bindMatrix"),bt.setOptional(F,V,"bindMatrixInverse");const qt=V.skeleton;qt&&(qt.boneTexture===null&&qt.computeBoneTexture(),bt.setValue(F,"boneTexture",qt.boneTexture,_e))}V.isBatchedMesh&&(bt.setOptional(F,V,"batchingTexture"),bt.setValue(F,"batchingTexture",V._matricesTexture,_e),bt.setOptional(F,V,"batchingIdTexture"),bt.setValue(F,"batchingIdTexture",V._indirectTexture,_e),bt.setOptional(F,V,"batchingColorTexture"),V._colorsTexture!==null&&bt.setValue(F,"batchingColorTexture",V._colorsTexture,_e));const dn=X.morphAttributes;if((dn.position!==void 0||dn.normal!==void 0||dn.color!==void 0)&&ce.update(V,X,sn),(rn||Fe.receiveShadow!==V.receiveShadow)&&(Fe.receiveShadow=V.receiveShadow,bt.setValue(F,"receiveShadow",V.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(fn.envMap.value=Te,fn.flipEnvMap.value=Te.isCubeTexture&&Te.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&k.environment!==null&&(fn.envMapIntensity.value=k.environmentIntensity),rn&&(bt.setValue(F,"toneMappingExposure",v.toneMappingExposure),Fe.needsLights&&Rd(fn,nr),he&&Y.fog===!0&&oe.refreshFogUniforms(fn,he),oe.refreshMaterialUniforms(fn,Y,H,W,p.state.transmissionRenderTarget[T.id]),Vo.upload(F,su(Fe),fn,_e)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(Vo.upload(F,su(Fe),fn,_e),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&bt.setValue(F,"center",V.center),bt.setValue(F,"modelViewMatrix",V.modelViewMatrix),bt.setValue(F,"normalMatrix",V.normalMatrix),bt.setValue(F,"modelMatrix",V.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){const qt=Y.uniformsGroups;for(let Qt=0,ya=qt.length;Qt<ya;Qt++){const Bi=qt[Qt];qe.update(Bi,sn),qe.bind(Bi,sn)}}return sn}function Rd(T,k){T.ambientLightColor.needsUpdate=k,T.lightProbe.needsUpdate=k,T.directionalLights.needsUpdate=k,T.directionalLightShadows.needsUpdate=k,T.pointLights.needsUpdate=k,T.pointLightShadows.needsUpdate=k,T.spotLights.needsUpdate=k,T.spotLightShadows.needsUpdate=k,T.rectAreaLights.needsUpdate=k,T.hemisphereLights.needsUpdate=k}function Cd(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(T,k,X){const Y=le.get(T);Y.__autoAllocateDepthBuffer=T.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),le.get(T.texture).__webglTexture=k,le.get(T.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:X,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(T,k){const X=le.get(T);X.__webglFramebuffer=k,X.__useDefaultFramebuffer=k===void 0};const Pd=F.createFramebuffer();this.setRenderTarget=function(T,k=0,X=0){A=T,C=k,R=X;let Y=!0,V=null,he=!1,be=!1;if(T){const Te=le.get(T);if(Te.__useDefaultFramebuffer!==void 0)J.bindFramebuffer(F.FRAMEBUFFER,null),Y=!1;else if(Te.__webglFramebuffer===void 0)_e.setupRenderTarget(T);else if(Te.__hasExternalTextures)_e.rebindTextures(T,le.get(T.texture).__webglTexture,le.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){const Ue=T.depthTexture;if(Te.__boundDepthTexture!==Ue){if(Ue!==null&&le.has(Ue)&&(T.width!==Ue.image.width||T.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");_e.setupDepthRenderbuffer(T)}}const Oe=T.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(be=!0);const ze=le.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(ze[k])?V=ze[k][X]:V=ze[k],he=!0):T.samples>0&&_e.useMultisampledRTT(T)===!1?V=le.get(T).__webglMultisampledFramebuffer:Array.isArray(ze)?V=ze[X]:V=ze,S.copy(T.viewport),N.copy(T.scissor),D=T.scissorTest}else S.copy(z).multiplyScalar(H).floor(),N.copy(Q).multiplyScalar(H).floor(),D=re;if(X!==0&&(V=Pd),J.bindFramebuffer(F.FRAMEBUFFER,V)&&Y&&J.drawBuffers(T,V),J.viewport(S),J.scissor(N),J.setScissorTest(D),he){const Te=le.get(T.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+k,Te.__webglTexture,X)}else if(be){const Te=k;for(let Oe=0;Oe<T.textures.length;Oe++){const ze=le.get(T.textures[Oe]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+Oe,ze.__webglTexture,X,Te)}}else if(T!==null&&X!==0){const Te=le.get(T.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,Te.__webglTexture,X)}g=-1},this.readRenderTargetPixels=function(T,k,X,Y,V,he,be,Ae=0){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Te=le.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&be!==void 0&&(Te=Te[be]),Te){J.bindFramebuffer(F.FRAMEBUFFER,Te);try{const Oe=T.textures[Ae],ze=Oe.format,Ue=Oe.type;if(!j.textureFormatReadable(ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!j.textureTypeReadable(Ue)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=T.width-Y&&X>=0&&X<=T.height-V&&(T.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+Ae),F.readPixels(k,X,Y,V,Ne.convert(ze),Ne.convert(Ue),he))}finally{const Oe=A!==null?le.get(A).__webglFramebuffer:null;J.bindFramebuffer(F.FRAMEBUFFER,Oe)}}},this.readRenderTargetPixelsAsync=async function(T,k,X,Y,V,he,be,Ae=0){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Te=le.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&be!==void 0&&(Te=Te[be]),Te)if(k>=0&&k<=T.width-Y&&X>=0&&X<=T.height-V){J.bindFramebuffer(F.FRAMEBUFFER,Te);const Oe=T.textures[Ae],ze=Oe.format,Ue=Oe.type;if(!j.textureFormatReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!j.textureTypeReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Qe=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,Qe),F.bufferData(F.PIXEL_PACK_BUFFER,he.byteLength,F.STREAM_READ),T.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+Ae),F.readPixels(k,X,Y,V,Ne.convert(ze),Ne.convert(Ue),0);const ft=A!==null?le.get(A).__webglFramebuffer:null;J.bindFramebuffer(F.FRAMEBUFFER,ft);const Tt=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await Lp(F,Tt,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,Qe),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,he),F.deleteBuffer(Qe),F.deleteSync(Tt),he}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(T,k=null,X=0){const Y=Math.pow(2,-X),V=Math.floor(T.image.width*Y),he=Math.floor(T.image.height*Y),be=k!==null?k.x:0,Ae=k!==null?k.y:0;_e.setTexture2D(T,0),F.copyTexSubImage2D(F.TEXTURE_2D,X,0,0,be,Ae,V,he),J.unbindTexture()};const Ld=F.createFramebuffer(),Id=F.createFramebuffer();this.copyTextureToTexture=function(T,k,X=null,Y=null,V=0,he=null){he===null&&(V!==0?(Or("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),he=V,V=0):he=0);let be,Ae,Te,Oe,ze,Ue,Qe,ft,Tt;const _t=T.isCompressedTexture?T.mipmaps[he]:T.image;if(X!==null)be=X.max.x-X.min.x,Ae=X.max.y-X.min.y,Te=X.isBox3?X.max.z-X.min.z:1,Oe=X.min.x,ze=X.min.y,Ue=X.isBox3?X.min.z:0;else{const dn=Math.pow(2,-V);be=Math.floor(_t.width*dn),Ae=Math.floor(_t.height*dn),T.isDataArrayTexture?Te=_t.depth:T.isData3DTexture?Te=Math.floor(_t.depth*dn):Te=1,Oe=0,ze=0,Ue=0}Y!==null?(Qe=Y.x,ft=Y.y,Tt=Y.z):(Qe=0,ft=0,Tt=0);const pt=Ne.convert(k.format),Fe=Ne.convert(k.type);let St;k.isData3DTexture?(_e.setTexture3D(k,0),St=F.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(_e.setTexture2DArray(k,0),St=F.TEXTURE_2D_ARRAY):(_e.setTexture2D(k,0),St=F.TEXTURE_2D),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,k.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,k.unpackAlignment);const nt=F.getParameter(F.UNPACK_ROW_LENGTH),sn=F.getParameter(F.UNPACK_IMAGE_HEIGHT),os=F.getParameter(F.UNPACK_SKIP_PIXELS),rn=F.getParameter(F.UNPACK_SKIP_ROWS),nr=F.getParameter(F.UNPACK_SKIP_IMAGES);F.pixelStorei(F.UNPACK_ROW_LENGTH,_t.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,_t.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Oe),F.pixelStorei(F.UNPACK_SKIP_ROWS,ze),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Ue);const bt=T.isDataArrayTexture||T.isData3DTexture,fn=k.isDataArrayTexture||k.isData3DTexture;if(T.isDepthTexture){const dn=le.get(T),qt=le.get(k),Qt=le.get(dn.__renderTarget),ya=le.get(qt.__renderTarget);J.bindFramebuffer(F.READ_FRAMEBUFFER,Qt.__webglFramebuffer),J.bindFramebuffer(F.DRAW_FRAMEBUFFER,ya.__webglFramebuffer);for(let Bi=0;Bi<Te;Bi++)bt&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,le.get(T).__webglTexture,V,Ue+Bi),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,le.get(k).__webglTexture,he,Tt+Bi)),F.blitFramebuffer(Oe,ze,be,Ae,Qe,ft,be,Ae,F.DEPTH_BUFFER_BIT,F.NEAREST);J.bindFramebuffer(F.READ_FRAMEBUFFER,null),J.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(V!==0||T.isRenderTargetTexture||le.has(T)){const dn=le.get(T),qt=le.get(k);J.bindFramebuffer(F.READ_FRAMEBUFFER,Ld),J.bindFramebuffer(F.DRAW_FRAMEBUFFER,Id);for(let Qt=0;Qt<Te;Qt++)bt?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,dn.__webglTexture,V,Ue+Qt):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,dn.__webglTexture,V),fn?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,qt.__webglTexture,he,Tt+Qt):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,qt.__webglTexture,he),V!==0?F.blitFramebuffer(Oe,ze,be,Ae,Qe,ft,be,Ae,F.COLOR_BUFFER_BIT,F.NEAREST):fn?F.copyTexSubImage3D(St,he,Qe,ft,Tt+Qt,Oe,ze,be,Ae):F.copyTexSubImage2D(St,he,Qe,ft,Oe,ze,be,Ae);J.bindFramebuffer(F.READ_FRAMEBUFFER,null),J.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else fn?T.isDataTexture||T.isData3DTexture?F.texSubImage3D(St,he,Qe,ft,Tt,be,Ae,Te,pt,Fe,_t.data):k.isCompressedArrayTexture?F.compressedTexSubImage3D(St,he,Qe,ft,Tt,be,Ae,Te,pt,_t.data):F.texSubImage3D(St,he,Qe,ft,Tt,be,Ae,Te,pt,Fe,_t):T.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,he,Qe,ft,be,Ae,pt,Fe,_t.data):T.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,he,Qe,ft,_t.width,_t.height,pt,_t.data):F.texSubImage2D(F.TEXTURE_2D,he,Qe,ft,be,Ae,pt,Fe,_t);F.pixelStorei(F.UNPACK_ROW_LENGTH,nt),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,sn),F.pixelStorei(F.UNPACK_SKIP_PIXELS,os),F.pixelStorei(F.UNPACK_SKIP_ROWS,rn),F.pixelStorei(F.UNPACK_SKIP_IMAGES,nr),he===0&&k.generateMipmaps&&F.generateMipmap(St),J.unbindTexture()},this.initRenderTarget=function(T){le.get(T).__webglFramebuffer===void 0&&_e.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?_e.setTextureCube(T,0):T.isData3DTexture?_e.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?_e.setTexture2DArray(T,0):_e.setTexture2D(T,0),J.unbindTexture()},this.resetState=function(){C=0,R=0,A=null,J.reset(),Se.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Vn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=et._getDrawingBufferColorSpace(e),t.unpackColorSpace=et._getUnpackColorSpace()}}function Ch(i,e){if(e===ip)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(e===ec||e===xf){let t=i.getIndex();if(t===null){const o=[],a=i.getAttribute("position");if(a!==void 0){for(let l=0;l<a.count;l++)o.push(l);i.setIndex(o),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}const n=t.count-2,s=[];if(e===ec)for(let o=1;o<=n;o++)s.push(t.getX(0)),s.push(t.getX(o)),s.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(s.push(t.getX(o)),s.push(t.getX(o+1)),s.push(t.getX(o+2))):(s.push(t.getX(o+2)),s.push(t.getX(o+1)),s.push(t.getX(o)));s.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const r=i.clone();return r.setIndex(s),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),i}class ad extends ss{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new fy(t)}),this.register(function(t){return new dy(t)}),this.register(function(t){return new Sy(t)}),this.register(function(t){return new by(t)}),this.register(function(t){return new Ey(t)}),this.register(function(t){return new my(t)}),this.register(function(t){return new gy(t)}),this.register(function(t){return new _y(t)}),this.register(function(t){return new vy(t)}),this.register(function(t){return new hy(t)}),this.register(function(t){return new xy(t)}),this.register(function(t){return new py(t)}),this.register(function(t){return new My(t)}),this.register(function(t){return new yy(t)}),this.register(function(t){return new cy(t)}),this.register(function(t){return new Ty(t)}),this.register(function(t){return new wy(t)})}load(e,t,n,s){const r=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const c=Er.extractUrlBase(e);o=Er.resolveURL(c,this.path)}else o=Er.extractUrlBase(e);this.manager.itemStart(e);const a=function(c){s?s(c):console.error(c),r.manager.itemError(e),r.manager.itemEnd(e)},l=new Vc(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{r.parse(c,o,function(u){t(u),r.manager.itemEnd(e)},a)}catch(u){a(u)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,s){let r;const o={},a={},l=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===ld){try{o[Je.KHR_BINARY_GLTF]=new Ay(e)}catch(h){s&&s(h);return}r=JSON.parse(o[Je.KHR_BINARY_GLTF].content)}else r=JSON.parse(l.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new ky(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let u=0;u<this.pluginCallbacks.length;u++){const h=this.pluginCallbacks[u](c);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[h.name]=h,o[h.name]=!0}if(r.extensionsUsed)for(let u=0;u<r.extensionsUsed.length;++u){const h=r.extensionsUsed[u],f=r.extensionsRequired||[];switch(h){case Je.KHR_MATERIALS_UNLIT:o[h]=new uy;break;case Je.KHR_DRACO_MESH_COMPRESSION:o[h]=new Ry(r,this.dracoLoader);break;case Je.KHR_TEXTURE_TRANSFORM:o[h]=new Cy;break;case Je.KHR_MESH_QUANTIZATION:o[h]=new Py;break;default:f.indexOf(h)>=0&&a[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}c.setExtensions(o),c.setPlugins(a),c.parse(n,s)}parseAsync(e,t){const n=this;return new Promise(function(s,r){n.parse(e,t,s,r)})}}function ly(){let i={};return{get:function(e){return i[e]},add:function(e,t){i[e]=t},remove:function(e){delete i[e]},removeAll:function(){i={}}}}const Je={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class cy{constructor(e){this.parser=e,this.name=Je.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,s=t.length;n<s;n++){const r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let s=t.cache.get(n);if(s)return s;const r=t.json,l=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e];let c;const u=new De(16777215);l.color!==void 0&&u.setRGB(l.color[0],l.color[1],l.color[2],Yt);const h=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new ed(u),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Qf(u),c.distance=h;break;case"spot":c=new hg(u),c.distance=h,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),zn(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),s=Promise.resolve(c),t.cache.add(n,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(l){return n._getNodeRef(t.cache,a,l)})}}class uy{constructor(){this.name=Je.KHR_MATERIALS_UNLIT}getMaterialType(){return un}extendParams(e,t,n){const s=[];e.color=new De(1,1,1),e.opacity=1;const r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){const o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],Yt),e.opacity=o[3]}r.baseColorTexture!==void 0&&s.push(n.assignTexture(e,"map",r.baseColorTexture,xt))}return Promise.all(s)}}class hy{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=s.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}}class fy{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ie(a,a)}return Promise.all(r)}}class dy{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_DISPERSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=s.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}}class py{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}}class my{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_SHEEN}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[];t.sheenColor=new De(0,0,0),t.sheenRoughness=0,t.sheen=1;const o=s.extensions[this.name];if(o.sheenColorFactor!==void 0){const a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],Yt)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,xt)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}}class gy{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}}class _y{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_VOLUME}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;const a=o.attenuationColor||[1,1,1];return t.attenuationColor=new De().setRGB(a[0],a[1],a[2],Yt),Promise.all(r)}}class vy{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_IOR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=s.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}}class xy{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_SPECULAR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));const a=o.specularColorFactor||[1,1,1];return t.specularColor=new De().setRGB(a[0],a[1],a[2],Yt),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,xt)),Promise.all(r)}}class yy{constructor(e){this.parser=e,this.name=Je.EXT_MATERIALS_BUMP}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}}class My{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Un}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}}class Sy{constructor(e){this.parser=e,this.name=Je.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,s=n.textures[e];if(!s.extensions||!s.extensions[this.name])return null;const r=s.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}}class by{constructor(e){this.parser=e,this.name=Je.EXT_TEXTURE_WEBP}loadTexture(e){const t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;const o=r.extensions[t],a=s.images[o.source];let l=n.textureLoader;if(a.uri){const c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return n.loadTextureImage(e,o.source,l)}}class Ey{constructor(e){this.parser=e,this.name=Je.EXT_TEXTURE_AVIF}loadTexture(e){const t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;const o=r.extensions[t],a=s.images[o.source];let l=n.textureLoader;if(a.uri){const c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return n.loadTextureImage(e,o.source,l)}}class Ty{constructor(e){this.name=Je.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const s=n.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){const l=s.byteOffset||0,c=s.byteLength||0,u=s.count,h=s.byteStride,f=new Uint8Array(a,l,c);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(u,h,f,s.mode,s.filter).then(function(d){return d.buffer}):o.ready.then(function(){const d=new ArrayBuffer(u*h);return o.decodeGltfBuffer(new Uint8Array(d),u,h,f,s.mode,s.filter),d})})}else return null}}class wy{constructor(e){this.name=Je.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const s=t.meshes[n.mesh];for(const c of s.primitives)if(c.mode!==mn.TRIANGLES&&c.mode!==mn.TRIANGLE_STRIP&&c.mode!==mn.TRIANGLE_FAN&&c.mode!==void 0)return null;const o=n.extensions[this.name].attributes,a=[],l={};for(const c in o)a.push(this.parser.getDependency("accessor",o[c]).then(u=>(l[c]=u,l[c])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(c=>{const u=c.pop(),h=u.isGroup?u.children:[u],f=c[0].count,d=[];for(const _ of h){const x=new He,m=new I,p=new Ui,b=new I(1,1,1),M=new Uf(_.geometry,_.material,f);for(let v=0;v<f;v++)l.TRANSLATION&&m.fromBufferAttribute(l.TRANSLATION,v),l.ROTATION&&p.fromBufferAttribute(l.ROTATION,v),l.SCALE&&b.fromBufferAttribute(l.SCALE,v),M.setMatrixAt(v,x.compose(m,p,b));for(const v in l)if(v==="_COLOR_0"){const w=l[v];M.instanceColor=new nc(w.array,w.itemSize,w.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&_.geometry.setAttribute(v,l[v]);mt.prototype.copy.call(M,_),this.parser.assignFinalMaterial(M),d.push(M)}return u.isGroup?(u.clear(),u.add(...d),u):d[0]}))}}const ld="glTF",pr=12,Ph={JSON:1313821514,BIN:5130562};class Ay{constructor(e){this.name=Je.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,pr),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==ld)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const s=this.header.length-pr,r=new DataView(e,pr);let o=0;for(;o<s;){const a=r.getUint32(o,!0);o+=4;const l=r.getUint32(o,!0);if(o+=4,l===Ph.JSON){const c=new Uint8Array(e,pr+o,a);this.content=n.decode(c)}else if(l===Ph.BIN){const c=pr+o;this.body=e.slice(c,c+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Ry{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Je.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},l={},c={};for(const u in o){const h=ac[u]||u.toLowerCase();a[h]=o[u]}for(const u in e.attributes){const h=ac[u]||u.toLowerCase();if(o[u]!==void 0){const f=n.accessors[e.attributes[u]],d=Ns[f.componentType];c[h]=d.name,l[h]=f.normalized===!0}}return t.getDependency("bufferView",r).then(function(u){return new Promise(function(h,f){s.decodeDracoFile(u,function(d){for(const _ in d.attributes){const x=d.attributes[_],m=l[_];m!==void 0&&(x.normalized=m)}h(d)},a,c,Yt,f)})})}}class Cy{constructor(){this.name=Je.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class Py{constructor(){this.name=Je.KHR_MESH_QUANTIZATION}}class cd extends Yr{constructor(e,t,n,s){super(e,t,n,s)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let o=0;o!==s;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=a*2,c=a*3,u=s-t,h=(n-t)/u,f=h*h,d=f*h,_=e*c,x=_-c,m=-2*d+3*f,p=d-f,b=1-m,M=p-f+h;for(let v=0;v!==a;v++){const w=o[x+v+a],C=o[x+v+l]*u,R=o[_+v+a],A=o[_+v]*u;r[v]=b*w+M*C+m*R+p*A}return r}}const Ly=new Ui;class Iy extends cd{interpolate_(e,t,n,s){const r=super.interpolate_(e,t,n,s);return Ly.fromArray(r).normalize().toArray(r),r}}const mn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Ns={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Lh={9728:Zt,9729:Lt,9984:hf,9985:Oo,9986:gr,9987:Ln},Ih={33071:Hn,33648:Yo,10497:hn},ol={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},ac={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Mi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Dy={CUBICSPLINE:void 0,LINEAR:Ur,STEP:Nr},al={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Ny(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new Kn({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Xn})),i.DefaultMaterial}function Xi(i,e,t){for(const n in t.extensions)i[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function zn(i,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(i.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Uy(i,e,t){let n=!1,s=!1,r=!1;for(let c=0,u=e.length;c<u;c++){const h=e[c];if(h.POSITION!==void 0&&(n=!0),h.NORMAL!==void 0&&(s=!0),h.COLOR_0!==void 0&&(r=!0),n&&s&&r)break}if(!n&&!s&&!r)return Promise.resolve(i);const o=[],a=[],l=[];for(let c=0,u=e.length;c<u;c++){const h=e[c];if(n){const f=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):i.attributes.position;o.push(f)}if(s){const f=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):i.attributes.normal;a.push(f)}if(r){const f=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):i.attributes.color;l.push(f)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l)]).then(function(c){const u=c[0],h=c[1],f=c[2];return n&&(i.morphAttributes.position=u),s&&(i.morphAttributes.normal=h),r&&(i.morphAttributes.color=f),i.morphTargetsRelative=!0,i})}function Fy(i,e){if(i.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)i.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let n=0,s=t.length;n<s;n++)i.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Oy(i){let e;const t=i.extensions&&i.extensions[Je.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+ll(t.attributes):e=i.indices+":"+ll(i.attributes)+":"+i.mode,i.targets!==void 0)for(let n=0,s=i.targets.length;n<s;n++)e+=":"+ll(i.targets[n]);return e}function ll(i){let e="";const t=Object.keys(i).sort();for(let n=0,s=t.length;n<s;n++)e+=t[n]+":"+i[t[n]]+";";return e}function lc(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function By(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":i.search(/\.ktx2($|\?)/i)>0||i.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const zy=new He;class ky{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new ly,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,s=-1,r=!1,o=-1;if(typeof navigator!="undefined"){const a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;const l=a.match(/Version\/(\d+)/);s=n&&l?parseInt(l[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap=="undefined"||n&&s<17||r&&o<98?this.textureLoader=new ea(this.options.manager):this.textureLoader=new pg(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Vc(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){const a={scene:o[0][s.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:s.asset,parser:n,userData:{}};return Xi(r,a,s),zn(a,s),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(a)})).then(function(){for(const l of a.scenes)l.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){const o=t[s].joints;for(let a=0,l=o.length;a<l;a++)e[o[a]].isBone=!0}for(let s=0,r=e.length;s<r;s++){const o=e[s];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const s=n.clone(),r=(o,a)=>{const l=this.associations.get(o);l!=null&&this.associations.set(a,l);for(const[c,u]of o.children.entries())r(u,a.children[c])};return r(n,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const s=e(t[n]);if(s)return s}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let s=0;s<t.length;s++){const r=e(t[s]);r&&n.push(r)}return n}getDependency(e,t){const n=e+":"+t;let s=this.cache.get(n);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(n,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Je.KHR_BINARY_GLTF].body);const s=this.options;return new Promise(function(r,o){n.load(Er.resolveURL(t.uri,s.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const s=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+s)})}loadAccessor(e){const t=this,n=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){const o=ol[s.type],a=Ns[s.componentType],l=s.normalized===!0,c=new a(s.count*o);return Promise.resolve(new Jt(c,o,l))}const r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(o){const a=o[0],l=ol[s.type],c=Ns[s.componentType],u=c.BYTES_PER_ELEMENT,h=u*l,f=s.byteOffset||0,d=s.bufferView!==void 0?n.bufferViews[s.bufferView].byteStride:void 0,_=s.normalized===!0;let x,m;if(d&&d!==h){const p=Math.floor(f/d),b="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+p+":"+s.count;let M=t.cache.get(b);M||(x=new c(a,p*d,s.count*d/u),M=new Lf(x,d/u),t.cache.add(b,M)),m=new Br(M,l,f%d/u,_)}else a===null?x=new c(s.count*l):x=new c(a,f,s.count*l),m=new Jt(x,l,_);if(s.sparse!==void 0){const p=ol.SCALAR,b=Ns[s.sparse.indices.componentType],M=s.sparse.indices.byteOffset||0,v=s.sparse.values.byteOffset||0,w=new b(o[1],M,s.sparse.count*p),C=new c(o[2],v,s.sparse.count*l);a!==null&&(m=new Jt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let R=0,A=w.length;R<A;R++){const g=w[R];if(m.setX(g,C[R*l]),l>=2&&m.setY(g,C[R*l+1]),l>=3&&m.setZ(g,C[R*l+2]),l>=4&&m.setW(g,C[R*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=_}return m})}loadTexture(e){const t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r];let a=this.textureLoader;if(o.uri){const l=n.manager.getHandler(o.uri);l!==null&&(a=l)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){const s=this,r=this.json,o=r.textures[e],a=r.images[t],l=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,n).then(function(u){u.flipY=!1,u.name=o.name||a.name||"",u.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(u.name=a.uri);const f=(r.samplers||{})[o.sampler]||{};return u.magFilter=Lh[f.magFilter]||Lt,u.minFilter=Lh[f.minFilter]||Ln,u.wrapS=Ih[f.wrapS]||hn,u.wrapT=Ih[f.wrapT]||hn,u.generateMipmaps=!u.isCompressedTexture&&u.minFilter!==Zt&&u.minFilter!==Lt,s.associations.set(u,{textures:e}),u}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const n=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());const o=s.images[e],a=self.URL||self.webkitURL;let l=o.uri||"",c=!1;if(o.bufferView!==void 0)l=n.getDependency("bufferView",o.bufferView).then(function(h){c=!0;const f=new Blob([h],{type:o.mimeType});return l=a.createObjectURL(f),l});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const u=Promise.resolve(l).then(function(h){return new Promise(function(f,d){let _=f;t.isImageBitmapLoader===!0&&(_=function(x){const m=new It(x);m.needsUpdate=!0,f(m)}),t.load(Er.resolveURL(h,r.path),_,void 0,d)})}).then(function(h){return c===!0&&a.revokeObjectURL(l),zn(h,o),h.userData.mimeType=o.mimeType||By(o.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),h});return this.sourceCache[e]=u,u}assignTexture(e,t,n,s){const r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[Je.KHR_TEXTURE_TRANSFORM]){const a=n.extensions!==void 0?n.extensions[Je.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const l=r.associations.get(o);o=r.extensions[Je.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,l)}}return s!==void 0&&(o.colorSpace=s),e[t]=o,o})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){const a="PointsMaterial:"+n.uuid;let l=this.cache.get(a);l||(l=new Of,Dn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(a,l)),n=l}else if(e.isLine){const a="LineBasicMaterial:"+n.uuid;let l=this.cache.get(a);l||(l=new Ff,Dn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(a,l)),n=l}if(s||r||o){let a="ClonedMaterial:"+n.uuid+":";s&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let l=this.cache.get(a);l||(l=n.clone(),r&&(l.vertexColors=!0),o&&(l.flatShading=!0),s&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(a,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return Kn}loadMaterial(e){const t=this,n=this.json,s=this.extensions,r=n.materials[e];let o;const a={},l=r.extensions||{},c=[];if(l[Je.KHR_MATERIALS_UNLIT]){const h=s[Je.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),c.push(h.extendParams(a,r,t))}else{const h=r.pbrMetallicRoughness||{};if(a.color=new De(1,1,1),a.opacity=1,Array.isArray(h.baseColorFactor)){const f=h.baseColorFactor;a.color.setRGB(f[0],f[1],f[2],Yt),a.opacity=f[3]}h.baseColorTexture!==void 0&&c.push(t.assignTexture(a,"map",h.baseColorTexture,xt)),a.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,a.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(a,"metalnessMap",h.metallicRoughnessTexture)),c.push(t.assignTexture(a,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=Pt);const u=r.alphaMode||al.OPAQUE;if(u===al.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,u===al.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==un&&(c.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new ie(1,1),r.normalTexture.scale!==void 0)){const h=r.normalTexture.scale;a.normalScale.set(h,h)}if(r.occlusionTexture!==void 0&&o!==un&&(c.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==un){const h=r.emissiveFactor;a.emissive=new De().setRGB(h[0],h[1],h[2],Yt)}return r.emissiveTexture!==void 0&&o!==un&&c.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,xt)),Promise.all(c).then(function(){const h=new o(a);return r.name&&(h.name=r.name),zn(h,r),t.associations.set(h,{materials:e}),r.extensions&&Xi(s,h,r),h})}createUniqueName(e){const t=ht.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,s=this.primitiveCache;function r(a){return n[Je.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(l){return Dh(l,a,t)})}const o=[];for(let a=0,l=e.length;a<l;a++){const c=e[a],u=Oy(c),h=s[u];if(h)o.push(h.promise);else{let f;c.extensions&&c.extensions[Je.KHR_DRACO_MESH_COMPRESSION]?f=r(c):f=Dh(new Mt,c,t),s[u]={primitive:c,promise:f},o.push(f)}}return Promise.all(o)}loadMesh(e){const t=this,n=this.json,s=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let l=0,c=o.length;l<c;l++){const u=o[l].material===void 0?Ny(this.cache):this.getDependency("material",o[l].material);a.push(u)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(l){const c=l.slice(0,l.length-1),u=l[l.length-1],h=[];for(let d=0,_=u.length;d<_;d++){const x=u[d],m=o[d];let p;const b=c[d];if(m.mode===mn.TRIANGLES||m.mode===mn.TRIANGLE_STRIP||m.mode===mn.TRIANGLE_FAN||m.mode===void 0)p=r.isSkinnedMesh===!0?new om(x,b):new Rt(x,b),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===mn.TRIANGLE_STRIP?p.geometry=Ch(p.geometry,xf):m.mode===mn.TRIANGLE_FAN&&(p.geometry=Ch(p.geometry,ec));else if(m.mode===mn.LINES)p=new fm(x,b);else if(m.mode===mn.LINE_STRIP)p=new Nc(x,b);else if(m.mode===mn.LINE_LOOP)p=new dm(x,b);else if(m.mode===mn.POINTS)p=new pm(x,b);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&Fy(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),zn(p,r),m.extensions&&Xi(s,p,m),t.assignFinalMaterial(p),h.push(p)}for(let d=0,_=h.length;d<_;d++)t.associations.set(h[d],{meshes:e,primitives:d});if(h.length===1)return r.extensions&&Xi(s,h[0],r),h[0];const f=new Vt;r.extensions&&Xi(s,f,r),t.associations.set(f,{meshes:e});for(let d=0,_=h.length;d<_;d++)f.add(h[d]);return f})}loadCamera(e){let t;const n=this.json.cameras[e],s=n[n.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new Ht(Xr.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):n.type==="orthographic"&&(t=new ha(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),zn(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let s=0,r=t.joints.length;s<r;s++)n.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(s){const r=s.pop(),o=s,a=[],l=[];for(let c=0,u=o.length;c<u;c++){const h=o[c];if(h){a.push(h);const f=new He;r!==null&&f.fromArray(r.array,c*16),l.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Ic(a,l)})}loadAnimation(e){const t=this.json,n=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,o=[],a=[],l=[],c=[],u=[];for(let h=0,f=s.channels.length;h<f;h++){const d=s.channels[h],_=s.samplers[d.sampler],x=d.target,m=x.node,p=s.parameters!==void 0?s.parameters[_.input]:_.input,b=s.parameters!==void 0?s.parameters[_.output]:_.output;x.node!==void 0&&(o.push(this.getDependency("node",m)),a.push(this.getDependency("accessor",p)),l.push(this.getDependency("accessor",b)),c.push(_),u.push(x))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(c),Promise.all(u)]).then(function(h){const f=h[0],d=h[1],_=h[2],x=h[3],m=h[4],p=[];for(let M=0,v=f.length;M<v;M++){const w=f[M],C=d[M],R=_[M],A=x[M],g=m[M];if(w===void 0)continue;w.updateMatrix&&w.updateMatrix();const y=n._createAnimationTracks(w,C,R,A,g);if(y)for(let S=0;S<y.length;S++)p.push(y[S])}const b=new tg(r,void 0,p);return zn(b,s),b})}createNodeMesh(e){const t=this.json,n=this,s=t.nodes[e];return s.mesh===void 0?null:n.getDependency("mesh",s.mesh).then(function(r){const o=n._getNodeRef(n.meshCache,s.mesh,r);return s.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let l=0,c=s.weights.length;l<c;l++)a.morphTargetInfluences[l]=s.weights[l]}),o})}loadNode(e){const t=this.json,n=this,s=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=s.children||[];for(let c=0,u=a.length;c<u;c++)o.push(n.getDependency("node",a[c]));const l=s.skin===void 0?Promise.resolve(null):n.getDependency("skin",s.skin);return Promise.all([r,Promise.all(o),l]).then(function(c){const u=c[0],h=c[1],f=c[2];f!==null&&u.traverse(function(d){d.isSkinnedMesh&&d.bind(f,zy)});for(let d=0,_=h.length;d<_;d++)u.add(h[d]);return u})}_loadNodeShallow(e){const t=this.json,n=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const r=t.nodes[e],o=r.name?s.createUniqueName(r.name):"",a=[],l=s._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&a.push(l),r.camera!==void 0&&a.push(s.getDependency("camera",r.camera).then(function(c){return s._getNodeRef(s.cameraCache,r.camera,c)})),s._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){a.push(c)}),this.nodeCache[e]=Promise.all(a).then(function(c){let u;if(r.isBone===!0?u=new Nf:c.length>1?u=new Vt:c.length===1?u=c[0]:u=new mt,u!==c[0])for(let h=0,f=c.length;h<f;h++)u.add(c[h]);if(r.name&&(u.userData.name=r.name,u.name=o),zn(u,r),r.extensions&&Xi(n,u,r),r.matrix!==void 0){const h=new He;h.fromArray(r.matrix),u.applyMatrix4(h)}else r.translation!==void 0&&u.position.fromArray(r.translation),r.rotation!==void 0&&u.quaternion.fromArray(r.rotation),r.scale!==void 0&&u.scale.fromArray(r.scale);if(!s.associations.has(u))s.associations.set(u,{});else if(r.mesh!==void 0&&s.meshCache.refs[r.mesh]>1){const h=s.associations.get(u);s.associations.set(u,{...h})}return s.associations.get(u).nodes=e,u}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],s=this,r=new Vt;n.name&&(r.name=s.createUniqueName(n.name)),zn(r,n),n.extensions&&Xi(t,r,n);const o=n.nodes||[],a=[];for(let l=0,c=o.length;l<c;l++)a.push(s.getDependency("node",o[l]));return Promise.all(a).then(function(l){for(let u=0,h=l.length;u<h;u++)r.add(l[u]);const c=u=>{const h=new Map;for(const[f,d]of s.associations)(f instanceof Dn||f instanceof It)&&h.set(f,d);return u.traverse(f=>{const d=s.associations.get(f);d!=null&&h.set(f,d)}),h};return s.associations=c(r),r})}_createAnimationTracks(e,t,n,s,r){const o=[],a=e.name?e.name:e.uuid,l=[];Mi[r.path]===Mi.weights?e.traverse(function(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}):l.push(a);let c;switch(Mi[r.path]){case Mi.weights:c=Vs;break;case Mi.rotation:c=Gs;break;case Mi.translation:case Mi.scale:c=Ws;break;default:n.itemSize===1?c=Vs:c=Ws;break}const u=s.interpolation!==void 0?Dy[s.interpolation]:Ur,h=this._getArrayFromAccessor(n);for(let f=0,d=l.length;f<d;f++){const _=new c(l[f]+"."+Mi[r.path],t.array,h,u);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(_),o.push(_)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=lc(t.constructor),s=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)s[r]=t[r]*n;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){const s=this instanceof Gs?Iy:cd;return new s(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Hy(i,e,t){const n=e.attributes,s=new jn;if(n.POSITION!==void 0){const a=t.json.accessors[n.POSITION],l=a.min,c=a.max;if(l!==void 0&&c!==void 0){if(s.set(new I(l[0],l[1],l[2]),new I(c[0],c[1],c[2])),a.normalized){const u=lc(Ns[a.componentType]);s.min.multiplyScalar(u),s.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const r=e.targets;if(r!==void 0){const a=new I,l=new I;for(let c=0,u=r.length;c<u;c++){const h=r[c];if(h.POSITION!==void 0){const f=t.json.accessors[h.POSITION],d=f.min,_=f.max;if(d!==void 0&&_!==void 0){if(l.setX(Math.max(Math.abs(d[0]),Math.abs(_[0]))),l.setY(Math.max(Math.abs(d[1]),Math.abs(_[1]))),l.setZ(Math.max(Math.abs(d[2]),Math.abs(_[2]))),f.normalized){const x=lc(Ns[f.componentType]);l.multiplyScalar(x)}a.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(a)}i.boundingBox=s;const o=new Zn;s.getCenter(o.center),o.radius=s.min.distanceTo(s.max)/2,i.boundingSphere=o}function Dh(i,e,t){const n=e.attributes,s=[];function r(o,a){return t.getDependency("accessor",o).then(function(l){i.setAttribute(a,l)})}for(const o in n){const a=ac[o]||o.toLowerCase();a in i.attributes||s.push(r(n[o],a))}if(e.indices!==void 0&&!i.index){const o=t.getDependency("accessor",e.indices).then(function(a){i.setIndex(a)});s.push(o)}return et.workingColorSpace!==Yt&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${et.workingColorSpace}" not supported.`),zn(i,e),Hy(i,e,t),Promise.all(s).then(function(){return e.targets!==void 0?Uy(i,e.targets,t):i})}const Ft="endless-run",er={1:"Easy",2:"Normal",3:"Hard"},Vy=new Set(["hub","normal","checkpoint","moving","vertical","orbit","bounce","ice","conveyor","spinner","crumble","finish"]);function Gy(i){let e=i>>>0;return()=>{e+=1831565813;let t=Math.imul(e^e>>>15,1|e);return t^=t+Math.imul(t^t>>>7,61|t),((t^t>>>14)>>>0)/4294967296}}function rs(i){const e=Math.round(Number(i));return Number.isFinite(e)?Math.min(3,Math.max(1,e)):2}const Wy={1:{pads:14,hub:18,size:[3.7,4.2],edgeGap:[2.6,3.6],stepY:[.35,.65],xSpread:1.1,moveAmp:[.9,1.15],vertAmp:[1,1.2],orbitAmp:1,bounce:[14.5,15.5],conveyor:[3.2,4.2],pool:["normal","normal","normal","vertical","moving","bounce","ice","conveyor","orbit"]},2:{pads:18,hub:15,size:[3.3,3.7],edgeGap:[3,4.2],stepY:[.4,.85],xSpread:1.4,moveAmp:[1.05,1.35],vertAmp:[1.15,1.4],orbitAmp:1.1,bounce:[15.2,16.2],conveyor:[3.6,4.8],pool:["normal","vertical","moving","orbit","bounce","ice","conveyor","crumble","spinner"]},3:{pads:22,hub:13,size:[3.05,3.35],edgeGap:[3.4,4.8],stepY:[.5,1.05],xSpread:1.55,moveAmp:[1.15,1.45],vertAmp:[1.25,1.45],orbitAmp:1.1,bounce:[15.8,16.8],conveyor:[4,5.2],pool:["crumble","moving","orbit","ice","conveyor","spinner","bounce","vertical","normal","crumble"]}};function gn(i,e,t){return e+(t-e)*i()}function Xy(i,e){return e[Math.min(e.length-1,Math.floor(i()*e.length))]}function Yy(i){return(i.type==="orbit"||i.type==="moving")&&i.amplitude||0}function qy(i,e,t,n){const s={...i,type:e};if(e==="moving")s.amplitude=gn(n,...t.moveAmp),s.speed=gn(n,.95,1.45);else if(e==="vertical")s.amplitude=gn(n,...t.vertAmp),s.speed=gn(n,1.05,1.5);else if(e==="orbit")s.amplitude=t.orbitAmp,s.speed=gn(n,.75,1.25);else if(e==="bounce")s.bounce=gn(n,...t.bounce);else if(e==="conveyor"){const r=gn(n,...t.conveyor);s.pushX=(n()-.5)*r*.7,s.pushZ=-r}return s}function Ky({seed:i=1,difficulty:e=2}={}){const t=rs(e),n=Wy[t],s=Gy(i>>>0||1),r=[],o=n.hub;r.push({x:0,y:0,z:1,w:o,d:o,type:"hub"});let a=0,l=.85,c=1-o/2;const u=t===1||t===2?5:6;let h=0;const f=n.pads;for(let m=0;m<f;m++){const p=r[r.length-1];let b=gn(s,...n.size);const M=(m+1)%u===0&&h<3&&m<f-2;let v=M?"checkpoint":Xy(s,n.pool);Vy.has(v)||(v="normal"),(p.type==="orbit"||p.type==="moving")&&(v==="orbit"||v==="moving")&&(v="normal"),M&&(b=Math.max(b,4.2),v="checkpoint");const w=Yy(p),C=Math.max(2.4,5.6-w-n.xSpread*.55),R=Math.min(gn(s,...n.edgeGap),C),A=c-R-b/2-w*.35;l=Math.min(l+gn(s,...n.stepY),p.y+1.55),a=Math.min(2,Math.max(-2,a+gn(s,-n.xSpread,n.xSpread)));let g={x:Math.round(a*100)/100,y:Math.round(l*100)/100,z:Math.round(A*100)/100,w:Math.round(b*100)/100,d:Math.round(b*100)/100,type:v};M?(h+=1,g.type="checkpoint",g.checkpoint=h,g.w=Math.max(g.w,4.2),g.d=Math.max(g.d,4.2)):(g=qy(g,v,n,s),(m%2===0||s()>.35)&&(g.gem=!0)),r.push(g),c=g.z-g.d/2}const d=t===3?8:9,_=Math.min(gn(s,3.2,4.4),5),x=c-_-d/2;return l=Math.min(l+.45,r[r.length-1].y+1.2),r.push({x:0,y:Math.round(l*100)/100,z:Math.round(x*100)/100,w:d,d,type:"finish"}),r}function $y(i,e=2){const t=rs(e),n=i>>>0||1,s=Ky({seed:n,difficulty:t});return{id:Ft,name:"Endless Run",difficulty:t,order:4,procedural:!0,seed:n,blurb:`${er[t]} random course · seed ${n}`,platforms:s}}const ud=[{x:0,y:0,z:1,w:19,d:19,type:"hub"},{x:0,y:.9,z:-12,w:4,d:4,type:"normal",gem:!0},{x:2.2,y:1.5,z:-19,w:3.6,d:3.6,type:"vertical",amplitude:1.1,speed:1.05,gem:!0},{x:-1.2,y:2,z:-26,w:3.5,d:3.5,type:"normal",gem:!0},{x:0,y:2.5,z:-33,w:5,d:5,type:"checkpoint",checkpoint:1},{x:1,y:3,z:-40,w:4.1,d:3.6,type:"moving",amplitude:1.3,speed:.95,gem:!0},{x:0,y:3.5,z:-48.2,w:3.6,d:3.6,type:"orbit",amplitude:1.15,speed:.75,gem:!0},{x:-1.4,y:4,z:-55.2,w:4.2,d:4,type:"bounce",bounce:15.5,gem:!0},{x:0,y:4.5,z:-63,w:5,d:4.6,type:"spinner",gem:!0},{x:0,y:5,z:-71,w:5.5,d:5.3,type:"checkpoint",checkpoint:2},{x:0,y:5.5,z:-79,w:4,d:4,type:"vertical",amplitude:1.3,speed:1.15,gem:!0},{x:2,y:6,z:-87,w:3.8,d:3.8,type:"ice",gem:!0},{x:0,y:6.5,z:-95,w:4.2,d:4,type:"moving",amplitude:2,speed:1.15,gem:!0},{x:-1.5,y:7,z:-103,w:4,d:4,type:"crumble",gem:!0},{x:1.2,y:7.4,z:-111,w:4.2,d:3.8,type:"conveyor",pushX:0,pushZ:-4.8,gem:!0},{x:0,y:7.9,z:-119,w:4,d:4,type:"normal",gem:!0},{x:0,y:8.4,z:-127,w:5.7,d:5.4,type:"checkpoint",checkpoint:3},{x:-1.5,y:8.9,z:-135.5,w:3.6,d:3.6,type:"orbit",amplitude:1.15,speed:.9,gem:!0},{x:1.6,y:9.3,z:-142.5,w:4,d:4,type:"bounce",bounce:14.8,gem:!0},{x:0,y:9.7,z:-150,w:4.2,d:4,type:"conveyor",pushX:2.6,pushZ:-3.4},{x:0,y:10.1,z:-158,w:4.2,d:4,type:"ice"},{x:0,y:10.4,z:-166,w:9.5,d:9.5,type:"finish"}],jy=[{x:0,y:0,z:1,w:16,d:16,type:"hub"},{x:0,y:1,z:-11,w:3.4,d:3.4,type:"normal",gem:!0},{x:1.8,y:1.7,z:-17,w:3.3,d:3.3,type:"moving",amplitude:1.8,speed:1.25,gem:!0},{x:-1.5,y:2.4,z:-23,w:3.3,d:3.3,type:"vertical",amplitude:1.35,speed:1.35,gem:!0},{x:0,y:3.1,z:-29,w:4.6,d:4.6,type:"checkpoint",checkpoint:1},{x:1.2,y:3.8,z:-37,w:3.3,d:3.3,type:"orbit",amplitude:1.15,speed:1.05,gem:!0},{x:-1.4,y:4.5,z:-44,w:3.4,d:3.4,type:"ice",gem:!0},{x:.4,y:5.2,z:-50,w:3.5,d:3.3,type:"spinner",gem:!0},{x:0,y:5.9,z:-56,w:3.3,d:3.3,type:"crumble",gem:!0},{x:1.6,y:6.5,z:-62,w:3.4,d:3.2,type:"conveyor",pushX:-3.2,pushZ:-4,gem:!0},{x:0,y:7.1,z:-68,w:4.8,d:4.8,type:"checkpoint",checkpoint:2},{x:-1.4,y:7.8,z:-74,w:3.2,d:3.2,type:"normal",gem:!0},{x:1.5,y:8.5,z:-80,w:3.3,d:3.3,type:"bounce",bounce:16.2,gem:!0},{x:0,y:9.2,z:-86,w:3.2,d:3.2,type:"vertical",amplitude:1.45,speed:1.4,gem:!0},{x:-1.2,y:9.9,z:-92,w:3.3,d:3.3,type:"moving",amplitude:1.4,speed:1.35,gem:!0},{x:1.2,y:10.5,z:-99.5,w:3.3,d:3.3,type:"orbit",amplitude:1.15,speed:1.15,gem:!0},{x:0,y:11.1,z:-106.5,w:4.6,d:4.6,type:"checkpoint",checkpoint:3},{x:0,y:11.7,z:-112.5,w:3.2,d:3.2,type:"ice",gem:!0},{x:1.4,y:12.3,z:-118.5,w:3.3,d:3.1,type:"conveyor",pushX:3.5,pushZ:-3.8},{x:-1,y:12.9,z:-124.5,w:3.2,d:3.2,type:"normal"},{x:0,y:13.4,z:-130.5,w:8.5,d:8.5,type:"finish"}],Zy=[{x:0,y:0,z:1,w:14,d:14,type:"hub"},{x:0,y:1.2,z:-10,w:3.1,d:3.1,type:"crumble",gem:!0},{x:1.6,y:2,z:-16,w:3.1,d:3.1,type:"moving",amplitude:1.3,speed:1.45,gem:!0},{x:-1.2,y:2.8,z:-23.2,w:3.1,d:3.1,type:"orbit",amplitude:1.15,speed:1.25,gem:!0},{x:0,y:3.6,z:-30.2,w:3.1,d:3.1,type:"normal",gem:!0},{x:0,y:4.3,z:-36.2,w:4.4,d:4.4,type:"checkpoint",checkpoint:1},{x:1.4,y:5.1,z:-42.2,w:3.1,d:3.1,type:"vertical",amplitude:1.55,speed:1.55,gem:!0},{x:-1.5,y:5.9,z:-48.2,w:3.1,d:3.1,type:"ice",gem:!0},{x:.3,y:6.7,z:-54.2,w:3.2,d:3,type:"spinner",gem:!0},{x:1.5,y:7.4,z:-60.2,w:3.1,d:3.1,type:"conveyor",pushX:0,pushZ:-5.6,gem:!0},{x:-1.3,y:8.1,z:-66.2,w:3.1,d:3.1,type:"bounce",bounce:16.8,gem:!0},{x:0,y:8.8,z:-72.2,w:3.1,d:3.1,type:"crumble",gem:!0},{x:1.2,y:9.5,z:-79.2,w:3.1,d:3.1,type:"orbit",amplitude:1.15,speed:1.35,gem:!0},{x:0,y:10.2,z:-86.2,w:4.2,d:4.2,type:"checkpoint",checkpoint:2},{x:-1.4,y:11,z:-92.2,w:3.1,d:3.1,type:"normal",gem:!0},{x:1.5,y:11.7,z:-98.2,w:3.1,d:3.1,type:"moving",amplitude:1.4,speed:1.5,gem:!0},{x:0,y:12.4,z:-104.2,w:3.1,d:3.1,type:"vertical",amplitude:1.55,speed:1.55,gem:!0},{x:-1.2,y:13.1,z:-110.2,w:3.1,d:3.1,type:"ice"},{x:1.2,y:13.8,z:-116.2,w:3.1,d:3,type:"conveyor",pushX:-3.8,pushZ:-4.2},{x:0,y:14.4,z:-122.2,w:3.1,d:3.1,type:"spinner"},{x:0,y:15,z:-128.2,w:3.1,d:3.1,type:"normal"},{x:0,y:15.5,z:-134.2,w:8,d:8,type:"finish"}],Ni=[{id:"crystal-run",name:"Crystal Run",difficulty:1,order:1,blurb:"Learn the pads. Wide landings, three checkpoints, friendly movers.",platforms:ud},{id:"storm-ascent",name:"Storm Ascent",difficulty:2,order:2,blurb:"Faster movers, icy ledges, and less room to miss.",platforms:jy},{id:"void-gauntlet",name:"Void Gauntlet",difficulty:3,order:3,blurb:"Narrow gauntlet of crumble pads and spinning hazards.",platforms:Zy},{id:Ft,name:"Endless Run",difficulty:2,order:4,procedural:!0,blurb:"Offline random courses. Set Easy / Normal / Hard, then climb.",platforms:[]}],cl=Ni.filter(i=>!i.procedural),Jy=ud;function Qy(i,{seed:e,difficulty:t}={}){return i===Ft?$y(e!=null?e:Date.now(),rs(t!=null?t:2)):Ni.find(n=>n.id===i)||Ni[0]}function eM(i){if(i===Ft)return null;const e=cl.find(t=>t.id===i)||cl[0];return cl.find(t=>t.order===e.order+1)||null}function tM(i=Ni[0]){return i.platforms.filter(e=>e.checkpoint).length}function nM(i=Ni[0]){return i.platforms.filter(e=>e.gem).length}const Nh=["#758c70","#857f65","#76958a","#8a806e","#697f77","#947c65"],We=(i,e={})=>new Kn({color:i,roughness:.96,metalness:0,flatShading:!1,...e}),iM=We("#4d6b46"),ul=We("#4b5150"),hl=We("#92624a"),Uh=[We("#54cc92"),We("#74dd9d"),We("#3fbba1")],sM=new un({color:"#fffaf1",transparent:!0,opacity:.8});We("#fff4e3");const rM=We("#ffe27d",{emissive:"#966016",emissiveIntensity:.35});function rt(i,e,t,n,s=!1){const r=new Rt(i,e);return r.position.set(...n),r.castShadow=s,r.receiveShadow=!0,t.add(r),r}function en(i,e,t,n,s,r,o=!0){return rt(new Fi(i,e,t),n,s,r,o)}function As(i,e,t,n,s=12,r=8){return rt(new js(i,s,r),e,t,n,!0)}function Si(i,e,t,n,s,r,o=8){return rt(new ui(i,e,t,o),n,s,r,!0)}function Fh(i,e,t,n=1){const s=v=>{const w=Math.sin(v*92.219+n*157.49)*43758.5453;return w-Math.floor(w)},o=[],a=[],l=[],c=(v,w,C)=>(o.push(v,w,C),a.push(v*.115,C*.115),o.length/3-1),u=c(0,0,0),h=[];for(let v=0;v<64;v++){const w=v/64*Math.PI*2,C=Math.cos(w),R=Math.sin(w),A=Math.min((i*.5+.45)/Math.max(Math.abs(C),1e-4),(e*.5+.45)/Math.max(Math.abs(R),1e-4)),g=1.04+s(v)*.13;h.push([C*A*g,R*A*g])}const f=h.map(([v,w])=>c(v,0,w));for(let v=0;v<64;v++)l.push(u,f[(v+1)%64],f[v]);const d=l.length,_=[[.93,-.27],[1.02,-t*.25],[.83,-t*.65],[.57,-t*.94],[.11,-t*1.22]];let x=f;_.forEach(([v,w],C)=>{const R=h.map(([A,g],y)=>{const S=.89+s(y*2.1+C*8.3)*.23;return c(A*v*S,w+(s(y*9.1+C)*.16-.08)*t,g*v*S)});for(let A=0;A<64;A++){const g=(A+1)%64;l.push(x[A],x[g],R[A],x[g],R[g],R[A])}x=R});const m=new Mt;m.setAttribute("position",new Xe(o,3)),m.setAttribute("uv",new Xe(a,2)),m.setIndex(l),m.clearGroups(),m.addGroup(0,d,0),m.addGroup(d,l.length-d,1),m.computeVertexNormals();const p=new Kn({name:"Cinematic | grass",color:"#658a54",roughness:1}),b=new Kn({name:"Cinematic | rock",color:"#777b72",roughness:1,side:Pt}),M=new Rt(m,[p,b]);return M.receiveShadow=!0,M.castShadow=!0,M}function Rs(i="#c5f2ff",e=.78){return new Un({color:i,roughness:.12,metalness:.05,clearcoat:1,clearcoatRoughness:.05,transparent:!0,opacity:e,flatShading:!0,emissive:"#8fd0ff",emissiveIntensity:.16})}function oM(){const i=document.createElement("canvas");i.width=128,i.height=256;const e=i.getContext("2d");e.fillStyle="#1f242b",e.fillRect(0,0,128,256);for(let n=0;n<256;n+=8)e.fillStyle=n%16===0?"#2a313a":"#242a32",e.fillRect(0,n,128,4);for(let n=8;n<256;n+=48)e.fillStyle="#ffd24a",e.beginPath(),e.moveTo(64,n),e.lineTo(112,n+22),e.lineTo(96,n+22),e.lineTo(64,n+38),e.lineTo(32,n+22),e.lineTo(16,n+22),e.closePath(),e.fill(),e.fillStyle="#ffe9a0",e.beginPath(),e.moveTo(64,n+6),e.lineTo(92,n+20),e.lineTo(64,n+30),e.lineTo(36,n+20),e.closePath(),e.fill();const t=new Zo(i);return t.wrapS=hn,t.wrapT=hn,t.colorSpace=xt,t.anisotropy=8,t.repeat.set(1,2.2),t}function aM(i,e=Jy){const t=e;i.background=new De("#b7e6f4"),i.fog=new Cc("#b7e6f4",75,275),i.add(new cg("#f6fdff","#6e70b2",2.3));const n=new ed("#fff8dd",2.4);n.position.set(-35,75,30),n.castShadow=!0,n.shadow.mapSize.set(matchMedia("(pointer: coarse)").matches?1024:2048,matchMedia("(pointer: coarse)").matches?1024:2048),n.shadow.camera.left=-75,n.shadow.camera.right=75,n.shadow.camera.top=90,n.shadow.camera.bottom=-90,n.shadow.camera.near=.5,n.shadow.camera.far=250,n.shadow.bias=-2e-4,i.add(n);const s=new mt;i.add(s),n.target=s;const r=rt(new Gn(800,800),new Kn({color:"#84c2ed",roughness:.5,metalness:0,transparent:!0,opacity:.8}),i,[0,-29,-65]);r.rotation.x=-Math.PI/2,r.receiveShadow=!1;const o=[];for(let g=0;g<50;g++){const y=15-g*4.2,S=(g%2?1:-1)*(22+g*17%30),N=new Vt;N.position.set(S,12+g*13%14,y),i.add(N),o.push(N);for(let D=0;D<3;D++)As(2.4+(g+D)%3*.7,sM,N,[(D-1)*2.3,D%2*.55,0],9,7).castShadow=!1}function a(g,y,S=0,N=1){const D=new Vt;D.position.set(g,S,y),D.scale.setScalar(N),i.add(D),_.push(D),Si(.22,.3,2,hl,D,[0,1,0]),As(1.4,Uh[Math.abs(Math.floor(g*10))%3],D,[0,2.65,0]),As(.8,Uh[1],D,[.67,3,.15])}const l=[],c=[],u=[],h=[],f=[],d=[],_=[],x=[],m=new Set(["ice","conveyor","orbit","bounce"]);t.forEach((g,y)=>{const S=new Vt;i.add(S),S.position.set(g.x,g.y,g.z);const N=g.type==="hub",D=N?1.7:.85,U={hub:"#8bdc9a",checkpoint:"#6cead4",finish:"#ffd97e",vertical:"#8ecbff",orbit:"#c9a0ff",bounce:"#ff8f6b",ice:"#b9ecff",conveyor:"#6b6256",crumble:"#b3a4fa"}[g.type]||Nh[y%Nh.length],O=g.type==="ice"?Rs("#b9ecff",.82):We(U),W=en(g.w,D,g.d,O,S,[0,-D/2,0]);W.receiveShadow=!0;const H=en(g.w+.2,.12,g.d+.2,g.type==="ice"?Rs("#eaf9ff",.9):We(N?"#b8f2b4":"#fff1d2"),S,[0,-.08,0]);let Z;if(N){Z=rt(new Ti(8.5,8,6),ul,S,[0,-5.5,0],!0),Z.rotation.z=Math.PI;const z=rt(new tn(6.6,.12,8,40),We("#fbdb83"),S,[0,.1,0]);z.rotation.x=Math.PI/2}else g.type==="ice"?(Z=rt(new Ti(Math.min(g.w,g.d)*.52,3.2,5),Rs("#7ec7e8",.7),S,[0,-2.35,0],!0),Z.rotation.z=Math.PI):(Z=rt(new Ti(Math.min(g.w,g.d)*.52,3.2,5),ul,S,[0,-2.35,0],!0),Z.rotation.z=Math.PI);d.push([W,H,Z]);const ae={};if(g.type==="checkpoint"){rt(new ui(1.18,1.18,.12,24),We("#f9ffb8",{emissive:"#65ebbd",emissiveIntensity:.3}),S,[0,.09,0]),en(.15,3,.15,We("#f8fbff"),S,[-g.w*.33,1.55,0]);const z=rt(new Gn(1.1,.76),We("#fff3aa",{side:Pt}),S,[-g.w*.33+.57,2.56,0]);z.rotation.y=0,h.push({flag:z,data:g});const Q=rt(new tn(1.18,.09,8,32),We("#fff5b2",{emissive:"#e1be42",emissiveIntensity:.3}),S,[0,.27,0]);Q.rotation.x=Math.PI/2}if(g.type==="spinner"){const z=new Vt;z.position.set(0,.65,0),S.add(z),Si(.37,.37,1.5,We("#7555b5"),S,[0,.74,0]),en(g.w*.78,.25,.33,We("#f75d91",{emissive:"#ad2c58",emissiveIntensity:.2}),z,[0,.05,0]);for(const Q of[-1,1])As(.27,We("#fff4e7"),z,[Q*g.w*.39,.05,0]);u.push({pivot:z,base:S,reach:g.w*.39})}if(g.type==="crumble")for(let z=-1;z<=1;z++)en(.065,.01,g.d*.7,We("#856dc6"),S,[z*.6,.015,0],!1);if(g.type==="vertical"){Si(.08,.08,g.amplitude*2+1.2,We("#dff2ff",{emissive:"#6eb7ff",emissiveIntensity:.25}),S,[0,0,0],6);for(const z of[-g.amplitude,g.amplitude])As(.18,We("#fff"),S,[0,z,0],8,6)}if(g.type==="orbit"){const z=g.amplitude,Q=We("#d9b8ff",{emissive:"#9b6dff",emissiveIntensity:.45}),re=rt(new tn(z,.22,10,64),Q,i,[g.x,g.y+.04,g.z],!1);re.rotation.x=Math.PI/2;const de=rt(new tn(z+.35,.08,8,64),We("#f0e3ff",{emissive:"#c9a0ff",emissiveIntensity:.25}),i,[g.x,g.y+.04,g.z],!1);de.rotation.x=Math.PI/2,Si(.45,.55,.55,We("#b388ff",{emissive:"#7a4dff",emissiveIntensity:.35}),i,[g.x,g.y+.2,g.z],10);const Re=en(z,.22,.32,We("#e4c7ff",{emissive:"#a87cff",emissiveIntensity:.3}),i,[g.x+z/2,g.y+.18,g.z],!0);ae.orbitArm=Re}if(g.type==="bounce"){W.visible=!1,H.visible=!1;const z=Math.min(g.w,g.d)*.46,Q=rt(new tn(z,.14,10,36),We("#4b5568",{metalness:.35,roughness:.4}),S,[0,.1,0],!0);Q.rotation.x=Math.PI/2;const re=rt(new ui(z*.9,z*.9,.1,32),We("#ff4f78",{emissive:"#ff2a55",emissiveIntensity:.38}),S,[0,.16,0],!1);re.receiveShadow=!0,rt(new ui(z*.34,z*.34,.11,24),We("#fff4d6",{emissive:"#ffd27a",emissiveIntensity:.28}),S,[0,.2,0],!1),rt(new ui(z*.14,z*.14,.12,16),We("#ff7a3c",{emissive:"#ff5a1a",emissiveIntensity:.35}),S,[0,.22,0],!1);for(let de=0;de<10;de++){const Re=de/10*Math.PI*2;Si(.045,.045,.32,We("#c5ced8",{metalness:.4,roughness:.35}),S,[Math.cos(Re)*z,.02,Math.sin(Re)*z],6)}for(const[de,Re]of[[-1,-1],[1,-1],[-1,1],[1,1]])en(.12,.5,.12,We("#3a4452"),S,[de*z*.72,-.12,Re*z*.72],!1),en(.22,.08,.22,We("#2c3440"),S,[de*z*.72,-.34,Re*z*.72],!1)}if(g.type==="ice"){const z=rt(new Fi(g.w*.92,.08,g.d*.92),Rs("#eefcff",.92),S,[0,.06,0],!1);z.receiveShadow=!0;for(const[Q,re,de]of[[-.9,.7,.55],[.85,-.55,.42],[-.2,.15,.7],[.55,.75,.38],[-.75,-.7,.48]])rt(new Qo(.35*de,0),Rs("#d7f5ff",.88),S,[Q*g.w*.28,.28,re*g.d*.28],!0).rotation.set(Q*.4,.6,re*.35);for(const[Q,re]of[[-1,-1],[1,-1],[-1,1],[1,1]])en(.12,.55,.12,Rs("#9fdfff",.75),S,[Q*g.w*.42,.2,re*g.d*.42],!1)}if(g.type==="conveyor"){const z=g.pushX||0,Q=g.pushZ||-1,re=new I(z,0,Q);re.lengthSq()<1e-6&&re.set(0,0,-1),re.normalize();const de=Math.atan2(re.x,re.z);W.visible=!1,H.visible=!1;const Re=oM(),q=g.w*.9,ee=g.d*.9,me=rt(new Gn(q,ee),new Kn({map:Re,roughness:.7,metalness:.08}),S,[0,.08,0],!1);me.rotation.x=-Math.PI/2,me.rotation.z=-de+Math.PI,en(g.w+.2,.28,g.d+.2,We("#2a3038"),S,[0,-.08,0],!1);const Me=new I(-re.z,0,re.x),ye=Math.max(g.w,g.d)*.95,Ze=Math.min(g.w,g.d)*.42;for(const j of[-1,1]){const J=en(.14,.22,ye,We("#6b7380",{metalness:.25,roughness:.45}),S,[Me.x*Ze*j,.18,Me.z*Ze*j],!1);J.rotation.y=de}for(const j of[-1,1]){const J=Si(.11,.11,Math.min(g.w,g.d)*.78,We("#9aa3b0",{metalness:.35,roughness:.35}),S,[re.x*ye*.42*j,.1,re.z*ye*.42*j],10);J.rotation.y=de,J.rotation.z=Math.PI/2}const at=We("#ffe14a",{emissive:"#ffbf1a",emissiveIntensity:.65}),F=new Vt;S.add(F),F.position.set(0,.42,0),F.quaternion.setFromUnitVectors(new I(0,0,-1),re);const se=Math.min(g.w,g.d)*.55;en(.38,.1,se,at,F,[0,0,-se*.05],!1);const te=rt(new Ti(.48,.85,4),at,F,[0,0,-se*.55],!1);te.rotation.x=-Math.PI/2;for(const j of[-.28,0,.28])rt(new Ti(.32,.5,3),We("#fff1a8",{emissive:"#ffd24a",emissiveIntensity:.4}),S,[re.x*j*Math.min(g.w,g.d),.2,re.z*j*Math.min(g.w,g.d)],!1).quaternion.setFromUnitVectors(new I(0,1,0),re);ae.beltTexture=Re,ae.beltSpeed=Math.hypot(z,Q)*.12}if(g.type==="finish"){for(const de of[-2.6,2.6])Si(.3,.38,5,We("#fff7e6"),S,[de,2.5,0]);const z=rt(new tn(2.6,.4,10,45,Math.PI),We("#f77fa3",{emissive:"#f55c95",emissiveIntensity:.25}),S,[0,5,0]);z.rotation.z=0;const Q=rt(new ca(2.2,32),new un({color:"#b89fff",transparent:!0,opacity:.45,side:Pt,depthWrite:!1}),S,[0,2.7,0]),re=rt(new tn(2.35,.15,8,48),We("#f9df77",{emissive:"#f6ce73",emissiveIntensity:.4}),S,[0,2.7,.03]);f.push({portal:Q,ring:re})}if(l.push({...g,index:y,group:S,baseX:g.x,baseY:g.y,baseZ:g.z,topY:g.y,previousX:g.x,previousY:g.y,previousZ:g.z,dx:0,dy:0,dz:0,crumbleClock:0,disabledUntil:0,...ae}),g.gem){const z=new Vt;z.position.set(g.x,g.y+1.65,g.z),i.add(z);const Q=rt(new Qo(.5,0),rM,z,[0,0,0]),re=rt(new tn(.7,.065,8,24),We("#fff5b5",{emissive:"#ffcc4c",emissiveIntensity:.4}),z,[0,0,0],!1);re.rotation.x=Math.PI/2,c.push({id:y,group:z,crystal:Q,halo:re,baseY:g.y+1.65,taken:!1})}}),a(-7,-3,0,1.15),a(7,-2,0,1.25),a(-7,6,0,.93),a(6.6,6.4,0,.95);for(const[g,y]of[[-4,7],[-6,2],[5,4],[4,-3]]){const S=As(.52,We("#f6b9a5"),i,[g,.45,y]);S.scale.y=.6,_.push(S)}const p=document.createElement("canvas");p.width=512,p.height=160;const b=p.getContext("2d");b.fillStyle="#422979",b.fillRect(0,0,512,160),b.fillStyle="#ffdb79",b.font="bold 52px sans-serif",b.textAlign="center",b.fillText("CRYSTAL RUN",256,72),b.fillStyle="#fff",b.font="bold 28px sans-serif",b.fillText("FOLLOW THE ISLANDS  →",256,120);const M=new Zo(p);M.colorSpace=xt;const v=rt(new Gn(5.1,1.6),new un({map:M,side:Pt}),i,[-2,2,-4.7]);v.rotation.y=0,en(.15,2.4,.15,hl,i,[-4,1.1,-4.7]),en(.15,2.4,.15,hl,i,[0,1.1,-4.7]);const w=rt(new tn(1.15,.08,8,36),We("#f8e67a",{emissive:"#f2ce60",emissiveIntensity:.35}),i,[0,.06,5]);w.rotation.x=Math.PI/2;for(let g=0;g<12;g++){const y=(g%2===0?-1:1)*(32+g%4*13),S=5-g*14,N=rt(new Ti(6+g%3,10,6),ul,i,[y,-11,S]);N.rotation.z=Math.PI,x.push(N),x.push(Si(6+g%3,6+g%3,1,iM,i,[y,-5.6,S],7)),a(y,S,-5.1,1.3)}const C=(async()=>{if(typeof window=="undefined")return!1;const g=new ad,y="./assets/scenery/",S=["island_terrain","oak_tree","pine_tree","boulder","fern_cluster","grass_cluster","fallen_log"];try{let N=function(z,Q,re,de=1,Re=0){const q=P[z].clone(!0);if(q.userData.skyboundSceneryAsset=z,q.position.set(...re),Array.isArray(de)?q.scale.set(...de):q.scale.setScalar(de),q.rotation.y=Re,z==="island_terrain"&&Array.isArray(de)){const ee=Math.max(1,de[0]/7),me=Math.max(1,de[2]/7);q.traverse(Me=>{if(Me.isMesh){Me.material=Me.material.clone();for(const ye of["map","normalMap"])Me.material[ye]&&(Me.material[ye]=Me.material[ye].clone(),Me.material[ye].wrapS=hn,Me.material[ye].wrapT=hn,Me.material[ye].repeat.set(ee,me),Me.material[ye].needsUpdate=!0)}})}if(z==="oak_tree"||z==="pine_tree"){const ee=[];q.traverse(me=>{const Me=Array.isArray(me.material)?me.material:[me.material];me.isMesh&&Me.some(ye=>ye==null?void 0:ye.name.startsWith("Foliage"))&&ee.push(me)});for(const me of ee){const Me=me.clone();Me.rotation.y+=.48,Me.scale.set(1.035,.99,1.035),me.parent.add(Me)}}return Q.add(q),q};const D=await Promise.all(S.map(async z=>{const Q=await g.loadAsync(y+z+".glb");return Q.scene.traverse(re=>{if(re.isMesh){re.castShadow=["oak_tree","pine_tree","boulder","fallen_log"].includes(z),re.receiveShadow=!0;for(const de of Array.isArray(re.material)?re.material:[re.material])if(de){for(const Re of[de.map,de.normalMap])Re&&(Re.anisotropy=8,Re.minFilter=Ln,Re.magFilter=Lt);de.name.startsWith("Foliage")&&(de.alphaTest=Math.max(.42,de.alphaTest),de.alphaToCoverage=!0,de.transparent=!1,de.depthWrite=!0,de.side=Pt,de.color.set("#d8dfd0")),de.normalMap&&de.normalScale.set(1.25,1.25),de.needsUpdate=!0}}}),[z,Q.scene]})),P=Object.fromEntries(D);for(const[z,Q]of l.entries()){if(m.has(Q.type))continue;const re=Fh(Q.w,Q.d,Q.type==="hub"?10:3.5,11+z*3);re.position.y=.015,Q.group.add(re);for(const de of d[z])de.visible=!1;z>0&&Q.type!=="spinner"&&Q.type!=="crumble"&&Q.w>4.5&&(N("grass_cluster",Q.group,[Q.w*.35,0,Q.d*.34],.31,z),N("boulder",Q.group,[-Q.w*.34,-.05,Q.d*.32],.28,z*.7))}const U=[["oak_tree",-7,-3,1.25,.4],["oak_tree",7.1,-2,1.05,2.1],["pine_tree",-7,6,1.24,1.3],["pine_tree",7.2,6.1,1.18,.9],["oak_tree",-5.9,3,.92,3.2],["pine_tree",5.9,3.9,.91,.2],["oak_tree",-8.3,-6.3,.72,1.4],["pine_tree",8.1,-5.8,.76,2.4],["pine_tree",-8.6,1.7,.66,.8],["oak_tree",8.2,1.4,.68,1.2]];for(const[z,Q,re,de,Re]of U)N(z,i,[Q,-.04,re],de,Re);for(const[z,Q,re]of[[-4.2,7,.38],[-7.5,1,.42],[5.9,6.9,.31],[7,-5,.43],[-7,-6.5,.33]])N("boulder",i,[z,-.03,Q],re,z*.3);for(let z=0;z<110;z++){const Q=z*2.399963*1.1,re=4.5+z*7%40/10,de=Math.cos(Q)*re,Re=1+Math.sin(Q)*re;Math.abs(de)<3.3&&Re<1.5||N(z%4===0?"fern_cluster":"grass_cluster",i,[de,-.05,Re],z%4===0?.57:.34,Q)}N("fallen_log",i,[-5.8,-.05,-5.4],.72,.9);for(const z of x)z.visible=!1;for(let z=0;z<12;z++){const Q=(z%2===0?-1:1)*(32+z%4*13),re=5-z*14,de=12+z%3*2,Re=Fh(de,de,11,47+z);Re.position.set(Q,-5.1,re),i.add(Re);for(let q=0;q<4;q++){const ee=q*Math.PI*2/4+z*.4,me=q===0?0:de*.25;N((z+q)%3===0?"oak_tree":"pine_tree",i,[Q+Math.cos(ee)*me,-5.13,re+Math.sin(ee)*me],.75+(z+q)%3*.16,ee)}}for(const z of _)z.visible=!1;for(const z of o)z.visible=!1;const O=document.createElement("canvas");O.width=128,O.height=128;const W=O.getContext("2d"),H=W.createRadialGradient(64,64,12,64,64,63);H.addColorStop(0,"rgba(255,255,251,0.8)"),H.addColorStop(.35,"rgba(255,255,251,0.58)"),H.addColorStop(.72,"rgba(255,255,251,0.18)"),H.addColorStop(1,"rgba(255,255,251,0)"),W.fillStyle=H,W.fillRect(0,0,128,128);const Z=new Zo(O),ae=new Pc({map:Z,transparent:!0,opacity:.45,depthWrite:!1,fog:!0});for(let z=0;z<34;z++){const Q=new Df(ae),re=z%2?1:-1;Q.position.set(re*(20+z*13%48),18+z*7%17,14-z*6);const de=18+z*11%19;Q.scale.set(de,de*.48,1),i.add(Q)}return!0}catch(N){return console.warn("Optional scenery could not be loaded; using original level visuals.",N),!1}})();function R(g,y){for(const S of l){if(S.previousX=S.group.position.x,S.previousY=S.group.position.y,S.previousZ=S.group.position.z,S.type==="moving"&&(S.group.position.x=S.baseX+Math.sin(g*S.speed+S.index)*S.amplitude),S.type==="vertical"&&(S.group.position.y=S.baseY+Math.sin(g*S.speed+S.index)*S.amplitude),S.type==="orbit"){const N=g*S.speed+S.index;S.group.position.x=S.baseX+Math.cos(N)*S.amplitude,S.group.position.z=S.baseZ+Math.sin(N)*S.amplitude,S.orbitArm&&(S.orbitArm.position.set(S.baseX+Math.cos(N)*S.amplitude*.5,S.baseY+.18,S.baseZ+Math.sin(N)*S.amplitude*.5),S.orbitArm.rotation.y=-N)}S.type==="conveyor"&&S.beltTexture&&(S.beltTexture.offset.y=(S.beltTexture.offset.y+y*(S.beltSpeed||.2))%1),S.topY=S.group.position.y,S.dx=S.group.position.x-S.previousX,S.dy=S.group.position.y-S.previousY,S.dz=S.group.position.z-S.previousZ,S.type==="crumble"&&(S.collapseAt&&g>=S.collapseAt+3.7&&(S.collapseAt=0),S.group.visible=!(S.collapseAt&&g>=S.collapseAt&&g<S.collapseAt+3.7))}for(const S of u)S.pivot.rotation.y+=y*1.9;for(const S of c){S.group.rotation.y+=y*1.5;const N=l[S.id];S.group.position.x=N.group.position.x,S.group.position.z=N.group.position.z,S.group.position.y=N.topY+1.65+Math.sin(g*3+S.id)*.18}for(const S of f)S.portal.rotation.z+=y*.35,S.ring.rotation.z-=y*.25;s.position.set(0,0,-55),n.position.set(-35,75,-10)}function A(g,y,S,N,D,P){let U=null,O=-1/0;for(const W of l){if(W.type==="crumble"&&!W.group.visible)continue;const H=W.group.position.x,Z=W.group.position.z;Math.abs(g-H)>W.w/2+.33||Math.abs(y-Z)>W.d/2+.33||W.topY<=N+.17&&W.topY>=S-.05&&W.topY>O&&D<=0&&(U=W,O=W.topY)}return U}return{platforms:l,collectibles:c,spinnerHazards:u,flags:h,sceneryReady:C,update:R,findPlatformUnder:A,sun:n,sea:r}}const st={skin:"#bd7751",skinHighlight:"#d38b61",skinShade:"#8e513c",freckles:"#92523c",blush:"#df8468",hair:"#392625",hairGlint:"#52352e",white:"#fff2dd",iris:"#7c462e",pupil:"#241c23",hat:"#79334e",hatLight:"#a65a70",hatSeam:"#542639",hoodie:"#c26075",hoodieDark:"#994759",thread:"#dfaa86",scarf:"#87994e",scarfDark:"#66753a",scarfLeaf:"#c9c983",shorts:"#50372f",cuffs:"#775344",leather:"#c99b65",leatherDark:"#986e49",buckles:"#e9c277",boots:"#674235",bootsDark:"#3c2927",soles:"#82864e",socks:"#f5e4c9",crystal:"#d784ff",crystalCore:"#f8bcff"},Yi=Math.PI,lM=new js(1,28,20),cM=new js(1,14,10);new Uc(1,1,6,12);function lt(i,e=.85,t=0,n={}){return new Kn({color:i,roughness:e,metalness:t,...n})}function Bn(i,e,t=0,n=0,s=0){const r=new Vt;return r.name=e,r.position.set(t,n,s),i.add(r),r}function Rn(i,e,t,n,s=0,r=0,o=0){const a=new Rt(t,n);return a.name=e,a.position.set(s,r,o),a.castShadow=!0,a.receiveShadow=!0,i.add(a),a}function Ye(i,e,t,n,s,r,o,a,l,c=!1){const u=Rn(i,e,c?cM:lM,t,n,s,r);return u.scale.set(o,a,l),u}function bi(i,e,t,n,s,r=18){const o=new kf(t.map(a=>new I(...a)));return Rn(i,e,new Hc(o,r,n,6,!1),s)}function Tr(i,e,t,n,s,r,o=10){const a=new I(...t),l=new I(...n),c=l.clone().sub(a),u=Rn(i,e,new ui(s,s,c.length(),o),r,...a.clone().add(l).multiplyScalar(.5).toArray());return u.quaternion.setFromUnitVectors(new I(0,1,0),c.normalize()),u}function uM(i,e,t){const n=-i/2,s=-e/2,r=new Yf;return r.moveTo(n+t,s),r.lineTo(n+i-t,s),r.quadraticCurveTo(n+i,s,n+i,s+t),r.lineTo(n+i,s+e-t),r.quadraticCurveTo(n+i,s+e,n+i-t,s+e),r.lineTo(n+t,s+e),r.quadraticCurveTo(n,s+e,n,s+e-t),r.lineTo(n,s+t),r.quadraticCurveTo(n,s,n+t,s),r}function fl(i,e,t,n,s,r,o,a,l,c){const u=new zc(uM(n,s,o),{depth:r,bevelEnabled:!0,bevelThickness:.008,bevelSize:.008,bevelSegments:2,steps:1,curveSegments:6});return u.computeVertexNormals(),Rn(i,e,u,t,a,l,c)}function qi(i,e,t,n,s,r=.08){const o=Ye(i,"Embroidered leaf",e,t,n,s,r*.52,r*.95,.008,!0);return o.rotation.z=-.44,o}function hM(i,e,t,n,s,r,o=.085){const a=Bn(i,"Glowing crystal",n,s,r),l=[0,o*1.35,0,-o,0,0,0,0,o*.7,o,0,0,0,0,-o*.7,0,-o*1.5,0],c=[0,2,1,0,3,2,0,4,3,0,1,4,5,1,2,5,2,3,5,3,4,5,4,1],u=new Mt;u.setAttribute("position",new Xe(l,3)),u.setIndex(c),u.computeVertexNormals();const h=Rn(a,"Faceted amethyst charm",u,e);return Ye(a,"Crystal central sparkle",t,-.017,.04,-.062,.014,.028,.008,!0),{g:a,crystal:h}}function fM(i,e,t){Ye(i,`Boot leather ${e}`,t.boots,0,-.655,-.115,.22,.195,.287),Ye(i,`Boot toe ${e}`,t.boots,0,-.707,-.265,.225,.12,.223),Ye(i,`Boot cuff ${e}`,t.bootsDark,0,-.515,-.002,.201,.083,.172);const s=Ye(i,`Boot chunky sole ${e}`,t.soles,0,-.802,-.15,.24,.055,.337);s.scale.z=.337;for(let r=0;r<3;r++){const o=-.58-r*.054,a=-.3-r*.018;Ye(i,"Gold boot eyelet",t.buckles,-.063,o,a,.014,.013,.013,!0),Ye(i,"Gold boot eyelet",t.buckles,.063,o,a,.014,.013,.013,!0),Tr(i,"Crossed boot lace",[-.06,o,a-.012],[.06,o-.042,a-.012],.009,t.thread,7),Tr(i,"Crossed boot lace",[.06,o,a-.014],[-.06,o-.042,a-.014],.009,t.thread,7)}}function dM(i,{shadow:e=!0}={}){const t={skin:lt(st.skin,.86),skinHighlight:lt(st.skinHighlight,.87),skinShade:lt(st.skinShade),freckles:lt(st.freckles),blush:lt(st.blush,.93,0,{transparent:!0,opacity:.5,depthWrite:!1}),hair:lt(st.hair,.94),hairGlint:lt(st.hairGlint,.94),white:lt(st.white,.36),iris:lt(st.iris,.34),pupil:lt(st.pupil,.22),hat:lt(st.hat,.93),hatLight:lt(st.hatLight,.87),hatSeam:lt(st.hatSeam,.93),hoodie:lt(st.hoodie,.9),hoodieDark:lt(st.hoodieDark,.9),thread:lt(st.thread,.91),scarf:lt(st.scarf,.96),scarfDark:lt(st.scarfDark,.95),scarfLeaf:lt(st.scarfLeaf,.96),shorts:lt(st.shorts,.9),cuffs:lt(st.cuffs,.93),leather:lt(st.leather,.84),leatherDark:lt(st.leatherDark,.89),buckles:lt(st.buckles,.4,.25),boots:lt(st.boots,.8),bootsDark:lt(st.bootsDark,.87),soles:lt(st.soles,.95),socks:lt(st.socks,.97),crystal:lt(st.crystal,.23,.05,{emissive:new De("#a83bce"),emissiveIntensity:1.2,side:Pt}),sparkle:new un({color:st.crystalCore,transparent:!0,opacity:.9,depthWrite:!1})},n=Bn(i,"ForestSproutPlayer"),s=Bn(n,"Character animation root"),r=[[0,-.375],[.31,-.38],[.41,-.32],[.418,-.2],[.385,.05],[.345,.255],[.29,.35],[.2,.4],[0,.43]].map(([P,U])=>new ie(P,U)),o=Rn(s,"Soft rose hoodie",new kc(r,40),t.hoodie,0,1.14,0);o.scale.z=.81,Ye(s,"Hoodie lower seam",t.hoodieDark,0,.82,0,.392,.039,.309),Ye(s,"Soft hood behind neck",t.hoodieDark,0,1.42,.23,.3,.19,.19),fl(s,"Hoodie pocket",t.hoodieDark,.38,.2,.013,.065,0,1.025,-.327),bi(s,"Pocket stitching",[[-.16,1.06,-.35],[-.1,.965,-.351],[.1,.965,-.351],[.16,1.06,-.35]],.006,t.thread,20),bi(s,"Sprout stem",[[0,1.2,-.339],[0,1.16,-.345],[0,1.127,-.346]],.01,t.thread,10),qi(s,t.scarfLeaf,-.05,1.18,-.353,.053);const a=qi(s,t.scarfLeaf,.05,1.18,-.353,.053);a.rotation.z=.48;for(const P of[-.098,.098])bi(s,"Hoodie cord",[[P,1.443,-.28],[P*1.1,1.35,-.333],[P*1.08,1.29,-.336]],.01,t.socks,10),Ye(s,"Cord tip",t.thread,P*1.08,1.287,-.34,.023,.018,.022,!0);const l=Bn(s,"Backpack pivots",0,1.16,.275);Ye(l,"Tan leather adventure backpack",t.leather,0,-.045,.225,.3,.355,.19),Ye(l,"Backpack bottom",t.leatherDark,0,-.33,.248,.264,.09,.17),fl(l,"Backpack flap",t.leather,.5,.245,.035,.1,0,.126,.405),Tr(l,"Backpack leather tab",[0,.13,.45],[0,-.035,.465],.025,t.leatherDark),Ye(l,"Brass backpack clasp",t.buckles,0,-.028,.474,.048,.034,.015,!0),qi(l,t.scarfDark,-.04,.179,.455,.055);const c=qi(l,t.scarfDark,.025,.179,.455,.048);c.rotation.z=.52;for(const P of[-1,1])bi(s,"Pack shoulder strap",[[P*.245,1.42,.1],[P*.29,1.44,-.14],[P*.298,1.23,-.295],[P*.308,1.05,-.26]],.036,t.leather,20);Ye(s,"Fabric collar",t.scarf,0,1.47,0,.27,.115,.25);const u=Rn(s,"Scarf wrap edge",new tn(.267,.06,10,40),t.scarfDark,0,1.495,0);u.rotation.x=Yi/2,u.scale.z=.95;const h=Bn(s,"Scarf swinging tail",.23,1.45,.04),f=Ye(h,"Long olive scarf end",t.scarf,.112,-.23,.185,.125,.285,.048);f.rotation.z=.19;for(let P=-2;P<=2;P++){const U=.122+P*.037;Tr(h,"Scarf fringe",[U,-.48,.18],[U+.018,-.56,.2],.012,t.scarfLeaf,6)}for(let P=0;P<3;P++){const U=qi(h,t.scarfLeaf,.073+P%2*.084,-.13-P*.105,.241,.046);U.rotation.z=P%2===0?-.6:.5}const d=[];for(const P of[-1,1]){const U=Bn(s,P<0?"LeftArm":"RightArm",P*.365,1.41,.015);Ye(U,"Puffy sleeve",t.hoodie,P*.065,-.225,0,.16,.305,.174),Ye(U,"Cuffed wrist",t.hoodieDark,P*.1,-.463,-.003,.137,.068,.14),Ye(U,"Rounded hand",t.skin,P*.102,-.583,-.006,.137,.15,.119),Ye(U,"Little thumb",t.skin,P*.207,-.535,-.052,.059,.073,.072,!0),d.push(U)}Ye(s,"Brown shorts waist",t.shorts,0,.795,0,.34,.155,.27);const _=[];for(const P of[-1,1]){const U=Bn(s,P<0?"LeftLeg":"RightLeg",P*.182,.85,0);Ye(U,"Shorts leg",t.shorts,0,-.124,0,.181,.178,.193),Ye(U,"Cuffed shorts",t.cuffs,0,-.243,0,.185,.06,.195),Ye(U,"Skin exposed calf",t.skin,0,-.337,-.004,.137,.159,.145),Ye(U,"Thick cream sock",t.socks,0,-.487,-.006,.152,.121,.152);for(let W=0;W<3;W++){const H=Rn(U,"Sock knit rib",new tn(.137,.007,5,20),t.thread,0,-.455-W*.045,0);H.rotation.x=Yi/2}const O=Bn(U,P<0?"LeftFoot":"RightFoot",0,0,0);fM(O,P,t),_.push({leg:U,foot:O})}const x=Bn(s,"Head rig",0,1.84,-.015);Ye(x,"Warm brown rounded head",t.skin,0,0,0,.454,.431,.406),Ye(x,"Soft cheek lower face",t.skin,0,-.185,-.067,.355,.222,.315);for(const P of[-1,1]){Ye(x,"Rounded ear",t.skin,P*.445,-.043,.017,.111,.139,.074),Ye(x,"Inner ear",t.skinHighlight,P*.477,-.045,-.033,.055,.069,.016,!0),Ye(x,"Rosy cheek blush",t.blush,P*.252,-.147,-.33,.109,.064,.019,!0),Ye(x,"Cream eye white",t.white,P*.166,.045,-.363,.124,.143,.079),Ye(x,"Warm iris",t.iris,P*.166,.038,-.434,.077,.105,.025),Ye(x,"Dark round pupil",t.pupil,P*.165,.035,-.46,.046,.072,.015),Ye(x,"Catchlight",t.white,P*.148,.087,-.473,.023,.03,.008,!0),Ye(x,"Secondary sparkle",t.white,P*.194,.015,-.468,.01,.013,.007,!0),bi(x,"Curious eyebrow",[[P*.1,.226,-.362],[P*.153,.25,-.367],[P*.224,.241,-.358]],.019,t.hair,10);for(let U=0;U<3;U++)Ye(x,"Freckle",t.freckles,P*(.235+U*.042),-.09-U%2*.03,-.36+U*.027,.011,.01,.008,!0)}Ye(x,"Little rounded nose",t.skinHighlight,0,-.085,-.397,.065,.066,.052),Ye(x,"Open happy smile",t.pupil,0,-.221,-.367,.147,.091,.022),Ye(x,"Little pink tongue",t.blush,0,-.274,-.385,.103,.034,.011),bi(x,"Smile upper contour",[[-.135,-.197,-.395],[0,-.208,-.394],[.135,-.197,-.395]],.009,t.skinShade,12),Ye(x,"Hair at back of head",t.hair,0,.079,.175,.447,.385,.309),[[-.42,.22,.035,.15],[-.47,.08,.012,.17],[-.46,-.13,.06,.14],[-.4,-.29,.103,.17],[.42,.19,.04,.15],[.48,.04,.018,.17],[.46,-.14,.07,.15],[.39,-.3,.107,.17],[-.29,-.36,.18,.15],[-.18,-.38,.24,.14],[.15,-.37,.24,.14],[.29,-.36,.18,.15],[-.31,.29,-.24,.14],[-.14,.282,-.35,.14],[.065,.29,-.375,.16],[.25,.285,-.3,.16]].forEach(([P,U,O,W],H)=>{const Z=Ye(x,"Hair curl "+String(H+1),H%4===0?t.hairGlint:t.hair,P,U,O,W,W*(H%3===0?.92:1.12),W*.78);Z.rotation.z=Math.sin(H*2.17)*.32});const p=Bn(x,"Knitted plum beanie");Rn(p,"Rounded knitted cap top",new js(.478,40,20,0,Yi*2,0,Yi*.55),t.hat,0,.318,.025).scale.set(1.02,.9,.98);const M=Rn(p,"Ribbed cap band",new tn(.467,.077,14,48),t.hatLight,0,.255,.017);M.rotation.x=Yi/2,M.scale.z=.98;for(let P=0;P<15;P++){const U=P*Yi*2/15,O=Math.sin(U),W=Math.cos(U);bi(p,"Knit seam",[[.43*O,.35,.025+.43*W],[.3*O,.51,.025+.3*W],[.13*O,.66,.025+.13*W],[.018*O,.73,.025+.018*W]],.007,t.hatSeam,12)}fl(p,"Cream sprout patch",t.socks,.175,.115,.017,.032,.214,.335,-.414),bi(p,"Patch green stem",[[.214,.319,-.428],[.214,.354,-.431],[.214,.374,-.429]],.008,t.scarfDark,8);const v=qi(p,t.scarfDark,.179,.355,-.436,.041);v.rotation.z=-.72;const w=qi(p,t.scarfDark,.25,.355,-.436,.041);w.rotation.z=.72,Ye(s,"Golden crystal hanger",t.buckles,.255,1.304,-.363,.043,.043,.017,!0),Tr(s,"Crystal chain",[.255,1.299,-.383],[.278,1.236,-.388],.012,t.buckles,8);const C=hM(s,t.crystal,t.sparkle,.28,1.155,-.392,.083),R=new Qf("#d779ff",.34,1.6,2);R.position.set(.28,1.17,-.44),s.add(R);const A=e?Rn(i,"Character contact shadow",new ca(.56,32),new un({color:"#272c27",transparent:!0,opacity:.17,depthWrite:!1})):null;A&&(A.castShadow=!1,A.receiveShadow=!1,A.rotation.x=-Yi/2);const g={left:d[0],right:d[1]};let y="happy";function S(P){y=P}function N(P=0,U=0,O=!0,W=0){const H=Xr.clamp(U/8.7,0,1),Z=H>.04,ae=P*(3.4+H*8.7),z=Math.sin(ae)*(.16+.62*H),Q=Z?Math.abs(Math.sin(ae))*.042*H:Math.sin(P*2)*.012;if(s.position.y=Q,s.rotation.z=Z?Math.sin(ae)*.018:Math.sin(P*1.7)*.012,x.rotation.z=Math.sin(P*1.8)*.024+(Z?Math.sin(ae)*.021:0),x.rotation.x=O?Math.sin(P*1.3)*.015:-.09,_[0].leg.rotation.x=O?z:-.28,_[1].leg.rotation.x=O?-z:-.28,_[0].foot.rotation.x=O?Math.max(0,-z)*.28:-.12,_[1].foot.rotation.x=O?Math.max(0,z)*.28:-.12,d[0].rotation.x=O?-z*.83:-.65,d[1].rotation.x=O?z*.83:-.65,d[0].rotation.z=.14,d[1].rotation.z=-.14,l.rotation.x=Math.sin(ae)*.024*H,h.rotation.z=Math.sin(P*4.4)*.14-H*.16,h.rotation.x=Math.sin(P*3.8)*.055+H*.14,p.rotation.z=Math.sin(P*3.1)*.012,C.g.rotation.z=Math.sin(P*3.4)*.11,R.intensity=.27+(.09*Math.sin(P*5)+.09),y==="celebrate"&&(d[0].rotation.z=-1.8,d[1].rotation.z=1.8,d[0].rotation.x=Math.sin(P*9)*.25,d[1].rotation.x=-Math.sin(P*9)*.25,s.position.y+=Math.abs(Math.sin(P*6))*.08),A){A.position.set(n.position.x,n.position.y-.029-W,n.position.z),A.material.opacity=.18*(1-Math.min(W/5,.8)),A.visible=W<5;const re=1+Math.min(W,4)*.14;A.scale.set(re,re,1)}}function D(P){t.hoodie.color.set(P)}return{root:n,body:s,head:x,legs:_,arms:g,animate:N,setColor:D,setEmotion:S,materials:t}}class da extends Rt{constructor(){const e=da.SkyShader,t=new Ot({name:e.name,uniforms:Di.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:jt,depthWrite:!1});super(new Fi(1,1,1),t),this.isSky=!0}}da.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new I},up:{value:new I(0,1,0)}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};class pM extends Rt{constructor(e,t={}){super(e),this.isWater=!0;const n=this,s=t.textureWidth!==void 0?t.textureWidth:512,r=t.textureHeight!==void 0?t.textureHeight:512,o=t.clipBias!==void 0?t.clipBias:0,a=t.alpha!==void 0?t.alpha:1,l=t.time!==void 0?t.time:0,c=t.waterNormals!==void 0?t.waterNormals:null,u=t.sunDirection!==void 0?t.sunDirection:new I(.70707,.70707,0),h=new De(t.sunColor!==void 0?t.sunColor:16777215),f=new De(t.waterColor!==void 0?t.waterColor:8355711),d=t.eye!==void 0?t.eye:new I(0,0,0),_=t.distortionScale!==void 0?t.distortionScale:20,x=t.side!==void 0?t.side:Xn,m=t.fog!==void 0?t.fog:!1,p=new Ei,b=new I,M=new I,v=new I,w=new He,C=new I(0,0,-1),R=new tt,A=new I,g=new I,y=new tt,S=new He,N=new Ht,D=new Mn(s,r),P={name:"MirrorShader",uniforms:Di.merge([xe.fog,xe.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new He},sunColor:{value:new De(8355711)},sunDirection:{value:new I(.70707,.70707,0)},eye:{value:new I},waterColor:{value:new De(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},U=new Ot({name:P.name,uniforms:Di.clone(P.uniforms),vertexShader:P.vertexShader,fragmentShader:P.fragmentShader,lights:!0,side:x,fog:m});U.uniforms.mirrorSampler.value=D.texture,U.uniforms.textureMatrix.value=S,U.uniforms.alpha.value=a,U.uniforms.time.value=l,U.uniforms.normalSampler.value=c,U.uniforms.sunColor.value=h,U.uniforms.waterColor.value=f,U.uniforms.sunDirection.value=u,U.uniforms.distortionScale.value=_,U.uniforms.eye.value=d,n.material=U,n.onBeforeRender=function(O,W,H){if(M.setFromMatrixPosition(n.matrixWorld),v.setFromMatrixPosition(H.matrixWorld),w.extractRotation(n.matrixWorld),b.set(0,0,1),b.applyMatrix4(w),A.subVectors(M,v),A.dot(b)>0)return;A.reflect(b).negate(),A.add(M),w.extractRotation(H.matrixWorld),C.set(0,0,-1),C.applyMatrix4(w),C.add(v),g.subVectors(M,C),g.reflect(b).negate(),g.add(M),N.position.copy(A),N.up.set(0,1,0),N.up.applyMatrix4(w),N.up.reflect(b),N.lookAt(g),N.far=H.far,N.updateMatrixWorld(),N.projectionMatrix.copy(H.projectionMatrix),S.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),S.multiply(N.projectionMatrix),S.multiply(N.matrixWorldInverse),p.setFromNormalAndCoplanarPoint(b,M),p.applyMatrix4(N.matrixWorldInverse),R.set(p.normal.x,p.normal.y,p.normal.z,p.constant);const Z=N.projectionMatrix;y.x=(Math.sign(R.x)+Z.elements[8])/Z.elements[0],y.y=(Math.sign(R.y)+Z.elements[9])/Z.elements[5],y.z=-1,y.w=(1+Z.elements[10])/Z.elements[14],R.multiplyScalar(2/R.dot(y)),Z.elements[2]=R.x,Z.elements[6]=R.y,Z.elements[10]=R.z+1-o,Z.elements[14]=R.w,d.setFromMatrixPosition(H.matrixWorld);const ae=O.getRenderTarget(),z=O.xr.enabled,Q=O.shadowMap.autoUpdate;n.visible=!1,O.xr.enabled=!1,O.shadowMap.autoUpdate=!1,O.setRenderTarget(D),O.state.buffers.depth.setMask(!0),O.autoClear===!1&&O.clear(),O.render(W,N),n.visible=!0,O.xr.enabled=z,O.shadowMap.autoUpdate=Q,O.setRenderTarget(ae);const re=H.viewport;re!==void 0&&O.state.viewport(re)}}}const Go={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class tr{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const mM=new ha(-1,1,1,-1,0,1);class gM extends Mt{constructor(){super(),this.setAttribute("position",new Xe([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Xe([0,2,0,0,2,0],2))}}const _M=new gM;class qc{constructor(e){this._mesh=new Rt(_M,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,mM)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class vM extends tr{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Ot?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Di.clone(e.uniforms),this.material=new Ot({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new qc(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class Oh extends tr{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const s=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}}class xM extends tr{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class yM{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new ie);this._width=n.width,this._height=n.height,t=new Mn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:cn}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new vM(Go),this.copyPass.material.blending=fi,this.clock=new td}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let s=0,r=this.passes.length;s<r;s++){const o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),o.needsSwap){if(n){const a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}Oh!==void 0&&(o instanceof Oh?n=!0:o instanceof xM&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new ie);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class MM extends tr{constructor(e,t,n=null,s=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new De}render(e,t,n){const s=e.autoClear;e.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=s}}const SM={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new De(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class Xs extends tr{constructor(e,t=1,n,s){super(),this.strength=t,this.radius=n,this.threshold=s,this.resolution=e!==void 0?new ie(e.x,e.y):new ie(256,256),this.clearColor=new De(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new Mn(r,o,{type:cn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const h=new Mn(r,o,{type:cn});h.texture.name="UnrealBloomPass.h"+u,h.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(h);const f=new Mn(r,o,{type:cn});f.texture.name="UnrealBloomPass.v"+u,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),r=Math.round(r/2),o=Math.round(o/2)}const a=SM;this.highPassUniforms=Di.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Ot({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new ie(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new I(1,1,1),new I(1,1,1),new I(1,1,1),new I(1,1,1),new I(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Di.clone(Go.uniforms),this.blendMaterial=new Ot({uniforms:this.copyUniforms,vertexShader:Go.vertexShader,fragmentShader:Go.fragmentShader,blending:ml,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new De,this._oldClearAlpha=1,this._basic=new un,this._fsQuad=new qc(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new ie(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(e,t,n,s,r){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let a=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[l].uniforms.direction.value=Xs.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=Xs.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),a=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(n),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){const t=[];for(let n=0;n<e;n++)t.push(.39894*Math.exp(-.5*n*n/(e*e))/e);return new Ot({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new ie(.5,.5)},direction:{value:new ie(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}_getCompositeMaterial(e){return new Ot({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}Xs.BlurDirectionX=new ie(1,0);Xs.BlurDirectionY=new ie(0,1);const Io={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class bM extends tr{constructor(){super(),this.uniforms=Di.clone(Io.uniforms),this.material=new Ym({name:Io.name,uniforms:this.uniforms,vertexShader:Io.vertexShader,fragmentShader:Io.fragmentShader}),this._fsQuad=new qc(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},et.getTransfer(this._outputColorSpace)===ct&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===sf?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===rf?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===of?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===oa?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===lf?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===cf?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===af&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const dl="./assets/cinematic/",Bh=11126748,EM=5210010,zh=-8,Vr={cinematic:{pixelRatio:1.5,reflections:768,bloom:!0,grassFactor:.72,fog:.00135,shadows:"soft",shadowSize:2048},balanced:{pixelRatio:1.15,reflections:256,bloom:!1,grassFactor:.35,fog:.00155,shadows:"basic",shadowSize:1024},performance:{pixelRatio:1,reflections:0,bloom:!1,grassFactor:.08,fog:.00175,shadows:"off",shadowSize:512}};function TM(i="balanced"){const e=Object.prototype.hasOwnProperty.call(Vr,i)?i:"balanced";return Vr[e].pixelRatio}function wM(){const i=document.createElement("canvas");i.width=128,i.height=128;const e=i.getContext("2d"),t=e.createRadialGradient(64,64,4,64,64,64);return t.addColorStop(0,"rgba(235,247,245,.42)"),t.addColorStop(.47,"rgba(227,241,240,.23)"),t.addColorStop(1,"rgba(227,241,240,0)"),e.fillStyle=t,e.fillRect(0,0,128,128),new Zo(i)}function ai(i){const e=Math.sin(i*127.1+91.7)*43758.5453;return e-Math.floor(e)}function AM(){const i=[],e=[],t=[],n=[];for(let r=0;r<3;r++){const o=r*Math.PI/3,a=Math.cos(o),l=Math.sin(o),c=i.length/3,u=.46,h=.31;i.push(-a*u/2,0,-l*u/2,a*u/2,0,l*u/2,a*u/2,h,l*u/2,-a*u/2,h,-l*u/2);for(let f=0;f<4;f++)e.push(l,0,-a);t.push(0,0,1,0,1,1,0,1),n.push(c,c+1,c+2,c,c+2,c+3)}const s=new Mt;return s.setAttribute("position",new Xe(i,3)),s.setAttribute("normal",new Xe(e,3)),s.setAttribute("uv",new Xe(t,2)),s.setIndex(n),s.computeBoundingSphere(),s}function RM(i,e,t){const n=Vr[t].grassFactor,s=new Kn({map:e,color:15923679,side:Pt,alphaTest:.38,roughness:1,metalness:0,depthWrite:!0}),r=AM(),o=new mt,a=[];for(const l of i){if(["ice","conveyor","orbit","bounce","spinner","crumble","finish"].includes(l.type))continue;const c=Math.max(3,Math.floor((l.type==="hub"?290:l.w*l.d*2.3)*n)),u=new Uf(r,s,c);for(let h=0;h<c;h++){const f=ai(l.index*235+h*1.73),d=ai(h*2.33+l.index*387),_=h%4!==0;let x=(f-.5)*(l.w-.7),m=(d-.5)*(l.d-.7);_&&l.type!=="hub"&&(h%2===0?x=Math.sign(x||1)*(l.w*.5-.3-ai(h)*.45):m=Math.sign(m||1)*(l.d*.5-.3-ai(h)*.45)),l.type==="hub"&&x*x+m*m<12&&(x+=Math.sign(x||1)*2.4,m+=Math.sign(m||1)*2.4),o.position.set(x,.008,m);const p=.45+ai(l.index+h*7.91)*.8;o.scale.set(p,p,p),o.rotation.set(0,ai(h*4.1+l.index)*Math.PI*2,0),o.updateMatrix(),u.setMatrixAt(h,o.matrix)}u.instanceMatrix.needsUpdate=!0,u.castShadow=!1,u.receiveShadow=!0,u.frustumCulled=!1,l.group.add(u),a.push(u)}return a}function CM(){const i=new Ot({uniforms:{uTime:{value:0},uSun:{value:new I(-.57,.69,-.22)}},vertexShader:`varying vec3 vWorld;varying vec2 vUv;uniform float uTime;
      void main(){vUv=uv;vec3 p=position;
        p.z+=.08*sin(p.x*.13+uTime*.55)+.05*sin(p.y*.18-uTime);
        vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;
        gl_Position=projectionMatrix*viewMatrix*w;
      }`,fragmentShader:`uniform float uTime;uniform vec3 uSun;varying vec3 vWorld;varying vec2 vUv;
      void main(){float wave=sin(vWorld.x*.16+uTime*.55)*cos(vWorld.z*.11-uTime*.3);
        vec3 n=normalize(vec3(.12*cos(vWorld.x*.16+uTime*.55),1.,.11*sin(vWorld.z*.11-uTime*.3)));
        vec3 viewDir=normalize(cameraPosition-vWorld);
        float fresnel=pow(1.-max(dot(viewDir,n),0.),2.4);
        float spec=pow(max(dot(reflect(-normalize(uSun),n),viewDir),0.),140.);
        vec3 deep=vec3(.12,.28,.38);vec3 sky=vec3(.66,.78,.86);
        vec3 rgb=mix(deep,sky,clamp(fresnel*.85+wave*.03,0.,1.))+spec*vec3(1.,.94,.82)*.45;
        gl_FragColor=vec4(rgb,1.);}`,side:Pt});return new Rt(new Gn(2e3,2e3,48,48),i)}function PM(i,e,t,n,s="balanced"){const r=Object.prototype.hasOwnProperty.call(Vr,s)?s:"balanced",o=Vr[r];t.setPixelRatio(Math.min(window.devicePixelRatio||1,o.pixelRatio)),t.toneMapping=oa,t.toneMappingExposure=.83,t.outputColorSpace=xt;const a=o.shadows!=="off";t.shadowMap.enabled=a,t.shadowMap.type=o.shadows==="basic"?ef:vc,i.background=new De(Bh),i.fog=new Rc(Bh,o.fog),n.sea.visible=!1,n.sun.color.set(16772558),n.sun.intensity=1.95,n.sun.castShadow=a,n.sun.shadow.normalBias=.012,n.sun.shadow.bias=-15e-5,n.sun.shadow.radius=3.2,n.sun.shadow.mapSize.set(o.shadowSize,o.shadowSize);const l=i.children.find(R=>R.isHemisphereLight);l&&(l.intensity=.95,l.color.set(14149876),l.groundColor.set(6981528));const c=new da;c.scale.setScalar(4500),c.material.uniforms.turbidity.value=2.4,c.material.uniforms.rayleigh.value=1.05,c.material.uniforms.mieCoefficient.value=.0035,c.material.uniforms.mieDirectionalG.value=.7;const u=new I(-.42,.62,-.35).normalize();c.material.uniforms.sunPosition.value.copy(u),i.add(c);let h;if(o.reflections){const R=new ea().load(dl+"water_normal.png");R.wrapS=R.wrapT=hn,h=new pM(new Gn(2e3,2e3),{textureWidth:o.reflections,textureHeight:o.reflections,waterNormals:R,sunDirection:u.clone(),sunColor:16773330,waterColor:EM,distortionScale:.4,alpha:.92,fog:i.fog!==void 0})}else h=CM();h.position.set(0,zh,-70),h.rotation.x=-Math.PI/2,i.add(h),n.waterSurface=h,n.waterLevel=zh;const f=new Pc({map:wM(),color:14281717,transparent:!0,opacity:.12,depthWrite:!1,fog:!0}),d=[];for(let R=0;R<8;R++){const A=new Df(f),g=R%2===0?-1:1;A.position.set(g*(48+ai(R+1)*55),2+ai(R+7)*8,-40-R*18);const y=18+ai(R+39)*16;A.scale.set(y,y*.4,1),i.add(A),d.push(A)}let _=null;if(o.bloom){_=new yM(t),_.addPass(new MM(i,e));const R=new Xs(new ie(window.innerWidth,window.innerHeight),.08,.4,.97);_.addPass(R),_.addPass(new bM)}const x=new ea,m={"Terrain | meadow grass":"grass","Cinematic | grass":"grass","Terrain | exposed earth":"soil","Cinematic | soil":"soil","Stone | mossy limestone":"rock","Cinematic | rock":"rock","Stone | weathered granite":"rock","Wood | rough bark":"bark","Cinematic | bark":"bark"},p=(async()=>{const R={},A=[];for(const y of new Set(Object.values(m))){R[y]={};for(const S of["color","normal","roughness"]){const N=x.loadAsync(`${dl}${y}_${S}.png`).then(D=>{D.wrapS=D.wrapT=hn,D.flipY=!1,D.anisotropy=Math.min(t.capabilities.getMaxAnisotropy(),8),S==="color"&&(D.colorSpace=xt),R[y][S]=D});A.push(N)}}await Promise.all(A);const g=await x.loadAsync(dl+"grass_blades.png");return g.colorSpace=xt,{maps:R,blades:g}})(),b=Promise.all([n.sceneryReady,p]).then(([R,{maps:A,blades:g}])=>{if(!R)return!1;const y=new Set;return i.traverse(S=>{var N;if(!(!S.isMesh||!S.material))for(const D of Array.isArray(S.material)?S.material:[S.material]){if(y.has(D))continue;y.add(D);const P=m[D.name];if(!P)continue;const U=A[P];D.map=U.color,D.normalMap=U.normal,(N=D.normalScale)==null||N.set(1.05,1.05),D.roughnessMap=U.roughness,D.color.set(16777215),D.roughness=.92,D.metalness=0,D.map&&(D.map.repeat.set(P==="grass"?2.2:1.6,P==="grass"?2.2:1.6),D.map.needsUpdate=!0),D.normalMap&&(D.normalMap.repeat.copy(D.map.repeat),D.normalMap.needsUpdate=!0),D.roughnessMap&&(D.roughnessMap.repeat.copy(D.map.repeat),D.roughnessMap.needsUpdate=!0),D.needsUpdate=!0}}),RM(n.platforms,g,r),!0}).catch(R=>(console.warn("Cinematic materials unavailable; using original GLBs",R),!1));function M(R,A){c.position.copy(e.position);for(let g=0;g<d.length;g++)d[g].position.x+=Math.sin(A*.13+g)*R*.018;h.material.uniforms&&h.material.uniforms.time&&(h.material.uniforms.time.value+=R),h.material.uniforms&&h.material.uniforms.uTime&&(h.material.uniforms.uTime.value=A)}function v(){_?_.render():t.render(i,e)}function w(R,A){_&&_.setSize(R,A)}function C(){_=null,t.shadowMap.enabled=!1,t.setPixelRatio(1),n.sun&&(n.sun.castShadow=!1);for(let R=0;R<d.length;R++)d[R].visible=!1}return{ready:b,render:v,update:M,resize:w,downgradeToPerformance:C,quality:r}}class LM extends lg{constructor(e){super(e),this.type=cn}parse(e){const o=function(A,g){switch(A){case 1:throw new Error("THREE.HDRLoader: Read Error: "+(g||""));case 2:throw new Error("THREE.HDRLoader: Write Error: "+(g||""));case 3:throw new Error("THREE.HDRLoader: Bad File Format: "+(g||""));default:case 4:throw new Error("THREE.HDRLoader: Memory Error: "+(g||""))}},h=function(A,g,y){g=g||1024;let N=A.pos,D=-1,P=0,U="",O=String.fromCharCode.apply(null,new Uint16Array(A.subarray(N,N+128)));for(;0>(D=O.indexOf(`
`))&&P<g&&N<A.byteLength;)U+=O,P+=O.length,N+=128,O+=String.fromCharCode.apply(null,new Uint16Array(A.subarray(N,N+128)));return-1<D?(A.pos+=P+D+1,U+O.slice(0,D)):!1},f=function(A){const g=/^#\?(\S+)/,y=/^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,S=/^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,N=/^\s*FORMAT=(\S+)\s*$/,D=/^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,P={valid:0,string:"",comments:"",programtype:"RGBE",format:"",gamma:1,exposure:1,width:0,height:0};let U,O;for((A.pos>=A.byteLength||!(U=h(A)))&&o(1,"no header found"),(O=U.match(g))||o(3,"bad initial token"),P.valid|=1,P.programtype=O[1],P.string+=U+`
`;U=h(A),U!==!1;){if(P.string+=U+`
`,U.charAt(0)==="#"){P.comments+=U+`
`;continue}if((O=U.match(y))&&(P.gamma=parseFloat(O[1])),(O=U.match(S))&&(P.exposure=parseFloat(O[1])),(O=U.match(N))&&(P.valid|=2,P.format=O[1]),(O=U.match(D))&&(P.valid|=4,P.height=parseInt(O[1],10),P.width=parseInt(O[2],10)),P.valid&2&&P.valid&4)break}return P.valid&2||o(3,"missing format specifier"),P.valid&4||o(3,"missing image size specifier"),P},d=function(A,g,y){const S=g;if(S<8||S>32767||A[0]!==2||A[1]!==2||A[2]&128)return new Uint8Array(A);S!==(A[2]<<8|A[3])&&o(3,"wrong scanline width");const N=new Uint8Array(4*g*y);N.length||o(4,"unable to allocate buffer space");let D=0,P=0;const U=4*S,O=new Uint8Array(4),W=new Uint8Array(U);let H=y;for(;H>0&&P<A.byteLength;){P+4>A.byteLength&&o(1),O[0]=A[P++],O[1]=A[P++],O[2]=A[P++],O[3]=A[P++],(O[0]!=2||O[1]!=2||(O[2]<<8|O[3])!=S)&&o(3,"bad rgbe scanline format");let Z=0,ae;for(;Z<U&&P<A.byteLength;){ae=A[P++];const Q=ae>128;if(Q&&(ae-=128),(ae===0||Z+ae>U)&&o(3,"bad scanline data"),Q){const re=A[P++];for(let de=0;de<ae;de++)W[Z++]=re}else W.set(A.subarray(P,P+ae),Z),Z+=ae,P+=ae}const z=S;for(let Q=0;Q<z;Q++){let re=0;N[D]=W[Q+re],re+=S,N[D+1]=W[Q+re],re+=S,N[D+2]=W[Q+re],re+=S,N[D+3]=W[Q+re],D+=4}H--}return N},_=function(A,g,y,S){const N=A[g+3],D=Math.pow(2,N-128)/255;y[S+0]=A[g+0]*D,y[S+1]=A[g+1]*D,y[S+2]=A[g+2]*D,y[S+3]=1},x=function(A,g,y,S){const N=A[g+3],D=Math.pow(2,N-128)/255;y[S+0]=ro.toHalfFloat(Math.min(A[g+0]*D,65504)),y[S+1]=ro.toHalfFloat(Math.min(A[g+1]*D,65504)),y[S+2]=ro.toHalfFloat(Math.min(A[g+2]*D,65504)),y[S+3]=ro.toHalfFloat(1)},m=new Uint8Array(e);m.pos=0;const p=f(m),b=p.width,M=p.height,v=d(m.subarray(m.pos),b,M);let w,C,R;switch(this.type){case nn:R=v.length/4;const A=new Float32Array(R*4);for(let y=0;y<R;y++)_(v,y*4,A,y*4);w=A,C=nn;break;case cn:R=v.length/4;const g=new Uint16Array(R*4);for(let y=0;y<R;y++)x(v,y*4,g,y*4);w=g,C=cn;break;default:throw new Error("THREE.HDRLoader: Unsupported type: "+this.type)}return{width:b,height:M,data:w,header:p.string,gamma:p.gamma,exposure:p.exposure,type:C}}setDataType(e){return this.type=e,this}load(e,t,n,s){function r(o,a){switch(o.type){case nn:case cn:o.colorSpace=Yt,o.minFilter=Lt,o.magFilter=Lt,o.generateMipmaps=!1,o.flipY=!0;break}t&&t(o,a)}return super.load(e,r,n,s)}}class IM extends LM{constructor(e){console.warn("RGBELoader has been deprecated. Please use HDRLoader instead."),super(e)}}const Wo="./assets/scanned/",hd=40*1024*1024,Do={boulder:{asset:"rock_moss_set_01",height:2.4},pine_tree:{asset:"pine_sapling_small",height:8,fallback:"pine_tree_01"},oak_tree:{asset:"island_tree_01",height:10}},cc=new Set(["pine_tree_01"]);function DM(i){if(!i.isMesh)return;i.castShadow=!1,i.receiveShadow=!0;const e=Array.isArray(i.material)?i.material:[i.material];for(const t of e)t&&(t.map&&(t.map.anisotropy=Math.min(t.map.anisotropy||1,4)),(t.alphaTest>.05||t.transparent||/leaves|foliage|needles/i.test(t.name))&&(t.side=Pt,t.alphaTest>0&&t.opacity>=1&&(t.transparent=!1),t.needsUpdate=!0))}function kh(i,e){const t=i.clone(!0),n=new jn().setFromObject(t);if(n.isEmpty())return null;const s=Math.max(1e-4,n.max.y-n.min.y),r=e/s,o=new Vt;return t.position.set(-(n.min.x+n.max.x)*.5,-n.min.y,-(n.min.z+n.max.z)*.5),o.add(t),o.scale.setScalar(r),o}async function NM(i){try{const e=await fetch(i,{method:"HEAD",cache:"no-cache"});if(Number(e.headers.get("content-length")||0)>hd)return!1}catch{}return!0}async function UM(i,e,t,n){if(cc.has(e))return console.warn("Scan skipped (too heavy for browser):",e),n.failures.push(e),null;const s=Wo+t.url;if(!await NM(s))return console.warn("Scan skipped (over size budget):",e),n.failures.push(e),null;if(s.endsWith(".gltf"))try{const r=new URL(s,window.location.href),o=await(await fetch(r.href,{cache:"no-cache"})).json();for(const a of o.buffers||[]){if(!a.uri||a.uri.startsWith("data:"))continue;const l=new URL(a.uri,r.href),c=await fetch(l.href,{method:"HEAD",cache:"no-cache"}),u=Number(c.headers.get("content-length")||a.byteLength||0);if(u>hd)return console.warn(`Scan skipped (${Math.round(u/1e6)}MB mesh):`,e),n.failures.push(e),null}}catch(r){return console.warn("Scan size check failed:",e,r),n.failures.push(e),null}try{const r=await i.loadAsync(s);return r.scene.traverse(DM),n.models.push(e),r.scene}catch(r){return console.warn("Scan unavailable:",e,r),n.failures.push(e),null}}async function FM(i,e,t,n="balanced"){var _,x;if(n==="performance")return{enabled:!1,why:"disabled on performance preset"};let s;try{const m=await fetch(Wo+"manifest.json",{cache:"no-cache"});if(!m.ok)return{enabled:!1,why:"scan pack not installed"};if(s=await m.json(),!s.models||!Object.keys(s.models).length)return{enabled:!1,why:"empty scan manifest"}}catch{return{enabled:!1,why:"scan pack not installed"}}if(!await t.sceneryReady)return{enabled:!1,why:"base world missing"};const r=new ad,o={},a={models:[],failures:[],hdri:!1,ground:!1,skippedHeavy:[]},l=new Set([Do.boulder.asset,Do.pine_tree.asset,Do.oak_tree.asset,"rock_moss_set_01","tree_stump_01","mountainside","pine_sapling_small"]);for(const[m,p]of Object.entries(s.models)){if(!l.has(m))continue;const b=await UM(r,m,p,a);b?o[m]=b:(cc.has(m)||m==="pine_tree_01")&&a.skippedHeavy.push(m)}const c=m=>{const p=Do[m];return p?o[p.asset]?p:p.fallback&&o[p.fallback]&&!cc.has(p.fallback)?{...p,asset:p.fallback}:null:null},u=[];i.traverse(m=>{var b;const p=(b=m.userData)==null?void 0:b.skyboundSceneryAsset;p&&c(p)&&u.push({obj:m,kind:p})});const h={boulder:12,pine_tree:4,oak_tree:4},f={boulder:0,pine_tree:0,oak_tree:0};for(const{obj:m,kind:p}of u){if((f[p]||0)>=(h[p]||0))continue;const b=c(p);if(!b||!o[b.asset])continue;const M=m.parent;if(!M)continue;const v=new Vt;v.name="Scanned "+b.asset,v.position.copy(m.position),v.rotation.copy(m.rotation),v.scale.copy(m.scale);const w=kh(o[b.asset],b.height);w&&(v.add(w),M.add(v),m.visible=!1,f[p]=(f[p]||0)+1)}const d=[["rock_moss_set_01",[-7.6,-.13,6.8],2.1,.5],["rock_moss_set_01",[7.6,-.13,6.1],1.8,1.8],["tree_stump_01",[6.7,0,5.5],1.5,1.1],["mountainside",[-22,-11,-30],18,1.2],["mountainside",[22,-12,-46],20,4.2]];for(const[m,p,b,M]of d){if(!o[m])continue;const v=kh(o[m],b);v&&(v.position.set(...p),v.rotation.y=M,i.add(v))}if((_=s.hdri)!=null&&_.url)try{if(!s.hdri.url.toLowerCase().endsWith(".hdr"))throw new Error("HDRI EXR not supported by RGBELoader");const m=await new IM().loadAsync(Wo+s.hdri.url);m.mapping=Xo,i.environment=m,i.environmentIntensity=.8,a.hdri=!0}catch(m){console.warn("HDRI unavailable",m)}if((x=s.ground)!=null&&x.color)try{const m=new ea,p=await Promise.all(["color","normal","roughness"].map(async M=>{const v=s.ground[M];if(!v)return[M,null];const w=await m.loadAsync(Wo+v);return w.wrapS=w.wrapT=hn,w.repeat.set(3,3),w.anisotropy=Math.min(e.capabilities.getMaxAnisotropy(),4),M==="color"&&(w.colorSpace=xt),[M,w]})),b=Object.fromEntries(p);i.traverse(M=>{if(!M.isMesh||!M.material)return;const v=Array.isArray(M.material)?M.material:[M.material];for(const w of v)["Cinematic | grass","Cinematic | soil"].includes(w.name)&&(w.map=b.color,w.normalMap=b.normal,w.roughnessMap=b.roughness,w.color.set(16777215),w.roughness=1,w.metalness=0,w.needsUpdate=!0)}),a.ground=!0}catch(m){console.warn("Scanned ground textures missing",m)}return console.info("Skybound scans loaded locally:",a),{enabled:a.models.length>0||a.hdri||a.ground,...a}}const Hh="sprouts-sidecar",Vh=[{prompt:"Which platform is slippery?",choices:[{label:"Ice",ok:!0},{label:"Bounce"},{label:"Hub"}]},{prompt:"What do sky crystals look like?",choices:[{label:"◆",ok:!0},{label:"⚑"},{label:"▤"}]},{prompt:"2 + 3 =",choices:[{label:"4"},{label:"5",ok:!0},{label:"6"}]},{prompt:"Spell jump. Tap the letters.",kind:"spell",word:"jump",letters:["j","u","m","p","a","t"],choices:[{label:"jump",ok:!0}]},{prompt:"Which pad flings you up?",choices:[{label:"Bounce",ok:!0},{label:"Ice"},{label:"Conveyor"}]}];function fd(){try{return typeof window!="undefined"&&window.parent&&window.parent!==window}catch{return!1}}function Gh(i){return!i||!Array.isArray(i.choices)||!i.choices.length?null:{prompt:i.prompt||"",show:i.show||"",kind:i.kind||"",word:i.word||"",letters:Array.isArray(i.letters)?i.letters.map(e=>String(e)):[],built:"",slipped:!1,choices:i.choices.map(e=>({label:String(e.label),ok:!!e.ok,fill:e.fill||"",shape:e.shape||""}))}}function OM(i,e){return!i||!i.choices[e]?!1:i.choices.some(t=>t.ok)?!!i.choices[e].ok:e===0}function Cn(i){return String(i).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function BM(i){return i.shape?`<span class="shape ${Cn(i.shape)}" style="--shape-color:${Cn(i.fill||"#5d7a45")}"></span><span>${Cn(i.label)}</span>`:i.fill?`<span class="swatch" style="background:${Cn(i.fill)}"></span><span>${Cn(i.label)}</span>`:`<span>${Cn(i.label)}</span>`}function zM(i){var N;const e=i.root,t=(N=i.embedded)!=null?N:fd(),n=i.note||"A right answer earns a learning star. A wrong one lets you keep climbing.";let s=!1,r=!1,o=!1,a=null,l=!1,c=null,u=0,h=0,f=!1;function d(D,P){if(!t)return;const U={source:Hh,type:D};P&&Object.assign(U,P),window.parent.postMessage(U,"*")}function _(){return a.word.split("").map((D,P)=>P<a.built.length?a.built[P]:"_").join(" ")}function x(){e.innerHTML=`<div class="card"><p class="prompt">${Cn(a.prompt||"Spell the word.")}</p><p class="slots">${Cn(_())}</p><div class="choices">${a.letters.map((U,O)=>`<button type="button" class="letter" data-i="${O}">${Cn(U)}</button>`).join("")}</div><label class="spell-type">Type the next letter <input class="spell-key" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="Type the next letter"></label><button type="button" class="hear">Hear it again</button><p class="note">Tap a letter or type it.</p></div>`,e.querySelectorAll("button.letter").forEach(U=>{U.onclick=()=>w(+U.dataset.i,U)});const D=e.querySelector("button.hear");D&&(D.onclick=()=>d("replay"));const P=e.querySelector(".spell-key");P&&(P.addEventListener("keydown",U=>U.stopPropagation()),P.addEventListener("input",()=>v(P.value)),P.focus())}function m(){if(e.hidden=!1,a.kind==="spell"&&a.word&&a.letters.length){x();return}e.innerHTML=`<div class="card"><p class="prompt">${Cn(a.prompt||"")}</p><div class="show">${a.show||""}</div><div class="choices">${a.choices.map((P,U)=>`<button type="button" data-i="${U}">${BM(P)}</button>`).join("")}</div><button type="button" class="hear">Hear it again</button><p class="note">${Cn(n)}</p></div>`,e.querySelectorAll("button[data-i]").forEach(P=>{P.onclick=()=>M(+P.dataset.i,P)});const D=e.querySelector("button.hear");D&&(D.onclick=()=>d("replay"))}function p(){var D;s=!1,c=null,e.hidden=!0,e.innerHTML="",(D=i.onResume)==null||D.call(i)}function b(D){var P;D&&(f||(h+=1,(P=i.onStar)==null||P.call(i,h))),p()}function M(D,P){if(!s||!a||!a.choices[D])return;if(e.querySelectorAll("button").forEach(O=>{O.disabled=!0}),P&&P.classList.add("picked"),t){d("pick",{index:D});return}const U=OM(a,D);P&&P.classList.add(U?"correct":"wrong"),setTimeout(()=>b(U),U?280:520)}function v(D){const P=String(D||"").match(/[a-zA-Z']/g)||[],U=e.querySelector(".spell-key");for(const O of P){if(!s||!a||a.built===a.word)break;const W=a.word[a.built.length];if(O.toLowerCase()!==String(W).toLowerCase()){U&&(U.classList.add("wrong"),setTimeout(()=>U.classList.remove("wrong"),280)),a.slipped||(a.slipped=!0,f=!0,d("slip"));break}let H=!1;for(const Z of e.querySelectorAll("button.letter"))if(!Z.disabled&&String(a.letters[+Z.dataset.i]).toLowerCase()===String(W).toLowerCase()){w(+Z.dataset.i,Z),H=!0;break}if(!H)break}U&&(U.value="")}function w(D,P){if(!s||!a||a.kind!=="spell"||P.disabled)return;const U=a.letters[D];if(U!==a.word[a.built.length]){P.classList.add("wrong"),a.slipped||(a.slipped=!0,f=!0,d("slip")),setTimeout(()=>P.classList.remove("wrong"),280);return}a.built+=U,P.disabled=!0;const O=e.querySelector(".slots");if(O&&(O.textContent=_()),a.built===a.word){if(t){d("pick",{index:0});return}b(!0)}}function C(){var D;return r||o||s||!a||!a.choices.length?!1:(a.kind==="spell"&&(a.built="",a.slipped=!1),f=!1,s=!0,l=!1,(D=i.onPause)==null||D.call(i),m(),d("show"),!0)}function R(D){a=Gh(D),l=!1}function A(){const D=Vh[u%Vh.length];return u+=1,Gh(D)}function g(D="pad"){return r||o||s?!1:(c=D,a&&a.choices.length?C():t?(l||(l=!0,d("need")),!1):(a=A(),C()))}function y(D){var U,O,W;if(!t||D.source!==window.parent)return;const P=D.data;if(!(!P||P.source!==Hh)){if(P.type==="boot"&&((U=i.onBoot)==null||U.call(i,P)),P.type==="clear"&&(o=!0,s&&p()),P.type==="arcade"&&(r=!0,o=!0,s&&p()),P.type==="ask"&&((O=P.choices)!=null&&O.length)){if(s||o||r)return;R(P),(c||l)&&C()}P.type==="mark"&&b(!!P.ok),P.type==="duck"&&((W=i.onDuck)==null||W.call(i,!!P.on))}}window.addEventListener("message",y),window.addEventListener("keydown",D=>{var P,U;(U=(P=D.target)==null?void 0:P.classList)!=null&&U.contains("spell-key")&&D.stopPropagation(),s&&["Escape"," ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(D.key)&&D.preventDefault()},!0),d("ready");const S=setInterval(()=>{t&&!r&&!o&&!s&&c&&!a&&d("need")},1e3);return{get asking(){return s},get arcade(){return r},get stars(){return h},get embedded(){return t},gate:g,progress(D,P){d("progress",{label:D||"",travel:P||0})},finish(D="course"){d("finish",{detail:D})},quit(){d("quit")},setArcade(D){r=!!D,r&&s&&p()},destroy(){clearInterval(S),window.removeEventListener("message",y),s&&p()}}}const dd="skybound-visual-quality",kM=["cinematic","balanced","performance"];function HM(){try{return localStorage.getItem(dd)||"auto"}catch{return"auto"}}function pd(i){try{localStorage.setItem(dd,String(i))}catch{}}function VM({choice:i="auto",embedded:e=!1,deviceMemory:t,hardwareConcurrency:n,saveData:s=!1,reducedMotion:r=!1,coarsePointer:o=!1,smallViewport:a=!1}={}){if(kM.includes(i))return i;const l=typeof t=="number"&&t>0&&t<=4,c=typeof n=="number"&&n>0&&n<=4;return e||l||c||s||r||o&&a?"performance":"balanced"}function GM(i=!1,e=typeof globalThis!="undefined"?globalThis:{}){const t=e.navigator||{},n=typeof e.matchMedia=="function"?e.matchMedia.bind(e):null,s=n?n("(pointer: coarse)").matches:!1,r=n?n("(max-width: 900px), (max-height: 700px)").matches:typeof e.innerWidth=="number"&&(e.innerWidth<900||e.innerHeight<700);let o=!1;try{o=!!(t.connection&&t.connection.saveData)}catch{o=!1}const a=n?n("(prefers-reduced-motion: reduce)").matches:!1;return{embedded:!!i,deviceMemory:t.deviceMemory,hardwareConcurrency:t.hardwareConcurrency,saveData:o,reducedMotion:a,coarsePointer:s,smallViewport:r}}const No=.28,xr=.5,WM=.28;function XM(i){return i?typeof i=="number"?i>0?i:0:i.pressed?i.value>0?i.value:1:i.value>0?i.value:0:0}function Uo(i,e,t=xr,n=WM){const s=Number(i)||0;return e?s>=n:s>=t}function YM(i){const e=n=>XM(i&&i.buttons&&i.buttons[n]),t=n=>Number(i&&i.axes&&i.axes[n])||0;return{lx:t(0),ly:t(1),rx:t(2),ry:t(3),a:e(0),b:e(1),y:e(3),rt:e(7),start:e(9),up:e(12),down:e(13),left:e(14),right:e(15)}}function qM(){const i=typeof globalThis!="undefined"?globalThis.navigator:null;if(!i||typeof i.getGamepads!="function")return null;const e=i.getGamepads();for(let t=0;t<e.length;t++)if(e[t])return e[t];return null}function KM(i={}){const e=qM();if(!e)return{connected:!1,moveX:0,moveY:0,lookX:0,lookY:0,jumpEdge:!1,pauseEdge:!1,confirmEdge:!1,backEdge:!1,state:{jump:!1,pause:!1,confirm:!1,back:!1}};const t=YM(e),n=Math.abs(t.lx)>No?t.lx:0,s=Math.abs(t.ly)>No?-t.ly:0,r=(t.right>=xr?1:0)-(t.left>=xr?1:0),o=(t.up>=xr?1:0)-(t.down>=xr?1:0),a=Math.abs(n)>Math.abs(r)?n:r||n,l=Math.abs(s)>Math.abs(o)?s:o||s,c=Math.abs(t.rx)>No?t.rx:0,u=Math.abs(t.ry)>No?t.ry:0,h=Uo(Math.max(t.a,t.rt),!!i.jump),f=Uo(t.start,!!i.pause),d=Uo(t.a,!!i.confirm),_=Uo(t.b,!!i.back);return{connected:!0,moveX:a,moveY:l,lookX:c,lookY:u,jumpEdge:h&&!i.jump,pauseEdge:f&&!i.pause,confirmEdge:d&&!i.confirm,backEdge:_&&!i.back,state:{jump:h,pause:f,confirm:d,back:_}}}const ot=i=>document.getElementById(i),$M=ot("stage-fill"),jM=ot("stage-label"),ZM=ot("timer"),JM=ot("gems"),QM=ot("gems-total"),eS=ot("checkpoint"),tS=ot("checkpoint-total"),Wh=ot("stars"),Ii=ot("modal"),md=ot("modal-heading"),pa=ot("modal-description"),Sn=ot("play-btn"),wr=ot("level-select"),uc=ot("modal-eyebrow"),es=ot("difficulty-meter"),Xh=ot("difficulty-value"),Yh=ot("difficulty-hint"),pl=ot("toast"),ta="skybound-obby-progress-v2",gd="skybound-active-level",hc="skybound-endless-seed",_d="skybound-endless-difficulty",mr=8.7,nS=11.7,iS=26,qh={1:"Wider pads, gentler movers, shorter course.",2:"Balanced gaps and a mix of pads.",3:"Narrow pads, denser hazards, longer climb."},qr=fd();qr&&document.body.classList.add("sprouts-embedded");let vt=null,fc=!1,Kh=!1;function sS(){try{return localStorage.getItem(gd)||"crystal-run"}catch{return"crystal-run"}}function rS(){try{return rs(localStorage.getItem(_d)||2)}catch{return 2}}function oS(i){try{localStorage.setItem(_d,String(rs(i)))}catch{}}function Kc(){try{const e=localStorage.getItem(hc),t=Number(e);if(Number.isFinite(t)&&t>0)return t>>>0}catch{}const i=(Date.now()^Math.random()*1e9)>>>0||1;try{localStorage.setItem(hc,String(i))}catch{}return i}function aS(i){try{localStorage.setItem(hc,String(i>>>0||1))}catch{}}function vd(){const i=Math.imul(Kc()^2654435769,2246822507)>>>0||Date.now()>>>0||1;return aS(i),i}let Wn=rS(),yt=Qy(sS(),{seed:Kc(),difficulty:Wn});const xd=HM();let Nn=VM({choice:xd,...GM(qr)}),dc=!1;const Ki=[];let Fo=0;function lS(){Ii.classList.add("visible"),uc&&(uc.textContent="GRAPHICS UNAVAILABLE"),md.innerHTML="UPDATE<br/><em>BROWSER</em>",pa.textContent="Skybound needs WebGL and hardware acceleration. Update your browser or turn on hardware acceleration, then reload.",Sn&&(Sn.hidden=!0),wr&&(wr.hidden=!0),es&&(es.hidden=!0);const i=ot("scanned-status");i&&(i.textContent="WebGL unavailable on this device.")}const ma=new sm,is=new Ht(65,innerWidth/innerHeight,.1,450);let wt;try{if(wt=new ay({antialias:Nn!=="performance",alpha:!1,powerPreference:Nn==="performance"?"low-power":"high-performance"}),!wt.getContext())throw new Error("no-webgl-context")}catch(i){throw lS(),i}wt.setPixelRatio(Math.min(devicePixelRatio||1,TM(Nn)));wt.setSize(innerWidth,innerHeight);wt.shadowMap.enabled=Nn!=="performance";wt.shadowMap.type=Nn==="cinematic"?vc:ef;wt.outputColorSpace=xt;wt.toneMapping=oa;wt.toneMappingExposure=1.55;ot("game").appendChild(wt.domElement);is.position.set(0,7.4,16);is.lookAt(0,1.6,0);const Wt=aM(ma,yt.platforms),Ys=PM(ma,is,wt,Wt,Nn),cS=Ys.ready.then(()=>FM(ma,wt,Wt,Nn));cS.then(i=>{const e=ot("scanned-status");e&&(e.textContent=i&&i.enabled?`Scanned scenery: ${i.models.length} models loaded · HDRI ${i.hdri?"on":"off"} · Ground scans ${i.ground?"on":"off"}`:Nn==="performance"?"Performance mode — heavy scenery skipped for smoother play.":"Scanned scenery not installed — see SCAN_UPGRADE.md"),i&&i.enabled&&console.info("Scanned forest pack active",i)}).catch(()=>{const i=ot("scanned-status");i&&(i.textContent="Scanned scenery unavailable")});const Ls=ot("quality-select");Ls&&(Ls.value=xd,Ls.addEventListener("change",()=>{pd(Ls.value),location.reload()}));function uS(){Nn==="performance"||dc||(dc=!0,Nn="performance",pd("performance"),Ls&&(Ls.value="performance"),wt.setPixelRatio(1),wt.shadowMap.enabled=!1,Wt.sun&&(Wt.sun.castShadow=!1),Ys.downgradeToPerformance&&Ys.downgradeToPerformance(),In("Switched to Performance for a smoother ride"))}function hS(i){if(dc||Nn==="performance"||!Xt||(Ki.push(i),Ki.length>45&&Ki.shift(),Ki.length<45))return;let e=0;for(let n=0;n<Ki.length;n++)e+=Ki[n];e/Ki.length>1/25?(Fo+=i,Fo>2.5&&uS()):Fo=Math.max(0,Fo-i)}const vn=dM(ma),yd=new td,dt={keys:new Set,touchX:0,touchY:0,padX:0,padY:0,jumpRequested:!1};let $h={jump:!1,pause:!1,confirm:!1,back:!1},jh=!1,kt=null,An=!1,ji=0,pc=0,wi=0,Ai=0,Pi=0,qs=.3,na=10.2,Ci=0,Qi=0,Xt=!1,$n=!1,ci=!1,Zh=null,Gt=0,Gr=0,bn=new Set,Us=null,ia=!1,Ct=Ni.slice(0,1).map(i=>i.id),sa="start",ln=null;const Ar=()=>Wt.collectibles.length,fS=()=>Math.max(1,yt.platforms.length-1),Md=()=>tM(yt);function dS(){return{checkpoint:0,gems:[],best:null,cleared:!1}}function pS(i){var n,s;const e=!!((s=(n=i==null?void 0:i.levels)==null?void 0:n["crystal-run"])!=null&&s.cleared);(Ct.includes("storm-ascent")||Ct.includes("void-gauntlet")||e)&&!Ct.includes(Ft)&&Ct.push(Ft)}function mS(){var i;try{const e=JSON.parse(localStorage.getItem(ta)||"{}");Ct=Array.isArray(e.unlocked)&&e.unlocked.length?e.unlocked.filter(s=>Ni.some(r=>r.id===s)):["crystal-run"],Ct.includes("crystal-run")||Ct.unshift("crystal-run"),pS(e);const t=((i=e.levels)==null?void 0:i[yt.id])||dS();Gt=Math.min(Md(),Math.max(0,Number(t.checkpoint)||0)),Us=Number.isFinite(t.best)&&t.best>0?t.best:null,ia=!!t.cleared;const n=Math.max(0,...Wt.collectibles.map(s=>s.id));bn=new Set(Array.isArray(t.gems)?t.gems.filter(s=>Number.isInteger(s)&&s>=1&&s<=n):[])}catch{Ct=["crystal-run"],Gt=0,Us=null,ia=!1,bn=new Set}}function Wr(){try{const e={...JSON.parse(localStorage.getItem(ta)||"{}").levels||{}};e[yt.id]={checkpoint:Gt,best:Us,gems:[...bn],cleared:ia},localStorage.setItem(ta,JSON.stringify({unlocked:Ct,levels:e,activeLevel:yt.id}))}catch{}}function $c(i){try{localStorage.setItem(gd,i)}catch{}location.reload()}function gS(i){return yt.platforms.find(e=>e.checkpoint===i)}function jc(){var e,t,n,s;const i=Gt?gS(Gt):null;vn.root.position.set((e=i==null?void 0:i.x)!=null?e:0,(t=i==null?void 0:i.y)!=null?t:0,((n=i==null?void 0:i.z)!=null?n:5)+(i?1.25:0)),vn.root.rotation.y=0,kt=null,An=!1,ji=0,pc=(s=i==null?void 0:i.y)!=null?s:0,Kr()}function _S(){Gt=0,Gr=0,Ci=0,bn.clear(),$n=!1;for(const i of Wt.collectibles)i.taken=!1,i.group.visible=!0;for(const i of Wt.platforms)i.collapseAt=0,i.group.visible=!0;wi=0,Ai=0,Wr(),jc()}function In(i){pl.textContent=i,pl.classList.add("show"),clearTimeout(Zh),Zh=setTimeout(()=>pl.classList.remove("show"),2100)}function pi(i=650,e=.1,t="sine"){if(!ci)try{ln!=null||(ln=new(window.AudioContext||window.webkitAudioContext)),ln.state==="suspended"&&ln.resume();const n=ln.createOscillator(),s=ln.createGain();n.type=t,n.frequency.setValueAtTime(i,ln.currentTime),s.gain.setValueAtTime(.045,ln.currentTime),s.gain.exponentialRampToValueAtTime(.001,ln.currentTime+e),n.connect(s).connect(ln.destination),n.start(),n.stop(ln.currentTime+e)}catch{}}function Rr(i){const e=Math.floor(i);return`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`}function Kr(){var i;eS.textContent=Gt,tS.textContent=`/ ${Md()}`,JM.textContent=bn.size,QM.textContent=`/ ${Ar()}`,Wh&&(Wh.textContent=(i=vt==null?void 0:vt.stars)!=null?i:0),ZM.textContent=Rr(Ci),$M.style.width=`${Math.min(100,Gr/fS()*100).toFixed(1)}%`,jM.textContent=yt.procedural?`ENDLESS · ${er[Wn].toUpperCase()}`:`WORLD 0${yt.order} · ${yt.name.toUpperCase()}`}function Sd(){if(!es)return;const i=Ct.includes(Ft);if(es.hidden=!i,!!i){Xh&&(Xh.textContent=er[Wn]||"Normal"),Yh&&(Yh.textContent=qh[Wn]||qh[2]);for(const e of es.querySelectorAll("[data-diff]")){const t=rs(e.getAttribute("data-diff"));e.classList.toggle("active",t===Wn)}}}function Zc(){if(!wr)return;let i={};try{i=JSON.parse(localStorage.getItem(ta)||"{}").levels||{}}catch{}wr.innerHTML=Ni.map(e=>{const t=!Ct.includes(e.id),n=i[e.id]||{},s=e.procedural?Wn:e.difficulty,r="★".repeat(s)+"☆".repeat(3-s),o=t?e.id===Ft?"Locked — clear Crystal Run first":"Locked — clear the previous world":e.procedural?`${er[Wn]} · seed ${Kc()}`:n.best?`Best ${Rr(n.best)}${n.cleared?" · Cleared":""}`:e.blurb;return`<button type="button" class="level-card${e.id===yt.id?" active":""}${t?" locked":""}" data-level="${e.id}" ${t?"disabled":""}>
      <span class="level-stars">${r}</span>
      <strong>${e.name}</strong>
      <small>${o}</small>
    </button>`}).join("");for(const e of wr.querySelectorAll("[data-level]"))e.addEventListener("click",()=>{const t=e.getAttribute("data-level");!t||!Ct.includes(t)||t===yt.id||$c(t)});Sd()}function Cr(i,e,t,n="start"){md.innerHTML=i,pa.textContent=e,Sn.innerHTML=`${t} <span>→</span>`,sa=n,Ii.classList.add("visible"),Xt=!1,Zc()}function Jc(){$n&&_S(),Xt=!0,Ii.classList.remove("visible"),yd.getDelta()}function ga(){Xt&&Cr("PAUSED<br><em>ADVENTURE</em>","Your checkpoint and collected crystals are saved on this device.","RESUME GAME","start")}function bd(){var e,t,n;if($n)return;$n=!0,ia=!0,(Us===null||Ci<Us)&&(Us=Ci);const i=eM(yt.id);if(i&&!Ct.includes(i.id)&&Ct.push(i.id),yt.id==="crystal-run"&&!Ct.includes(Ft)&&Ct.push(Ft),Wr(),vt==null||vt.finish("course"),pi(830,.25),setTimeout(()=>pi(1080,.3),120),yt.procedural){vd(),Cr("COURSE CLEAR!<br><em>NEW LAYOUT READY</em>",`${er[Wn]} course finished in ${Rr(Ci)}. Crystals ${bn.size}/${Ar()} · ★ ${(e=vt==null?void 0:vt.stars)!=null?e:0}. A fresh offline layout is ready.`,"NEW RANDOM COURSE","endless-next"),Sn.dataset.next=Ft;return}i?(Cr("WORLD CLEAR!<br><em>PORTAL REACHED</em>",`${yt.name} finished in ${Rr(Ci)}. Crystals ${bn.size}/${Ar()}. Learning stars ${(t=vt==null?void 0:vt.stars)!=null?t:0}. ${i.name} is unlocked — pick it below or tap play.`,`PLAY ${i.name.toUpperCase()}`,"next"),Sn.dataset.next=i.id):(Ct.includes(Ft)||Ct.push(Ft),Wr(),Cr("YOU DID IT!<br><em>ALL WORLDS</em>",`${yt.name} complete in ${Rr(Ci)}. Collected ${bn.size}/${Ar()} crystals · ★ ${(n=vt==null?void 0:vt.stars)!=null?n:0}. Endless Run stays open with Easy / Normal / Hard.`,"PLAY ENDLESS RUN","next"),Sn.dataset.next=Ft)}function Qc(i="Oops! Back to your checkpoint"){wi=0,Ai=0,jc(),pi(210,.2,"triangle"),In(i)}mS();for(const i of Wt.collectibles)i.taken=bn.has(i.id),i.group.visible=!i.taken;var Jh,Qh;Gr=Gt&&(Qh=(Jh=Wt.platforms.find(i=>i.checkpoint===Gt))==null?void 0:Jh.index)!=null?Qh:0;jc();uc.textContent=`WORLD 0${yt.order} — ${yt.name.toUpperCase()}`;pa.textContent=Gt?`Continue ${yt.name} from checkpoint ${Gt}, with ${bn.size} crystals collected.`:`${yt.blurb} Collect ${nM(yt)} sky crystals and reach the portal.`;Sn.innerHTML=Gt?"CONTINUE ADVENTURE <span>→</span>":"START ADVENTURE <span>→</span>";Zc();Kr();Sn.addEventListener("click",()=>{if((sa==="next"||sa==="endless-next")&&Sn.dataset.next){$c(Sn.dataset.next);return}Jc()});es&&es.addEventListener("click",i=>{const e=i.target.closest("[data-diff]");if(!e||!Ct.includes(Ft))return;const t=rs(e.getAttribute("data-diff"));t===Wn&&yt.id===Ft||(Wn=t,oS(t),vd(),Sd(),Zc(),In(`${er[t]} courses ready`),yt.id===Ft&&$c(Ft))});ot("pause-btn").addEventListener("click",ga);ot("sound-btn").addEventListener("click",()=>{ci=!ci,ot("sound-btn").textContent=ci?"♩":"♪",In(ci?"Sound off":"Sound on"),ci||pi(660)});window.addEventListener("keydown",i=>{const e=i.key.toLowerCase();["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e)&&i.preventDefault(),dt.keys.add(e),i.code==="Space"&&!i.repeat&&(dt.jumpRequested=!0),e==="r"&&Xt&&Qc("Respawned at checkpoint"),e==="escape"&&(Xt?ga():!$n&&!Ii.classList.contains("visible")&&Cr("PAUSED","Take a break","RESUME","start"))});window.addEventListener("keyup",i=>dt.keys.delete(i.key.toLowerCase()));window.addEventListener("blur",()=>{dt.keys.clear(),dt.touchX=0,dt.touchY=0,dt.padX=0,dt.padY=0,dt.jumpRequested=!1,Xt&&ga()});let _a=!1,mc=0,gc=0,va=null;wt.domElement.addEventListener("pointerdown",i=>{Xt&&(_a=!0,va=i.pointerId,mc=i.clientX,gc=i.clientY,wt.domElement.setPointerCapture(i.pointerId))});wt.domElement.addEventListener("pointermove",i=>{!_a||i.pointerId!==va||(Pi+=(i.clientX-mc)*.005,qs=Xr.clamp(qs+(i.clientY-gc)*.003,-.05,.85),mc=i.clientX,gc=i.clientY)});wt.domElement.addEventListener("pointerup",()=>{_a=!1,va=null});wt.domElement.addEventListener("pointercancel",()=>{_a=!1,va=null});wt.domElement.addEventListener("wheel",i=>{i.preventDefault(),na=Xr.clamp(na+Math.sign(i.deltaY),6,17)},{passive:!1});const Ks=ot("stick"),Ed=ot("stick-thumb");let ra=null;function Td(i){const e=Ks.getBoundingClientRect(),t=i.clientX-(e.left+e.width/2),n=i.clientY-(e.top+e.height/2),s=e.width*.35,r=Math.hypot(t,n),o=Math.min(1,s/(r||1)),a=t*o,l=n*o;dt.touchX=a/s,dt.touchY=-l/s,Ed.style.transform=`translate(${a}px,${l}px)`}Ks.addEventListener("pointerdown",i=>{i.preventDefault(),ra=i.pointerId,Ks.setPointerCapture(i.pointerId),Td(i)});Ks.addEventListener("pointermove",i=>{ra===i.pointerId&&Td(i)});function wd(i){ra===i.pointerId&&(ra=null,dt.touchX=0,dt.touchY=0,Ed.style.transform="translate(0,0)")}Ks.addEventListener("pointerup",wd);Ks.addEventListener("pointercancel",wd);ot("jump-btn").addEventListener("pointerdown",i=>{i.preventDefault(),dt.jumpRequested=!0});function vS(){const i=dt.keys,e=(i.has("d")||i.has("arrowright")?1:0)-(i.has("a")||i.has("arrowleft")?1:0)+dt.touchX+dt.padX,t=(i.has("w")||i.has("arrowup")?1:0)-(i.has("s")||i.has("arrowdown")?1:0)+dt.touchY+dt.padY,n=Math.hypot(e,t);if(n<.08)return{x:0,z:0,m:0};const s=e/Math.max(1,n),r=t/Math.max(1,n);return{x:Math.cos(Pi)*s+Math.sin(Pi)*r,z:Math.sin(Pi)*s-Math.cos(Pi)*r,m:Math.min(1,n)}}function xS(i){const e=KM($h);if($h=e.state,e.connected&&!jh&&(jh=!0,In("Controller on · stick move · A/RT jump · look with right stick")),!e.connected){dt.padX=0,dt.padY=0;return}dt.padX=e.moveX,dt.padY=e.moveY,(Math.abs(e.lookX)>.01||Math.abs(e.lookY)>.01)&&(Pi+=e.lookX*2.4*i,qs=Xr.clamp(qs+e.lookY*1.6*i,-.05,.85)),e.jumpEdge&&(Xt?dt.jumpRequested=!0:Ii.classList.contains("visible")&&Sn.click()),e.pauseEdge&&(Xt?ga():Ii.classList.contains("visible")&&!$n&&Jc()),e.backEdge&&Ii.classList.contains("visible")}function yS(i){if(i.checkpoint&&i.checkpoint>Gt&&(Gt=i.checkpoint,Wr(),In(`⚑ Checkpoint ${Gt} saved!`),pi(880,.25),vt==null||vt.gate(`checkpoint-${Gt}`)),i.type==="crumble"&&!i.collapseAt&&(i.collapseAt=Qi+.8,In("⚠ This platform is crumbling!")),i.type==="bounce"&&(In("↑ Spring pad!"),pi(640,.1)),i.type==="ice"&&!i._iced&&(In("❄ Icy — keep your footing!"),i._iced=!0),i.index>Gr&&(Gr=i.index),i.type==="finish"){if(vt&&!vt.arcade&&!$n){fc=!0,Xt=!1,vt.gate("finish");return}bd()}}function MS(){for(const i of Wt.spinnerHazards){const e=i.base,t=vn.root.position.x-e.position.x,n=vn.root.position.z-e.position.z,s=i.pivot.rotation.y,r=Math.cos(s),o=-Math.sin(s),a=Math.abs(t*r+n*o),l=Math.abs(t*o-n*r),c=vn.root.position.y-e.position.y;if(a<i.reach+.26&&l<.44&&c>-.65&&c<1.65){Qc("Hit by the spinner!");return}}}function SS(i){var l;const e=vn.root.position,t=vS();if(kt&&An&&(e.x+=kt.dx,e.y+=kt.dy,e.z+=kt.dz,kt.type==="conveyor"&&(e.x+=(kt.pushX||0)*i,e.z+=(kt.pushZ||0)*i)),An&&(kt==null?void 0:kt.type)==="ice"){if(t.m>.01)wi=t.x*mr*1.25,Ai=t.z*mr*1.25;else{const c=Math.exp(-1.15*i);wi*=c,Ai*=c}e.x+=wi*i,e.z+=Ai*i}else wi=0,Ai=0,e.x+=t.x*mr*i,e.z+=t.z*mr*i;if(t.m>.01){const c=Math.atan2(-t.x,-t.z);vn.root.rotation.y+=Math.atan2(Math.sin(c-vn.root.rotation.y),Math.cos(c-vn.root.rotation.y))*Math.min(1,i*12)}dt.jumpRequested&&An&&(ji=nS,An=!1,kt=null,wi=0,Ai=0,pi(530,.07)),dt.jumpRequested=!1;const s=e.y;ji-=iS*i;const r=s+ji*i,o=Wt.findPlatformUnder(e.x,e.z,r,s,ji);if(o){const c=An&&kt===o;e.y=o.topY,ji=0,An=!0,kt=o,pc=o.topY,c||yS(o),o.type==="bounce"&&(ji=o.bounce||15,An=!1,kt=null,wi=0,Ai=0)}else e.y=r,An=!1,kt=null;const a=(l=Wt.waterLevel)!=null?l:-8;if(e.y<=a){Qc("Splash! Back to your checkpoint");return}MS();for(const c of Wt.collectibles)c.taken||Math.hypot(e.x-c.group.position.x,e.z-c.group.position.z)<1.02&&Math.abs(e.y+1.1-c.group.position.y)<1.65&&(c.taken=!0,c.group.visible=!1,bn.add(c.id),Wr(),pi(780,.12),In(`◆ Sky crystal found! ${bn.size}/${Ar()}`));vn.animate(Qi,t.m*mr,An,An?0:Math.max(0,e.y-pc))}function bS(i){const e=vn.root.position,t=Math.cos(qs)*na,n=new I(e.x,e.y+1.6,e.z),s=new I(e.x+Math.sin(Pi)*t,e.y+2.1+Math.sin(qs)*na,e.z+Math.cos(Pi)*t);is.position.lerp(s,1-Math.exp(-5.5*i)),is.lookAt(n)}function ES(){const i=Math.min(yd.getDelta(),.04);xS(i),hS(i),Xt&&!(vt&&vt.asking)?(Qi+=i,Ci+=i,Wt.update(Qi,i),SS(i),Kr()):(Wt.update(Qi,0),vn.animate(Qi,0,!0,0)),bS(i),Ys.update(i,Qi),Ys.render()}wt.setAnimationLoop(ES);window.addEventListener("resize",()=>{is.aspect=innerWidth/innerHeight,is.updateProjectionMatrix(),wt.setSize(innerWidth,innerHeight),Ys.resize(innerWidth,innerHeight)});vt=zM({root:ot("ask"),embedded:qr,onPause(){Xt=!1,dt.keys.clear(),dt.jumpRequested=!1},onResume(){if(fc){fc=!1,bd();return}!Ii.classList.contains("visible")&&!$n&&(Xt=!0)},onStar(i){Kr(),In(`★ Learning star! (${i})`),pi(920,.18)},onDuck(i){i?(Kh=ci,ci=!0):ci=Kh},onBoot(){!Xt&&!$n&&Jc()}});Kr();qr&&(pa.textContent="Climb the course. Clear a world to unlock the next one — pick it from the list.",Sn.innerHTML="START CLIMB <span>→</span>");!qr&&"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(i=>console.warn("Offline install unavailable:",i))});
