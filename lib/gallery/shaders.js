// Original Photoyoshi shader programs, retained for matching distortion and noise.
export const galleryFragment = `varying vec2 vUv;
uniform sampler2D noise;
uniform sampler2D tA;
uniform float hoverN;
uniform int f_type;
uniform bool u_isHovered;  // ホバーされているかどうか
uniform vec2 vUvScale;     // UVスケール
uniform float opacityN;    // 不透明度  //⚡️
uniform float scrollPow;   // スクロールの影響度
uniform float u_time;      // 時間
uniform vec2 uMouse;       // マウスのUV座標
uniform float radius;      // マウス周辺の影響範囲
uniform vec2 u_res;        // マウスのUV座標
uniform float mode;        //mode

float random(vec2 st) {
    float seed = dot(st, vec2(501., 302.));
    return fract(sin(seed) * 1000. * (u_time + 1.));
}
float circle(in vec2 _st, in float _radius, in float blurriness) {
    vec2 dist = _st;
    return 1. - smoothstep(_radius - (_radius * blurriness), _radius + (_radius * blurriness), dot(dist * 0.4, dist) * 1.0);
}

void main() {
    if(f_type == 1) {
        
          //Texture
        vec2 uv = (vUv - 0.5) * vUvScale + 0.5;
        if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { discard; } 

          // 歪んだUV座標を計算
        vec2 distortedUv = uv + vec2(
            sin(uv.y * 50.0 + u_time) * 0.001,   // Y方向の歪み
            cos(uv.x * 50.0 + u_time) * 0.001    // X方向の歪み
        );
          //Texture
        vec4  color       = texture2D(tA, uv);
        float gray        = (color.r + color.g + color.b) / 3.0;
        float opacity     = u_isHovered ? color.a : opacityN;
        vec4  colorD      = texture2D(tA, distortedUv);//full
              colorD.rgb += 0.01;                                 // RGB成分を少し増やして明るくする
        vec4  colorC      = texture2D(tA, distortedUv);//grid
              colorC.rgb += 0.05;                                  // RGB成分を少し増やして明るくする        

          //circle
        vec2  res            = u_res;
        vec2  st             = gl_FragCoord.xy / res.xy - vec2(0.5);
              st.y          *= u_res.y / u_res.x;
        vec2  mouse          = uMouse - .5;
              mouse.y       *= u_res.y / u_res.x;
              mouse         *= -1.;
        vec2  circlePos      = st + mouse;
        float c              = circle(circlePos, 0.015, 0.015) * 1.;
        float mouseDistance  = length(circlePos);                     // マウスとの距離

                                                                                                                         // マウスからの距離に基づいてoutherを補正]
        float outher            = smoothstep(radius, radius * (  40.0  + ( hoverN * 40.)  +  ( (mode * 300.) * hoverN))  , mouseDistance);  // マウスから遠いほど1に近づく
        vec2  adjustedCirclePos = circlePos * (1.0 - outher * 0.5);                                                      // outherに応じてcirclePosを補正
        vec4  texSample = texture2D(noise, vUv + adjustedCirclePos * 0.2);
        float r         = outher * (1.0 + 0.0000001 * 2.0) - 0.0000001;
        float mixf      = clamp((texSample.r - r) * (1.0 / 0.0000001), 0.0, 1.0);

          //MIX&Export
        vec4 hoverColor   = mix(vec4(gray, gray, gray, opacity), color, hoverN);
        vec4 modeColor    = mix( colorC,colorD, mode);
        vec4 noiseColor   = mix(hoverColor, modeColor, mixf);
        vec4 finalColor   = mix(color, noiseColor, 1.);
        gl_FragColor      = finalColor;
    
    }

}`

export const galleryVertex = `varying vec2  vUv;
uniform int   u_type;
uniform float pw;
const float curvePower = 5.0;  // Z軸方向の変化を強調

void main() {

    vUv = uv;

    if(u_type == 1) {

        float normalizedX = position.x / 1.0;                                             // 左端を基準に正規化
        float tz          = pw * curvePower * normalizedX;                                // カーブの変位量を計算
        vec3  newPosition = vec3(position.x, position.y, tz);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    

    } 
}


`

export const galleryScreenVertex = `varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`

