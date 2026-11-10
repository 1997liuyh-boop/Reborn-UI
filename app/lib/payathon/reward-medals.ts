/**
 * 奖励区（section#awards）的全部动效，入口为 mountRewardMedals：
 *
 * 1. 奖牌舞台：一张铺满视口的 WebGL 画布，绘制挂在双色挂带上的金属奖牌。奖牌可拖拽、用方向键推动，
 *    彼此碰撞；拖拽时奖牌与挂带逐渐「字符化」。拉得太远并坚持半秒会触发「奖牌拿不走」彩蛋弹窗，
 *    奖牌飞进弹窗并被铁栏关住。
 * 2. 字符鱼群：桌面端在每张赛道卡片背后插入一张 Canvas 2D，绘制由字符组成、横穿卡片游动的鲨鱼与蝠鲼。
 * 3. 刮刮卡：在组件数量上覆盖一层可刮开的银色涂层，数字被刮开九成后整层揭开，并迸出碎屑与闪光。
 *
 * 场景坐标约定（奖牌舞台）：每个 .reward-medal-stage 按钮对应一个 200×260 的场景坐标系，
 * 挂带固定端在 (100, 34)，奖牌静止时中心在 (100, 175)，挂环在奖牌中心沿摆角方向 45 处，
 * 挂绳自然长度 96，由 9 个节点（8 段）组成。
 */
import type { RopeNode, StrapNode, StrapPoint } from "./payathon-strap";
import type { FishRig, FishShape, FishSpecies, RigBinding } from "./reward-fish-rig";
import { observeActivity } from "./activity";
import {
  buildStrapTriangles,
  constrainRope,
  integrateRope,
  STRAP_SHADER_SNIPPET,
  STRAP_SUFFIX_SVG,
  STRAP_SUFFIX_WIDTH,
  STRAP_WORDMARK_SVG,
  STRAP_WORDMARK_WIDTH,
} from "./payathon-strap";
import { createMantaRig, createSpineRig, FISH_SHAPES } from "./reward-fish-rig";

type Vec2 = [number, number];
type Vec3 = [number, number, number];

/* ------------------------------------------------------------------------------------------------
 * 着色器
 * ---------------------------------------------------------------------------------------------- */

/**
 * 顶点着色器（奖牌、挂带、光晕、铁栏共用）
 *
 * - 顶点格式：a_position(3) + a_normal(3) + a_uv(2)，每顶点 32 字节；
 * - u_isMedal>.5 时为奖牌网格：uv.y< -500 标记顶部挂环，先绕挂环中心 (0,-47) 按 u_wobble 抖动；
 *   再按 u_modelScale 缩放，绕 Y 轴按倾角旋转（u_pose.zw 为倾角的 cos/sin），
 *   再绕 Z 轴按摆角旋转（u_swing 为摆角的 cos/sin），最后平移到奖牌中心 u_pose.xy；
 * - 其余网格（挂带、光晕、铁栏）在 CPU 侧已是场景坐标，直接投影；
 * - 投影：透视因子 600/(600-z*u_perspective)，把 200×260 的场景按按钮尺寸等比放入，
 *   以场景中心 (100,130) 对齐按钮中心，再加上按钮相对画布的偏移 u_offset，换算为裁剪坐标；深度取 -z/300。
 */
const MEDAL_VERTEX_SHADER = `
attribute vec3 a_position;attribute vec3 a_normal;attribute vec2 a_uv;
uniform vec2 u_size;uniform vec2 u_viewport;uniform vec2 u_offset;uniform float u_scale;uniform float u_perspective;
uniform float u_isMedal;uniform vec4 u_pose;uniform vec2 u_swing;uniform float u_modelScale;uniform float u_wobble;
varying MEDAL_PRECISION vec3 v_normal;varying MEDAL_PRECISION vec3 v_position;varying MEDAL_PRECISION vec2 v_uv;varying MEDAL_PRECISION vec2 v_screen;
void main(){
  vec3 p=a_position,n=a_normal;vec2 uv=a_uv;
  if(u_isMedal>.5){
    if(uv.y< -500.){
      uv.y+=1000.;
      float cw=cos(u_wobble),sw=sin(u_wobble);
      p.xy=vec2(p.x*cw-(p.y+47.)*sw,p.x*sw+(p.y+47.)*cw-47.);
      n.xy=vec2(n.x*cw-n.y*sw,n.x*sw+n.y*cw);
    }
    p*=u_modelScale;
    p.xz=vec2(p.x*u_pose.z+p.z*u_pose.w,-p.x*u_pose.w+p.z*u_pose.z);
    n.xz=vec2(n.x*u_pose.z+n.z*u_pose.w,-n.x*u_pose.w+n.z*u_pose.z);
    p.xy=vec2(p.x*u_swing.x-p.y*u_swing.y,p.x*u_swing.y+p.y*u_swing.x)+u_pose.xy;
    n.xy=vec2(n.x*u_swing.x-n.y*u_swing.y,n.x*u_swing.y+n.y*u_swing.x);
  }
  float perspective=600./(600.-p.z*u_perspective);
  float fit=min(u_size.x/200.,u_size.y/260.);
  vec2 screen=(p.xy-vec2(100.,130.))*perspective*fit*u_scale+u_size*.5;
  screen+=u_offset;
  gl_Position=vec4(screen.x/u_viewport.x*2.-1.,1.-screen.y/u_viewport.y*2.,-p.z/300.,1.);
  v_normal=n;v_position=p;v_uv=uv;v_screen=screen;
}`;

/**
 * 片元着色器。u_material 编码材质：0 背面挂带、1 正面挂带、2 奖牌、3 奖牌背后的光晕、4 牢笼铁栏。
 *
 * - safeNormalize：先除以最大分量再归一化，避免移动端 mediump 精度下相机距离的平方溢出；
 * - rodHit：光线与有限圆柱（侧面 + 两端盖）求交，圆柱尺寸与前景铁栏网格一致，用于在奖牌面上反射出铁栏；
 * - 光晕（3）：按到奖牌中心的距离做高斯衰减，变暗（u_dim）时去饱和；
 * - 挂带（0/1）：嵌入 STRAP_SHADER_SNIPPET 的织带着色，正面带贴图（材质判定改为 >.5，贴图坐标按挂带长度换算）；
 * - 金属（2/4）：前上方主光照亮正面、侧补光保留倒角起伏；高光、柔高光与菲涅尔；两盏影棚柔光箱按真实法线的反射方向映出；
 *   用倒角保持亮面、压低阴影底色；按 RGB 最大值整体压缩峰值，保留金属色相而不是逐通道削成白色；
 *   每 6.8 秒一次宽度呼吸、缓动行进、随角度响应的柔和扫光；外圈倒角用整圈背光勾边（不做移动的弧光）；
 *   铁栏（4）两侧有冷色背光掠过圆柱边缘，铁芯保持深色；奖牌被关进牢笼时（u_jail.w>.5）
 *   沿反射方向与 7 根铁栏求交，把铁栏以羽化的覆盖率映在奖牌面上，并保留底下的拉丝金属，避免出现发黑的反射带；
 * - 字符化：把亮度量化成 9 级，从 u_glyphs 字符图集取字形；拖拽时（u_pull 0~1）奖牌在自身坐标里自下而上转为字符，
 *   该过渡跟随奖牌移动，松手后独立于物理淡出；继续拉（u_pull 1~2）挂带从奖牌端向固定端转为字符；
 * - 挂带只丢弃固定端之外显式隐藏的那一截（u_hiddenStrap），从不丢弃自由摆动的中间部分。
 */
const MEDAL_FRAGMENT_SHADER = `
precision MEDAL_PRECISION float;
uniform vec4 u_card;uniform sampler2D u_strap;uniform float u_strapLength;uniform float u_hiddenStrap;uniform sampler2D u_glyphs;uniform float u_pull;uniform float u_dim;uniform vec3 u_color;uniform float u_material;uniform float u_time;
uniform vec4 u_jail;
uniform float u_jailGrowth[7];
varying MEDAL_PRECISION vec3 v_normal;varying MEDAL_PRECISION vec3 v_position;varying MEDAL_PRECISION vec2 v_uv;varying MEDAL_PRECISION vec2 v_screen;
vec3 safeNormalize(vec3 value){
  float scale=max(max(abs(value.x),abs(value.y)),abs(value.z));
  return normalize(value/max(scale,.0001));
}
float rodHit(vec3 origin,vec3 ray,float radius,float low,float high,out vec3 normal){
  float closest=10000.;normal=vec3(0.);
  float a=dot(ray.xz,ray.xz),b=dot(origin.xz,ray.xz);
  float c=dot(origin.xz,origin.xz)-radius*radius,d=b*b-a*c;
  if(a>.0001&&d>=0.){
    float root=sqrt(d);
    for(int side=0;side<2;side++){
      float t=(-b+(side==0?-root:root))/a;
      float y=origin.y+ray.y*t;
      if(t>.01&&t<closest&&y>=low&&y<=high){closest=t;normal=safeNormalize(vec3(origin.x+ray.x*t,0.,origin.z+ray.z*t));}
    }
  }
  if(abs(ray.y)>.0001){
    for(int cap=0;cap<2;cap++){
      float t=((cap==0?low:high)-origin.y)/ray.y;
      vec2 p=origin.xz+ray.xz*t;
      if(t>.01&&t<closest&&dot(p,p)<=radius*radius){closest=t;normal=vec3(0.,cap==0?-1.:1.,0.);}
    }
  }
  return closest;
}
void main(){
  vec3 color;
  if(u_material>2.5&&u_material<3.5){
    float radius=length(v_uv);
    float halo=exp(-radius*radius/2500.)*(1.-smoothstep(65.,90.,radius));
    vec3 haloColor=mix(u_color,vec3(dot(u_color,vec3(.299,.587,.114))),u_dim);
    gl_FragColor=vec4(haloColor,halo*.32*(1.-u_dim*.65));return;
  }
  if(u_material<1.5){
    ${STRAP_SHADER_SNIPPET.replace("vec3 color=", "color=").replace("u_material<1.5", "u_material>.5").replace("vec2(v_uv.x,fract(v_uv.y*3.))", "vec2(.5+(v_uv.x-.5)*.55,.5+(v_uv.y-.5)*u_strapLength/80.)")}
  }else{
    vec3 n=safeNormalize(v_normal);vec3 eye=u_jail.w>.5?vec3(0.,0.,1.):safeNormalize(vec3(100.,110.,600.)-v_position);
    vec3 key=safeNormalize(vec3(-.35,-.45,1.5));vec3 fill=safeNormalize(vec3(.8,.2,.6));
    float diffuse=max(dot(n,key),0.);float rim=max(dot(n,fill),0.);
    float spec=pow(clamp(dot(n,safeNormalize(key+eye)),0.,1.),64.);
    float soft=pow(clamp(dot(n,safeNormalize(fill+eye)),0.,1.),18.);
    float fresnel=pow(1.-clamp(dot(n,eye),0.,1.),3.);
    vec3 reflected=reflect(-eye,n);
    float box=pow(max(0.,1.-abs(reflected.x+.32)*2.8),8.)*smoothstep(-.5,.3,-reflected.y);
    float brush=.98+.02*sin(v_position.y*20.);
    float litFace=smoothstep(.35,.85,diffuse);
    float ambient=mix(.055,.20,litFace);
    float fillStrength=mix(.045,.14,litFace);
    color=u_color*(ambient+.95*diffuse+fillStrength*rim)*brush;
    color+=mix(u_color,vec3(1.),.25)*(spec*.30+soft*.10+box*.14)+u_color*fresnel*.08;
    float peak=max(color.r,max(color.g,color.b));
    color/=1.+peak*.45;
    float cycle=mod(u_time,6.8);
    float progress=clamp(cycle/3.2,0.,1.);
    float eased=progress*progress*(3.-2.*progress);
    float angle=.38+.22*sin(u_time*.43)+n.x*.35;
    vec2 axis=vec2(cos(angle),sin(angle));
    float band=dot(v_uv,axis)-mix(-70.,70.,eased)+reflected.x*9.;
    float width=4.+2.*sin(progress*3.14159);
    float window=smoothstep(0.,.45,cycle)*(1.-smoothstep(2.5,3.2,cycle));
    float sweep=exp(-band*band/(width*width))*window*smoothstep(.1,.7,n.z);
    color=mix(color,mix(u_color,vec3(1.),.65),sweep*.46);
    float radius=length(v_uv);
    float outerBevel=smoothstep(39.5,42.5,radius)*(1.-smoothstep(43.,44.,radius));
    float silhouette=pow(clamp(1.-abs(dot(n,eye)),0.,1.),1.4);
    float rimStrength=(u_material<2.5?outerBevel:silhouette*.32)*(.72+.22*silhouette);
    vec3 rimColor=mix(u_color,vec3(1.),.72);
    color=mix(color,rimColor,rimStrength);
    if(u_material>3.5){
      vec3 backLeft=safeNormalize(vec3(-1.,-.2,-.35)),backRight=safeNormalize(vec3(1.,.15,-.35));
      float edge=pow(clamp(1.-abs(dot(n,eye)),0.,1.),.7);
      float back=max(dot(n,backLeft),0.)+max(dot(n,backRight),0.);
      color=mix(color,vec3(.78,.87,.93),clamp(edge*back*.85,0.,.8));
    }else if(u_jail.w>.5){
      vec3 origin=(v_position-vec3(u_jail.xy,0.))/u_jail.z;
      float nearest=10000.;vec3 hitNormal=vec3(0.);
      for(int i=0;i<7;i++){
        float growth=u_jailGrowth[i];
        if(growth>.001){
          bool horizontal=i>=5;
          vec3 center=horizontal?vec3(0.,i==5?-46.:46.,33.):vec3(-44.+float(i)*22.,0.,36.);
          vec3 ro=origin-center,rd=reflected;
          if(horizontal){ro=ro.yxz;rd=rd.yxz;}
          float length=horizontal?112.:116.;vec3 hn;
          float distance=rodHit(ro,rd,horizontal?2.2:1.8,-length*.5,-length*.5+length*growth,hn);
          if(distance<nearest){nearest=distance;hitNormal=horizontal?hn.yxz:hn;}
        }
      }
      if(nearest<9999.){
        float reflectionLight=.12+.85*max(dot(hitNormal,key),0.)+.14*max(dot(hitNormal,fill),0.);
        float reflectionEdge=pow(clamp(1.-abs(dot(hitNormal,-reflected)),0.,1.),.7);
        vec3 steel=vec3(.34,.40,.45)*reflectionLight+vec3(.65,.75,.83)*reflectionEdge*.55;
        float rodCoverage=smoothstep(.05,.85,abs(dot(hitNormal,-reflected)));
        float faceCoverage=smoothstep(.45,.92,n.z);
        float bevelCoverage=1.-smoothstep(34.,43.,length(v_uv));
        vec3 reflectedSteel=steel*mix(vec3(1.),u_color,.55);
        reflectedSteel=max(reflectedSteel,color*.55);
        color=mix(color,reflectedSteel,.24*rodCoverage*faceCoverage*bevelCoverage);
      }
    }

  }
  if(u_material>3.5){gl_FragColor=vec4(color,1.);return;}
  float strapRoot=u_material<.5?1.-v_uv.y:v_uv.y;
  vec2 glyphPoint=u_material>1.5?v_uv+vec2(100.,175.):vec2(v_uv.x*11.,strapRoot*u_strapLength);
  vec2 cell=fract(glyphPoint/vec2(5.,7.));
  float light=dot(color,vec3(.299,.587,.114));
  float glyph=floor(clamp(light*1.9,0.,.999)*9.);
  float ink=texture2D(u_glyphs,vec2((glyph+cell.x)/9.,cell.y)).a;
  vec3 asciiColor=mix(vec3(.55,.61,.67),u_color,.25)*ink*(.65+light*.45);
  float metal=1.;
  if(u_material>1.5){
    float pullFront=mix(46.,-64.,min(u_pull,1.));
    metal*=1.-smoothstep(pullFront,pullFront+14.,v_uv.y);
  }else{
    float strapProgress=clamp(u_pull-1.,0.,1.);
    float strapFront=mix(1.02,-.12,strapProgress);
    metal*=1.-smoothstep(strapFront,strapFront+.10,strapRoot);
  }
  float alpha=mix(ink,1.,metal);
  if(alpha<.015)discard;
  color=mix(asciiColor,color,metal);
  color=mix(color,vec3(dot(color,vec3(.299,.587,.114))),u_dim);
  color*=1.-u_dim*.4;
  if(u_material<1.5){
    float root=u_material<.5?1.-v_uv.y:v_uv.y;
    if(root*u_strapLength<u_hiddenStrap)discard;
  }
  gl_FragColor=vec4(color,alpha);
}`;

