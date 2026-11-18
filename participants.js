function readCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const csv = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < csv.length; index++) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (character === "," || character === "\n" || character === "\r")) {
      row.push(field.trim());
      field = "";
      if (character !== ",") {
        rows.push(row);
        row = [];
        if (character === "\r" && csv[index + 1] === "\n") index++;
      }
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("Unclosed CSV field");
  row.push(field.trim());
  rows.push(row);
  return rows.filter(fields => fields.some(Boolean));
}

function readParticipants(text) {
  const [header, ...rows] = readCsv(text);
  if (header?.[0]?.toLowerCase() !== "name") throw new Error("Expected a Name column");
  const names = [...new Set(rows.map(([name]) => name).filter(Boolean))];
  return names.sort((a, b) => a.localeCompare(b)).map(name => ({ name }));
}

window.madsRoster = fetch("./participants.csv")
  .then(response => {
    if (!response.ok) throw new Error("Participant list unavailable");
    return response.text();
  })
  .then(readParticipants);
window.madsRoster.catch(() => {});