export const galleryScreenFragment = `uniform sampler2D tDiffuse;
uniform float u_time;
uniform vec2 uMouse;
uniform vec2 resolution;
uniform int u_type;
uniform float scroll_pow;
uniform float blendFactor;
uniform float modeChangePow;
uniform float roundPow;
uniform float uMouseSwitch;
uniform float mode;
uniform float device;//0がpc1がmob
uniform float pm;
uniform float mousePow;
varying vec2 vUv;

float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
    uv -= disc_center;
    uv *= resolution;
    float dist = sqrt(dot(uv, uv));
    return smoothstep(disc_radius + border_size, disc_radius - border_size, dist);
}

float hash(vec2 p) {
    float h = dot(p, vec2(1.0, 1.0));
    return fract(tan(h) * 0.1);
}

void main() {
    vec2 uv = vUv;
    if(u_type == 1) {

        //Twist
        vec2 uvTwist = uv;
        float angleX = (uv.x - 0.5) * 3.14159 * 0.9;
        uvTwist.y -= tan(angleX) * 0.15;
        //  if(pm < 0.0) {
        //     // uvTwist.y += tan(angleX) * 0.15 * scroll_pow;
        //     uvTwist.y -= tan(angleX) * -0.15 * scroll_pow;
        // } else {
        //     // uvTwist.y -= tan(angleX) * 0.15 * scroll_pow;
        //     uvTwist.y -= tan(angleX) * 0.15* scroll_pow;
        // }

         //Twiset-2
        vec2 uvTwist2 = uv;
        float angleX2 = (uv.x - 0.5) * 3.14159;
        float blend = smoothstep(0.2, 0.8, uv.x);
        uvTwist2.y += tan(angleX2) * -0.002 * (1. - blend);
        uvTwist2.y -= tan(angleX2) * -0.002 * blend;

        //Twist - 端っこ
        // vec2 uvTwist = uv;
        // float angleX = (uv.x - 0.5) * 3.14159 * 0.9; // 横方向の影響
        // float angleY = (uv.y - 0.5) * 3.14159 * 0.9; // 縦方向の影響
        // float weight = smoothstep(0.0, .5, uv.x) * smoothstep(0.5, 1.0, uv.y); // 右下で強調
        // // weight *= pm; // pm が -1.0 の場合、weight の向きが逆転
        // uvTwist.y -= tan(angleX) * 0.15 * weight * pm;

        //台形-1
        vec2 uvDepth = uv;
        float edgeInfluenceX = smoothstep(0.0, 0.4, uv.x) - smoothstep(0.6, 1.0, uv.x);
        uvDepth.y += (edgeInfluenceX * 5.5 * -0.05);
        // uvDepth.y = uvDepth.y * pm
        //台形-2
        vec2 uvDepth2 = uv;
        float edgeInfluenceX2 = smoothstep(0.0, 0.2, uv.x) - smoothstep(0.8, 1.0, uv.x);
        uvDepth2.y -= (edgeInfluenceX2 - 1.0) * .025; // 変化量を調整

        //WAVE - 上下が膨らむpattern
        // vec2  uvWave = uv;
        // float uvWaveDistanceFromCenter = distance(uvWave, vec2(0.5, uvWave.y));
        // float uvWaveStrength = (-1. * ((scroll_pow*(1.0-mode))))*1.1;
        // float uvWavePattern = sin(uvWave.x * 3.14159) * .15;
        // float uvWaveWidth = 1.0;
        // float uvWaveBlend = smoothstep(0.05, .95, uvWave.y);
        // if(uvWaveDistanceFromCenter < uvWaveWidth) {
        //     float effect = smoothstep(uvWaveWidth / 4., 0., uvWaveDistanceFromCenter);
        //     uvWave.y += effect * uvWavePattern * uvWaveStrength * mix(-1.0, 1.0, uvWaveBlend);
        // }

        //WAVE - 左右
        // vec2 uvWave = uv;
        // float uvWaveDistanceFromCenter = distance(uvWave, vec2(1.5, uvWave.y)); 
        // float uvWaveStrength = (-1. * ((scroll_pow * (1.0 - mode)))) * 5.0;
        // float uvWavePattern = sin(uvWave.x * 3.14159) * 1.0;
        // float uvWaveWidth = 1.5;
        // float uvWaveBlend = smoothstep(0.05, 0.95, uvWave.y);
        // if(uvWaveDistanceFromCenter < uvWaveWidth) {
        //     float effect = smoothstep(uvWaveWidth / 2., 0.0, uvWaveDistanceFromCenter);
        //     uvWave.y += (effect * uvWavePattern * uvWaveStrength * mix(-1.0, 1.0, uvWaveBlend) );
        // }
        vec2 uvWave2 = uv;

        //Transition - Wave
        vec2 tuvWave = uv;
        float tDistanceFromCenter = distance(tuvWave, vec2(0.5, tuvWave.y)); // セミコロンを追加
        float tWaveStrength = 0.05;
        float tWavePattern = cos(tuvWave.x * 3.14159);
        float tWidth = 1.;
        float tEffect = smoothstep(tWidth, .0, tDistanceFromCenter);
        tuvWave.y += tEffect * tWavePattern * tWaveStrength;

        //Paper
        // float hash = hash(vUv * 0.5);
        // float c = circle(uv, uMouse, 0.0, 0.06) * 0.1;
        // vec2 warpedUV = vUv + vec2(hash - 0.5) * c * mousePow;
        float hash = hash(vUv * 0.5);
        float c = circle(uv, vec2(uMouse.x, uMouse.y), 0.0, .01) * 0.1;
        float smoothFactor = smoothstep(0.45, 0.55, vUv.x);
        vec2 direction = mix(vec2(.0, .15), vec2(-0.15, 0.0), cos(smoothFactor * 3.14159));
        vec2 warpedUV = vUv + direction * (vec2(hash - 0.5) * c * 2.0);

        // gl_FragColor = texture2D(tDiffuse, warpedUV);

        //Mix
        vec2 powEffect = mix(uvWave2, uvTwist, scroll_pow * 0.5);
        vec2 modeChange = mix(powEffect, uvWave2, mode);
        vec2 modeEffect = mix(modeChange, warpedUV, 0.0);//0..grid 1..full
        vec2 modeEffect2 = mix(uvDepth2, uvTwist, 0.5);//0..grid 1..full
        vec2 transitionEffect = mix(modeEffect, modeEffect2, modeChangePow);//0..grid 1..full

        vec2 deviceOriginal = mix(uvTwist2, uvTwist, .0);
        vec2 deviceEffect = mix(modeEffect, deviceOriginal, device);//mobile
        vec2 finalUV = mix(deviceEffect, transitionEffect, modeChangePow); //modeChange 
        // vec2 finalUV = mix(uvWave2, uvWave2, modeChangePow); //modeChange 
        //斜め
        // vec2 deviceEffect = mix(modeEffect, uvTwist, .2 - (0.1 * device));//mobile
        // vec2 finalUV = mix(deviceEffect, uvDepth2, .3); //modeChange 

        //uvWave
        //
        float edgeDarkness = smoothstep(0.3, 0., uv.x) + smoothstep(0.7, 1., uv.x);
        edgeDarkness = clamp(edgeDarkness, 0.0, 1.0);
        vec4 baseColor = texture2D(tDiffuse, finalUV);
        vec4 darkenedColor = baseColor * (1.0 - edgeDarkness * 0.8);

        vec4 finalOutColor = mix(baseColor, darkenedColor, mode);
        gl_FragColor = finalOutColor;
    }

}
`

