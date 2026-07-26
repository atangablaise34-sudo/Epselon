const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf8");

code = code.replace("setUser(authenticatedUser);", "setUser(authenticatedUser); localStorage.setItem('activeSessionUserId', authenticatedUser.id);");

fs.writeFileSync("src/App.tsx", code);
console.log("Patched src/App.tsx again");