/* ------------------------------------------------------------------------------------------------
 * 几何
 * ---------------------------------------------------------------------------------------------- */

/** 奖牌主体的旋转剖面 [半径, z]：绕 z 轴车削一周，得到正面带倒角、背面平整的圆饼 */
const MEDAL_PROFILE: Vec2[] = [
  [0, -5],
  [37, -5],
  [42, -2],
  [43, 1],
  [41, 5],
  [36, 7],
  [34, 5.5],
  [0, 5.5],
];

/** 奖牌正面浮雕数字的外轮廓，键与按钮的 data-medal-mark 一致；未知值按「1」处理 */
const DIGIT_OUTLINES: Record<string, Vec2[]> = {
  1: [
    [-14, -15],
    [-3, -25],
    [8, -25],
    [8, 15],
    [16, 15],
    [16, 25],
    [-15, 25],
    [-15, 15],
    [-4, 15],
    [-4, -10],
    [-14, -3],
  ],
  2: [
    [-19, -25],
    [12, -25],
    [20, -17],
    [20, -2],
    [-7, 15],
    [20, 15],
    [20, 25],
    [-20, 25],
    [-20, 10],
    [7, -7],
    [7, -14],
    [-7, -14],
    [-7, -7],
    [-19, -7],
  ],
  3: [
    [-19, -25],
    [12, -25],
    [20, -17],
    [20, 17],
    [12, 25],
    [-19, 25],
    [-19, 14],
    [7, 14],
    [7, 5],
    [-11, 5],
    [-11, -5],
    [7, -5],
    [7, -14],
    [-19, -14],
  ],
};

/** 挂环（圆环面）的顶点数：32×10 个四边形 × 6；它们位于网格末尾，用于在 uv 上做标记 */
const RING_VERTEX_COUNT = 320 * 6;

/**
 * 生成奖牌网格：车削主体 + 正面浮雕标记 + 顶部挂环
 * @param mark 正面标记：「✦」为十角星，其余按数字轮廓
 * @returns 交错顶点数据，每顶点 [x, y, z, nx, ny, nz, u, v]；uv 此处全为 0，由调用方回填
 */
function buildMedalGeometry(mark: string | undefined): Float32Array {
  const data: number[] = [];
  const pushVertex = (
    position: readonly number[],
    normal: readonly number[],
    uv: readonly number[] = [0, 0],
  ) => data.push(...position, ...normal, ...uv);
  const pushTriangle = (
    a: readonly number[],
    b: readonly number[],
    c: readonly number[],
    normal: readonly number[],
  ) => {
    pushVertex(a, normal);
    pushVertex(b, normal);
    pushVertex(c, normal);
  };

  // 车削主体：剖面相邻两点之间绕一周切 96 段，法线取剖面线段的垂直方向
  for (let index = 0; index < MEDAL_PROFILE.length - 1; index++) {
    const [r0, z0] = MEDAL_PROFILE[index]!;
    const [r1, z1] = MEDAL_PROFILE[index + 1]!;
    const edge = Math.hypot(z1 - z0, r1 - r0) || 1;
    for (let step = 0; step < 96; step++) {
      const a0 = (step / 96) * Math.PI * 2;
      const a1 = ((step + 1) / 96) * Math.PI * 2;
      const pointAt = (radius: number, z: number, angle: number): Vec3 => [
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        z,
      ];
      const normalAt = (angle: number): Vec3 => [
        ((z1 - z0) / edge) * Math.cos(angle),
        ((z1 - z0) / edge) * Math.sin(angle),
        (r0 - r1) / edge,
      ];
      for (const [radius, z, angle] of [
        [r0, z0, a0],
        [r1, z1, a0],
        [r0, z0, a1],
        [r0, z0, a1],
        [r1, z1, a0],
        [r1, z1, a1],
      ] as const) {
        pushVertex(pointAt(radius, z, angle), normalAt(angle));
      }
    }
  }

  /**
   * 把平面轮廓挤出为带斜面的浮雕：
   * 底部 z=5.5 → z=10.8 为直壁，z=12 内缩 0.4、z=13 内缩 1.4 形成倒角，顶面在 z=13 用耳切法三角化
   */
  const extrudeMark = (points: Vec2[]) => {
    const cross = (a: Vec2, b: Vec2, c: Vec2) =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    // 有向面积为负时反转顶点顺序，统一绕向，使下面的法线朝向轮廓内侧
    const area = points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length]!;
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0);
    const outline = area < 0 ? [...points].reverse() : points;
    // 按斜接方式整体内缩 distance：顶点沿前后两条边法线之和移动，夹角越尖移动越远（下限 0.25 防止爆点）
    const inset = (distance: number) =>
      outline.map((point, index): Vec2 => {
        const prev = outline[(index + outline.length - 1) % outline.length]!;
        const next = outline[(index + 1) % outline.length]!;
        const inLength = Math.hypot(point[0] - prev[0], point[1] - prev[1]);
        const outLength = Math.hypot(next[0] - point[0], next[1] - point[1]);
        const inNormal: Vec2 = [-(point[1] - prev[1]) / inLength, (point[0] - prev[0]) / inLength];
        const outNormal: Vec2 = [
          -(next[1] - point[1]) / outLength,
          (next[0] - point[0]) / outLength,
        ];
        const miter =
          distance / Math.max(0.25, 1 + inNormal[0] * outNormal[0] + inNormal[1] * outNormal[1]);
        return [
          point[0] + (inNormal[0] + outNormal[0]) * miter,
          point[1] + (inNormal[1] + outNormal[1]) * miter,
        ];
      });
    const face = inset(1.4);

    // 耳切法：反复找一个凸顶点、且三角形内没有其他剩余顶点的「耳朵」切掉
    const remaining = face.map((_, index) => index);
    while (remaining.length > 2) {
      let clipped = false;
      for (let index = 0; index < remaining.length; index++) {
        const prevIndex = remaining[(index + remaining.length - 1) % remaining.length]!;
        const earIndex = remaining[index]!;
        const nextIndex = remaining[(index + 1) % remaining.length]!;
        const a = face[prevIndex]!;
        const b = face[earIndex]!;
        const c = face[nextIndex]!;
        const isConvex = !(cross(a, b, c) <= 0);
        if (
          isConvex &&
          !remaining.some(
            (other) =>
              other !== prevIndex &&
              other !== earIndex &&
              other !== nextIndex &&
              cross(a, b, face[other]!) >= 0 &&
              cross(b, c, face[other]!) >= 0 &&
              cross(c, a, face[other]!) >= 0,
          )
        ) {
          pushTriangle([...a, 13], [...b, 13], [...c, 13], [0, 0, 1]);
          remaining.splice(index, 1);
          clipped = true;
          break;
        }
      }
      if (!clipped) break;
    }

    // 侧壁：相邻两层之间逐边拼四边形，法线取两条边的叉积
    const levels = [
      { points: outline, z: 5.5 },
      { points: outline, z: 10.8 },
      { points: inset(0.4), z: 12 },
      { points: face, z: 13 },
    ];
    for (let level = 0; level < levels.length - 1; level++) {
      for (let index = 0; index < outline.length; index++) {
        const nextIndex = (index + 1) % outline.length;
        const lower = levels[level]!;
        const upper = levels[level + 1]!;
        const a: Vec3 = [...lower.points[index]!, lower.z];
        const b: Vec3 = [...lower.points[nextIndex]!, lower.z];
        const c: Vec3 = [...upper.points[index]!, upper.z];
        const d: Vec3 = [...upper.points[nextIndex]!, upper.z];
        const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
        const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]] as const;
        const normal: Vec3 = [
          ab[1] * ac[2] - ab[2] * ac[1],
          ab[2] * ac[0] - ab[0] * ac[2],
          ab[0] * ac[1] - ab[1] * ac[0],
        ];
        const length = Math.hypot(...normal) || 1;
        pushTriangle(
          a,
          b,
          c,
          normal.map((value) => value / length),
        );
        pushTriangle(
          c,
          b,
          d,
          normal.map((value) => value / length),
        );
      }
    }
  };

  if (mark === "✦") {
    // 十角星：外半径 25、内半径 10 交替
    extrudeMark(
      Array.from({ length: 10 }, (_, index): Vec2 => {
        const angle = (index * Math.PI) / 5 - Math.PI / 2;
        const radius = index % 2 ? 10 : 25;
        return [Math.cos(angle) * radius, Math.sin(angle) * radius];
      }),
    );
  } else {
    extrudeMark(DIGIT_OUTLINES[String(mark)] || DIGIT_OUTLINES[1]!);
  }

  // 顶部挂环：中心 (0,-47)、主半径 6、管半径 2 的圆环面，32×10 段
  const ringPoint = (around: number, tube: number): Vec3 => [
    (6 + 2 * Math.cos(tube)) * Math.cos(around),
    -47 + (6 + 2 * Math.cos(tube)) * Math.sin(around),
    2 * Math.sin(tube),
  ];
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 10; j++) {
      const around = (i * Math.PI) / 16;
      const tube = (j * Math.PI) / 5;
      const aroundStep = Math.PI / 16;
      const tubeStep = Math.PI / 5;
      for (const [a, t] of [
        [around, tube],
        [around + aroundStep, tube],
        [around, tube + tubeStep],
        [around, tube + tubeStep],
        [around + aroundStep, tube],
        [around + aroundStep, tube + tubeStep],
      ] as const) {
        pushVertex(ringPoint(a, t), [
          Math.cos(a) * Math.cos(t),
          Math.sin(a) * Math.cos(t),
          Math.sin(t),
        ]);
      }
    }
  }
  return new Float32Array(data);
}

/** 牢笼的一根铁栏（中心坐标在牢笼局部坐标里），vertices 为完整长度时的网格 */
interface JailBar {
  x: number;
  y: number;
  z: number;
  length: number;
  radius: number;
  horizontal: boolean;
  vertices: Float32Array;
}

/**
 * 生成牢笼铁栏：5 根竖杆（z=36）+ 上下 2 根横杆（z=33），尺寸与片元着色器里 rodHit 的圆柱一致
 * @returns 每根铁栏的参数与网格，uv 存放该顶点的 xy，供生长动画按长度裁切
 */
function buildJailBars(): JailBar[] {
  const bars = [
    ...[-44, -22, 0, 22, 44].map((x) => ({
      x,
      y: 0,
      z: 36,
      length: 116,
      radius: 1.8,
      horizontal: false,
    })),
    ...[-46, 46].map((y) => ({
      x: 0,
      y,
      z: 33,
      length: 112,
      radius: 2.2,
      horizontal: true,
    })),
  ];
  return bars.map((bar) => {
    const data: number[] = [];
    /**
     * @param along 沿杆方向的坐标
     * @param angle 绕杆的角度
     * @param mode 0 侧面；2 端盖中心；±1 端盖边缘（端盖法线稍后统一改写为轴向）
     */
    const pushVertex = (along: number, angle: number, mode = 0) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const radius = mode === 2 ? 0 : bar.radius;
      const sideNormal = mode ? 0 : 1;
      const axialNormal = mode === -1 ? -1 : mode ? 1 : 0;
      const x = bar.horizontal ? along : radius * cos;
      const y = bar.horizontal ? radius * cos : along;
      data.push(
        x + bar.x,
        y + bar.y,
        bar.z + radius * sin,
        bar.horizontal ? axialNormal : cos * sideNormal,
        bar.horizontal ? cos * sideNormal : axialNormal,
        sin * sideNormal,
        x + bar.x,
        y + bar.y,
      );
    };
    const half = bar.length / 2;
    for (let step = 0; step < 20; step++) {
      const a0 = (step / 20) * Math.PI * 2;
      const a1 = ((step + 1) / 20) * Math.PI * 2;
      for (const [along, angle] of [
        [-half, a0],
        [half, a0],
        [-half, a1],
        [-half, a1],
        [half, a0],
        [half, a1],
      ] as const) {
        pushVertex(along, angle);
      }
      for (const side of [-1, 1]) {
        const start = data.length;
        pushVertex(side * half, 0, 2);
        pushVertex(side * half, a0, side);
        pushVertex(side * half, a1, side);
        for (let offset = start; offset < data.length; offset += 8) {
          data[offset + 3] = bar.horizontal ? side : 0;
          data[offset + 4] = bar.horizontal ? 0 : side;
          data[offset + 5] = 0;
        }
      }
    }
    return { ...bar, vertices: new Float32Array(data) };
  });
}

/**
 * 字符图集：9 个 5×7 点阵字形，从暗到亮依次为 . : - = + * # % @，
 * 片元着色器把亮度量化为 0~8 取对应字形
 */
const ASCII_GLYPHS = [
  ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
  ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  ["11001", "11010", "00100", "00100", "01000", "10110", "00110"],
  ["01110", "10001", "10111", "10101", "10111", "10000", "01111"],
];

/** 三种奖牌的金属色（线性 RGB） */
const METAL_COLORS: Record<string, Vec3> = {
  gold: [0.94, 0.67, 0.24],
  silver: [0.73, 0.79, 0.87],
  bronze: [0.76, 0.4, 0.21],
};

