import { AnomalyCategory, DiagnosticKnowledge } from './knowledge';
import { Language } from '../i18n/translations';

export const KNOWLEDGE_BASE_I18N: Record<Language, Record<AnomalyCategory, DiagnosticKnowledge>> = {
  en: {
    'Data Corruption': {
      explanation: "The system detected malformed or corrupted CAN frames. This means the digital messages on the network are broken or unreadable by the time they reach the receiver.",
      causes: "This is typically a physical layer issue. It may be caused by severe electromagnetic interference (EMI), a damaged wiring harness, loose grounding, or water intrusion in a connector.",
      checks: "1. Inspect the main CAN bus wiring harness for visible damage, chafing, or exposed wires.\n2. Check grounding points for corrosion.\n3. Verify terminating resistor values (typically 60 ohms across CAN High and CAN Low with the battery disconnected).\n4. Ensure no aftermarket electronics are inducing EMI.",
      severityGuidance: "Critical. Data corruption can cause sudden module offline events or unpredictable vehicle behavior. The vehicle should not be driven until the physical network is verified by a professional."
    },
    'Message Timeout': {
      explanation: "An expected periodic message did not arrive within its required time window. A module on the network has stopped broadcasting.",
      causes: "The broadcasting module may have lost power, crashed, or disconnected from the bus. It could also indicate a severed communication line to that specific node.",
      checks: "1. Check the fuse for the affected module (e.g., ABS, ECM).\n2. Inspect the connector plugging into the module for loose pins or water damage.\n3. Verify power and ground at the module connector.",
      severityGuidance: "High to Critical depending on the module. If a critical safety system (like ABS or Airbags) has timed out, professional diagnosis is required immediately."
    },
    'Timing/Flood': {
      explanation: "A module is transmitting messages at an abnormally high rate, dominating the network bandwidth.",
      causes: "This can be caused by a faulty module continuously resetting, a software bug ('babbling idiot' syndrome), or a compromised aftermarket device attached to the OBD-II port.",
      checks: "1. Disconnect any aftermarket devices (insurance trackers, tune boxes) from the OBD-II port.\n2. Note if the issue correlates with a specific vehicle action (e.g., turning on the radio or AC).\n3. A professional scan tool may be required to isolate which module is flooding the bus.",
      severityGuidance: "Medium to High. A flooded bus can delay legitimate safety-critical messages. If disconnecting aftermarket devices does not resolve it, seek professional help."
    },
    'Logical Contradiction': {
      explanation: "Two or more signals broadcast on the network contradict each other physically. For example, the vehicle speed is reported as high while the transmission is reported in Park.",
      causes: "A sensor is likely reporting faulty data, or a module is calculating states incorrectly. It is rarely a wire issue and usually a faulty sensor or module internal logic error.",
      checks: "1. Check the specific sensor data using a diagnostic scan tool (e.g., wheel speed sensors vs. transmission output shaft speed).\n2. Look for related sensor-specific DTCs (Diagnostic Trouble Codes).\n3. Verify the sensor wiring and connector.",
      severityGuidance: "Medium. This indicates a sensor or logic failure rather than a complete network collapse. However, it can disable advanced driver assistance systems (ADAS) or ABS."
    },
    'Engine RPM Out-of-Range': {
      explanation: "The Engine RPM signal exceeded the absolute maximum expected value (e.g., > 10,000 RPM) or reported an impossible sudden jump.",
      causes: "The Crankshaft Position Sensor (CKP), its wiring, or the Engine Control Module (ECM) processing the signal is faulty.",
      checks: "1. Inspect the Crankshaft Position Sensor (CKP) and Camshaft Position Sensor (CMP) wiring for damage or proximity to high-heat sources (exhaust).\n2. Check for oil or debris on the sensor face.\n3. Scan the ECM for related Engine Speed DTCs.",
      severityGuidance: "High. An erratic RPM signal can cause engine stalling, misfires, or prevent the vehicle from starting. Have the sensor and ECM checked."
    },
    'Unknown': {
      explanation: "The system detected an anomaly pattern that deviates from normal baseline traffic, but it does not match a specific known deterministic rule.",
      causes: "This could be an intermittent electrical issue, an early sign of a failing component, or a highly specific situational glitch that the deep learning model identified as abnormal.",
      checks: "1. Monitor if the vehicle exhibits any actual drivability symptoms.\n2. Check if the issue occurs under specific conditions (e.g., hitting a bump, turning the steering wheel).\n3. Check for any pending DTCs with a scanner.",
      severityGuidance: "Low to Medium. If there are no noticeable driving symptoms and no warning lights, this may be a minor transient anomaly. Continue monitoring, but seek help if symptoms develop."
    }
  },
  ta: {
    'Data Corruption': {
      explanation: "கணினி சிதைந்த CAN பிரேம்களைக் கண்டறிந்துள்ளது. அதாவது வலையமைப்பிலுள்ள டிஜிட்டல் செய்திகள் உடைந்துள்ளன அல்லது படிக்க முடியாத நிலையில் உள்ளன.",
      causes: "இது பொதுவாக பௌதீக அடுக்கு (physical layer) பிரச்சனையாகும். இது மின்காந்த குறுக்கீடு, சேதமடைந்த வயர்கள் அல்லது தண்ணீரின் கசிவினால் ஏற்படலாம்.",
      checks: "1. பிரதான CAN வயரிங் சேதமடைந்துள்ளதா என சரிபார்க்கவும்.\n2. தரை இணைப்புகளில் (grounding) துரு உள்ளதா எனப் பார்க்கவும்.\n3. டெர்மினேட்டிங் மின்தடையை (60 ohms) சரிபார்க்கவும்.\n4. வேறு சாதனங்கள் குறுக்கீடு செய்கின்றனவா என உறுதிப்படுத்தவும்.",
      severityGuidance: "மிகவும் ஆபத்தானது. தொழில்முறை உதவியாளர் சரிபார்க்கும் வரை வாகனத்தை ஓட்டக்கூடாது."
    },
    'Message Timeout': {
      explanation: "எதிர்பார்த்த செய்தி குறித்த நேரத்திற்குள் வரவில்லை. வலையமைப்பிலுள்ள ஒரு தொகுதி ஒளிபரப்பை நிறுத்தியுள்ளது.",
      causes: "தொகுதிக்கு மின்தடை ஏற்பட்டிருக்கலாம், செயலிழந்திருக்கலாம் அல்லது இணைப்பு துண்டிக்கப்பட்டிருக்கலாம்.",
      checks: "1. பாதிக்கப்பட்ட தொகுதிக்கான ஃபியூஸை சரிபார்க்கவும்.\n2. தொகுதியின் இணைப்பிகளை சரிபார்க்கவும்.\n3. தொகுதியில் மின்சாரம் மற்றும் கிரவுண்ட் உள்ளதா என சரிபார்க்கவும்.",
      severityGuidance: "அதிக ஆபத்து. முக்கியமான பாதுகாப்பு அமைப்பு செயலிழந்திருந்தால் உடனடியாக சரிசெய்யவும்."
    },
    'Timing/Flood': {
      explanation: "ஒரு தொகுதி அதிக அளவில் செய்திகளை அனுப்புகிறது, இது வலையமைப்பை முடக்குகிறது.",
      causes: "பழுதடைந்த தொகுதி, மென்பொருள் பிழை அல்லது தவறான மூன்றாம் தரப்பு சாதனங்களால் இது ஏற்படலாம்.",
      checks: "1. OBD-II போர்ட்டில் இணைக்கப்பட்டுள்ள கூடுதல் சாதனங்களை அகற்றவும்.\n2. பிரச்சனை ஒரு குறிப்பிட்ட செயலுடன் தொடர்புடையதா என பார்க்கவும்.\n3. பழுதடைந்த தொகுதியை கண்டறிய ஸ்கேனிங் தேவைப்படலாம்.",
      severityGuidance: "நடுத்தர/அதிக ஆபத்து. கூடுதல் சாதனங்களை அகற்றியும் சரியாகவில்லை எனில் மெக்கானிக்கை அணுகவும்."
    },
    'Logical Contradiction': {
      explanation: "இரண்டு அல்லது அதற்கு மேற்பட்ட சிக்னல்கள் ஒன்றுக்கொன்று முரண்படுகின்றன (எ.கா. வேகம் அதிகமாக உள்ளது, ஆனால் கியர் பார்க்கில் உள்ளது).",
      causes: "ஒரு சென்சார் தவறான தகவலை தருகிறது அல்லது தொகுதி தவறாக கணக்கிடுகிறது.",
      checks: "1. சென்சார் தரவுகளை ஸ்கேனர் மூலம் சரிபார்க்கவும்.\n2. தொடர்புடைய DTC-களை பார்க்கவும்.\n3. சென்சாரின் வயர்களை சரிபார்க்கவும்.",
      severityGuidance: "நடுத்தர ஆபத்து. இதனால் ABS அல்லது ADAS போன்ற அமைப்புகள் செயலிழக்கலாம்."
    },
    'Engine RPM Out-of-Range': {
      explanation: "எஞ்சின் RPM அளவு எதிர்பாராத அளவுக்கு அதிகமாக உள்ளது அல்லது சாத்தியமில்லாத மாற்றத்தை காட்டுகிறது.",
      causes: "க்ராங்க்ஷாஃப்ட் பொசிஷன் சென்சார் (CKP), அதன் வயர்கள் அல்லது எஞ்சின் கண்ட்ரோல் மாடியூல் (ECM) பழுதடைந்திருக்கலாம்.",
      checks: "1. CKP மற்றும் CMP சென்சார் வயர்களை சரிபார்க்கவும்.\n2. சென்சாரில் எண்ணெய் அல்லது குப்பை உள்ளதா என பார்க்கவும்.\n3. ஸ்கேனர் மூலம் ECM பிழைகளை பார்க்கவும்.",
      severityGuidance: "அதிக ஆபத்து. இதனால் எஞ்சின் நிற்கலாம் அல்லது தொடங்குவதில் சிக்கல் ஏற்படலாம்."
    },
    'Unknown': {
      explanation: "வழக்கமான நெட்வொர்க் போக்குவரத்திலிருந்து மாறுபடும் ஒரு முரண்பாட்டை கணினி கண்டறிந்துள்ளது, ஆனால் இது தெரிந்த விதிகளுடன் பொருந்தவில்லை.",
      causes: "இது மின்சார பிரச்சனை, ஒரு பாகத்தின் ஆரம்பகால பழுது அல்லது ஒரு குறிப்பிட்ட சூழ்நிலையால் ஏற்பட்ட சிறு பிழையாக இருக்கலாம்.",
      checks: "1. வாகனத்தை ஓட்டும்போது ஏதேனும் அறிகுறிகள் தெரிகின்றனவா என கண்காணிக்கவும்.\n2. எந்த சூழ்நிலையில் இது நடக்கிறது என கவனிக்கவும்.\n3. ஸ்கேனர் மூலம் ஏதேனும் பிழைகள் (DTC) உள்ளனவா எனப் பார்க்கவும்.",
      severityGuidance: "குறைந்த/நடுத்தர ஆபத்து. வேறு அறிகுறிகள் இல்லையென்றால் தொடர்ந்து கண்காணிக்கவும்."
    }
  },
  te: {
    'Data Corruption': {
      explanation: "సిస్టమ్ లోపం ఉన్న CAN ఫ్రేమ్‌లను గుర్తించింది. నెట్‌వర్క్‌లోని సందేశాలు విరిగిపోయాయని లేదా చదవడానికి వీలుగా లేవని దీని అర్థం.",
      causes: "ఇది సాధారణంగా భౌతిక కనెక్షన్ సమస్య. షార్ట్ సర్క్యూట్, పాడైన వైర్లు లేదా నీరు చేరడం వల్ల ఇది జరగవచ్చు.",
      checks: "1. ప్రధాన CAN వైరింగ్ డ్యామేజ్ కోసం తనిఖీ చేయండి.\n2. గ్రౌండ్ పాయింట్లను తనిఖీ చేయండి.\n3. టెర్మినేటింగ్ రెసిస్టర్‌లను (60 ohms) తనిఖీ చేయండి.\n4. బయటి పరికరాలు ఇబ్బంది కలిగించడం లేదని నిర్ధారించుకోండి.",
      severityGuidance: "అతి తీవ్రమైనది. నిపుణుడు తనిఖీ చేసేవరకు వాహనాన్ని నడపకూడదు."
    },
    'Message Timeout': {
      explanation: "ఆశించిన సందేశం నిర్ణీత సమయంలో రాలేదు. నెట్‌వర్క్‌లోని ఒక మాడ్యూల్ ప్రసారం ఆపివేసింది.",
      causes: "ఆ మాడ్యూల్ పవర్ కోల్పోవచ్చు, క్రాష్ కావచ్చు లేదా డిస్‌కనెక్ట్ కావచ్చు.",
      checks: "1. ఆ మాడ్యూల్‌కి సంబంధించిన ఫ్యూజ్ తనిఖీ చేయండి.\n2. కనెక్టర్‌లో వదులుగా ఉన్న పిన్‌లు లేదా నీరు ఉందో లేదో తనిఖీ చేయండి.\n3. మాడ్యూల్ వద్ద పవర్ మరియు గ్రౌండ్ సరిచూసుకోండి.",
      severityGuidance: "తీవ్రమైనది. ABS లాంటి ముఖ్యమైన సిస్టమ్ ఆగిపోతే వెంటనే రిపేర్ చేయించాలి."
    },
    'Timing/Flood': {
      explanation: "ఒక మాడ్యూల్ అసాధారణంగా ఎక్కువ సందేశాలను పంపుతోంది, దీనివల్ల నెట్‌వర్క్ బ్లాక్ అవుతోంది.",
      causes: "మాడ్యూల్ లోపం, సాఫ్ట్‌వేర్ బగ్ లేదా OBD-II పోర్ట్‌కి జోడించిన పరికరం దీనికి కారణం కావచ్చు.",
      checks: "1. OBD-II పోర్ట్ నుండి బయటి పరికరాలను తొలగించండి.\n2. ఈ సమస్య ఏదైనా నిర్దిష్ట చర్యకు (ఎసి ఆన్ చేయడం) సంబంధించినదో గమనించండి.\n3. ఏ మాడ్యూల్ ఈ సమస్యను కలిగిస్తుందో తెలుసుకోవడానికి స్కానర్ అవసరం.",
      severityGuidance: "మధ్యస్థ/తీవ్రమైనది. పరికరాలు తీసివేసినా సమస్య ఉంటే మెకానిక్‌ని సంప్రదించండి."
    },
    'Logical Contradiction': {
      explanation: "రెండు లేదా అంతకంటే ఎక్కువ సిగ్నల్స్ ఒకదానికొకటి విరుద్ధంగా ఉన్నాయి (ఉదా. వాహనం వేగంగా వెళ్తున్నా, గేర్ పార్క్ లో ఉందని చూపుతోంది).",
      causes: "సెన్సార్ తప్పుడు డేటా ఇస్తుండవచ్చు లేదా మాడ్యూల్ తప్పుగా లెక్కిస్తోంది.",
      checks: "1. స్కానర్‌తో సెన్సార్ డేటాను సరిచూసుకోండి.\n2. సంబంధిత DTC (లోపాలు) కోసం చూడండి.\n3. సెన్సార్ వైరింగ్‌ను తనిఖీ చేయండి.",
      severityGuidance: "మధ్యస్థం. దీనివల్ల ABS లేదా సహాయక సిస్టమ్స్ ఆగిపోవచ్చు."
    },
    'Engine RPM Out-of-Range': {
      explanation: "ఇంజిన్ RPM ఊహించిన దానికంటే ఎక్కువగా ఉంది లేదా అసాధ్యమైన మార్పును చూపించింది.",
      causes: "క్రాంక్ షాఫ్ట్ పొజిషన్ సెన్సార్ (CKP), దాని వైర్లు లేదా ఇంజిన్ కంట్రోల్ మాడ్యూల్ (ECM) లోపం కావచ్చు.",
      checks: "1. CKP మరియు CMP సెన్సార్ వైరింగ్ డ్యామేజ్ కోసం తనిఖీ చేయండి.\n2. సెన్సార్ పైన నూనె లేదా దుమ్ము ఉందేమో చూడండి.\n3. ECM లోపాల కోసం స్కాన్ చేయండి.",
      severityGuidance: "తీవ్రమైనది. దీనివల్ల ఇంజిన్ ఆగిపోవచ్చు లేదా స్టార్ట్ కాకపోవచ్చు."
    },
    'Unknown': {
      explanation: "సిస్టమ్ ఒక అసాధారణ సంఘటనను గుర్తించింది, కానీ ఇది తెలిసిన నియమాలకు సరిపోలలేదు.",
      causes: "ఇది విద్యుత్ సమస్య, లేదా పార్ట్స్ లోపం ప్రారంభ దశ కావచ్చు.",
      checks: "1. డ్రైవింగ్ చేస్తున్నప్పుడు ఏవైనా లక్షణాలు కనిపిస్తున్నాయేమో గమనించండి.\n2. ఏ సమయంలో ఇది జరుగుతుందో చూడండి.\n3. స్కానర్ తో ఏవైనా లోపాలు ఉన్నాయేమో చూడండి.",
      severityGuidance: "తక్కువ/మధ్యస్థం. ఇతర లక్షణాలు లేకుంటే గమనిస్తూ ఉండండి, ఉంటే మెకానిక్‌ని సంప్రదించండి."
    }
  },
  hi: {
    'Data Corruption': {
      explanation: "सिस्टम ने दूषित CAN फ़्रेम का पता लगाया है। इसका मतलब है कि नेटवर्क पर डिजिटल संदेश टूट गए हैं या पढ़े नहीं जा सकते।",
      causes: "यह आमतौर पर एक भौतिक परत (physical layer) की समस्या है। यह तारों के क्षतिग्रस्त होने, पानी जाने या शॉर्ट सर्किट के कारण हो सकता है।",
      checks: "1. मुख्य CAN वायरिंग में क्षति की जांच करें।\n2. ग्राउंडिंग पॉइंट्स की जांच करें।\n3. टर्मिनेटिंग रेसिस्टर्स (60 ohms) की जांच करें।\n4. सुनिश्चित करें कि कोई बाहरी उपकरण व्यवधान नहीं डाल रहा है।",
      severityGuidance: "अति गंभीर। किसी पेशेवर द्वारा जांच किए जाने तक वाहन नहीं चलाना चाहिए।"
    },
    'Message Timeout': {
      explanation: "अपेक्षित संदेश समय पर नहीं आया। नेटवर्क पर एक मॉड्यूल ने संदेश भेजना बंद कर दिया है।",
      causes: "उस मॉड्यूल की बिजली कट सकती है, वह क्रैश हो सकता है या डिस्कनेक्ट हो सकता है।",
      checks: "1. प्रभावित मॉड्यूल (जैसे ABS) के फ्यूज की जांच करें।\n2. कनेक्टर में पानी या ढीले पिन की जांच करें।\n3. मॉड्यूल पर पावर और ग्राउंड की जांच करें।",
      severityGuidance: "गंभीर। यदि ABS जैसे महत्वपूर्ण सिस्टम बंद हो जाते हैं, तो तुरंत पेशेवर की मदद लें।"
    },
    'Timing/Flood': {
      explanation: "एक मॉड्यूल बहुत तेज़ी से संदेश भेज रहा है, जिससे नेटवर्क ब्लॉक हो रहा है।",
      causes: "यह एक खराब मॉड्यूल, सॉफ़्टवेयर बग या OBD-II पोर्ट से जुड़े किसी उपकरण के कारण हो सकता है।",
      checks: "1. OBD-II पोर्ट से किसी भी बाहरी उपकरण को हटा दें।\n2. ध्यान दें कि क्या यह समस्या किसी विशिष्ट क्रिया (जैसे AC चालू करना) से संबंधित है।\n3. यह पता लगाने के लिए कि कौन सा मॉड्यूल समस्या पैदा कर रहा है, स्कैनर की आवश्यकता हो सकती है।",
      severityGuidance: "मध्यम से गंभीर। बाहरी उपकरणों को हटाने से समस्या हल नहीं होती है, तो मैकेनिक से मिलें।"
    },
    'Logical Contradiction': {
      explanation: "दो या अधिक संकेत एक-दूसरे के विपरीत हैं (उदा. वाहन की गति अधिक है, लेकिन गियर पार्क में है)।",
      causes: "संभवतः सेंसर गलत डेटा दे रहा है या मॉड्यूल गलत गणना कर रहा है।",
      checks: "1. स्कैनर से सेंसर डेटा की जांच करें।\n2. संबंधित त्रुटि कोड (DTC) देखें।\n3. सेंसर वायरिंग की जांच करें।",
      severityGuidance: "मध्यम। इसके कारण ABS या ADAS जैसे सिस्टम काम करना बंद कर सकते हैं।"
    },
    'Engine RPM Out-of-Range': {
      explanation: "इंजन RPM अप्रत्याशित रूप से अधिक है या असंभव परिवर्तन दिखा रहा है।",
      causes: "क्रैंकशाफ्ट पोजिशन सेंसर (CKP), उसके तार या इंजन कंट्रोल मॉड्यूल (ECM) में खराबी हो सकती है।",
      checks: "1. CKP और CMP सेंसर तारों की जांच करें।\n2. सेंसर पर तेल या गंदगी की जांच करें।\n3. स्कैनर से ECM त्रुटियों की जांच करें।",
      severityGuidance: "गंभीर। इससे इंजन बंद हो सकता है या स्टार्ट होने में समस्या आ सकती है।"
    },
    'Unknown': {
      explanation: "सिस्टम ने एक विसंगति का पता लगाया है, लेकिन यह किसी ज्ञात नियम से मेल नहीं खाता।",
      causes: "यह एक विद्युत समस्या, किसी पुर्जे की विफलता की शुरुआती अवस्था या कोई मामूली तकनीकी खराबी हो सकती है।",
      checks: "1. ड्राइविंग करते समय किसी भी लक्षण पर नज़र रखें।\n2. ध्यान दें कि यह समस्या किस स्थिति में होती है।\n3. स्कैनर से त्रुटि कोड की जांच करें।",
      severityGuidance: "कम से मध्यम। यदि कोई अन्य लक्षण नहीं हैं, तो निगरानी जारी रखें।"
    }
  }
};
