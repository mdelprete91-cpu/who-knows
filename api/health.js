/** Health probe — lets the frontend detect the live backend (server mode). */
module.exports = (req, res) => res.status(200).json({ ok: true });
