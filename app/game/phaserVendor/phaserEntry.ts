// @ts-nocheck — plain CommonJS mirror of Phaser's own untyped src/phaser.js, not app code.
/**
 * Trimmed re-export of Phaser's own top-level entry point (node_modules/phaser/src/phaser.js),
 * used in place of the stock "phaser" package via a bundler alias (see next.config.ts) so this
 * game's chunk doesn't ship Phaser's Arcade Physics engine, which nothing in app/game/ uses
 * (verified: `physics` is never set in GameConfig.ts, and no file references `this.physics` /
 * `Phaser.Physics`). Physics is cleanly excluded: nothing else in the module graph below
 * (GameObjects, Core, etc.) references it internally, so dropping the `Physics: require(...)` line
 * removes it from the bundle entirely, not just from the `Phaser.*` public namespace.
 *
 * IMPORTANT caveat, discovered the hard way (see phaser3spectorjsStub.ts for the full story):
 * Phaser gates several optional subsystems behind `if (typeof SOME_FLAG)` checks, expecting its
 * own webpack build to literally rewrite that expression to the boolean `false` via DefinePlugin
 * before bundling. This project doesn't replicate that (no equivalent exists for Turbopack here),
 * and `typeof anUndeclaredGlobal` evaluates to the *string* "undefined" — which is truthy — so
 * every one of those checks is actually always true, not skipped, in this build:
 *   - Sound: `core/Game.js` has its own internal `if (typeof FEATURE_SOUND)
 *     require('../sound/SoundManagerCreator')` and instantiates it. This matches the STOCK
 *     phaser package's behavior too (its dist build bakes FEATURE_SOUND permanently true), so it's
 *     not a regression from this trim — just means Sound was never actually excludable this way.
 *   - Facebook Instant Games plugin: `core/Game.js` also unconditionally does
 *     `this.facebook = new FacebookInstantGamesPlugin(this)`, which the STOCK dist build correctly
 *     excludes (PLUGIN_FBINSTANT is baked false there). Checked its constructor: it only sets
 *     plain instance fields, never touches `window.FBInstant`, and nothing in app/game/ ever
 *     references `.facebook` — so it's inert, just unwanted dead weight partially offsetting the
 *     Physics savings.
 * Only Physics ends up being a fully clean win; the above are known, accepted imperfections.
 *
 * Everything else Phaser ships (all GameObjects, Geom, full Math, Tweens, Input, Loader, etc.) is
 * still included unmodified, via the same requires as the stock file — this is a 1-line removal
 * (the `Physics` entry) from Phaser's own entry point, not a hand-picked module list, specifically
 * to avoid the maintenance risk of silently missing some future GameObject/feature.
 *
 * To bring Physics back (e.g. a future minigame mode needs it): add back
 *   Physics: require('phaser/src/physics'),
 * Keep this file in sync with node_modules/phaser/src/phaser.js on every Phaser version bump —
 * diff the two and reapply this same one-line removal.
 *
 * Also requires a stub for `phaser3spectorjs` (see phaser3spectorjsStub.ts + next.config.ts) — an
 * optional WebGL debug tool Phaser's renderer references behind the same always-true guard, but
 * whose target package isn't installed at all (it's a devDependency of `phaser` itself), so it
 * needs a resolvable, working stand-in rather than just an omitted line.
 */

require('phaser/src/polyfills/requestVideoFrame');

var CONST = require('phaser/src/const');
var Extend = require('phaser/src/utils/object/Extend');

var Phaser = {

    Actions: require('phaser/src/actions'),
    Animations: require('phaser/src/animations'),
    BlendModes: require('phaser/src/renderer/BlendModes'),
    Cache: require('phaser/src/cache'),
    Cameras: require('phaser/src/cameras'),
    Core: require('phaser/src/core'),
    Class: require('phaser/src/utils/Class'),
    Create: require('phaser/src/create'),
    Curves: require('phaser/src/curves'),
    Data: require('phaser/src/data'),
    Display: require('phaser/src/display'),
    DOM: require('phaser/src/dom'),
    Events: require('phaser/src/events'),
    FX: require('phaser/src/fx'),
    Game: require('phaser/src/core/Game'),
    GameObjects: require('phaser/src/gameobjects'),
    Geom: require('phaser/src/geom'),
    Input: require('phaser/src/input'),
    Loader: require('phaser/src/loader'),
    Math: require('phaser/src/math'),
    Plugins: require('phaser/src/plugins'),
    Renderer: require('phaser/src/renderer'),
    Scale: require('phaser/src/scale'),
    ScaleModes: require('phaser/src/renderer/ScaleModes'),
    Scene: require('phaser/src/scene/Scene'),
    Scenes: require('phaser/src/scene'),
    Structs: require('phaser/src/structs'),
    Textures: require('phaser/src/textures'),
    Tilemaps: require('phaser/src/tilemaps'),
    Time: require('phaser/src/time'),
    Tweens: require('phaser/src/tweens'),
    Utils: require('phaser/src/utils')

    // Physics deliberately omitted — see file header.

};

Phaser = Extend(false, Phaser, CONST);

module.exports = Phaser;

global.Phaser = Phaser;
