// @ts-nocheck — plain CommonJS stub consumed via require() from vendored Phaser source, not typed app code.
/**
 * Stub for the optional `phaser3spectorjs` WebGL debug/inspector tool. It's a devDependency of the
 * `phaser` package itself (not a runtime dependency), so it isn't installed here, and pulling in
 * the real ~700KB package just to satisfy the bundler's static resolver would partly defeat the
 * point of trimming (see phaserEntry.ts) for a tool this app never actually drives. Aliased to this
 * file in next.config.ts.
 *
 * IMPORTANT: Phaser's WebGLRenderer gates this on `if (typeof WEBGL_DEBUG)`
 * (renderer/webgl/WebGLRenderer.js) — note that's a *truthy string check*, not a real boolean:
 * `typeof anUndeclaredGlobal` evaluates to the STRING "undefined", which is truthy, so without
 * Phaser's own build step (which uses webpack DefinePlugin to literally replace the text
 * `typeof WEBGL_DEBUG` with the boolean `false`, something this app doesn't replicate for
 * Turbopack) that branch is always taken, not skipped. So `new SPECTOR.Spector()` really does run
 * on every game boot — this stub has to be a working inert class, not an empty object, or boot
 * crashes with "SPECTOR.Spector is not a constructor". None of its methods are ever reached by app
 * code (nothing here calls Phaser's debug-capture APIs), so every method below is a safe no-op.
 */
class Spector
{
    constructor()
    {
        this.onCapture = { add: () => {} };
    }

    captureCanvas() {}
    captureNextFrame() {}
    getFps() { return 0; }
    log() {}
    startCapture() {}
    stopCapture() {}
    getResultUI() { return null; }
}

module.exports = { Spector };
