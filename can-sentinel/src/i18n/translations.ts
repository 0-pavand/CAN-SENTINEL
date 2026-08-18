export type Language = 'en' | 'ta' | 'te' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    cancel: "Cancel",
    save: "Save",
    back: "Back",
    clear: "Clear",
    
    // Home
    appTitle: "CAN Sentinel",
    appSubtitle: "Automotive anomaly detection",
    startNewAnalysis: "START NEW ANALYSIS",
    viewLastResults: "VIEW LAST RESULTS",

    // Import
    importTitle: "NEW ANALYSIS",
    selectCanLog: "Select CAN Log file",
    selectDbc: "Select DBC file (Optional)",
    readyToAnalyze: "Ready to Analyze",
    startAnalysis: "START ANALYSIS",
    fileSelected: "Selected",
    uploadLogPrompt: "Tap to browse or drop CAN log here",
    uploadDbcPrompt: "Tap to browse or drop DBC file here",

    // Progress
    analyzing: "ANALYZING",
    pleaseWait: "Please wait",
    framesProcessed: "Frames processed:",
    elapsedTime: "Elapsed time:",
    analysisFailed: "Analysis Failed",
    tryAgain: "Try Again",

    // Progress Stages
    stageParsingLog: "Parsing CAN log",
    stageParsingDbc: "Parsing DBC file",
    stageLoadingModel: "Loading ONNX model",
    stageRunningAnalysis: "Running analysis",
    stageAggregating: "Aggregating incidents",
    stageFetchingResults: "Fetching results",

    // Results
    resultsTitle: "ANALYSIS RESULTS",
    incidents: "Incidents",
    messages: "Messages",
    time: "Time",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    viewDetails: "View Details",
    noIncidents: "No anomalies detected",

    // Incident Details
    incidentDetailsTitle: "INCIDENT DETAILS",
    severity: "Severity",
    duration: "Duration",
    affectedCanIds: "Affected CAN IDs",
    ruleEvidence: "Rule Evidence",
    deepLearning: "Deep Learning",
    diagnosticAssistant: "Diagnostic Assistant",
    
    // Settings
    settingsTitle: "SETTINGS",
    system: "SYSTEM",
    analysisConfiguration: "Analysis Configuration",
    detectionMode: "Detection Mode",
    hybridMode: "Hybrid (Rules + Deep Learning)",
    dlModel: "DL Model",
    ruleEngine: "Rule Engine",
    appearance: "Appearance",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    storage: "Storage",
    analysisHistory: "Analysis History",
    hasUnsavedResults: "Current session has unsaved analysis results.",
    noActiveAnalysis: "No active analysis.",
    clearCurrentAnalysis: "Clear Current Analysis",
    about: "About",
    appDescription: "Anomaly detection for automotive cybersecurity.",
    language: "Language",

    // Chat
    chatTitle: "Diagnostic Assistant",
    typeQuestion: "Type a message...",
    ask: "Ask"
  },
  ta: {
    // General
    cancel: "ரத்துசெய்",
    save: "சேமி",
    back: "பின்செல்",
    clear: "அழி",
    
    // Home
    appTitle: "கான் சென்டினல்", // CAN Sentinel
    appSubtitle: "வாகன முரண்பாடு கண்டறிதல்",
    startNewAnalysis: "புதிய பகுப்பாய்வை தொடங்கு",
    viewLastResults: "முந்தைய முடிவுகளைப் பார்",

    // Import
    importTitle: "புதிய பகுப்பாய்வு",
    selectCanLog: "CAN Log கோப்பைத் தேர்ந்தெடுக்கவும்",
    selectDbc: "DBC கோப்பைத் தேர்ந்தெடுக்கவும்",
    readyToAnalyze: "பகுப்பாய்வுக்குத் தயார்",
    startAnalysis: "பகுப்பாய்வைத் தொடங்கு",
    fileSelected: "தேர்ந்தெடுக்கப்பட்டது",
    uploadLogPrompt: "CAN log-ஐ தேர்வு செய்ய தட்டவும்",
    uploadDbcPrompt: "DBC கோப்பைத் தேர்வு செய்ய தட்டவும்",

    // Progress
    analyzing: "பகுப்பாய்வு நடக்கிறது",
    pleaseWait: "காத்திருக்கவும்",
    framesProcessed: "செயலாக்கப்பட்ட பிரேம்கள்:",
    elapsedTime: "கடந்துவிட்ட நேரம்:",
    analysisFailed: "பகுப்பாய்வு தோல்வி",
    tryAgain: "மீண்டும் முயற்சிக்கவும்",

    // Progress Stages
    stageParsingLog: "CAN log-ஐ பகுப்பாய்வு செய்கிறது",
    stageParsingDbc: "DBC கோப்பை பகுப்பாய்வு செய்கிறது",
    stageLoadingModel: "ONNX மாதிரியை ஏற்றுகிறது",
    stageRunningAnalysis: "பகுப்பாய்வு இயங்குகிறது",
    stageAggregating: "நிகழ்வுகளை ஒருங்கிணைக்கிறது",
    stageFetchingResults: "முடிவுகளை பெறுகிறது",

    // Results
    resultsTitle: "பகுப்பாய்வு முடிவுகள்",
    incidents: "நிகழ்வுகள்",
    messages: "செய்திகள்",
    time: "நேரம்",
    critical: "மிகவும் ஆபத்தானது",
    high: "அதிக ஆபத்து",
    medium: "நடுத்தர ஆபத்து",
    low: "குறைந்த ஆபத்து",
    viewDetails: "விவரங்களைப் பார்",
    noIncidents: "எந்த முரண்பாடும் இல்லை",

    // Incident Details
    incidentDetailsTitle: "நிகழ்வு விவரங்கள்",
    severity: "தீவிரம்",
    duration: "காலம்",
    affectedCanIds: "பாதிக்கப்பட்ட CAN IDகள்",
    ruleEvidence: "விதி சான்றுகள்",
    deepLearning: "ஆழமான கற்றல்",
    diagnosticAssistant: "கண்டறியும் உதவியாளர்",

    // Settings
    settingsTitle: "அமைப்புகள்",
    system: "அமைப்பு",
    analysisConfiguration: "பகுப்பாய்வு கட்டமைப்பு",
    detectionMode: "கண்டறிதல் முறை",
    hybridMode: "கலப்பு முறை (விதிகள் + ஆழமான கற்றல்)",
    dlModel: "DL மாதிரி",
    ruleEngine: "விதி எஞ்சின்",
    appearance: "தோற்றம்",
    theme: "தீம்",
    light: "வெளிச்சம்",
    dark: "இருட்டு",
    storage: "சேமிப்பு",
    analysisHistory: "பகுப்பாய்வு வரலாறு",
    hasUnsavedResults: "தற்போதைய அமர்வில் சேமிக்கப்படாத முடிவுகள் உள்ளன.",
    noActiveAnalysis: "பகுப்பாய்வு எதுவும் இல்லை.",
    clearCurrentAnalysis: "தற்போதைய பகுப்பாய்வை அழி",
    about: "பற்றி",
    appDescription: "வாகன சைபர் பாதுகாப்புக்கான முரண்பாடு கண்டறிதல்.",
    language: "மொழி",

    // Chat
    chatTitle: "கண்டறியும் உதவியாளர்",
    typeQuestion: "ஒரு செய்தியை தட்டச்சு செய்யவும்...",
    ask: "கேள்"
  },
  te: {
    // General
    cancel: "రద్దు చేయి",
    save: "సేవ్ చేయి",
    back: "వెనుకకు",
    clear: "తొలగించు",
    
    // Home
    appTitle: "కాన్ సెంటినెల్", // CAN Sentinel
    appSubtitle: "ఆటోమోటివ్ అసమానత గుర్తింపు",
    startNewAnalysis: "కొత్త విశ్లేషణను ప్రారంభించు",
    viewLastResults: "గత ఫలితాలను చూడండి",

    // Import
    importTitle: "కొత్త విశ్లేషణ",
    selectCanLog: "CAN Log ఫైల్‌ను ఎంచుకోండి",
    selectDbc: "DBC ఫైల్‌ను ఎంచుకోండి",
    readyToAnalyze: "విశ్లేషించడానికి సిద్ధంగా ఉంది",
    startAnalysis: "విశ్లేషణ ప్రారంభించండి",
    fileSelected: "ఎంపిక చేయబడింది",
    uploadLogPrompt: "CAN log ఎంచుకోవడానికి నొక్కండి",
    uploadDbcPrompt: "DBC ఫైల్ ఎంచుకోవడానికి నొక్కండి",

    // Progress
    analyzing: "విశ్లేషిస్తోంది",
    pleaseWait: "దయచేసి వేచి ఉండండి",
    framesProcessed: "ప్రాసెస్ చేయబడిన ఫ్రేమ్‌లు:",
    elapsedTime: "గడిచిన సమయం:",
    analysisFailed: "విశ్లేషణ విఫలమైంది",
    tryAgain: "మళ్లీ ప్రయత్నించండి",

    // Progress Stages
    stageParsingLog: "CAN log విశ్లేషిస్తోంది",
    stageParsingDbc: "DBC ఫైల్ విశ్లేషిస్తోంది",
    stageLoadingModel: "ONNX మోడల్‌ను లోడ్ చేస్తోంది",
    stageRunningAnalysis: "విశ్లేషణ నడుస్తోంది",
    stageAggregating: "సంఘటనలను కలుపుతోంది",
    stageFetchingResults: "ఫలితాలను పొందుతోంది",

    // Results
    resultsTitle: "విశ్లేషణ ఫలితాలు",
    incidents: "సంఘటనలు",
    messages: "సందేశాలు",
    time: "సమయం",
    critical: "అతి తీవ్రమైన",
    high: "తీవ్రమైన",
    medium: "మధ్యస్థ",
    low: "తక్కువ",
    viewDetails: "వివరాలు చూడండి",
    noIncidents: "ఎలాంటి అసమానతలు కనుగొనబడలేదు",

    // Incident Details
    incidentDetailsTitle: "సంఘటన వివరాలు",
    severity: "తీవ్రత",
    duration: "వ్యవధి",
    affectedCanIds: "ప్రభావితమైన CAN IDలు",
    ruleEvidence: "నియమ సాక్ష్యం",
    deepLearning: "డీప్ లెర్నింగ్",
    diagnosticAssistant: "రోగనిర్ధారణ సహాయకుడు",

    // Settings
    settingsTitle: "సెట్టింగ్‌లు",
    system: "సిస్టమ్",
    analysisConfiguration: "విశ్లేషణ కాన్ఫిగరేషన్",
    detectionMode: "గుర్తింపు మోడ్",
    hybridMode: "హైబ్రిడ్ (నియమాలు + డీప్ లెర్నింగ్)",
    dlModel: "DL మోడల్",
    ruleEngine: "రూల్ ఇంజిన్",
    appearance: "స్వరూపం",
    theme: "థీమ్",
    light: "కాంతి",
    dark: "చీకటి",
    storage: "నిల్వ",
    analysisHistory: "విశ్లేషణ చరిత్ర",
    hasUnsavedResults: "ప్రస్తుత సెషన్‌లో సేవ్ చేయని ఫలితాలు ఉన్నాయి.",
    noActiveAnalysis: "క్రియాశీల విశ్లేషణ లేదు.",
    clearCurrentAnalysis: "ప్రస్తుత విశ్లేషణను క్లియర్ చేయండి",
    about: "గురించి",
    appDescription: "ఆటోమోటివ్ సైబర్ భద్రత కోసం అసమానత గుర్తింపు.",
    language: "భాష",

    // Chat
    chatTitle: "రోగనిర్ధారణ సహాయకుడు",
    typeQuestion: "ఒక సందేశాన్ని టైప్ చేయండి...",
    ask: "అడగండి"
  },
  hi: {
    // General
    cancel: "रद्द करें",
    save: "सहेजें",
    back: "वापस",
    clear: "साफ़ करें",
    
    // Home
    appTitle: "कैन सेंटिनल", // CAN Sentinel
    appSubtitle: "ऑटोमोटिव विसंगति का पता लगाना",
    startNewAnalysis: "नया विश्लेषण शुरू करें",
    viewLastResults: "पिछले परिणाम देखें",

    // Import
    importTitle: "नया विश्लेषण",
    selectCanLog: "CAN Log फ़ाइल चुनें",
    selectDbc: "DBC फ़ाइल चुनें",
    readyToAnalyze: "विश्लेषण के लिए तैयार",
    startAnalysis: "विश्लेषण शुरू करें",
    fileSelected: "चयनित",
    uploadLogPrompt: "CAN log चुनने के लिए टैप करें",
    uploadDbcPrompt: "DBC फ़ाइल चुनने के लिए टैप करें",

    // Progress
    analyzing: "विश्लेषण हो रहा है",
    pleaseWait: "कृपया प्रतीक्षा करें",
    framesProcessed: "संसाधित फ़्रेम:",
    elapsedTime: "बीता हुआ समय:",
    analysisFailed: "विश्लेषण विफल",
    tryAgain: "पुनः प्रयास करें",

    // Progress Stages
    stageParsingLog: "CAN log पार्स हो रहा है",
    stageParsingDbc: "DBC फ़ाइल पार्स हो रही है",
    stageLoadingModel: "ONNX मॉडल लोड हो रहा है",
    stageRunningAnalysis: "विश्लेषण चल रहा है",
    stageAggregating: "घटनाओं को एकत्र किया जा रहा है",
    stageFetchingResults: "परिणाम प्राप्त हो रहे हैं",

    // Results
    resultsTitle: "विश्लेषण परिणाम",
    incidents: "घटनाएं",
    messages: "संदेश",
    time: "समय",
    critical: "अति गंभीर",
    high: "गंभीर",
    medium: "मध्यम",
    low: "कम",
    viewDetails: "विवरण देखें",
    noIncidents: "कोई विसंगति नहीं मिली",

    // Incident Details
    incidentDetailsTitle: "घटना विवरण",
    severity: "गंभीरता",
    duration: "अवधि",
    affectedCanIds: "प्रभावित CAN ID",
    ruleEvidence: "नियम साक्ष्य",
    deepLearning: "डीप लर्निंग",
    diagnosticAssistant: "निदान सहायक",

    // Settings
    settingsTitle: "सेटिंग्स",
    system: "सिस्टम",
    analysisConfiguration: "विश्लेषण विन्यास",
    detectionMode: "खोज मोड",
    hybridMode: "हाइब्रिड (नियम + डीप लर्निंग)",
    dlModel: "DL मॉडल",
    ruleEngine: "नियम इंजन",
    appearance: "उपस्थिति",
    theme: "थीम",
    light: "हल्का",
    dark: "गहरा",
    storage: "भंडारण",
    analysisHistory: "विश्लेषण इतिहास",
    hasUnsavedResults: "वर्तमान सत्र में सहेजे न गए परिणाम हैं।",
    noActiveAnalysis: "कोई सक्रिय विश्लेषण नहीं है।",
    clearCurrentAnalysis: "वर्तमान विश्लेषण साफ़ करें",
    about: "के बारे में",
    appDescription: "ऑटोमोटिव साइबर सुरक्षा के लिए विसंगति का पता लगाना।",
    language: "भाषा",

    // Chat
    chatTitle: "निदान सहायक",
    typeQuestion: "एक संदेश टाइप करें...",
    ask: "पूछें"
  }
};
