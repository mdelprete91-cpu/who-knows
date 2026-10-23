/** Shared CSV helpers used by the server and the data-build script. */

/**
 * Minimal CSV parser that understands quoted fields (so a value may contain
 * commas if wrapped in double quotes). Returns an array of row objects keyed
 * by the header names.
 */
function parseCSV(text) {
  const rows = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) return rows;

  const splitLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };

  const headers = splitLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

/** Username = the part of the email before the "@" (e.g. anna.rossi). */
function usernameFromEmail(email) {
  return String(email || '').split('@')[0].toLowerCase();
}

/** Map a parsed CSV row + optional enrichment into a person record. */
function rowToPerson(r, enrichment = {}) {
  const username = usernameFromEmail(r.email);
  return {
    id: username,
    username,
    firstName: r.first_name || '',
    lastName: r.last_name || '',
    role: r.job_role || '',
    area: r.area || '',
    managerName: r.manager || '',
    location: r.location || '',
    email: r.email || '',
    whatIDo: enrichment.whatIDo || '',
    whatIDont: enrichment.whatIDont || '',
    skills: enrichment.skills || '',
    currentlyWorkingOn: enrichment.currentlyWorkingOn || '',
    happyToHelp: enrichment.happyToHelp || '',
  };
}

module.exports = { parseCSV, usernameFromEmail, rowToPerson };
