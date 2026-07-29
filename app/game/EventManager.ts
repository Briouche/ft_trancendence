import { EventEmitter } from "events";

// Shared bus so React components / your websocket layer can talk to Phaser scenes
// without prop-drilling through the Game instance.
export const EventManager = new EventEmitter();