/** 着色器里按名字查找的 uniform（不含 u_ 前缀） */
const UNIFORM_NAMES = [
  "size",
  "viewport",
  "offset",
  "scale",
  "perspective",
  "color",
  "material",
  "time",
  "pull",
  "dim",
  "card",
  "jail",
  "isMedal",
  "pose",
  "swing",
  "modelScale",
  "wobble",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

/** 指针落在这些区域内时，不触发奖牌的拖拽命中与悬停高亮 */
const OVERLAY_SELECTOR = '[data-payathon-header],nav,dialog,[aria-modal="true"]';

/* ------------------------------------------------------------------------------------------------
 * 奖牌舞台
 * ---------------------------------------------------------------------------------------------- */

interface MedalMesh {
  buffer: WebGLBuffer;
  /** 顶点数 */
  count: number;
}

/** 按钮在视口中的矩形 */
interface SceneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 一枚奖牌的完整状态，坐标均为该按钮的 200×260 场景坐标 */
interface MedalScene {
  button: HTMLButtonElement;
  track: HTMLElement;
  item: HTMLElement;
  mesh: MedalMesh;
  metal: Vec3;
  /** 挂带颜色（来自 --track-color），布局时更新 */
  color: number[];
  /** 奖牌中心，按 Verlet 积分 */
  body: RopeNode;
  /** 挂绳 9 个节点，首节点钉在 (100, 34) */
  nodes: RopeNode[];
  /** 摆角（绕视线方向），oldAngle 为上一步的值 */
  angle: number;
  oldAngle: number;
  /** 倾角（绕竖直轴），spin 为倾角速度 */
  tilt: number;
  spin: number;
  /** 挂绳被拉长的量及其回弹速度 */
  extension: number;
  extensionVelocity: number;
  /** 连续静止的物理步数，超过 100 步不再模拟 */
  quiet: number;
  /** 非当前赛道的变暗程度 0~1 */
  dim: number;
  /** 字符化进度 0~2：0~1 奖牌、1~2 挂带 */
  dataPull: number;
  visible: boolean;
  /** 是否曾进入视口（入场掉落只播一次） */
  entered: boolean;
  /** 是否已开始绘制与模拟 */
  started: boolean;
  /** 等待依次掉落入场 */
  dropPending: boolean;
  /** 入场后经过的秒数，驱动扫光与警告抖动 */
  entrance: number;
  rect: SceneRect | null;
  /** 所在赛道卡片的矩形，每帧更新 */
  cardRect: DOMRect | undefined;
  /** 挂载前按钮的禁用状态，清理时恢复 */
  initiallyDisabled: boolean;
}

/** 拖拽状态：x/y 为指针的场景坐标，dx/dy 为按下时指针相对奖牌中心的偏移 */
interface DragState {
  scene: MedalScene;
  id: number;
  clientX: number;
  clientY: number;
  /** 首次超过警告距离时的拉伸量（像素），未超过时为 null */
  warningAt: number | null;
  /** 超过撕扯距离后已坚持的秒数，未超过时为 null */
  tearHold: number | null;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

/** 彩蛋弹窗状态：记录飞入前的姿态，用于插值与关闭时恢复 */
interface EggState {
  scene: MedalScene;
  time: number;
  x: number;
  y: number;
  angle: number;
  tilt: number;
  dataPull: number;
  /** 打开前 <html> 的内联 overflow，关闭时恢复 */
  scrollOverflow: string;
  scale?: number;
  projectionEase?: number;
  /** 牢笼中心（弹窗舞台中心的场景坐标） */
  jailCenter?: { x: number; y: number };
}

interface ClientPoint {
  clientX: number;
  clientY: number;
}

/**
 * 挂载一个 .reward-medals 区块的奖牌舞台
 * @param medals .reward-medals 元素
 * @returns 清理函数
 */
function mountMedalStage(medals: HTMLElement): () => void {
  // 本页样式都收在 #payathon-page 里，画布挂到页面根节点上才能命中 .reward-medals-canvas 的定位规则；
  // 页面根节点是静态定位，绝对定位仍以文档为参照，与原站挂在 body 上一致
  const canvasHost = medals.closest<HTMLElement>("#payathon-page") ?? document.body;
  const jailBars = buildJailBars();
  const canvas = document.createElement("canvas");
  canvas.className = "reward-medals-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!context) return () => {};
  const gl: WebGLRenderingContext = context;
  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const compactViewport = matchMedia("(max-width:760px)");
  const eggDialog = medals.querySelector<HTMLDialogElement>("[data-medal-egg]");
  const eggStage = medals.querySelector<HTMLElement>("[data-medal-egg-stage]");
  let egg: EggState | null = null;
  /** 画布左上角在视口中的位置 */
  let canvasOrigin = { x: 0, y: 0 };
  /** 距离下一枚奖牌掉落入场的剩余秒数 */
  let dropCooldown = 0;
  /** WebGL 上下文丢失或已清理 */
  let disposed = false;
  let frameId = 0;
  let lastFrameTime = 0;
  /** 固定 60Hz 物理步长的时间累加器 */
  let stepAccumulator = 0;
  let hoveredScene: MedalScene | null = null;
  let focusedScene: MedalScene | null = null;
  let drag: DragState | null = null;
  /** 挂带字标贴图是否已就绪；就绪前不开始渲染 */
  let strapTextureReady = false;
  /** 拖拽后吞掉紧随的一次 click，避免误触按钮 */
  let suppressClick = false;

  // 片元着色器支持 highp 时用 highp，否则退回 mediump
  const precisionHeader = `#define MEDAL_PRECISION ${(gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision ?? 0) > 0 ? "highp" : "mediump"}\n`;
  const compileShader = (type: number, source: string): WebGLShader => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, precisionHeader + source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(
        `Medal ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader compilation failed: ${log}`,
      );
    }
    return shader;
  };
  let linkedProgram: WebGLProgram | undefined;
  try {
    const vertexShader = compileShader(gl.VERTEX_SHADER, MEDAL_VERTEX_SHADER);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, MEDAL_FRAGMENT_SHADER);
    linkedProgram = gl.createProgram();
    gl.attachShader(linkedProgram, vertexShader);
    gl.attachShader(linkedProgram, fragmentShader);
    gl.linkProgram(linkedProgram);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(linkedProgram, gl.LINK_STATUS)) {
      throw new Error(`Medal program link failed: ${gl.getProgramInfoLog(linkedProgram)}`);
    }
  } catch (error) {
    console.error("[payathon-medals] WebGL initialization failed", error);
    if (linkedProgram) gl.deleteProgram(linkedProgram);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return () => {};
  }
  const program: WebGLProgram = linkedProgram;

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);
  /** 挂带、光晕、铁栏每次绘制都重新上传的动态顶点缓冲 */
  const dynamicBuffer = gl.createBuffer();
  const strapTexture = gl.createTexture();
  const uniforms = Object.fromEntries(
    UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, `u_${name}`)]),
  ) as Record<UniformName, WebGLUniformLocation | null>;
  const jailGrowthLocation = gl.getUniformLocation(program, "u_jailGrowth[0]");
  const strapLengthLocation = gl.getUniformLocation(program, "u_strapLength");
  const hiddenStrapLocation = gl.getUniformLocation(program, "u_hiddenStrap");
  /** 7 根铁栏各自的生长进度 0~1 */
  const jailGrowth = new Float32Array(7);
  gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
  const attributes = (
    [
      ["position", 3, 0],
      ["normal", 3, 12],
      ["uv", 2, 24],
    ] as const
  ).map(([name, size, offset]) => ({
    location: gl.getAttribLocation(program, `a_${name}`),
    size,
    offset,
  }));
  for (const { location, size, offset } of attributes) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset);
  }
  gl.bindTexture(gl.TEXTURE_2D, strapTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "u_strap"), 0);

  // 字符图集：9 个字形横排在 144×16 的画布上，每格 16 像素，点阵每点 2×2 像素
  const glyphTexture = gl.createTexture();
  const glyphCanvas = document.createElement("canvas");
  glyphCanvas.width = 144;
  glyphCanvas.height = 16;
  const glyphContext = glyphCanvas.getContext("2d")!;
  glyphContext.fillStyle = "#fff";
  ASCII_GLYPHS.forEach((rows, glyph) =>
    rows.forEach((row, rowIndex) =>
      [...row].forEach((bit, column) => {
        if (bit === "1") glyphContext.fillRect(glyph * 16 + 3 + column * 2, 1 + rowIndex * 2, 2, 2);
      }),
    ),
  );
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, glyphTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphCanvas);
  gl.uniform1i(gl.getUniformLocation(program, "u_glyphs"), 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, strapTexture);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /** 同一标记的奖牌共用一份静态网格 */
  const meshCache = new Map<string | undefined, MedalMesh>();
  const tracks = [...medals.querySelectorAll<HTMLElement>(".reward-medal-track")];

  const scenes: MedalScene[] = [
    ...medals.querySelectorAll<HTMLButtonElement>(".reward-medal-stage"),
  ].map((button) => ({
    button,
    track: button.closest<HTMLElement>(".reward-medal-track")!,
    item: button.closest<HTMLElement>(".reward-medal-item")!,
    mesh: getMedalMesh(button.dataset.medalMark),
    metal: METAL_COLORS[String(button.dataset.medalMetal)]!,
    color: [0.51, 0.71, 1],
    body: { x: 100, y: 175, px: 100, py: 175 },
    nodes: Array.from({ length: 9 }, (_, index) => ({
      x: 100,
      y: 34 + index * 12,
      px: 100,
      py: 34 + index * 12,
    })),
    angle: 0,
    oldAngle: 0,
    tilt: -0.28,
    spin: 0,
    extension: 0,
    extensionVelocity: 0,
    quiet: 0,
    dim: 0,
    dataPull: 0,
    visible: false,
    entered: false,
    started: false,
    dropPending: false,
    entrance: 0,
    rect: null,
    cardRect: undefined,
    initiallyDisabled: button.disabled,
  }));

  /**
   * 取（或创建）某个标记的奖牌网格；顶点 uv 回填为自身 xy，
   * 末尾的挂环顶点 uv.y 再减 1000，供顶点着色器识别并单独抖动
   */
  function getMedalMesh(mark: string | undefined): MedalMesh {
    const cached = meshCache.get(mark);
    if (cached) return cached;
    const vertices = buildMedalGeometry(mark);
    const ringStart = vertices.length - RING_VERTEX_COUNT * 8;
    for (let offset = 0; offset < vertices.length; offset += 8) {
      vertices[offset + 6] = vertices[offset]!;
      vertices[offset + 7] = vertices[offset + 1]! - (offset >= ringStart ? 1e3 : 0);
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const mesh = { buffer, count: vertices.length / 8 };
    meshCache.set(mark, mesh);
    return mesh;
  }

  /** 绑定顶点缓冲并重新指定三个属性的布局 */
  function bindVertexBuffer(buffer: WebGLBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    for (const { location, size, offset } of attributes) {
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset);
    }
  }

  /**
   * 同步当前赛道的高亮类名；有可见奖牌且贴图就绪时启动渲染循环
   * 「当前奖牌」优先级：正在拖拽 > 指针悬停 > 键盘焦点
   */
  function refresh() {
    const current = drag?.scene || hoveredScene || focusedScene;
    medals.classList.toggle("has-current-medal", !!current);
    for (const scene of scenes) {
      scene.item.classList.toggle("is-current-medal", !!(current && scene.track === current.track));
    }
    for (const track of medals.querySelectorAll(".reward-medal-track")) {
      track.classList.toggle("has-current-medal", !!(current && track.contains(current.button)));
      track.classList.toggle(
        "is-glow-active",
        !disposed &&
          !document.hidden &&
          !egg &&
          scenes.some((scene) => scene.track === track && scene.visible),
      );
    }
    if (
      !frameId &&
      !disposed &&
      strapTextureReady &&
      !document.hidden &&
      (egg || scenes.some((scene) => scene.visible))
    ) {
      lastFrameTime = 0;
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  /** 奖牌回到静止姿态：挂绳竖直、奖牌正挂、倾角 -0.28 */
  function resetScene(scene: MedalScene) {
    Object.assign(scene.body, { x: 100, y: 175, px: 100, py: 175 });
    scene.nodes.forEach((node, index) =>
      Object.assign(node, { x: 100, y: 34 + index * 12, px: 100, py: 34 + index * 12 }),
    );
    scene.dataPull = 0;
    scene.angle = 0;
    scene.oldAngle = 0;
    scene.spin = 0;
    scene.extension = 0;
    scene.extensionVelocity = 0;
    scene.tilt = -0.28;
    scene.quiet = 0;
  }

  /**
   * 入场掉落的初始姿态：奖牌提到 y=65、带向下 3 和向右 1 的初速度，
   * 挂绳从锚点连到挂环，中段向右鼓出 42（正弦形），松手后自然坠落摆荡
   */
  function prepareDrop(scene: MedalScene) {
    resetScene(scene);
    Object.assign(scene.body, { y: 65, py: 62, px: 99 });
    scene.angle = -0.08;
    scene.oldAngle = -0.08;
    const clipX = scene.body.x + Math.sin(scene.angle) * 45;
    const clipY = scene.body.y - Math.cos(scene.angle) * 45;
    scene.nodes.forEach((node, index) => {
      const progress = index / 8;
      const x = 100 + (clipX - 100) * progress + 42 * Math.sin(Math.PI * progress);
      const y = 34 + (clipY - 34) * progress;
      Object.assign(node, { x, y, px: x, py: y });
    });
  }

  /**
   * 一步物理模拟（1/60 秒）：
   * 挂绳与奖牌各自 Verlet 积分 → 摆角追随挂绳末段方向 → 倾角受横向速度驱动回正 →
   * 挂绳可被拉长并弹性回缩 → 28 轮距离约束把挂绳末端与挂环对齐 → 绳绷紧时把中间节点拉直
   */
  function stepScene(scene: MedalScene) {
    const body = scene.body;
    const nodes = scene.nodes;
    let motion = integrateRope(nodes);
    const vx = (body.x - body.px) * 0.987;
    const vy = (body.y - body.py) * 0.987;
    body.px = body.x;
    body.py = body.y;
    body.x += vx;
    body.y += vy + 0.42;
    const activeDrag = drag?.scene === scene ? drag : null;
    const dragging = activeDrag !== null;
    if (activeDrag) {
      // 页面可能滚动过，按记录的指针视口坐标重新换算场景坐标
      Object.assign(activeDrag, clientToScene(activeDrag, scene));
      body.x = activeDrag.x - activeDrag.dx;
      body.y = activeDrag.y - activeDrag.dy;
    }
    const end = nodes.at(-1)!;
    const beforeEnd = nodes.at(-2)!;
    // 目标摆角跟随挂绳末段方向，用 tanh 软限幅在 ±0.6 弧度内
    const targetAngle =
      0.6 *
      Math.tanh((-Math.atan2(end.x - beforeEnd.x, Math.max(1, end.y - beforeEnd.y)) * 0.8) / 0.6);
    // 摆角速度同样软限幅在 ±0.05
    const angleStep = 0.05 * Math.tanh(((scene.angle - scene.oldAngle) * 0.9) / 0.05);
    scene.oldAngle = scene.angle;
    scene.angle += angleStep + (targetAngle - scene.angle) * 0.018;
    scene.spin = (scene.spin + vx * 0.0018) * 0.94;
    scene.tilt += scene.spin + (-0.28 - scene.tilt) * 0.015;
    const clip = {
      x: body.x + Math.sin(scene.angle) * 45,
      y: body.y - Math.cos(scene.angle) * 45,
    };
    const reach = Math.hypot(clip.x - 100, clip.y - 34);
    const stretch = Math.max(0, reach - 96);
    if (dragging) {
      scene.extension = stretch;
      scene.extensionVelocity = 0;
    } else {
      // 松手后被拉长的挂绳按弹簧回缩
      scene.extensionVelocity = (scene.extensionVelocity - scene.extension * 0.025) * 0.94;
      scene.extension += scene.extensionVelocity;
    }
    const ropeLength = Math.max(30, 96 + scene.extension);
    if (!dragging && reach > ropeLength) {
      const pullX = ((clip.x - 100) / reach) * (reach - ropeLength);
      const pullY = ((clip.y - 34) / reach) * (reach - ropeLength);
      body.x -= pullX;
      body.y -= pullY;
    }
    for (let iteration = 0; iteration < 28; iteration++) {
      constrainRope(nodes, 100, 34, ropeLength / 8);
      const tip = nodes.at(-1)!;
      const dx = body.x + Math.sin(scene.angle) * 45 - tip.x;
      const dy = body.y - Math.cos(scene.angle) * 45 - tip.y;
      // 挂绳末端向挂环靠拢 80%，奖牌反向让出 20%（拖拽中奖牌跟手，不让）
      tip.x += dx * 0.8;
      tip.y += dy * 0.8;
      if (!dragging) {
        body.x -= dx * 0.2;
        body.y -= dy * 0.2;
      }
    }
    const tip = nodes.at(-1)!;
    tip.x = body.x + Math.sin(scene.angle) * 45;
    tip.y = body.y - Math.cos(scene.angle) * 45;
    // 绳长超过 85% 后开始把中间节点拉向锚点与末端的连线，满绷时每步拉直 20%（同时平移上一步位置，不注入速度）
    const tension = Math.hypot(tip.x - 100, tip.y - 34) / ropeLength;
    const taut = Math.max(0, Math.min(1, (tension - 0.85) / 0.15));
    const straighten = 0.2 * taut * taut * (3 - 2 * taut);
    const last = nodes[8]!;
    for (let index = 1; index < 8; index++) {
      const node = nodes[index]!;
      const dx = (100 + ((last.x - 100) * index) / 8 - node.x) * straighten;
      const dy = (34 + ((last.y - 34) * index) / 8 - node.y) * straighten;
      node.x += dx;
      node.px += dx;
      node.y += dy;
      node.py += dy;
    }
    motion +=
      Math.abs(vx) +
      Math.abs(vy) +
      Math.abs(angleStep) * 100 +
      Math.abs(scene.extensionVelocity) +
      Math.abs(scene.spin) * 50;
    scene.quiet = motion < 0.4 && !dragging ? scene.quiet + 1 : 0;
  }

  /**
   * 把奖牌局部坐标变换到场景坐标：缩放（仅彩蛋中）→ 绕竖直轴倾斜 → 绕视线方向摆动 → 平移到奖牌中心
   * @returns [x, y, z]
   */
  function transformMedalPoint(scene: MedalScene, x: number, y: number, z: number): Vec3 {
    const scale = (egg?.scene === scene && egg.scale) || 1;
    x *= scale;
    y *= scale;
    z *= scale;
    const tiltCos = Math.cos(scene.tilt);
    const tiltSin = Math.sin(scene.tilt);
    const swingCos = Math.cos(scene.angle);
    const swingSin = Math.sin(scene.angle);
    const tiltedX = x * tiltCos + z * tiltSin;
    const tiltedZ = -x * tiltSin + z * tiltCos;
    return [
      tiltedX * swingCos - y * swingSin + scene.body.x,
      tiltedX * swingSin + y * swingCos + scene.body.y,
      tiltedZ,
    ];
  }

  /**
   * 同一列表内相邻奖牌的碰撞：在屏幕像素空间里把两枚奖牌视为半径 43 的圆，
   * 重叠超过 0.15 时按权重推开（被拖拽的一方不动），相向运动时再加一次带 1.48 倍恢复系数的冲量，
   * 推开后对挂绳做 6 轮约束，让挂绳跟上奖牌。允许的最小间距不超过两者静止时的间距。
   */
  function resolveCollisions() {
    const active = scenes.filter(
      (scene): scene is MedalScene & { rect: SceneRect } =>
        scene.visible && scene.started && !!scene.rect,
    );
    const toScreen = (scene: MedalScene & { rect: SceneRect }) => {
      const rect = scene.rect;
      const scale = Math.min(rect.width / 200, rect.height / 260);
      return {
        x: rect.x + rect.width / 2 + (scene.body.x - 100) * scale,
        y: rect.y + rect.height / 2 + (scene.body.y - 130) * scale,
        scale,
        radius: 43 * scale,
      };
    };
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const first = active[i]!;
          const second = active[j]!;
          if (first.item.parentElement !== second.item.parentElement) continue;
          const a = toScreen(first);
          const b = toScreen(second);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const restDistance = Math.hypot(
            second.rect.x + second.rect.width / 2 - first.rect.x - first.rect.width / 2,
            second.rect.y +
              second.rect.height / 2 +
              45 * b.scale -
              first.rect.y -
              first.rect.height / 2 -
              45 * a.scale,
          );
          const overlap = Math.min(a.radius + b.radius, restDistance) - distance;
          if (overlap <= 0.15) continue;
          const nx = distance > 0.001 ? dx / distance : 1;
          const ny = distance > 0.001 ? dy / distance : 0;
          const firstWeight = drag?.scene === first ? 0 : 1;
          const secondWeight = drag?.scene === second ? 0 : 1;
          const totalWeight = firstWeight + secondWeight;
          if (!totalWeight) continue;
          const firstVx = (first.body.x - first.body.px) * a.scale;
          const firstVy = (first.body.y - first.body.py) * a.scale;
          const secondVx = (second.body.x - second.body.px) * b.scale;
          const secondVy = (second.body.y - second.body.py) * b.scale;
          const approach = (secondVx - firstVx) * nx + (secondVy - firstVy) * ny;
          const impulse = approach < -0.02 ? Math.min(20, (-approach * 1.48) / totalWeight) : 0;
          const correction = ((overlap - 0.15) * 0.85) / totalWeight;
          for (const [scene, screen, weight, sign] of [
            [first, a, firstWeight, -1],
            [second, b, secondWeight, 1],
          ] as const) {
            if (!weight) continue;
            // 位置修正同时平移上一步位置，不改变速度；冲量只改上一步位置，相当于改速度
            const shiftX = (nx * correction * sign) / screen.scale;
            const shiftY = (ny * correction * sign) / screen.scale;
            scene.body.x += shiftX;
            scene.body.px += shiftX;
            scene.body.y += shiftY;
            scene.body.py += shiftY;
            scene.body.px -= (nx * impulse * sign) / screen.scale;
            scene.body.py -= (ny * impulse * sign) / screen.scale;
            scene.oldAngle -= ny * impulse * sign * 0.0015;
            if (impulse > 0.02 || overlap > 0.5) scene.quiet = 0;
            for (let iteration = 0; iteration < 6; iteration++) {
              constrainRope(scene.nodes, 100, 34, (96 + scene.extension) / 8);
              scene.nodes[8]!.x = scene.body.x + Math.sin(scene.angle) * 45;
              scene.nodes[8]!.y = scene.body.y - Math.cos(scene.angle) * 45;
            }
          }
        }
      }
    }
  }

  /** 用动态缓冲绘制一组非奖牌网格（挂带、光晕、铁栏） */
  function drawDynamic(vertices: number[], material: number, color: Float32List) {
    gl.uniform1f(uniforms.isMedal, 0);
    bindVertexBuffer(dynamicBuffer);
    gl.uniform1f(uniforms.material, material);
    gl.uniform3fv(uniforms.color, color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
  }

  /** 绘制两条挂带：背面（side=-1，z=-3，颜色压暗到 83%）与正面（side=1，z=3，带字标） */
  function drawStraps(scene: MedalScene) {
    const end = scene.nodes.at(-1)!;
    const beforeEnd = scene.nodes.at(-2)!;
    const endLength = Math.hypot(end.x - beforeEnd.x, end.y - beforeEnd.y) || 1;
    const tangentX = (end.x - beforeEnd.x) / endLength;
    const tangentY = (end.y - beforeEnd.y) / endLength;
    for (const side of [-1, 1]) {
      const depth = side < 0 ? -3 : 3;
      // 两条挂带从锚点处左右各偏 13，越往下越靠拢，在挂环处汇合；末端沿切向略微收进
      const strap: Array<StrapNode & { z: number }> = scene.nodes.map((node, index) => {
        const progress = index / 8;
        const spread = 13 * (1 - progress);
        const tuck = progress ** 12 * 2.5;
        const prev = scene.nodes[Math.max(0, index - 1)]!;
        const next = scene.nodes[Math.min(8, index + 1)]!;
        const length = Math.hypot(next.x - prev.x, next.y - prev.y) || 1;
        const dirX = index ? (next.x - prev.x) / length : 0;
        const dirY = index ? (next.y - prev.y) / length : 1;
        return {
          x: node.x - side * dirY * spread + tangentX * tuck,
          y: node.y + side * dirX * spread + tangentY * tuck,
          z: depth,
          half: 5.5,
          v: progress,
        };
      });
      // 在锚点上方补一截延伸到 y=10 的隐藏段，让挂带从卡片顶边之外伸进来
      strap.unshift({ ...strap[0]!, y: 10 });
      const toPoint = ([x, y, z]: Vec3): StrapPoint & { z: number } => ({ x, y, z });
      // 挂带末端固定在挂环两侧
      const clips: [StrapPoint & { z: number }, StrapPoint & { z: number }] = [
        toPoint(transformMedalPoint(scene, -5.5, -50, depth)),
        toPoint(transformMedalPoint(scene, 5.5, -50, depth)),
      ];
      const path = strap.map((node, index) =>
        index === strap.length - 1
          ? {
              x: (clips[0].x + clips[1].x) / 2,
              y: (clips[0].y + clips[1].y) / 2,
              z: (clips[0].z + clips[1].z) / 2,
            }
          : node,
      );
      // 按实际弧长重新分配 v，使字标在拉伸时不变形
      let total = 0;
      const distances = path.map((point, index) => {
        if (index) {
          const prev = path[index - 1]!;
          total += Math.hypot(point.x - prev.x, point.y - prev.y, point.z - prev.z);
        }
        return total;
      });
      strap.forEach((node, index) => {
        node.v = distances[index]! / Math.max(total, 0.001);
      });
      gl.uniform1f(strapLengthLocation, total);
      gl.uniform1f(hiddenStrapLocation, distances[1]!);
      const triangles = buildStrapTriangles(strap, clips, side < 0);
      // 顶端两排截面改为水平展开，让挂带平直地插进卡片顶边
      for (let offset = 0; offset < triangles.length; offset += 5) {
        for (let row = 0; row < 2; row++) {
          const node = strap[row]!;
          if (Math.abs(triangles[offset + 4]! - (side < 0 ? 1 - node.v : node.v)) < 1e-6) {
            triangles[offset] = node.x + (triangles[offset + 3]! * 2 - 1) * node.half;
            triangles[offset + 1] = node.y;
          }
        }
      }
      const vertices: number[] = [];
      for (let offset = 0; offset < triangles.length; offset += 5) {
        vertices.push(
          triangles[offset]!,
          triangles[offset + 1]!,
          triangles[offset + 2]! + depth,
          0,
          0,
          1,
          triangles[offset + 3]!,
          triangles[offset + 4]!,
        );
      }
      drawDynamic(
        vertices,
        side < 0 ? 0 : 1,
        scene.color.map((channel) => channel * (side < 0 ? 0.83 : 1)),
      );
    }
  }

  /** 绘制牢笼铁栏：按生长进度从一端裁切网格，竖杆自上而下、横杆自左而右长出 */
  function drawJail(state: EggState, center: { x: number; y: number }) {
    const vertices: number[] = [];
    jailBars.forEach((bar, index) => {
      const growth = jailGrowth[index]!;
      const scale = state.scale || 1;
      if (growth === 0) return;
      const source = bar.vertices;
      for (let offset = 0; offset < source.length; offset += 8) {
        let x = source[offset]!;
        let y = source[offset + 1]!;
        if (bar.horizontal) x = bar.x - bar.length / 2 + (x - bar.x + bar.length / 2) * growth;
        else y = bar.y - bar.length / 2 + (y - bar.y + bar.length / 2) * growth;
        vertices.push(
          center.x + x * scale,
          center.y + y * scale,
          source[offset + 2]! * scale,
          source[offset + 3]!,
          source[offset + 4]!,
          source[offset + 5]!,
          source[offset + 6]!,
          source[offset + 7]!,
        );
      }
    });
    if (vertices.length) drawDynamic(vertices, 4, [0.34, 0.4, 0.45]);
  }

  /**
   * 绘制一枚奖牌
   * @param scene 要绘制的奖牌
   * @param haloPass 为 true 时只画奖牌背后的光晕（不写深度），所有光晕先于所有奖牌绘制
   */
  function drawScene(scene: MedalScene, haloPass = false) {
    const rect = scene.rect;
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.scissor(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.viewport, document.documentElement.clientWidth, window.innerHeight);
    gl.uniform2f(uniforms.offset, rect.x - canvasOrigin.x, rect.y - canvasOrigin.y);
    const card = scene.cardRect!;
    gl.uniform4f(
      uniforms.card,
      card.left - canvasOrigin.x,
      card.top - canvasOrigin.y,
      card.width,
      card.height,
    );
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(uniforms.size, rect.width, rect.height);
    // 扫光时间：各奖牌错开 0.63 秒；减弱动效时固定在 0.48
    gl.uniform1f(
      uniforms.time,
      reducedMotion.matches ? 0.48 : scene.entrance + scenes.indexOf(scene) * 0.63,
    );
    gl.uniform1f(uniforms.scale, 1);
    // 飞入彩蛋弹窗时逐渐取消透视，最终正对镜头
    gl.uniform1f(uniforms.perspective, egg?.scene === scene ? 1 - (egg.projectionEase || 0) : 1);
    gl.uniform1f(uniforms.dim, scene.dim);
    gl.uniform1f(uniforms.pull, scene.dataPull);
    if (egg?.scene === scene && egg.jailCenter) {
      // 铁栏在飞入 0.65 秒后依次（间隔 0.1 秒）用 0.45 秒长出
      for (let bar = 0; bar < 7; bar++) {
        const growth = reducedMotion.matches
          ? 1
          : Math.max(0, Math.min(1, (egg.time - 0.65 - bar * 0.1) / 0.45));
        jailGrowth[bar] = growth * growth * (3 - 2 * growth);
      }
      gl.uniform4f(uniforms.jail, egg.jailCenter.x, egg.jailCenter.y, egg.scale || 1, 1);
    } else {
      jailGrowth.fill(0);
      gl.uniform4f(uniforms.jail, 0, 0, 1, 0);
    }
    gl.uniform1fv(jailGrowthLocation, jailGrowth);

    if (haloPass) {
      // 以奖牌中心为圆心、边长 180 的方形面片，uv 为相对中心的偏移
      const vertices: number[] = [];
      for (const [offsetX, offsetY] of [
        [-90, -90],
        [90, -90],
        [-90, 90],
        [-90, 90],
        [90, -90],
        [90, 90],
      ] as const) {
        vertices.push(
          scene.body.x + offsetX,
          scene.body.y + offsetY,
          -1,
          0,
          0,
          1,
          offsetX,
          offsetY,
        );
      }
      gl.depthMask(false);
      drawDynamic(vertices, 3, scene.metal);
      gl.depthMask(true);
      return;
    }

    // 拉到警告距离后，挂环以 16 rad/s 抖动提示「要断了」
    const warning = drag?.scene === scene && drag.warningAt !== null && !reducedMotion.matches;
    gl.uniform1f(uniforms.isMedal, 1);
    gl.uniform4f(
      uniforms.pose,
      scene.body.x,
      scene.body.y,
      Math.cos(scene.tilt),
      Math.sin(scene.tilt),
    );
    gl.uniform2f(uniforms.swing, Math.cos(scene.angle), Math.sin(scene.angle));
    gl.uniform1f(uniforms.modelScale, (egg?.scene === scene && egg.scale) || 1);
    gl.uniform1f(uniforms.wobble, warning ? Math.sin(scene.entrance * 16) * 0.16 : 0);
    gl.uniform1f(uniforms.material, 2);
    gl.uniform3fv(uniforms.color, scene.metal);
    bindVertexBuffer(scene.mesh.buffer);
    gl.drawArrays(gl.TRIANGLES, 0, scene.mesh.count);

    if (egg?.scene === scene) {
      // 彩蛋中的奖牌不画挂带，只画牢笼
      if (!egg.jailCenter) return;
      drawJail(egg, egg.jailCenter);
      return;
    }
    drawStraps(scene);
  }

  /**
   * 彩蛋动画：0.65 秒内（三次缓出）飞到弹窗舞台中心并放大到最多 1.75 倍、取消透视；
   * 之后缓慢上下浮动、轻摆，1 秒内褪去字符化
   */
  function updateEgg(state: EggState, delta: number) {
    state.time += delta;
    const stageRect = eggStage!.getBoundingClientRect();
    const scene = state.scene;
    const target = clientToScene(
      {
        clientX: stageRect.left + stageRect.width / 2,
        clientY: stageRect.top + stageRect.height / 2,
      },
      scene,
    );
    const flight = reducedMotion.matches ? 1 : Math.min(1, state.time / 0.65);
    const eased = 1 - (1 - flight) ** 3;
    scene.body.x = state.x + (target.x - state.x) * eased;
    scene.body.y = state.y + (target.y - state.y) * eased;
    const idle = reducedMotion.matches ? 0 : Math.max(0, state.time - 0.65);
    const idleRamp = Math.min(1, idle / 0.5);
    const sceneScale = Math.min(scene.rect!.width / 200, scene.rect!.height / 260);
    const zoom = Math.max(
      1,
      Math.min(
        1.75,
        (stageRect.height - 24) / (110 * sceneScale),
        (stageRect.width * 0.8) / (100 * sceneScale),
      ),
    );
    state.scale = 1 + (zoom - 1) * eased;
    state.projectionEase = eased;
    scene.body.y += (Math.sin(idle * 1.5) * 10 * idleRamp) / sceneScale;
    scene.angle = state.angle * (1 - eased) + Math.sin(idle * 0.7) * 0.045 * idleRamp;
    scene.tilt =
      state.tilt + (-0.12 - state.tilt) * eased + Math.sin(idle * 0.65) * 0.22 * idleRamp;
    const fade = reducedMotion.matches ? 1 : Math.min(1, idle / 1);
    const smooth = fade * fade * (3 - 2 * fade);
    state.jailCenter = target;
    scene.dataPull = Math.min(state.dataPull, 1) * (1 - smooth);
    scene.dim = 0;
  }

  /**
   * 撕扯判定：挂绳拉伸量（像素）超过警告阈值（视口短边的 40%，限制在 180~340）开始警告；
   * 在警告起点基础上再多拉 180 像素并坚持 0.5 秒，触发彩蛋
   */
  function checkTear(state: DragState, delta: number) {
    const scene = state.scene;
    const rect = scene.rect!;
    const scale = Math.min(rect.width / 200, rect.height / 260);
    const clipX = scene.body.x + Math.sin(scene.angle) * 45;
    const clipY = scene.body.y - Math.cos(scene.angle) * 45;
    const stretch = Math.max(0, Math.hypot(clipX - 100, clipY - 34) - 96) * scale;
    const threshold = Math.max(
      180,
      Math.min(340, Math.min(window.innerWidth, window.innerHeight) * 0.4),
    );
    if (stretch < threshold) {
      state.warningAt = null;
      state.tearHold = null;
      return;
    }
    if (state.warningAt === null) state.warningAt = stretch;
    if (stretch >= state.warningAt + 180) {
      state.tearHold = state.tearHold === null ? 0 : state.tearHold + delta;
      if (state.tearHold >= 0.5) openEgg(scene);
    } else {
      state.tearHold = null;
    }
  }

  /** 渲染循环的一帧 */
  function renderFrame(time: number) {
    frameId = 0;
    if (disposed || document.hidden) return;
    // 画布是 position:absolute 的视口大小画布，跟随滚动位置摆放；弹窗中则贴在弹窗左上角
    canvas.style.top = egg ? "0px" : `${window.scrollY}px`;
    const canvasRect = canvas.getBoundingClientRect();
    canvasOrigin = { x: canvasRect.left, y: canvasRect.top };
    const trackRects = new Map(
      [...new Set(scenes.map((scene) => scene.track))].map((track) => [
        track,
        track.getBoundingClientRect(),
      ]),
    );
    for (const scene of scenes) {
      const rect = scene.button.getBoundingClientRect();
      scene.rect = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      scene.cardRect = trackRects.get(scene.track);
    }
    const delta = lastFrameTime ? Math.min((time - lastFrameTime) / 1e3, 0.05) : 1 / 60;
    lastFrameTime = time;
    stepAccumulator += delta;
    if (egg) updateEgg(egg, delta);

    // 进入视口的奖牌依次掉落入场，间隔 0.09 秒
    const pendingDrop = !egg && scenes.find((scene) => scene.visible && scene.dropPending);
    dropCooldown = Math.max(0, dropCooldown - delta);
    if (pendingDrop && dropCooldown === 0) {
      pendingDrop.dropPending = false;
      pendingDrop.started = true;
      prepareDrop(pendingDrop);
      dropCooldown = 0.09;
    }
    while (stepAccumulator >= 1 / 60) {
      for (const scene of scenes) {
        if (
          !egg &&
          scene.visible &&
          scene.started &&
          !reducedMotion.matches &&
          (scene.quiet < 100 || drag?.scene === scene)
        ) {
          stepScene(scene);
        }
      }
      if (!egg && !reducedMotion.matches) resolveCollisions();
      stepAccumulator -= 1 / 60;
    }
    if (drag) checkTear(drag, delta);

    gl.scissor(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 倒序绘制，让 DOM 中靠前的奖牌叠在上面
    const drawList = egg
      ? [egg.scene]
      : [...scenes].reverse().filter((scene) => scene.visible && scene.started);
    const current = drag?.scene || hoveredScene || focusedScene;
    for (const scene of drawList) {
      scene.entrance += delta;
      if (egg) continue;
      const targetDim = current && scene.track !== current.track ? 1 : 0;
      scene.dim = reducedMotion.matches
        ? targetDim
        : scene.dim + (targetDim - scene.dim) * (1 - Math.exp(-delta * 18));
      if (drag?.scene === scene) {
        // 字符化进度：离开静止位 8 之后 190 内完成奖牌部分，198 之后 220 内完成挂带部分
        const offset = Math.hypot(scene.body.x - 100, scene.body.y - 175);
        const medalPull = Math.max(0, Math.min(1, (offset - 8) / 190));
        const strapPull = Math.max(0, Math.min(1, (offset - 198) / 220));
        scene.dataPull =
          medalPull * medalPull * (3 - 2 * medalPull) + strapPull * strapPull * (3 - 2 * strapPull);
      } else {
        scene.dataPull = reducedMotion.matches ? 0 : scene.dataPull * Math.exp(-delta * 22);
        if (scene.dataPull < 0.001) scene.dataPull = 0;
      }
    }
    for (const scene of drawList) drawScene(scene, true);
    for (const scene of drawList) drawScene(scene);
    if (
      !frameId &&
      ((!reducedMotion.matches && (egg || scenes.some((scene) => scene.visible))) ||
        (drag && drag.tearHold !== null))
    ) {
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  /**
   * 布局：画布铺满视口；按每条赛道最右侧奖牌的右边缘与挂绳锚点，
   * 写入 --medal-shift-x/--medal-shift-y，让奖牌贴齐卡片右边、锚点贴齐卡片顶边；并读取挂带颜色
   */
  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(document.documentElement.clientWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    canvas.style.width = `${document.documentElement.clientWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    for (const track of medals.querySelectorAll<HTMLElement>(".reward-medal-track")) {
      const trackRect = track.getBoundingClientRect();
      // 读回当前偏移，换算出未偏移时的位置
      const shiftX = Number.parseFloat(track.style.getPropertyValue("--medal-shift-x")) || 0;
      const shiftY = Number.parseFloat(track.style.getPropertyValue("--medal-shift-y")) || 0;
      let right = -Infinity;
      let top = Infinity;
      for (const scene of scenes.filter((item) => item.track === track)) {
        const rect = scene.button.getBoundingClientRect();
        const scale = Math.min(rect.width / 200, rect.height / 260);
        right = Math.max(right, rect.right - rect.width / 2 - shiftX + 43 * scale);
        top = Math.min(top, rect.top + rect.height / 2 - shiftY + -96 * scale);
      }
      track.style.setProperty("--medal-shift-x", `${trackRect.right - 1 - right}px`);
      track.style.setProperty("--medal-shift-y", `${trackRect.top + 1 - top}px`);
    }
    for (const scene of scenes) {
      const rect = scene.button.getBoundingClientRect();
      scene.rect = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      const color = getComputedStyle(scene.button).getPropertyValue("--track-color").trim();
      scene.color = /^#[\da-f]{6}$/i.test(color)
        ? [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16) / 255)
        : [0.51, 0.71, 1];
    }
    refresh();
  }

  /** 视口坐标换算到某枚奖牌的场景坐标 */
  function clientToScene(point: ClientPoint, scene: MedalScene) {
    const rect = scene.button.getBoundingClientRect();
    const scale = Math.min(rect.width / 200, rect.height / 260);
    return {
      x: 100 + (point.clientX - rect.left - rect.width / 2) / scale,
      y: 130 + (point.clientY - rect.top - rect.height / 2) / scale,
    };
  }

  /** 结束拖拽，释放指针捕获 */
  function endDrag() {
    if (!drag) return;
    const { scene, id } = drag;
    drag = null;
    scene.button.classList.remove("is-dragging");
    if (scene.button.hasPointerCapture(id)) scene.button.releasePointerCapture(id);
    scene.quiet = 0;
    refresh();
  }

  /** 关闭彩蛋：奖牌复位，画布放回页面根节点，恢复页面滚动，焦点还给奖牌按钮 */
  function closeEgg() {
    if (!egg) return;
    const { scene, scrollOverflow } = egg;
    egg = null;
    resetScene(scene);
    hoveredScene = null;
    focusedScene = null;
    document.documentElement.style.overflow = scrollOverflow;
    canvasHost.append(canvas);
    if (eggDialog!.open) eggDialog!.close();
    if (!disposed) scene.button.focus({ preventScroll: true });
    // 上面的 focus 会同步触发按钮的 focus 事件，这里再清一次，避免关闭后残留焦点高亮
    hoveredScene = null;
    focusedScene = null;
    for (const item of scenes) item.dim = 0;
    layout();
  }

  /** 打开彩蛋：把画布移进弹窗（顶层），锁定页面滚动 */
  function openEgg(scene: MedalScene) {
    // 页面上已有其他弹窗打开时不触发；这里有意查询整个文档，与原站行为一致
    if (egg || !eggDialog || document.querySelector("dialog[open]")) return;
    const state: EggState = {
      scene,
      time: 0,
      x: scene.body.x,
      y: scene.body.y,
      angle: scene.angle,
      tilt: scene.tilt,
      dataPull: scene.dataPull,
      scrollOverflow: document.documentElement.style.overflow,
    };
    endDrag();
    hoveredScene = null;
    focusedScene = null;
    egg = state;
    document.documentElement.style.overflow = "hidden";
    canvas.style.top = "0px";
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eggDialog.append(canvas);
    eggDialog.showModal();
    eggDialog.querySelector<HTMLElement>("#medal-egg-title")!.focus({ preventScroll: true });
    layout();
    refresh();
  }

  /** 窄屏（≤760px）禁用全部交互：关闭彩蛋、结束拖拽、禁用按钮 */
  function syncViewportMode() {
    if (compactViewport.matches) {
      closeEgg();
      endDrag();
      hoveredScene = null;
      focusedScene = null;
      suppressClick = false;
    }
    for (const scene of scenes) scene.button.disabled = compactViewport.matches;
    refresh();
  }

  /** 指针命中的奖牌：按倾角把命中圆压成椭圆，半径 46 */
  function hitMedal(event: PointerEvent): MedalScene | null {
    if (event.target instanceof Element && event.target.closest(OVERLAY_SELECTOR)) return null;
    return (
      scenes.find((scene) => {
        if (!scene.visible || !scene.started) return false;
        const point = clientToScene(event, scene);
        return (
          Math.hypot((point.x - scene.body.x) / Math.cos(scene.tilt), point.y - scene.body.y) < 46
        );
      }) ?? null
    );
  }

  /** 悬停目标：优先命中奖牌，否则取指针所在的赛道卡片里的第一枚可见奖牌 */
  function hoverTarget(event: PointerEvent): MedalScene | null {
    if (egg || (event.target instanceof Element && event.target.closest(OVERLAY_SELECTOR))) {
      return null;
    }
    return (
      hitMedal(event) ||
      scenes.find((scene) => {
        if (!scene.visible) return false;
        const rect = scene.track.getBoundingClientRect();
        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      }) ||
      null
    );
  }

  eggDialog?.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      closeEgg();
    },
    { signal },
  );
  eggDialog?.addEventListener("close", closeEgg, { signal });
  eggDialog
    ?.querySelector("[data-medal-egg-close]")
    ?.addEventListener("click", closeEgg, { signal });
  // 彩蛋里的「马上开始」是站内链接，点击后先放回奖牌再跳转
  eggDialog
    ?.querySelector("[data-medal-egg-start]")
    ?.addEventListener("click", closeEgg, { signal });

  syncViewportMode();
  compactViewport.addEventListener("change", syncViewportMode, { signal });

  for (const scene of scenes) {
    scene.button.addEventListener(
      "focus",
      () => {
        focusedScene = scene;
        refresh();
      },
      { signal },
    );
    scene.button.addEventListener(
      "blur",
      () => {
        if (focusedScene === scene) focusedScene = null;
        refresh();
      },
      { signal },
    );
    // 方向键给奖牌一个 10 的初速度（通过改上一步位置实现），Escape 复位
    scene.button.addEventListener(
      "keydown",
      (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(event.key)) {
          return;
        }
        event.preventDefault();
        if (event.key === "Escape" || reducedMotion.matches) {
          resetScene(scene);
        } else {
          scene.body.px += event.key === "ArrowLeft" ? 10 : event.key === "ArrowRight" ? -10 : 0;
          scene.body.py += event.key === "ArrowUp" ? 10 : event.key === "ArrowDown" ? -10 : 0;
          scene.quiet = 0;
        }
        refresh();
      },
      { signal },
    );
  }

  document.addEventListener(
    "pointerleave",
    () => {
      hoveredScene = null;
      refresh();
    },
    { signal },
  );
  // 捕获阶段拦截按下：命中奖牌即开始拖拽，并阻止页面其他处理（如文本选择）
  document.addEventListener(
    "pointerdown",
    (event) => {
      suppressClick = false;
      if (
        compactViewport.matches ||
        event.button !== 0 ||
        drag ||
        (event.target as Element).closest('dialog,[aria-modal="true"]')
      ) {
        return;
      }
      const scene = hitMedal(event);
      if (!scene) return;
      const point = clientToScene(event, scene);
      event.preventDefault();
      event.stopPropagation();
      suppressClick = true;
      scene.button.setPointerCapture(event.pointerId);
      scene.button.classList.add("is-dragging");
      drag = {
        scene,
        id: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        warningAt: null,
        tearHold: null,
        ...point,
        dx: point.x - scene.body.x,
        dy: point.y - scene.body.y,
      };
      scene.quiet = 0;
      refresh();
    },
    { capture: true, signal },
  );
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!drag) {
        if (!compactViewport.matches && event.pointerType !== "touch") {
          const target = hoverTarget(event);
          if (target !== hoveredScene) {
            hoveredScene = target;
            refresh();
          }
        }
        return;
      }
      if (drag.id !== event.pointerId) return;
      const scene = drag.scene;
      event.preventDefault();
      Object.assign(drag, clientToScene(event, scene), {
        clientX: event.clientX,
        clientY: event.clientY,
      });
      if (reducedMotion.matches) {
        // 减弱动效时不做物理：奖牌直接跟手，挂绳拉成直线
        scene.body.x = drag.x - drag.dx;
        scene.body.y = drag.y - drag.dy;
        for (let index = 0; index < 9; index++) {
          const progress = index / 8;
          scene.nodes[index]!.x = 100 + (scene.body.x - 100) * progress;
          scene.nodes[index]!.y = 34 + (scene.body.y - 79) * progress;
        }
      }
      refresh();
    },
    { signal },
  );
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    document.addEventListener(
      type,
      () => {
        const scene = drag?.scene;
        endDrag();
        if (scene && reducedMotion.matches) {
          resetScene(scene);
          refresh();
        }
      },
      { signal },
    );
  }
  document.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    { capture: true, signal },
  );

  // 赛道卡片进入视口（底部留 8% 余量）时，其中的奖牌开始入场
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        for (const scene of scenes.filter((item) => item.track === entry.target)) {
          scene.visible = entry.isIntersecting;
          if (scene.visible && !scene.entered) {
            scene.entered = true;
            scene.entrance = 0;
            scene.started = reducedMotion.matches;
            scene.dropPending = !reducedMotion.matches;
          }
          if (!scene.visible && drag?.scene === scene) endDrag();
        }
      }
      if (!egg && !scenes.some((scene) => scene.visible)) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      refresh();
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  new Set(scenes.map((scene) => scene.track)).forEach((track) =>
    intersectionObserver.observe(track),
  );
  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(medals);
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        endDrag();
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      refresh();
    },
    { signal },
  );
  window.addEventListener(
    "blur",
    () => {
      hoveredScene = null;
      endDrag();
      refresh();
    },
    { signal },
  );
  window.addEventListener("scroll", refresh, { passive: true, signal });
  window.addEventListener("resize", layout, { signal });
  reducedMotion.addEventListener(
    "change",
    () => {
      closeEgg();
      endDrag();
      scenes.forEach((scene) => {
        resetScene(scene);
        scene.entrance = 0;
        if (scene.entered) {
          scene.started = true;
          scene.dropPending = false;
        }
      });
      refresh();
    },
    { signal },
  );
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      disposed = true;
      closeEgg();
      endDrag();
      cancelAnimationFrame(frameId);
      frameId = 0;
    },
    { signal },
  );
  canvasHost.append(canvas);
  layout();

  // 挂带字标贴图：REBORN 与 UI 两段并排，旋转 90° 竖排在 128×512 的画布上
  const wordmark = new Image();
  wordmark.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(STRAP_WORDMARK_SVG)}`;
  const year = new Image();
  year.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(STRAP_SUFFIX_SVG)}`;
  Promise.all([wordmark.decode(), year.decode()])
    .catch(() => {})
    .then(() => {
      if (disposed) return;
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 128;
      labelCanvas.height = 512;
      const label = labelCanvas.getContext("2d")!;
      label.translate(64, 256);
      label.rotate(Math.PI / 2);
      // 两段字样之间留 20 的间距，整体缩放到 460 宽
      const totalWidth = STRAP_WORDMARK_WIDTH + 20 + STRAP_SUFFIX_WIDTH;
      const scale = 460 / totalWidth;
      const height = 37 * scale;
      if (wordmark.naturalWidth) {
        label.drawImage(wordmark, -230, -height / 2, STRAP_WORDMARK_WIDTH * scale, height);
      }
      if (year.naturalWidth) {
        label.drawImage(year, -230 + (STRAP_WORDMARK_WIDTH + 20) * scale, -height / 2, STRAP_SUFFIX_WIDTH * scale, height);
      }
      gl.bindTexture(gl.TEXTURE_2D, strapTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, labelCanvas);
      strapTextureReady = true;
      refresh();
    });

  return () => {
    disposed = true;
    closeEgg();
    endDrag();
    cancelAnimationFrame(frameId);
    controller.abort();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    gl.deleteBuffer(dynamicBuffer);
    for (const mesh of meshCache.values()) gl.deleteBuffer(mesh.buffer);
    gl.deleteTexture(strapTexture);
    gl.deleteTexture(glyphTexture);
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
    // 撤销写在宿主元素上的内联变量、状态类名与禁用状态
    medals.classList.remove("has-current-medal");
    for (const track of tracks) {
      track.style.removeProperty("--medal-shift-x");
      track.style.removeProperty("--medal-shift-y");
      track.classList.remove("has-current-medal", "is-glow-active");
    }
    for (const scene of scenes) {
      scene.item.classList.remove("is-current-medal");
      scene.button.classList.remove("is-dragging");
      scene.button.disabled = scene.initiallyDisabled;
    }
  };
}

/* ------------------------------------------------------------------------------------------------
 * 字符鱼群
 * ---------------------------------------------------------------------------------------------- */

/** 鱼身上的一个字符点（设计坐标） */
interface CreatureGlyph {
  x: number;
  y: number;
  /** 所属部件（对应 motion.parts），空串表示身体 */
  part: string;
  /** 字符；空串表示画一小段沿笔画方向的短线 */
  char: string;
  /** 笔画方向（弧度）；为 null 时画字符 */
  line: number | null;
  alpha: number;
  /** 固定字符不参与 0/1 闪烁 */
  fixed: boolean;
  role: string;
  binding: RigBinding;
}

/** 摆好姿态、换算到区块坐标后的字符点 */
interface PosedGlyph extends CreatureGlyph {
  angle: number;
  /** 朝向：1 向右游、-1 向左游（水平镜像） */
  mirror: number;
}

/** 同一赛道家族（data-reward-family）共用一条鱼，横穿该家族的所有卡片 */
interface CreatureGroup {
  cards: HTMLElement[];
  shape: FishShape;
  glyphs: CreatureGlyph[] | null;
  phase: number;
  direction: number;
  /** 初始行程进度 0~1 */
  travel: number;
  /** 下一次 0/1 闪烁的时间 */
  next: number;
  /** 本次 0/1 闪烁开始的时间 */
  start: number;
  /** 本次闪烁中被替换为 0/1 的字符点序号 */
  binary: Map<number, string>;
  rig: FishRig;
  nextBlink: number;
  blinkAt: number;
  /** 家族卡片在区块坐标里的左右边界 */
  left: number;
  right: number;
  centerY: number;
  scale: number;
  /** 当前字符点采样时使用的缩放 */
  sampleScale: number;
}

/** 插在每张赛道卡片里的绘制层 */
interface CreatureLayer {
  card: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  group: CreatureGroup;
  /** 卡片相对区块的位置与尺寸 */
  x: number;
  y: number;
  width: number;
  height: number;
  dpr: number;
  color: string;
}

/**
 * 沿鱼的轮廓与细节线等距采样字符点；约 24.5% 的非固定点随机换成方块或 0/1，形成数据噪点
 * @param shape 鱼的形状数据
 * @param scale 鱼的显示缩放；采样间距按屏幕像素恒定，因此缩放越小采样越疏
 * @param rig 鱼的骨骼，用于为每个字符点求绑定
 * @returns 按 x+y 排序的字符点（自左上向右下绘制）
 */
function sampleCreatureGlyphs(shape: FishShape, scale: number, rig: FishRig): CreatureGlyph[] {
  const glyphs: CreatureGlyph[] = [];
  const addGlyph = (
    x: number,
    y: number,
    part: string,
    char: string,
    line: number | null,
    alpha: number,
    fixed = false,
    role = "",
  ) => {
    const roll = Math.random();
    let glyphChar = char;
    let glyphLine = line;
    if (!fixed && char !== "·" && roll < 0.245) {
      glyphChar = roll < 0.025 ? "▪" : Math.random() < 0.5 ? "0" : "1";
      glyphLine = null;
    }
    glyphs.push({
      x,
      y,
      part,
      char: glyphChar,
      line: glyphLine,
      alpha,
      fixed,
      role,
      binding: rig.bind(x, y),
    });
  };
  for (const [paths, isDetail] of [
    [shape.contours, false],
    [shape.details, true],
  ] as const) {
    for (const path of paths) {
      const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
      element.setAttribute("d", typeof path === "string" ? path : path.d);
      const total = element.getTotalLength();
      const part = typeof path === "string" ? "" : path.part || "";
      for (let distance = 0; distance < total; distance += (isDetail ? 20 : 16) / scale) {
        const point = element.getPointAtLength(distance);
        const ahead = element.getPointAtLength(Math.min(total, distance + 7 / scale));
        addGlyph(
          (point.x + ahead.x) / 2,
          (point.y + ahead.y) / 2,
          part,
          "",
          Math.atan2(ahead.y - point.y, ahead.x - point.x),
          isDetail ? 0.5 : 0.9,
        );
      }
    }
  }
  shape.glyphs.forEach(([x, y, char, fixed, role]) =>
    addGlyph(x, y, "", char, null, 0.85, fixed, role),
  );
  return glyphs.sort((a, b) => a.x + a.y - b.x - b.y);
}

/**
 * 挂载字符鱼群（仅桌面端 ≥761px）
 * @param medals .reward-medals 元素，鱼的坐标以它为参照
 * @returns 清理函数
 */
function mountCreatures(medals: HTMLElement): () => void {
  const desktop = matchMedia("(min-width:761px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  const cards = [...medals.querySelectorAll<HTMLElement>(".reward-medal-track")];
  const visibleCards = new Set<Element>();
  const groups = new Map<string | undefined, CreatureGroup>();
  /** 鱼群按 60fps 节流绘制 */
  const FRAME_MS = 1e3 / 60;
  let layers: CreatureLayer[] = [];
  let frameId = 0;
  let lastTime: number | null = null;
  let frameBudget = 0;
  /** 动画时钟（秒），只在动画运行时推进 */
  let clock = 0;
  let layoutFrame = 0;

  for (const card of cards) {
    const family = card.dataset.rewardFamily;
    let group = groups.get(family);
    if (!group) {
      const shape = FISH_SHAPES[card.dataset.rewardSpecies as FishSpecies] as FishShape;
      const phase = Math.random() * 6;
      group = {
        cards: [],
        shape,
        glyphs: null,
        phase,
        // 第一个家族向右游、从 22% 处出发；其余向左游、从 68% 处出发
        direction: groups.size ? -1 : 1,
        travel: groups.size ? 0.68 : 0.22,
        next: 2.8 + Math.random() * 1.2,
        start: -Infinity,
        binary: new Map(),
        rig:
          shape.motion.kind === "manta"
            ? createMantaRig(shape.motion.cycle)
            : createSpineRig(shape.motion.spine, shape.motion.cycle),
        nextBlink: 2 + phase,
        blinkAt: -Infinity,
        left: 0,
        right: 0,
        centerY: 0,
        scale: 0,
        sampleScale: 0,
      };
      groups.set(family, group);
    }
    group.cards.push(card);
  }

  function removeLayers() {
    layers.forEach((layer) => layer.canvas.remove());
    layers = [];
  }

  function shouldAnimate() {
    return desktop.matches && !document.hidden && visibleCards.size > 0;
  }

  /** 布局：建立（或移除）绘制层，测量卡片位置，按家族宽度确定鱼的缩放并在缩放变化时重新采样 */
  function layoutCreatures() {
    layoutFrame = 0;
    if (!desktop.matches) {
      removeLayers();
      restart();
      return;
    }
    if (!layers.length) {
      layers = cards.map((card) => {
        const canvas = document.createElement("canvas");
        canvas.className = "reward-creature-canvas";
        canvas.setAttribute("aria-hidden", "true");
        card.prepend(canvas);
        return {
          card,
          canvas,
          ctx: canvas.getContext("2d"),
          group: groups.get(card.dataset.rewardFamily)!,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          dpr: 1,
          color: "",
        };
      });
    }
    const rootRect = medals.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const layer of layers) {
      const rect = layer.card.getBoundingClientRect();
      Object.assign(layer, {
        x: rect.left - rootRect.left,
        y: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
        dpr,
      });
      layer.canvas.width = Math.round(rect.width * dpr);
      layer.canvas.height = Math.round(rect.height * dpr);
      layer.color = getComputedStyle(layer.card).getPropertyValue("--track-color").trim();
    }
    for (const group of groups.values()) {
      const groupLayers = layers.filter((layer) => layer.group === group);
      group.left = Math.min(...groupLayers.map((layer) => layer.x));
      group.right = Math.max(...groupLayers.map((layer) => layer.x + layer.width));
      const firstCard = group.cards[0]!;
      const stageRect = firstCard.querySelector(".reward-medal-stage")!.getBoundingClientRect();
      const stageScale = Math.min(stageRect.width / 200, stageRect.height / 260);
      // 鱼游在奖牌静止高度（场景中心下方 45）
      group.centerY = stageRect.top - rootRect.top + stageRect.height / 2 + 45 * stageScale;
      group.scale = Math.min(0.95, Math.max(0.65, (group.right - group.left) / 1250));
      if (firstCard.dataset.rewardSpecies === "shark") {
        group.scale = (Math.min(...groupLayers.map((layer) => layer.width)) * 1.5) / 300;
      }
      if (!group.glyphs || Math.abs(group.sampleScale - group.scale) > 0.001) {
        group.glyphs = sampleCreatureGlyphs(group.shape, group.scale, group.rig);
        group.sampleScale = group.scale;
        group.binary.clear();
        group.start = -Infinity;
        group.next = clock + 2.8 + Math.random() * 1.2;
      }
    }
    render();
    restart();
  }

  /**
   * 求一个家族在当前时刻的全部字符点：
   * 鱼以 64 像素/秒横穿家族卡片（两侧各留出 extent 的出入场距离），上下缓慢浮动；
   * 部件先绕支点摆动，再交给骨骼形变，最后按 scale 缩放、按游向镜像到区块坐标
   */
  function poseGroup(group: CreatureGroup): PosedGlyph[] {
    const time = reducedMotion.matches ? group.phase : clock + group.phase;
    const scale = group.scale;
    const extent = (group.shape.extent ?? 180) * scale;
    const span = group.right - group.left + extent * 2;
    const progress = (group.travel + (clock * 64) / span) % 1;
    const originX =
      group.direction > 0
        ? group.left - extent + progress * span
        : group.right + extent - progress * span;
    // 缩小时摆幅放大，保证视觉上的摆动幅度
    const amplitude = 1 / scale ** 1.25;
    const originY = group.centerY + (Math.sin(time * 0.5) * 8) / Math.max(1, scale);
    const mirror = group.direction;
    const { shape, glyphs, rig } = group;
    rig.pose(time, amplitude);
    return glyphs!.map((glyph) => {
      let { x, y } = glyph;
      let angle = 0;
      const part = shape.motion.parts[glyph.part];
      if (part) {
        angle =
          (Math.sin((time / shape.motion.cycle) * Math.PI * 2 + part.phase) *
            part.amplitude *
            amplitude *
            Math.PI) /
          180;
        // 部件根部（rootY 以上）不动，往外 span 内平滑过渡到满幅
        const weight = Math.max(0, Math.min(1, (y - part.rootY) / part.span));
        angle *= weight * weight * (3 - 2 * weight);
        const [pivotX, pivotY] = part.pivot;
        const localX = x - pivotX;
        const localY = y - pivotY;
        x = pivotX + localX * Math.cos(angle) - localY * Math.sin(angle);
        y = pivotY + localX * Math.sin(angle) + localY * Math.cos(angle);
      }
      const deformed = rig.deform(glyph.binding, x, y, (glyph.line ?? 0) + angle);
      x = deformed.x;
      y = deformed.y;
      angle += deformed.angle;
      // 以设计坐标 (160, 108) 为鱼的中心
      const offsetX = (x - 160) * scale;
      const offsetY = (y - 108) * scale;
      return {
        ...glyph,
        // 眨眼：眼睛字符在 0.16 秒内显示为「-」
        char:
          glyph.role === "eye" && !reducedMotion.matches && clock - group.blinkAt < 0.16
            ? "-"
            : glyph.char,
        x: originX + offsetX * mirror,
        y: originY + offsetY,
        angle,
        mirror,
      };
    });
  }

  /**
   * 绘制所有可见卡片：
   * 每 3.8~6.2 秒眨一次眼；每 2.5~4 秒随机挑 25% 的字符点做一次 0/1 闪烁——
   * 前 0.28 秒与 0.92~1.2 秒显示闪烁的白色方块，中间显示 0/1 字符
   */
  function render() {
    const posed = new Map<CreatureGroup, PosedGlyph[]>();
    for (const group of groups.values()) {
      if (!layers.some((layer) => layer.group === group && visibleCards.has(layer.card))) continue;
      if (!reducedMotion.matches && clock >= group.nextBlink) {
        group.blinkAt = clock;
        group.nextBlink = clock + 3.8 + Math.random() * 2.4;
      }
      if (!reducedMotion.matches && clock >= group.next) {
        group.start = clock;
        group.next = clock + 2.5 + Math.random() * 1.5;
        group.binary.clear();
        group.glyphs!.forEach((_, index) => {
          if (Math.random() < 0.25) group.binary.set(index, Math.random() < 0.5 ? "0" : "1");
        });
      }
      posed.set(group, poseGroup(group));
    }
    for (const layer of layers) {
      if (!visibleCards.has(layer.card) || !layer.ctx) continue;
      const { ctx, group, dpr } = layer;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
      ctx.font = "600 16px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 1.3;
      const flicker = clock - group.start;
      posed.get(group)?.forEach((glyph, index) => {
        const x = glyph.x - layer.x;
        const y = glyph.y - layer.y;
        const margin = 18;
        if (x < -18 || x > layer.width + margin || y < -18 || y > layer.height + margin) return;
        const binary =
          !glyph.fixed && !reducedMotion.matches && flicker >= 0 && flicker < 1.2
            ? group.binary.get(index)
            : undefined;
        const showDigit = binary !== undefined && flicker >= 0.28 && flicker < 0.92;
        const showBlock = binary !== undefined && !showDigit;
        const blockTime = flicker < 0.28 ? flicker : flicker - 0.92;
        ctx.globalAlpha = glyph.alpha * (showBlock ? (blockTime % 0.14 < 0.09 ? 1 : 0.12) : 1);
        ctx.fillStyle = showBlock ? "#fff" : layer.color;
        ctx.strokeStyle = layer.color;
        if (showBlock || (glyph.char === "▪" && binary === undefined)) {
          const size = showBlock ? 12 : 5;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        } else if (showDigit) {
          ctx.fillText(binary, x, y);
        } else if (glyph.line !== null) {
          // 笔画点画成长 10 的短线，方向随形变转动，镜像时水平翻转
          const direction = glyph.line + glyph.angle;
          const dx = Math.cos(direction) * 5 * glyph.mirror;
          const dy = Math.sin(direction) * 5;
          ctx.beginPath();
          ctx.moveTo(x - dx, y - dy);
          ctx.lineTo(x + dx, y + dy);
          ctx.stroke();
        } else {
          ctx.fillText(glyph.char, x, y);
        }
      });
    }
  }

  function frame(time: number) {
    frameId = 0;
    if (!shouldAnimate() || reducedMotion.matches) return;
    if (lastTime === null) {
      lastTime = time;
      render();
    } else {
      const elapsed = Math.max(0, time - lastTime);
      lastTime = time;
      // 单帧最多推进 100ms，避免切回标签页时鱼瞬移
      clock += Math.min(elapsed, 100) / 1e3;
      frameBudget += elapsed;
      if (frameBudget >= FRAME_MS - 0.1) {
        frameBudget = Math.max(0, frameBudget - FRAME_MS) % FRAME_MS;
        render();
      }
    }
    frameId = requestAnimationFrame(frame);
  }

  /** 重启动画循环；减弱动效时只静态绘制一次 */
  function restart() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = null;
    frameBudget = 0;
    if (!shouldAnimate()) return;
    if (reducedMotion.matches) render();
    else frameId = requestAnimationFrame(frame);
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) =>
      entry.isIntersecting ? visibleCards.add(entry.target) : visibleCards.delete(entry.target),
    );
    restart();
  });
  cards.forEach((card) => intersectionObserver.observe(card));
  const resizeObserver = new ResizeObserver(() => {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(layoutCreatures);
  });
  resizeObserver.observe(medals);
  desktop.addEventListener("change", layoutCreatures, { signal });
  reducedMotion.addEventListener("change", restart, { signal });
  document.addEventListener("visibilitychange", restart, { signal });
  layoutCreatures();

  return () => {
    controller.abort();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    cancelAnimationFrame(frameId);
    cancelAnimationFrame(layoutFrame);
    removeLayers();
  };
}

/* ------------------------------------------------------------------------------------------------
 * 刮刮卡
 * ---------------------------------------------------------------------------------------------- */

/** 待处理的指针位置；null 表示一次刮擦结束（抬起或离开） */
interface PointerSample {
  clientX: number;
  clientY: number;
}

/** 数字上的覆盖率采样点（相对涂层左上角） */
interface ExposureSample {
  x: number;
  y: number;
  exposed: boolean;
  /** 剩余涂层不透明度 0~1 */
  remaining: number;
}

interface TrackedAnimation {
  node: Element;
  animation: Animation;
  /** 结束后是否移除节点 */
  remove: boolean;
}

/** 碎屑或脱落的刮屑条 */
interface ScratchParticle {
  x: number;
  y: number;
  size: number;
  start: number;
  /** 精灵图中的样式序号 0~7 */
  variant: number;
  angle: number;
  vx: number;
  vy: number;
  spin: number;
  /** 寿命（秒） */
  duration: number;
  ribbon?: boolean;
  thickness?: number;
  opacity?: number;
}

/** 正在刮出、跟随指针卷起的刮屑条 */
interface ScratchCurl {
  distance: number;
  variant: number;
  angle: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
  thickness: number;
}

/** 粒子画布相对涂层向上多留的高度（碎屑会先向上溅起） */
const PARTICLE_TOP_PAD = 64;

/**
 * 绘制 128×48 的刮屑精灵图，横向 8 种样式、每格 16×16：
 * 第一行为不规则五边形碎屑，第二行为卷曲的刮屑条（带上沿高光），第三行为刮屑条的投影
 */
function paintScratchSprites(ctx: CanvasRenderingContext2D) {
  for (let variant = 0; variant < 8; variant++) {
    ctx.fillStyle = ["#92989f", "#a0a5ab", "#858b92", "#777d84"][variant % 4]!;
    ctx.beginPath();
    for (let corner = 0; corner < 5; corner++) {
      const angle = (corner / 5) * Math.PI * 2;
      const radius = 5 + ((variant * 7 + corner * 3) % 3);
      const x = variant * 16 + 8 + Math.cos(angle) * radius;
      const y = 8 + Math.sin(angle) * radius;
      if (corner) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    const left = variant * 16;
    const bend = variant % 2 ? 2 : -2;
    ctx.strokeStyle = ["#a0a5ab", "#858b92", "#92989f", "#777d84"][variant % 4]!;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(left + 1, 24);
    ctx.bezierCurveTo(left + 5, 24 + bend, left + 10, 24 - bend, left + 14, 24 + bend);
    ctx.stroke();
    ctx.strokeStyle = "rgba(232,236,240,.3)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(left + 1, 23.3);
    ctx.bezierCurveTo(left + 5, 23.3 + bend, left + 10, 23.3 - bend, left + 14, 23.3 + bend);
    ctx.stroke();
    // 投影由宽到窄、由淡到浓叠三层
    for (const [width, alpha] of [
      [4.2, 0.12],
      [3.2, 0.22],
      [2, 0.65],
    ] as const) {
      ctx.strokeStyle = `rgba(8,11,16,${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(left + 2, 40);
      ctx.bezierCurveTo(left + 5, 40 + bend, left + 10, 40 - bend, left + 13, 40 + bend);
      ctx.stroke();
    }
  }
}

/**
 * 为一个 [data-reward-scratch] 区域挂载刮刮卡
 *
 * 结构：在区域内追加 button.reward-scratch-cover（内含涂层画布）与 span.reward-scratch-fragments（粒子画布容器）。
 * 指针移动先排队，按 60fps 节流在帧内批量处理；每段移动在涂层上用 destination-out 擦出宽 24 的条带，
 * 同时衰减落在条带内的数字采样点；数字九成采样点被刮开后整层揭开。键盘点击（detail 为 0）直接揭开。
 *
 * @param area 刮刮卡区域
 * @param reducedMotion 减弱动效媒体查询（各区域共用）
 * @returns 清理函数
 */
function mountScratchCover(area: HTMLElement, reducedMotion: MediaQueryList): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const track = area.closest<HTMLElement>(".reward-medal-track")!;
  const cover = document.createElement("button");
  const coverCanvas = document.createElement("canvas");
  const fragments = document.createElement("span");
  cover.type = "button";
  cover.className = "reward-scratch-cover";
  cover.setAttribute("aria-label", "刮开看组件数量，按回车或空格直接揭开");
  coverCanvas.setAttribute("aria-hidden", "true");
  cover.append(coverCanvas);
  area.append(cover);
  fragments.className = "reward-scratch-fragments";
  fragments.setAttribute("aria-hidden", "true");
  area.append(fragments);
  const coverContext = coverCanvas.getContext("2d")!;
  const animations = new Set<TrackedAnimation>();
  const samples: ExposureSample[] = [];
  let exposedCount = 0;
  let particleCanvas: HTMLCanvasElement | null = null;
  let particleContext: CanvasRenderingContext2D | null = null;
  let sprites: HTMLCanvasElement | null = null;
  let frameId = 0;
  const pointerQueue: Array<PointerSample | null> = [];
  const FRAME_MS = 1e3 / 60;
  let lastFrame = -Infinity;
  /** 正在帧内处理队列，期间不重复调度 */
  let inFrame = false;
  let particlesDirty = false;
  const particles: ScratchParticle[] = [];
  const particleDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let coverWidth = 0;
  let coverHeight = 0;
  let lastPoint: { x: number; y: number } | null = null;
  let curl: ScratchCurl | null = null;
  let curlTimer = 0;
  /** 区块是否处于活跃状态（在视口内、页面可见、无打开的弹窗） */
  let active = false;
  let revealed = false;
  const coverDpr = Math.min(window.devicePixelRatio || 1, 2);
  const coverObserver = new ResizeObserver(() => layoutCover());

  /** 播放一段 Web Animation 并登记，结束或清理时取消，必要时移除节点 */
  function playAnimation(
    node: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    remove = true,
    startTime: CSSNumberish | null = null,
  ) {
    const animation = node.animate(keyframes, options);
    const tracked = { node, animation, remove };
    if (startTime !== null) animation.startTime = startTime;
    animations.add(tracked);
    animation.finished
      .catch(() => {})
      .then(() => {
        animation.cancel();
        if (remove) node.remove();
        animations.delete(tracked);
      });
  }

  /** 中止所有效果：动画、粒子、排队的指针与卷屑 */
  function resetEffects() {
    animations.forEach((tracked) => {
      tracked.animation.cancel();
      if (tracked.remove) tracked.node.remove();
    });
    animations.clear();
    cancelAnimationFrame(frameId);
    frameId = 0;
    particles.length = 0;
    pointerQueue.length = 0;
    lastFrame = -Infinity;
    particlesDirty = false;
    if (particleContext) {
      particleContext.clearRect(0, 0, coverWidth + 80, coverHeight + 180 + PARTICLE_TOP_PAD);
    }
    clearTimeout(curlTimer);
    curlTimer = 0;
    curl = null;
    lastPoint = null;
  }

  /** 按需创建粒子画布（比涂层左右各宽 40、下方多 180、上方多 64）与刮屑精灵图 */
  function ensureParticleCanvas() {
    if (particleCanvas) return;
    particleCanvas = document.createElement("canvas");
    particleCanvas.className = "reward-scratch-particles";
    particleCanvas.width = Math.ceil((coverWidth + 80) * particleDpr);
    particleCanvas.height = Math.ceil((coverHeight + 180 + PARTICLE_TOP_PAD) * particleDpr);
    Object.assign(particleCanvas.style, {
      top: "-64px",
      width: `${coverWidth + 80}px`,
      height: `${coverHeight + 180 + PARTICLE_TOP_PAD}px`,
    });
    fragments.append(particleCanvas);
    particleContext = particleCanvas.getContext("2d")!;
    particleContext.scale(particleDpr, particleDpr);
    sprites = document.createElement("canvas");
    sprites.width = 128;
    sprites.height = 48;
    paintScratchSprites(sprites.getContext("2d")!);
  }

  /** 绘制并淘汰粒子：碎屑受 320 像素/秒² 重力下落、自转并渐隐；最后绘制正在卷起的刮屑条 */
  function drawParticles(now: number) {
    const context = particleContext!;
    const spriteSheet = sprites!;
    context.clearRect(0, 0, coverWidth + 80, coverHeight + 180 + PARTICLE_TOP_PAD);
    let alive = 0;
    for (const particle of particles) {
      const elapsed = Math.max(0, (now - particle.start) / 1e3);
      const progress = elapsed / particle.duration;
      if (progress >= 1) continue;
      particles[alive++] = particle;
      context.save();
      context.globalAlpha = (particle.opacity ?? 0.85) * (1 - progress) ** 1.3;
      context.translate(
        40 + particle.x + particle.vx * elapsed,
        PARTICLE_TOP_PAD + particle.y + particle.vy * elapsed + 160 * elapsed * elapsed,
      );
      context.rotate(particle.angle + particle.spin * elapsed);
      if (particle.ribbon) {
        const size = particle.size;
        const thickness = particle.thickness || 10;
        context.drawImage(
          spriteSheet,
          particle.variant * 16,
          16,
          16,
          16,
          -size / 2,
          -thickness / 2,
          size,
          thickness,
        );
      } else {
        context.drawImage(
          spriteSheet,
          particle.variant * 16,
          0,
          16,
          16,
          -particle.size / 2,
          -particle.size * 0.35,
          particle.size,
          particle.size * 0.7,
        );
      }
      context.restore();
    }
    if (curl) {
      context.save();
      context.globalAlpha = curl.opacity;
      context.translate(40 + curl.x, PARTICLE_TOP_PAD + curl.y);
      context.rotate(curl.angle + Math.PI / 2);
      // 投影随刮擦距离加深，并向下偏 0.6
      context.globalAlpha = 0.75 + 0.25 * Math.min(1, curl.distance / 120);
      context.drawImage(
        spriteSheet,
        curl.variant * 16,
        32,
        16,
        16,
        -curl.size / 2,
        -curl.thickness / 2 + 0.6,
        curl.size,
        curl.thickness,
      );
      context.globalAlpha = curl.opacity;
      context.drawImage(
        spriteSheet,
        curl.variant * 16,
        16,
        16,
        16,
        -curl.size / 2,
        -curl.thickness / 2,
        curl.size,
        curl.thickness,
      );
      context.restore();
    }
    particles.length = alive;
  }

  /** 新增一片碎屑（最多同时 160 片） */
  function spawnShard(x: number, y: number, size: number, start: number) {
    if (particles.length >= 160) return;
    particles.push({
      x,
      y,
      size,
      start,
      variant: Math.floor(Math.random() * 8),
      angle: Math.random() * Math.PI,
      vx: (Math.random() - 0.5) * 100,
      vy: 15 + Math.random() * 35,
      spin: (Math.random() - 0.5) * 9,
      duration: 0.65 + Math.random() * 0.3,
    });
  }

  function scheduleFrame() {
    if (active && !frameId && !inFrame) frameId = requestAnimationFrame(frame);
  }

  /** 一帧：60fps 节流，处理排队的指针，再重绘粒子 */
  function frame(time: number) {
    frameId = 0;
    if (!active) return;
    const elapsed = time - lastFrame;
    if (elapsed < FRAME_MS - 0.1) {
      scheduleFrame();
      return;
    }
    lastFrame =
      Number.isFinite(elapsed) && elapsed >= FRAME_MS ? time - (elapsed % FRAME_MS) : time;
    inFrame = true;
    if (pointerQueue.length && !revealed) {
      const rect = cover.getBoundingClientRect();
      for (const sample of pointerQueue) {
        if (revealed) break;
        if (sample === null) {
          lastPoint = null;
          releaseCurl();
        } else {
          scratchTo(sample, rect);
        }
      }
    }
    pointerQueue.length = 0;
    if (particleContext && (particlesDirty || particles.length)) drawParticles(time);
    particlesDirty = false;
    inFrame = false;
    if (particles.length && !reducedMotion.matches) scheduleFrame();
  }

  /** 有粒子或卷屑需要绘制时，确保粒子画布存在并调度一帧 */
  function kickParticles() {
    if ((particles.length || curl) && active && !reducedMotion.matches) {
      ensureParticleCanvas();
      particlesDirty = true;
      scheduleFrame();
    }
  }

  /**
   * 在每个数字字形上按 3 列 × 5 行取采样点，读出该处涂层的不透明度；
   * alpha < 32 视为已刮开
   */
  function sampleDigits() {
    samples.length = 0;
    exposedCount = 0;
    const coverRect = cover.getBoundingClientRect();
    const pixels = coverContext.getImageData(0, 0, coverCanvas.width, coverCanvas.height).data;
    for (const amount of area.querySelectorAll(".reward-medal-amount strong")) {
      const text = amount.firstChild;
      if (!(text instanceof CharacterData)) continue;
      for (let index = 0; index < text.length; index++) {
        if (!/\d/.test(text.data.charAt(index))) continue;
        const range = document.createRange();
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        const box = range.getBoundingClientRect();
        for (let row = 0; row < 5; row++) {
          for (let column = 0; column < 3; column++) {
            const x = box.left - coverRect.left + (box.width * (column + 1)) / 4;
            const y = box.top - coverRect.top + (box.height * (row + 1)) / 6;
            const pixelX = Math.max(0, Math.min(coverCanvas.width - 1, Math.floor(x * coverDpr)));
            const pixelY = Math.max(0, Math.min(coverCanvas.height - 1, Math.floor(y * coverDpr)));
            const alpha = pixels[(pixelY * coverCanvas.width + pixelX) * 4 + 3]!;
            const exposed = alpha < 32;
            samples.push({ x, y, exposed, remaining: alpha / 255 });
            if (exposed) exposedCount++;
          }
        }
      }
    }
  }

  /**
   * 布局涂层：把涂层的纵向范围写入 --scratch-top/--scratch-height（覆盖所有金额，上下各留 3）；
   * 尺寸变化时重建画布——已有涂层按新尺寸缩放保留刮痕，首次则绘制全新的银色涂层
   */
  function layoutCover() {
    if (revealed) return;
    const areaRect = area.getBoundingClientRect();
    const amountRects = [...area.querySelectorAll(".reward-medal-amount")].map((element) =>
      element.getBoundingClientRect(),
    );
    const top = Math.min(...amountRects.map((rect) => rect.top)) - areaRect.top - 3;
    const bottom = Math.max(...amountRects.map((rect) => rect.bottom)) - areaRect.top + 3;
    area.style.setProperty("--scratch-top", `${top}px`);
    area.style.setProperty("--scratch-height", `${bottom - top}px`);
    const width = cover.clientWidth;
    const height = cover.clientHeight;
    if (!width || !height || (width === coverWidth && height === coverHeight)) return;
    const snapshot = document.createElement("canvas");
    snapshot.width = coverCanvas.width;
    snapshot.height = coverCanvas.height;
    if (coverWidth) snapshot.getContext("2d")!.drawImage(coverCanvas, 0, 0);
    const hadCover = coverWidth > 0;
    coverWidth = width;
    coverHeight = height;
    coverCanvas.width = Math.ceil(width * coverDpr);
    coverCanvas.height = Math.ceil(height * coverDpr);
    coverContext.setTransform(coverDpr, 0, 0, coverDpr, 0, 0);
    resetEffects();
    if (particleCanvas) {
      particleCanvas.remove();
      particleCanvas = null;
      particleContext = null;
      sprites = null;
    }
    if (hadCover) {
      coverContext.drawImage(snapshot, 0, 0, width, height);
      sampleDigits();
      return;
    }
    // 底色：偏左上的金属渐变
    const base = coverContext.createLinearGradient(0, 0, width * 0.22, height);
    base.addColorStop(0, "#a3a9af");
    base.addColorStop(0.22, "#969da4");
    base.addColorStop(0.48, "#adb3b9");
    base.addColorStop(0.74, "#9ca3aa");
    base.addColorStop(1, "#8c949c");
    coverContext.fillStyle = base;
    coverContext.fillRect(0, 0, width, height);
    // 斜向的一道柔光
    const sheen = coverContext.createLinearGradient(0, height, width, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.38, "rgba(255,255,255,.015)");
    sheen.addColorStop(0.58, "rgba(255,255,255,.09)");
    sheen.addColorStop(0.78, "rgba(255,255,255,.015)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    coverContext.fillStyle = sheen;
    coverContext.fillRect(0, 0, width, height);
    // 横向拉丝纹，每 12 像素一条亮纹
    for (let y = 2; y < height; y += 4) {
      coverContext.fillStyle = y % 12 === 2 ? "rgba(255,255,255,.035)" : "rgba(31,40,49,.018)";
      coverContext.fillRect(0, y, width, 0.5);
    }
    // 倾斜 7.5° 交错平铺的「刮开看数量」压印字（浅色高光 + 深色本体）
    coverContext.save();
    coverContext.translate(width / 2, height / 2);
    coverContext.rotate(-Math.PI / 24);
    coverContext.font = "500 12px system-ui,sans-serif";
    coverContext.textAlign = "center";
    coverContext.textBaseline = "middle";
    const diagonal = Math.ceil(Math.hypot(width, height));
    const rowGap = 46;
    const columnGap = 156;
    for (let row = -Math.ceil(diagonal / rowGap); row <= Math.ceil(diagonal / rowGap); row++) {
      for (let column = -diagonal; column <= diagonal; column += columnGap) {
        const textX = column + ((Math.abs(row) % 2) * columnGap) / 2;
        const textY = row * rowGap;
        coverContext.fillStyle = "rgba(245,248,250,.32)";
        coverContext.fillText("刮开看数量", textX, textY + 0.4);
        coverContext.fillStyle = "rgba(44,54,64,.38)";
        coverContext.fillText("刮开看数量", textX, textY);
      }
    }
    coverContext.restore();
    // 四边的高光与暗边
    coverContext.fillStyle = "rgba(239,244,248,.38)";
    coverContext.fillRect(1, 0, width - 2, 1);
    coverContext.fillStyle = "rgba(34,43,53,.18)";
    coverContext.fillRect(0, height - 1, width, 1);
    coverContext.fillStyle = "rgba(239,244,248,.12)";
    coverContext.fillRect(0, 1, 1, height - 2);
    coverContext.fillStyle = "rgba(34,43,53,.1)";
    coverContext.fillRect(width - 1, 1, 1, height - 2);
    sampleDigits();
  }

  /**
   * 整层揭开：在剩余涂层上按约 128 个网格点抖动取样，有涂层处迸出碎屑；
   * 卡片上闪一道光，卡片本身左右晃动一下；随后移除涂层按钮
   */
  function reveal() {
    if (revealed) return;
    releaseCurl();
    revealed = true;
    if (!reducedMotion.matches) {
      const pixels = coverContext.getImageData(0, 0, coverCanvas.width, coverCanvas.height).data;
      const start = performance.now();
      const columns = Math.ceil(Math.sqrt((128 * coverWidth) / coverHeight));
      const rows = Math.ceil(128 / columns);
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const x = ((column + 0.2 + Math.random() * 0.6) * coverWidth) / columns;
          const y = ((row + 0.2 + Math.random() * 0.6) * coverHeight) / rows;
          const pixelX = Math.min(coverCanvas.width - 1, Math.floor(x * coverDpr));
          const pixelY = Math.min(coverCanvas.height - 1, Math.floor(y * coverDpr));
          if (pixels[(pixelY * coverCanvas.width + pixelX) * 4 + 3]! >= 32) {
            spawnShard(x, y, 4 + Math.random() * 6, start);
          }
        }
      }
      kickParticles();
      const flash = document.createElement("span");
      flash.className = "reward-scratch-flash";
      flash.setAttribute("aria-hidden", "true");
      track.append(flash);
      // 闪光与卡片晃动对齐到同一时间线起点
      const startTime = document.timeline.currentTime;
      playAnimation(
        flash,
        [
          {
            transform: "scaleY(.08)",
            opacity: 0.35,
            easing: "cubic-bezier(.16,1,.3,1)",
          },
          {
            transform: "scaleY(1.05)",
            opacity: 1,
            offset: 1 / 7,
            easing: "ease-out",
          },
          {
            transform: "scaleY(1)",
            opacity: 0.55,
            offset: 0.5,
            easing: "ease-out",
          },
          { transform: "scaleY(1)", opacity: 0 },
        ],
        { duration: 560, easing: "linear", fill: "forwards" },
        true,
        startTime,
      );
      playAnimation(
        track,
        [
          {
            translate: "0px",
            rotate: "0deg",
            easing: "cubic-bezier(.16,1,.3,1)",
          },
          {
            translate: "-3px",
            rotate: "-.35deg",
            offset: 1 / 7,
            easing: "ease-in-out",
          },
          {
            translate: "5px",
            rotate: ".6deg",
            offset: 0.36,
            easing: "ease-in-out",
          },
          {
            translate: "-3px",
            rotate: "-.35deg",
            offset: 0.6,
            easing: "ease-in-out",
          },
          {
            translate: "1.5px",
            rotate: ".15deg",
            offset: 0.8,
            easing: "ease-out",
          },
          { translate: "0px", rotate: "0deg" },
        ],
        { duration: 560, easing: "linear" },
        false,
        startTime,
      );
    }
    cover.remove();
    coverObserver.disconnect();
  }

  /**
   * 刮擦命中判定：把从 from 到 to 的线段视为两端各延长 2.5、半宽 11.5 的矩形，
   * 落在其中的未刮开采样点按本次笔触强度衰减剩余不透明度，低于 32/255 记为刮开
   * @returns 是否已刮开九成采样点
   */
  function applyScratch(
    from: { x: number; y: number },
    to: { x: number; y: number },
    strength: number,
  ) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.5) return false;
    const ux = dx / length;
    const uy = dy / length;
    for (const sample of samples) {
      if (sample.exposed) continue;
      const offsetX = sample.x - from.x;
      const offsetY = sample.y - from.y;
      // 投影到线段方向（along）与法向（across）
      const along = offsetX * ux + offsetY * uy;
      const across = -offsetX * uy + offsetY * ux;
      if (along >= -2.5 && along <= length + 2.5 && Math.abs(across) <= 11.5) {
        sample.remaining *= 1 - strength;
        if (sample.remaining < 32 / 255) {
          sample.exposed = true;
          exposedCount++;
        }
      }
    }
    return samples.length > 0 && exposedCount / samples.length >= 0.9;
  }

  /** 让当前卷屑脱落为一个下落的粒子（最多同时 32 个粒子时才加） */
  function releaseCurl() {
    clearTimeout(curlTimer);
    curlTimer = 0;
    if (!curl) return;
    const released = curl;
    curl = null;
    if (active && !reducedMotion.matches && particles.length < 32) {
      particles.push({
        ribbon: true,
        x: released.x,
        y: released.y,
        size: released.size,
        thickness: released.thickness,
        opacity: released.opacity,
        start: performance.now(),
        variant: released.variant,
        angle: released.angle + Math.PI / 2,
        vx: Math.cos(released.angle) * 18,
        vy: Math.sin(released.angle) * 12 + 20,
        spin: (Math.random() - 0.5) * 0.9,
        duration: 0.65 + Math.random() * 0.15,
      });
    }
    if (particleCanvas) {
      particlesDirty = true;
      scheduleFrame();
    }
  }

  /**
   * 刮擦时在笔尖前方卷起一条刮屑：随累计距离变长变粗、变不透明；
   * 方向急转（夹角余弦 < 0.64）时旧的脱落、重新卷起；停笔 120ms 后自动脱落
   */
  function updateCurl(from: { x: number; y: number }, to: { x: number; y: number }) {
    if (reducedMotion.matches) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.5) return;
    const angle = Math.atan2(dy, dx);
    if (curl && Math.cos(angle - curl.angle) < 0.64) releaseCurl();
    if (!curl) {
      curl = {
        distance: 0,
        variant: Math.floor(Math.random() * 8),
        angle: 0,
        x: 0,
        y: 0,
        opacity: 0,
        size: 0,
        thickness: 0,
      };
    }
    curl.distance += length;
    curl.angle = angle;
    curl.x = to.x + Math.cos(angle) * 3;
    curl.y = to.y + Math.sin(angle) * 3;
    curl.opacity = 0.55 + 0.45 * Math.min(1, curl.distance / 120);
    curl.size = Math.min(42, 12 + curl.distance * 0.14);
    curl.thickness = Math.min(22, 6 + curl.distance * 0.065);
    clearTimeout(curlTimer);
    curlTimer = window.setTimeout(releaseCurl, 120);
    kickParticles();
  }

  /** 指针事件只入队，留到帧内处理；触控/笔需按下才算刮 */
  function queuePointer(event: PointerEvent) {
    if (revealed || !active || (event.pointerType !== "mouse" && !event.buttons)) return;
    pointerQueue.push({ clientX: event.clientX, clientY: event.clientY });
    scheduleFrame();
  }

  /** 从上一个点刮到当前点：以 75%~100% 的随机强度擦出宽 24、两端各延长 3 的条带 */
  function scratchTo(sample: PointerSample, coverRect: DOMRect) {
    const x = sample.clientX - coverRect.left;
    const y = sample.clientY - coverRect.top;
    const from = lastPoint || { x, y };
    lastPoint = { x, y };
    const dx = x - from.x;
    const dy = y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.5) return;
    coverContext.save();
    coverContext.globalCompositeOperation = "destination-out";
    const strength = 0.75 + Math.random() * 0.25;
    coverContext.globalAlpha = strength;
    coverContext.fillStyle = "#000";
    coverContext.translate(from.x, from.y);
    coverContext.rotate(Math.atan2(dy, dx));
    coverContext.fillRect(-3, -12, length + 6, 24);
    coverContext.restore();
    updateCurl(from, { x, y });
    if (applyScratch(from, { x, y }, strength)) reveal();
  }

  cover.addEventListener("pointermove", queuePointer, { passive: true, signal });
  cover.addEventListener("pointerdown", queuePointer, { passive: true, signal });
  for (const type of ["pointerleave", "pointercancel", "pointerup"] as const) {
    cover.addEventListener(
      type,
      () => {
        if (!revealed && active) {
          pointerQueue.push(null);
          scheduleFrame();
        }
      },
      { signal },
    );
  }
  // detail 为 0 表示由键盘（回车/空格）触发的点击，直接揭开
  cover.addEventListener(
    "click",
    (event) => {
      if (event.detail === 0) reveal();
    },
    { signal },
  );
  coverObserver.observe(area);
  layoutCover();
  const unsubscribeActivity = observeActivity(area, (isActive) => {
    active = isActive;
    if (!isActive) resetEffects();
  });
  reducedMotion.addEventListener(
    "change",
    () => {
      if (reducedMotion.matches) resetEffects();
    },
    { signal },
  );

  return () => {
    controller.abort();
    coverObserver.disconnect();
    unsubscribeActivity();
    resetEffects();
    cover.remove();
    fragments.remove();
    area.style.removeProperty("--scratch-top");
    area.style.removeProperty("--scratch-height");
    coverCanvas.width = 0;
    coverCanvas.height = 0;
    if (particleCanvas) {
      particleCanvas.width = 0;
      particleCanvas.height = 0;
    }
    if (sprites) {
      sprites.width = 0;
      sprites.height = 0;
    }
  };
}

