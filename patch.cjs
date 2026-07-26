const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

// Inject the middleware right after app.use(express.json())
const mw = `
app.use(async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (userId) {
    activeSessionUserId = userId;
    
    // If the local in-memory DB is empty (due to cold start) and we have supabase
    if (!Object.values(db.users).find((u) => u.id === userId) && supabase) {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
        if (data) {
          const loadedUser = {
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            country: data.country || "United States",
            university: data.university || "Stanford University",
            faculty: data.faculty || "Sciences",
            department: data.department || "Physics",
            academicLevel: data.academic_level || "PhD Candidate",
            preferredLanguage: data.preferred_language || "English",
            learningStyle: data.learning_style || "Visual",
            weeklyCommitment: data.weekly_commitment || "5-10",
            learningObjectives: data.learning_objectives || "",
            masteryProgress: data.mastery_progress || 0,
            learningStreak: data.learning_streak || 1,
            cardsMastered: data.cards_mastered || 0,
            totalCards: data.total_cards || 0,
            preferences: data.preferences || {},
            providers: data.providers || []
          };
          db.users[data.email] = loadedUser;
          
          if (data.preferences && data.preferences._appState) {
            db.sessions[userId] = data.preferences._appState.sessions || [];
            db.flashcards[userId] = data.preferences._appState.flashcards || [];
            db.collections[userId] = data.preferences._appState.collections || [];
          }
        }
      } catch (err) {
        console.error("Failed to restore state from Supabase:", err);
      }
    }
  }
  next();
});
`;

code = code.replace("app.use(express.json({ limit: \"10mb\" }));", "app.use(express.json({ limit: \"10mb\" }));\n" + mw);

// Update saveDb to backup state to Supabase
const saveDbOrig = `function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist database file (non-fatal, e.g. read-only filesystem); keeping in memory.", err);
  }
}`;

const saveDbNew = `function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist database file (non-fatal, e.g. read-only filesystem); keeping in memory.", err);
  }
  
  if (supabase && activeSessionUserId) {
    const user = Object.values(db.users).find(u => u.id === activeSessionUserId);
    if (user) {
      supabase.from("users").update({
        preferences: {
          ...user.preferences,
          _appState: {
            sessions: db.sessions[activeSessionUserId] || [],
            flashcards: db.flashcards[activeSessionUserId] || [],
            collections: db.collections[activeSessionUserId] || []
          }
        }
      }).eq("id", activeSessionUserId).then(() => {}).catch(() => {});
    }
  }
}`;

code = code.replace(saveDbOrig, saveDbNew);

// In /api/auth/login, return the user so frontend can store the userId.
// We also need to set activeSessionUserId in register. It's already there.

fs.writeFileSync("server.ts", code);
console.log("Patched server.ts successfully");
