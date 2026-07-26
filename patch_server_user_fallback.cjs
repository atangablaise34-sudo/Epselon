const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

const chatRouteStart = 'app.post("/api/study/chat"';
const userSearch = 'const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);';

const newSearch = `
  let user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  
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
`;

code = code.replace(userSearch, newSearch);

fs.writeFileSync("server.ts", code);
console.log("Patched server.ts user fallback successfully");
