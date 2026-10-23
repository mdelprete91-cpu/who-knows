/**
 * Server-side search: re-exports the shared relevance engine so the Node
 * backend and the browser (static mode) use exactly the same logic.
 * The implementation lives in public/js/engine.js.
 */
module.exports = require('../public/js/engine.js');