export const viewerFragment = `varying vec2 vUv;
uniform sampler2D tA;
uniform sampler2D noise;
uniform vec2 scale;
uniform float fade;
uniform int f_type;
uniform vec2 vUvScale;      // UVスケール
uniform float u_time;       // 時間offset
uniform vec2 uMouse;        // マウスのUV座標
uniform float radius;       // マウス周辺の影響範囲
uniform vec2 u_res;         // マウスのUV座標
uniform float u_mousePow;   // マウスのUV座標//不要？
uniform float ttP;          // マウス周辺の影響範囲
uniform float zoom;         // マウス周辺の影響範囲
uniform float device;       //0がpc1がmob

float circle(in vec2 _st, in float _radius, in float blurriness) {
        vec2 dist = _st;
        return 1. - smoothstep(_radius - (_radius * blurriness), _radius + (_radius * blurriness), dot(dist * 0.4, dist) * 1.0);
}
void main() {
        if(f_type == 4) {
        //CROP
                vec2 uv = (vUv - 0.5) * vUvScale + 0.5;
                if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { discard; }

        // Mouse Interaction
                vec2 res = u_res;
                vec2 st = gl_FragCoord.xy / res.xy - vec2(0.5);
                st.y *= u_res.y / u_res.x;
                vec2 mouse = uMouse - 0.5;
                mouse.y *= u_res.y / u_res.x;
                mouse *= -1.0;
                vec2 circlePos = st + mouse;
                float c = circle(circlePos, 0.015, 0.015);
                float mouseDistance = length(circlePos);
                float outher = smoothstep(radius, radius * (((100. + (100. * u_mousePow)) * (1.0 - device)) + 0.025) * (1.01 - zoom)  , mouseDistance);
                vec2 adjustedCirclePos = circlePos * (1.0 - outher * 0.5);



                // vec2 refractUv = uv + vec2(sin(texSample.r * 0.02 + u_time) * 0.01, cos(texSample.g * 0.02 + u_time) * 0.01);
                // vec2 refractUv = uv + vec2(sin(uv.y * 10.0 + (u_time)) * 0.005, cos(uv.x * 10.0 + u_time) * 0.006);
                vec2 refractUv = uv + vec2(sin(uv.y * 30.0 + u_time) * 0.003, cos(uv.x * 30.0 + u_time) * 0.003);
                vec4 refractedColor = texture2D(tA, refractUv);
                vec4 texSample = texture2D(noise, refractUv);                

                float dynamicScale = 1.0 + (1.0 - smoothstep(0.0, radius, mouseDistance)) * 1.0;
                vec2 noiseUV = vUv * dynamicScale;
                float r = outher * (1.0 + 0.0000001 * 2.0) - 0.0000001;
                float mixf = clamp((texSample.r - r) * (1.0 / 0.0000001), 0.0, 1.0);

                
                // Center Interaction
                float y = 0.0 + (ttP * 0.5);
                vec2 center = vec2(0.5, y);
                vec2 circlePos3 = uv - center;
                float centerDistance3 = length(circlePos3);
                float outher3 = smoothstep(radius, radius * (5000.0 * 0.), centerDistance3);
                vec2 adjustedCirclePos3 = circlePos3 * (1.0 - outher3 * 0.5);
                vec4 texSample3 = texture2D(noise, refractUv);
                float r3 = outher3 * (1.0 + 0.0000001 * 2.0) - 0.0000001;
                float mixf3 = clamp((texSample3.r - r3) * (1.0 / 0.0000001), 0.0, 1.0);

                
                //COLOR /MIX
                vec4 color = texture2D(tA, uv);
                vec4 colorNoise = vec4(refractedColor.rgb*1.09, 1.0);

                vec4 initColor        = mix(colorNoise, color, mixf3);
                vec4 finalColor       = mix(initColor, colorNoise, mixf);
                vec4 heoverOpacity    = mix(initColor,finalColor,u_mousePow);
                vec4 finalDeviceColor = mix(heoverOpacity, color, device);


                
                gl_FragColor          = finalDeviceColor;
        }

}`

