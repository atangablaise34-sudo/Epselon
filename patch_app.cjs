const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf8");

code = code.replace("setUser(sessionUser);", "setUser(sessionUser); localStorage.setItem('activeSessionUserId', sessionUser.id);");

code = code.replace("setUser(null);", "setUser(null); localStorage.removeItem('activeSessionUserId');");

fs.writeFileSync("src/App.tsx", code);
console.log("Patched src/App.tsx successfully");
