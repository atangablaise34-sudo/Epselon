const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

// Restore the onboard route
code = code.replace(`  let user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  
  if (!user && activeSessionUserId) {
    console.warn("User not found in local db, attempting to fallback build a user for session", activeSessionUserId);
    user = {
      id: activeSessionUserId,
      email: "unknown@example.com",
      fullName: "Guest Student",
      country: "United States",
      university: "Unknown",
      faculty: "Sciences",
      department: "Physics",
      academicLevel: "Undergraduate",
      preferredLanguage: "English",
      learningStyle: "Visual",
      weeklyCommitment: "5-10",
      learningObjectives: "",
      masteryProgress: 0,
      learningStreak: 1,
      cardsMastered: 0,
      totalCards: 0,
      preferences: {},
      providers: []
    };
    db.users["unknown_" + activeSessionUserId] = user;
  }`, `const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);`);

// Now explicitly patch the chat route.
code = code.replace(`  const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  const userSessions = db.sessions[activeSessionUserId] || [];
  let session = userSessions.find((s) => s.id === sessionId);`, `  let user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  
  if (!user && activeSessionUserId) {
    console.warn("User not found in local db, attempting to fallback build a user for session", activeSessionUserId);
    user = {
      id: activeSessionUserId,
      email: "unknown@example.com",
      fullName: "Guest Student",
      country: "United States",
      university: "Unknown",
      faculty: "Sciences",
      department: "Physics",
      academicLevel: "Undergraduate",
      preferredLanguage: "English",
      learningStyle: "Visual",
      weeklyCommitment: "5-10",
      learningObjectives: "",
      masteryProgress: 0,
      learningStreak: 1,
      cardsMastered: 0,
      totalCards: 0,
      preferences: {},
      providers: []
    };
    db.users["unknown_" + activeSessionUserId] = user;
  }

  const userSessions = db.sessions[activeSessionUserId] || [];
  let session = userSessions.find((s) => s.id === sessionId);`);

fs.writeFileSync("server.ts", code);
console.log("Patched server.ts user fallback fix successfully");