/**
 * 为区块内全部 [data-reward-scratch] 区域挂载刮刮卡
 * @returns 清理函数
 */
function mountScratchCovers(root: HTMLElement): () => void {
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const cleanups = [...root.querySelectorAll<HTMLElement>("[data-reward-scratch]")].map((area) =>
    mountScratchCover(area, reducedMotion),
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}

/* ------------------------------------------------------------------------------------------------
 * 入口
 * ---------------------------------------------------------------------------------------------- */

/**
 * 挂载奖励区的全部动效
 *
 * 依次挂载：区块内每个 .reward-medals 的奖牌舞台、第一个 .reward-medals 的字符鱼群、所有 [data-reward-scratch] 刮刮卡。
 * 奖牌舞台的 WebGL 画布挂在 document.body 上（打开彩蛋时移入弹窗），由清理函数移除。
 *
 * @param root section#awards 元素（也可直接传 .reward-medals）
 * @returns 清理函数：移除全部监听、观察器、动画循环、计时器、WebGL 上下文、插入的节点与内联样式
 */
export function mountRewardMedals(root: HTMLElement): () => void {
  const medalSections = root.matches(".reward-medals")
    ? [root]
    : [...root.querySelectorAll<HTMLElement>(".reward-medals")];
  const cleanups = medalSections.map((section) => mountMedalStage(section));
  const creatureSection = medalSections[0];
  if (creatureSection) cleanups.push(mountCreatures(creatureSection));
  cleanups.push(mountScratchCovers(root));
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
