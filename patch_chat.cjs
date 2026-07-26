const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

const oldCode = `  const session = userSessions.find((s) => s.id === sessionId);

  if (!session || !user) {
    return res.status(404).json({ error: "Session or user not found" });
  }`;

const newCode = `  let session = userSessions.find((s) => s.id === sessionId);

  if (!session && user) {
    session = {
      id: sessionId,
      title: "Recovered Session",
      focus: "General",
      difficulty: "Intermediate",
      bloomLevel: "Understand",
      strategy: "Socratic",
      progress: 0,
      prerequisites: [],
      outline: [],
      messages: [],
      createdAt: new Date().toISOString()
    };
    if (!db.sessions[activeSessionUserId]) db.sessions[activeSessionUserId] = [];
    db.sessions[activeSessionUserId].push(session);
  }

  if (!session || !user) {
    return res.status(404).json({ error: "Session or user not found" });
  }`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync("server.ts", code);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find the target code in server.ts");
}