export const viewerVertex = `varying vec2 vUv;
uniform int u_type;
uniform float pw;
const float curvePower = 5.0; // Z軸方向の変化を強調

void main() {

    vUv = uv;

    if(u_type == 2) {

        float normalizedX = position.x / 1.0; // 左端を基準に正規化
        float tz = pw * curvePower * normalizedX;  // カーブの変位量を計算
        vec3 newPosition = vec3(position.x, position.y, tz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    }
}
`

export const viewerScreenVertex = `varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`

export const viewerScreenFragment = `varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float u_time;
uniform int u_type;
uniform vec2 uMouse;
uniform vec2 resolution;
uniform float mousePow;
                               // uniform float blendFactor;
                               // uniform float modeChangePow;
                               // uniform float roundPow;
uniform float device;          //0がpc1がmob
uniform float zoomTransition;  // マウス周辺の影響範囲

float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
          uv   -= disc_center;
          uv   *= resolution;
    float dist  = sqrt(dot(uv, uv));
    return smoothstep(disc_radius + border_size, disc_radius - border_size, dist);
}

float hash(vec2 p) {
    float h = dot(p, vec2(1.0, 1.0));
    return fract(tan(h) * 0.1);
}

void main() {
    vec2 uv = vUv;

    if(u_type == 123) {
        vec2  uvTwist2    = uv;
        vec2  centeredUV  = uv - 0.5;
        float dist        = length(centeredUV);
        float strength    = -0.06;
        float effect      = smoothstep(0.45, 0.0, dist);
              uvTwist2   += centeredUV * effect * strength;

        float hash             = hash(vUv * 0.5);
        float c                = circle(uv, uMouse, 0.0, 0.06) * 0.1;
        float smoothFactor     = smoothstep(0.45, 0.55, vUv.x);
        vec2  direction        = mix(vec2(-1.0, 1.0), vec2(1.0, 1.0), smoothFactor);
        vec2  warpedUV         = vUv + direction * (vec2(hash - 0.5) * c * 1.0);
        vec2  finalDeviceColor = mix(warpedUV,vUv,1.);
        
        vec2 zoomMix      = mix(vUv,uvTwist2, zoomTransition);
             gl_FragColor = texture2D(tDiffuse, zoomMix);
    } 

}
`
