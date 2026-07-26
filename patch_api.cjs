const fs = require("fs");
let code = fs.readFileSync("src/lib/api.ts", "utf8");

// Add apiFetch implementation at the top
const fetchImpl = `
const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const userId = typeof localStorage !== "undefined" ? localStorage.getItem("activeSessionUserId") : null;
  if (userId && typeof input === "string" && input.startsWith(API_BASE + "/api/")) {
    init = init || {};
    init.headers = {
      ...init.headers,
      "x-user-id": userId
    };
  }
  return fetch(input, init);
};
`;

code = code.replace("const API_BASE = \"\"; // Relative routes since we're using Vite's server proxy", "const API_BASE = \"\"; // Relative routes since we're using Vite's server proxy\n" + fetchImpl);

// Replace fetch with apiFetch everywhere except inside apiFetch itself
code = code.replace(/await fetch\(/g, "await apiFetch(");

fs.writeFileSync("src/lib/api.ts", code);
console.log("Patched src/lib/api.ts successfully");
