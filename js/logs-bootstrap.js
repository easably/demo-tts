/** Load engine branding, then classic ops log script. */

import { loadEngineConfig } from "./engine-config.js";

await loadEngineConfig();

const script = document.createElement("script");
script.src = "/demo/logs.js";
document.body.appendChild(script);
