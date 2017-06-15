module.exports = "@export ecgl.hatching.vertex\n\n@import ecgl.realistic.vertex\n\n@end\n\n\n@export ecgl.hatching.fragment\n\n#define NORMAL_UP_AXIS 1\n#define NORMAL_FRONT_AXIS 2\n\n@import ecgl.common.uv.fragmentHeader\n\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\n\nuniform vec4 color : [0.0, 0.0, 0.0, 1.0];\nuniform vec4 paperColor : [1.0, 1.0, 1.0, 1.0];\n\nuniform mat4 viewInverse : VIEWINVERSE;\n\n#ifdef AMBIENT_LIGHT_COUNT\n@import qtek.header.ambient_light\n#endif\n#ifdef AMBIENT_SH_LIGHT_COUNT\n@import qtek.header.ambient_sh_light\n#endif\n\n#ifdef DIRECTIONAL_LIGHT_COUNT\n@import qtek.header.directional_light\n#endif\n\n#ifdef VERTEX_COLOR\nvarying vec4 v_Color;\n#endif\n\n\n@import ecgl.common.ssaoMap.header\n\n@import ecgl.common.bumpMap.header\n\n@import qtek.util.srgb\n\n@import ecgl.common.wireframe.fragmentHeader\n\n@import qtek.plugin.compute_shadow_map\n\nuniform sampler2D hatch1;\nuniform sampler2D hatch2;\nuniform sampler2D hatch3;\nuniform sampler2D hatch4;\nuniform sampler2D hatch5;\nuniform sampler2D hatch6;\n\nfloat shade(in float tone) {\n vec4 c = vec4(1. ,1., 1., 1.);\n float step = 1. / 6.;\n vec2 uv = v_DetailTexcoord;\n if (tone <= step / 2.0) {\n c = mix(vec4(0.), texture2D(hatch6, uv), 12. * tone);\n }\n else if (tone <= step) {\n c = mix(texture2D(hatch6, uv), texture2D(hatch5, uv), 6. * tone);\n }\n if(tone > step && tone <= 2. * step){\n c = mix(texture2D(hatch5, uv), texture2D(hatch4, uv) , 6. * (tone - step));\n }\n if(tone > 2. * step && tone <= 3. * step){\n c = mix(texture2D(hatch4, uv), texture2D(hatch3, uv), 6. * (tone - 2. * step));\n }\n if(tone > 3. * step && tone <= 4. * step){\n c = mix(texture2D(hatch3, uv), texture2D(hatch2, uv), 6. * (tone - 3. * step));\n }\n if(tone > 4. * step && tone <= 5. * step){\n c = mix(texture2D(hatch2, uv), texture2D(hatch1, uv), 6. * (tone - 4. * step));\n }\n if(tone > 5. * step){\n c = mix(texture2D(hatch1, uv), vec4(1.), 6. * (tone - 5. * step));\n }\n\n return c.r;\n}\n\nconst vec3 w = vec3(0.2125, 0.7154, 0.0721);\n\nvoid main()\n{\n#ifdef SRGB_DECODE\n vec4 inkColor = sRGBToLinear(color);\n#else\n vec4 inkColor = color;\n#endif\n\n#ifdef VERTEX_COLOR\n #ifdef SRGB_DECODE\n inkColor *= sRGBToLinear(v_Color);\n #else\n inkColor *= v_Color;\n #endif\n#endif\n\n vec3 N = v_Normal;\n#ifdef DOUBLE_SIDE\n vec3 eyePos = viewInverse[3].xyz;\n vec3 V = normalize(eyePos - v_WorldPosition);\n\n if (dot(N, V) < 0.0) {\n N = -N;\n }\n#endif\n\n float tone = 0.0;\n\n float ambientFactor = 1.0;\n\n#ifdef BUMPMAP_ENABLED\n N = bumpNormal(v_WorldPosition, v_Normal, N);\n ambientFactor = dot(v_Normal, N);\n#endif\n\n vec3 N2 = vec3(N.x, N[NORMAL_UP_AXIS], N[NORMAL_FRONT_AXIS]);\n \n @import ecgl.common.ssaoMap.main\n\n#ifdef AMBIENT_LIGHT_COUNT\n for(int i = 0; i < AMBIENT_LIGHT_COUNT; i++)\n {\n tone += dot(ambientLightColor[i], w) * ambientFactor * ao;\n }\n#endif\n#ifdef AMBIENT_SH_LIGHT_COUNT\n for(int _idx_ = 0; _idx_ < AMBIENT_SH_LIGHT_COUNT; _idx_++)\n {{\n tone += dot(calcAmbientSHLight(_idx_, N2) * ambientSHLightColor[_idx_], w) * ao;\n }}\n#endif\n#ifdef DIRECTIONAL_LIGHT_COUNT\n#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)\n float shadowContribsDir[DIRECTIONAL_LIGHT_COUNT];\n if(shadowEnabled)\n {\n computeShadowOfDirectionalLights(v_WorldPosition, shadowContribsDir);\n }\n#endif\n for(int i = 0; i < DIRECTIONAL_LIGHT_COUNT; i++)\n {\n vec3 lightDirection = -directionalLightDirection[i];\n float lightTone = dot(directionalLightColor[i], w);\n\n float shadowContrib = 1.0;\n#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)\n if (shadowEnabled)\n {\n shadowContrib = shadowContribsDir[i];\n }\n#endif\n\n float ndl = dot(N, normalize(lightDirection)) * shadowContrib;\n\n tone += lightTone * clamp(ndl, 0.0, 1.0);\n }\n#endif\n\n gl_FragColor = mix(inkColor, paperColor, shade(clamp(tone, 0.0, 1.0)));\n }\n@end\n";
