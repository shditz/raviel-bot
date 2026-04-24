const config = require("../config");

function normalizeJid(jid) {
  if (!jid) return "";
  return jid.split(":")[0].split("@")[0] + "@s.whatsapp.net";
}

function isAdmin(groupMetadata, jid) {
  if (!jid) return false;
  const bareJid = jid.split(":")[0].split("@")[0];

  if (bareJid === config.ownerNumber) return true;

  const participant = groupMetadata.participants.find(p => p.id.split(":")[0].split("@")[0] === bareJid);
  return participant && (participant.admin === "admin" || participant.admin === "superadmin");
}

module.exports = { normalizeJid, isAdmin };
