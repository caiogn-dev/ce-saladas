import { useEffect, useRef } from 'react';

const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_res;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = p * 2.1 + vec2(0.31, 0.73);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    float t = u_time * 0.22;
    vec2 p = uv * 1.7;
    p += fbm(p * 0.85 + t * 0.28) * 0.95;
    float f = fbm(p * 0.75 + t * 0.14);

    vec3 deep   = vec3(0.067, 0.165, 0.122); // #1B4332
    vec3 forest = vec3(0.176, 0.416, 0.306); // #2D6A4F
    vec3 orange = vec3(1.000, 0.420, 0.208); // #FF6B35
    vec3 amber  = vec3(0.990, 0.740, 0.275); // warm peak

    vec3 col = deep;
    col = mix(col, forest, smoothstep(0.22, 0.52, f));
    col = mix(col, orange, smoothstep(0.48, 0.70, f + 0.14 * sin(t * 1.2 + uv.y * 1.5)));
    col = mix(col, amber,  smoothstep(0.66, 0.86, f + 0.09 * cos(t * 0.9 + uv.x)));

    float vig = 1.0 - smoothstep(0.35, 1.45, length(uv));
    col *= mix(0.12, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const mkShader = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
};

const ShaderBackground = ({ className, style }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_res');

    // O custo deste shader é POR PIXEL: são duas passadas de fbm de 6 oitavas,
    // ou seja algumas dezenas de sin() em cada pixel, 60 vezes por segundo. Em
    // tela cheia num 1080p isso é ordem de 10^8 operações transcendentais por
    // segundo — o suficiente pra saturar uma GPU integrada e congelar a aba.
    //
    // A saída é nuvem desfocada, sem uma única aresta: renderizar num buffer
    // pequeno e deixar o CSS ampliar é visualmente indistinguível e corta o
    // trabalho por um fator de ~10.
    const LADO_MAXIMO = 480;

    const resize = () => {
      const larguraCss = canvas.offsetWidth;
      const alturaCss = canvas.offsetHeight;
      if (!larguraCss || !alturaCss) return;

      const escala = Math.min(1, LADO_MAXIMO / Math.max(larguraCss, alturaCss));
      const w = Math.max(1, Math.round(larguraCss * escala));
      const h = Math.max(1, Math.round(alturaCss * escala));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf;
    const t0 = performance.now();
    const draw = () => {
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };

    // Aba em segundo plano não precisa de nuvem animada. O rAF já é pausado
    // pelo navegador na maioria dos casos, mas não quando a aba está visível
    // atrás de outra janela — e aí o shader seguia queimando GPU à toa.
    const aoTrocarVisibilidade = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', aoTrocarVisibilidade);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', aoTrocarVisibilidade);
      // Devolve o contexto WebGL na hora. Sem isso, cada montagem do splash
      // numa navegação SPA deixa um contexto vivo, e o Chrome derruba o mais
      // antigo depois de ~16 — o canvas some sem erro nenhum no console.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
    />
  );
};

export default ShaderBackground;
