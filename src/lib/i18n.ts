export type SupportedLanguage = "en" | "fr";

export const translations = {
  en: {
    // Navigation
    workspace: "Study Workspace",
    knowledgeMap: "Knowledge Map",
    flashcards: "Flashcards",
    settings: "Settings",

    // Settings
    settingsTitle: "Settings & Preferences",
    settingsDesc: "Configure AI learning guidance, visual themes, language, and academic profiles.",
    visualTheme: "Visual Interface Theme",
    languageSelection: "App Language",
    languageEn: "English",
    languageFr: "French (Français)",
    aiGuidanceSettings: "AI Learning Settings",
    teachingStyle: "Teaching Style",
    styleGuided: "Guided AI Tutor (Asks Guiding Questions)",
    styleExplanatory: "Explanatory Narrative (Direct Answers)",
    stylePractical: "Practical Sandbox (Code & Formulas)",
    styleTheoretical: "Theoretical Axioms (Theorems & Proofs)",
    cognitiveLoad: "Learning Complexity Level",
    loadNovice: "Novice (Gentle pacing & clear concepts)",
    loadProficient: "Proficient (University-level concepts)",
    loadMaster: "Master (Advanced proofs & equations)",
    fontScale: "Visual Font Scale",
    saveSettings: "Apply Settings",
    saveSuccess: "Settings updated successfully.",
    academicProfile: "Academic Profile",
    fullName: "Full Name",
    university: "University / Institution",
    faculty: "Faculty / School",
    department: "Department / Field",
    academicLevel: "Academic Level",
    learningStyle: "Learning Style",
    weeklyCommitment: "Weekly Commitment",
    learningObjectives: "Learning Goals & Objectives",
    signOut: "Sign Out",

    // Workspace / Study
    newStudySession: "New Study Session",
    typeQuestionPlaceholder: "Ask your AI Tutor a question or start a topic...",
    send: "Send",
    offlineModeTitle: "Offline AI Tutor Mode Enabled",
    offlineModeDesc: "Switched to high-speed offline tutor mode. Your study materials remain fully functional!",
    aiFormulating: "AI Tutor is formulating a response...",
    
    // Knowledge Map / Nexus
    knowledgeMapTitle: "Knowledge Map & Course Topics",
    knowledgeMapDesc: "Explore connected subjects, track topic mastery, and launch guided study sessions.",
    searchTopics: "Search subjects or topics...",
    startTopic: "Start Topic",

    // Flashcards
    flashcardVault: "Flashcard Vault & Review",
    flashcardVaultDesc: "Review flashcards generated during your AI study sessions to build lasting memory retention.",
    flipCard: "Click card to flip",
    easy: "Easy",
    medium: "Moyen / Medium",
    hard: "Hard",
    prev: "Previous",
    next: "Next",
  },
  fr: {
    // Navigation
    workspace: "Espace d'étude",
    knowledgeMap: "Carte de connaissances",
    flashcards: "Cartes mémoire",
    settings: "Paramètres",

    // Settings
    settingsTitle: "Paramètres et Préférences",
    settingsDesc: "Configurez l'assistance IA, le thème visuel, la langue et le profil académique.",
    visualTheme: "Thème de l'interface visuelle",
    languageSelection: "Langue de l'application",
    languageEn: "Anglais (English)",
    languageFr: "Français",
    aiGuidanceSettings: "Paramètres d'apprentissage IA",
    teachingStyle: "Style d'enseignement",
    styleGuided: "Tuteur IA Guidé (Pose des questions d'orientation)",
    styleExplanatory: "Narratif Explicatif (Réponses directes)",
    stylePractical: "Bac à sable pratique (Code et formules)",
    styleTheoretical: "Axiomes théoriques (Théorèmes et preuves)",
    cognitiveLoad: "Niveau de complexité",
    loadNovice: "Débutant (Rythme doux et concepts meublés)",
    loadProficient: "Intermédiaire (Niveau universitaire)",
    loadMaster: "Avancé (Preuves et équations approfondies)",
    fontScale: "Échelle de police visuelle",
    saveSettings: "Appliquer les paramètres",
    saveSuccess: "Paramètres mis à jour avec succès.",
    academicProfile: "Profil Académique",
    fullName: "Nom complet",
    university: "Université / Établissement",
    faculty: "Faculté / École",
    department: "Département / Domaine",
    academicLevel: "Niveau académique",
    learningStyle: "Style d'apprentissage",
    weeklyCommitment: "Engagement hebdomadaire",
    learningObjectives: "Objectifs d'apprentissage",
    signOut: "Se déconnecter",

    // Workspace / Study
    newStudySession: "Nouvelle session d'étude",
    typeQuestionPlaceholder: "Posez une question à votre Tuteur IA ou commencez un sujet...",
    send: "Envoyer",
    offlineModeTitle: "Mode Tuteur IA Hors-ligne Activé",
    offlineModeDesc: "Bascule en mode tuteur hors-ligne rapide. Vos supports d'étude restent entièrement fonctionnels !",
    aiFormulating: "Le tuteur IA formule une réponse...",

    // Knowledge Map / Nexus
    knowledgeMapTitle: "Carte de connaissances et sujets",
    knowledgeMapDesc: "Explorez les sujets connectés, suivez la maîtrise et lancez des sessions d'étude guidées.",
    searchTopics: "Rechercher des matières ou sujets...",
    startTopic: "Lancer le sujet",

    // Flashcards
    flashcardVault: "Coffre de cartes mémoire",
    flashcardVaultDesc: "Révisez les cartes mémoire générées pendant vos sessions d'étude pour une mémorisation durable.",
    flipCard: "Cliquez pour retourner",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    prev: "Précédent",
    next: "Suivant",
  }
};

export function getTranslation(lang: string = "en") {
  const code = (lang || "en").toLowerCase();
  if (code.startsWith("fr")) {
    return translations.fr;
  }
  return translations.en;
}
