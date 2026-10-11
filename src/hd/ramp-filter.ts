import { DB32 } from '@constants';
import { loOf, RAMP } from '@hd/palette';
import { Filter, GlProgram, UniformGroup } from 'pixi.js';

// The world behind an open book in HD (RECIPES §7): no translucent veil —
// every pixel steps two places down its ramp. The shader snaps each pixel to
// the nearest DB32 tone (the off-palette tones the game ships land on their
// nearest) and paints the tone two shadows below it. A tone with no ramp of
// its own borrows the ramp of the nearest tone that has one.

const TONES = Object.values(DB32);

function rgb(c: number): [number, number, number] {
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
}

function distance(a: number, b: number): number {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

// Two steps down the ramp from `c`, or from its nearest ramped tone.
export function twoDown(c: number): number {
  let ramped = c;
  if (!RAMP.has(c)) {
    let best = Number.POSITIVE_INFINITY;
    for (const t of RAMP.keys()) {
      const d = distance(c, t);
      if (d < best) {
        best = d;
        ramped = t;
      }
    }
  }
  return loOf(loOf(ramped));
}

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec3 uFrom[${TONES.length}];
uniform vec3 uTo[${TONES.length}];

void main(void) {
  vec4 c = texture(uTexture, vTextureCoord);
  if (c.a <= 0.0) { finalColor = c; return; }
  vec3 rgb = c.rgb / c.a;
  // WebGL 1 indexes a uniform array only by the loop's own counter, so the
  // answer is carried out of the loop rather than looked up after it.
  vec3 to = rgb;
  float best = 9.0;
  for (int i = 0; i < ${TONES.length}; i++) {
    vec3 d = rgb - uFrom[i];
    float dd = dot(d, d);
    if (dd < best) { best = dd; to = uTo[i]; }
  }
  finalColor = vec4(to * c.a, c.a);
}
`;

export function rampDownFilter(): Filter {
  const from = new Float32Array(TONES.length * 3);
  const to = new Float32Array(TONES.length * 3);
  TONES.forEach((c, i) => {
    from.set(rgb(c), i * 3);
    to.set(rgb(twoDown(c)), i * 3);
  });
  return new Filter({
    glProgram: GlProgram.from({ vertex, fragment, name: 'ramp-down' }),
    resources: {
      rampUniforms: new UniformGroup({
        uFrom: { value: from, type: 'vec3<f32>', size: TONES.length },
        uTo: { value: to, type: 'vec3<f32>', size: TONES.length },
      }),
    },
  });
}
