const WATER_LEVEL = 2, COMPLEXITY = 25, RESOLUTION = 800
let SCALE = 20, X_POS = 1, Y_POS = 1, SEED = 699814;

const depthMap = Array(RESOLUTION).fill().map(() => Array(RESOLUTION).fill(NaN))

let noise, paintMap, depthScaler = 1600 / RESOLUTION;

const pSBC = (r, e, t, l) => { let n, g, i, a, s, b, p, u = parseInt, o = Math.round, c = "string" == typeof t; return "number" != typeof r || r < -1 || r > 1 || "string" != typeof e || "r" != e[0] && "#" != e[0] || t && !c ? null : (this.pSBCr || (this.pSBCr = (r => { let e = r.length, t = {}; if (e > 9) { if ([n, g, i, c] = r = r.split(","), (e = r.length) < 3 || e > 4) return null; t.r = u("a" == n[3] ? n.slice(5) : n.slice(4)), t.g = u(g), t.b = u(i), t.a = c ? parseFloat(c) : -1 } else { if (8 == e || 6 == e || e < 4) return null; e < 6 && (r = "#" + r[1] + r[1] + r[2] + r[2] + r[3] + r[3] + (e > 4 ? r[4] + r[4] : "")), r = u(r.slice(1), 16), 9 == e || 5 == e ? (t.r = r >> 24 & 255, t.g = r >> 16 & 255, t.b = r >> 8 & 255, t.a = o((255 & r) / .255) / 1e3) : (t.r = r >> 16, t.g = r >> 8 & 255, t.b = 255 & r, t.a = -1) } return t })), p = e.length > 9, p = c ? t.length > 9 || "c" == t && !p : p, s = pSBCr(e), a = r < 0, b = t && "c" != t ? pSBCr(t) : a ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, a = 1 - (r = a ? -1 * r : r), s && b ? (l ? (n = o(a * s.r + r * b.r), g = o(a * s.g + r * b.g), i = o(a * s.b + r * b.b)) : (n = o((a * s.r ** 2 + r * b.r ** 2) ** .5), g = o((a * s.g ** 2 + r * b.g ** 2) ** .5), i = o((a * s.b ** 2 + r * b.b ** 2) ** .5)), c = s.a, b = b.a, c = (s = c >= 0 || b >= 0) ? c < 0 ? b : b < 0 ? c : c * a + b * r : 0, p ? "rgb" + (s ? "a(" : "(") + n + "," + g + "," + i + (s ? "," + o(1e3 * c) / 1e3 : "") + ")" : "#" + (4294967296 + 16777216 * n + 65536 * g + 256 * i + (s ? o(255 * c) : 0)).toString(16).slice(1, s ? void 0 : -2)) : null) };

const getColorFromDepth = (depth) => {
    // Get Color
    let color = "red";
    if (depth < WATER_LEVEL) color = "#3399ff";
    else if (depth < WATER_LEVEL + 2 && depth > WATER_LEVEL - 1) {
        color = "#ffe6b3";
        if (Math.random() > 0.4) color = pSBC(0.02, color)
    }
    else if (depth < WATER_LEVEL + 6) color = "#5cd65c";
    else if (depth < WATER_LEVEL + 7) color = "#6e9668";
    else if (depth < WATER_LEVEL + 9) color = "#85adad";
    else color = "#eff5f5";

    // Shade for depth/height
    let difference = (depth - WATER_LEVEL < -7 ? -7 : depth - WATER_LEVEL), shade = (depth >= WATER_LEVEL ? -0.08 : -0.04);
    color = pSBC(Math.abs(difference) * shade, color)
    if (Math.random() > 0.7) color = pSBC(0.012, color)

    return color;
}

function getDepth(x, y) {
    let depthX = Math.floor(x / depthScaler);
    let depthY = Math.floor(y / depthScaler);

    return depthMap[depthX][depthY];
}

function initTerrain() {
    try {
        WebAssembly.instantiateStreaming(fetch('terrain/main.wasm'), { imports: { imported_func: arg => console.log(arg) }, js: { mem: new WebAssembly.Memory({ initial: 10, maximum: 100 }) } }).then(
            results => {
                noise = (x, y, f, d, s) => results.instance.exports.perlin2d(x, y, f, d, s);
                paintMap = (change) => {
                    for (let x = 0; x < depthMap.length; x++) {
                        for (let y = 0; y < depthMap[0].length; y++) {
                            // check if value needs refresh
                            if (change || isNaN(depthMap[x][y])) {
                                // calculate scaled values
                                nx = ((x + X_POS * RESOLUTION / 100) / depthMap.length) * 0.3
                                ny = ((y + Y_POS * RESOLUTION / 100) / depthMap[0].length) * 0.3

                                // find value
                                depthMap[x][y] = Math.floor(noise(nx, ny, 10 + SCALE, 19, SEED) * COMPLEXITY - COMPLEXITY / 2.0833333333333333);
                            }


                            // begin drawing pixel
                            terrainCtx.beginPath();
                            terrainCtx.rect(depthScaler * x, depthScaler * y, depthScaler, depthScaler);

                            // Find color from depth
                            terrainCtx.fillStyle = getColorFromDepth(depthMap[x][y]);
                            terrainCtx.fill();
                        }
                    }
                }
            }
        ).then(() => {
            paintMap();
        }).catch((e) => {
            console.log(e);
        });
    } catch (e) {
        console.log(e);
    }
}
