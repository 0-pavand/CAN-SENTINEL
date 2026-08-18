import { AnomalyIncident } from '../types';
import { categorizeAnomaly } from './knowledge';
import { KNOWLEDGE_BASE_I18N } from './knowledge_i18n';
import { Language } from '../i18n/translations';

export type DiagnosticQuestion = 
  | 'What does this mean?'
  | 'Possible causes'
  | 'What should I check?'
  | 'How serious is it?'
  | 'Technical details';

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  'What does this mean?',
  'Possible causes',
  'What should I check?',
  'How serious is it?',
  'Technical details'
];

export class DiagnosticEngine {
  
  static answerQuestion(question: string, incident: AnomalyIncident, language: Language = 'en'): string {
    const category = categorizeAnomaly(incident.anomalyType);
    const knowledge = KNOWLEDGE_BASE_I18N[language][category] || KNOWLEDGE_BASE_I18N['en'][category];

    const q = question.toLowerCase();
    
    // Intent matching (we can keep english intent matching if the UI sends English questions, 
    // but the UI sends translated questions. Wait, we should map translated questions back,
    // or just use generic keyword matching across languages. Or better, chatService handles the routing)
    let matchedIntent: DiagnosticQuestion | null = null;
    
    // We match by index since chatService sends translated questions in order, or we just look for common terms
    // A more robust way is for the UI to send the English key or we check translations.
    // For now, let's keep it simple: the user clicks a button with the translated question, 
    // we need to match it. Actually, `chatService.ts` calls this. Let's see how `chatService` works.
    
    // If the question is exactly one of the translated suggested questions, we can match it.
    // But since this is a simple mock assistant, I'll match based on intent logic inside chatService or here.
    
    // Fallback intent matching (if they type in english)
    if (q.includes('mean') || q.includes('explain') || q.includes('what is this') || q.includes('definition') || q.includes('என்றால் என்ன') || q.includes('అంటే ఏమిటి') || q.includes('क्या मतलब')) {
      matchedIntent = 'What does this mean?';
    } else if (q.includes('cause') || q.includes('why') || q.includes('reason') || q.includes('காரணம்') || q.includes('కారణం') || q.includes('कारण')) {
      matchedIntent = 'Possible causes';
    } else if (q.includes('check') || q.includes('fix') || q.includes('do') || q.includes('inspect') || q.includes('troubleshoot') || q.includes('action') || q.includes('சரிபார்க்க') || q.includes('తనిఖీ') || q.includes('जांच')) {
      matchedIntent = 'What should I check?';
    } else if (q.includes('serious') || q.includes('sever') || q.includes('danger') || q.includes('bad') || q.includes('priority') || q.includes('ஆபத்து') || q.includes('తీవ్రత') || q.includes('गंभीर')) {
      matchedIntent = 'How serious is it?';
    } else if (q.includes('technical') || q.includes('detail') || q.includes('score') || q.includes('evidence') || q.includes('can id') || q.includes('data') || q.includes('விவரங்கள்') || q.includes('వివరాలు') || q.includes('विवरण')) {
      matchedIntent = 'Technical details';
    }

    // Default translations for string building
    const i18nStrings = {
      en: {
        specInc: `Specifically for this incident, the system observed a ${incident.severity.toLowerCase()}-severity anomaly categorized as "${incident.anomalyType}".`,
        evidence: `The system's detection engine noted the following evidence: "${incident.ruleEvidence || 'Complex behavioral deviation detected across multiple frames.'}"`,
        safeSteps: `Here are some safe inspection steps:`,
        disclaimer: `⚠️ Disclaimer: This tool assists with diagnostics but cannot physically repair your vehicle. Do not attempt high-voltage or complex ECM repairs without professional training.`,
        catAs: `The system categorized this specific event as ${incident.severity} severity.`,
        genGuidance: `General guidance for this type of issue:`,
        techData: `Technical Incident Data:`,
        rawType: `Raw Anomaly Type`,
        affIds: `Affected CAN IDs`,
        occur: `Occurrences`,
        dur: `Duration`,
        time: `Time`,
        peakDl: `Peak DL Score`,
        ruleEv: `Rule Evidence`,
        none: `None`,
        defaultMsg: `I can explain this incident, its likely causes, what you can check, and its severity. Try asking one of those or pick an option below.`
      },
      ta: {
        specInc: `இந்த நிகழ்விற்காக, கணினி "${incident.anomalyType}" என வகைப்படுத்தப்பட்ட ${incident.severity.toLowerCase()}-தீவிர முரண்பாட்டை கண்டறிந்துள்ளது.`,
        evidence: `கணினி கண்டறிந்த சான்றுகள்: "${incident.ruleEvidence || 'பல பிரேம்களில் சிக்கலான நடத்தை விலகல் கண்டறியப்பட்டது.'}"`,
        safeSteps: `சில பாதுகாப்பான சோதனை படிகள்:`,
        disclaimer: `⚠️ எச்சரிக்கை: இந்த கருவி கண்டறிதலுக்கு மட்டுமே உதவும். முறையான பயிற்சி இல்லாமல் பழுதுபார்க்க முயற்சிக்க வேண்டாம்.`,
        catAs: `இந்த நிகழ்வு ${incident.severity} தீவிரம் என வகைப்படுத்தப்பட்டுள்ளது.`,
        genGuidance: `இந்த வகையான பிரச்சனைக்கான பொதுவான வழிகாட்டுதல்:`,
        techData: `தொழில்நுட்ப தரவு:`,
        rawType: `முரண்பாடு வகை`,
        affIds: `பாதிக்கப்பட்ட CAN IDகள்`,
        occur: `நிகழ்வுகளின் எண்ணிக்கை`,
        dur: `காலம்`,
        time: `நேரம்`,
        peakDl: `உச்ச DL ஸ்கோர்`,
        ruleEv: `விதி சான்று`,
        none: `எதுவுமில்லை`,
        defaultMsg: `இந்த நிகழ்வு, காரணங்கள், மற்றும் தீவிரத்தை என்னால் விளக்க முடியும். கீழே உள்ள விருப்பங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும்.`
      },
      te: {
        specInc: `ఈ సంఘటన కోసం, సిస్టమ్ "${incident.anomalyType}" వర్గీకరించబడిన ${incident.severity.toLowerCase()}-తీవ్రత గల అసమానతను గమనించింది.`,
        evidence: `సిస్టమ్ గమనించిన సాక్ష్యం: "${incident.ruleEvidence || 'బహుళ ఫ్రేమ్‌లలో సంక్లిష్ట ప్రవర్తన మార్పు కనుగొనబడింది.'}"`,
        safeSteps: `కొన్ని సురక్షిత తనిఖీ దశలు ఇక్కడ ఉన్నాయి:`,
        disclaimer: `⚠️ గమనిక: ఈ సాధనం రోగనిర్ధారణకు మాత్రమే సహాయపడుతుంది. తగిన శిక్షణ లేకుండా రిపేర్ చేయడానికి ప్రయత్నించవద్దు.`,
        catAs: `సిస్టమ్ ఈ సంఘటనను ${incident.severity} తీవ్రతగా వర్గీకరించింది.`,
        genGuidance: `ఈ రకమైన సమస్యకు సాధారణ మార్గదర్శకం:`,
        techData: `సాంకేతిక డేటా:`,
        rawType: `అసమానత రకం`,
        affIds: `ప్రభావిత CAN IDలు`,
        occur: `సంఘటనల సంఖ్య`,
        dur: `వ్యవధి`,
        time: `సమయం`,
        peakDl: `గరిష్ట DL స్కోర్`,
        ruleEv: `నియమ సాక్ష్యం`,
        none: `ఏదీ లేదు`,
        defaultMsg: `నేను ఈ సంఘటన, దాని కారణాలు మరియు తీవ్రతను వివరించగలను. దయచేసి కింద ఉన్న ఎంపికలలో ఒకదాన్ని ఎంచుకోండి.`
      },
      hi: {
        specInc: `विशेष रूप से इस घटना के लिए, सिस्टम ने "${incident.anomalyType}" के रूप में वर्गीकृत ${incident.severity.toLowerCase()}-गंभीरता वाली विसंगति देखी है।`,
        evidence: `सिस्टम के इंजन ने निम्नलिखित साक्ष्य नोट किए: "${incident.ruleEvidence || 'कई फ़्रेमों में जटिल व्यवहार विचलन का पता चला।'}"`,
        safeSteps: `यहां कुछ सुरक्षित निरीक्षण चरण दिए गए हैं:`,
        disclaimer: `⚠️ अस्वीकरण: यह टूल निदान में सहायता करता है लेकिन शारीरिक रूप से मरम्मत नहीं कर सकता। पेशेवर प्रशिक्षण के बिना मरम्मत का प्रयास न करें।`,
        catAs: `सिस्टम ने इस घटना को ${incident.severity} गंभीरता के रूप में वर्गीकृत किया है।`,
        genGuidance: `इस प्रकार की समस्या के लिए सामान्य मार्गदर्शन:`,
        techData: `तकनीकी डेटा:`,
        rawType: `विसंगति का प्रकार`,
        affIds: `प्रभावित CAN ID`,
        occur: `घटनाओं की संख्या`,
        dur: `अवधि`,
        time: `समय`,
        peakDl: `अधिकतम DL स्कोर`,
        ruleEv: `नियम साक्ष्य`,
        none: `कोई नहीं`,
        defaultMsg: `मैं इस घटना, इसके कारणों और गंभीरता की व्याख्या कर सकता हूँ। नीचे दिए गए विकल्पों में से किसी एक को चुनें।`
      }
    };

    const s = i18nStrings[language] || i18nStrings['en'];

    switch (matchedIntent) {
      case 'What does this mean?':
        return `${knowledge.explanation}\n\n${s.specInc}`;
      
      case 'Possible causes':
        return `${knowledge.causes}\n\n${s.evidence}`;
      
      case 'What should I check?':
        const checksList = knowledge.checks.split('\n').map(c => c.trim()).join('\n');
        return `${s.safeSteps}\n\n${checksList}\n\n${s.disclaimer}`;
      
      case 'How serious is it?':
        return `${s.catAs}\n\n${s.genGuidance} ${knowledge.severityGuidance}`;
      
      case 'Technical details':
        const canIds = incident.canIds.join(', ');
        const scoreStr = incident.dlScore !== undefined ? incident.dlScore.toFixed(4) : 'N/A';
        return `${s.techData}\n• ${s.rawType}: ${incident.anomalyType}\n• ${s.affIds}: ${canIds}\n• ${s.occur}: ${incident.occurrences}\n• ${s.dur}: ${incident.duration} ms\n• ${s.time}: ${incident.startTime.toFixed(2)}s - ${incident.endTime.toFixed(2)}s\n• ${s.peakDl}: ${scoreStr}\n• ${s.ruleEv}: ${incident.ruleEvidence || s.none}`;

      default:
        return s.defaultMsg;
    }
  }

  static getIntroMessage(incident: AnomalyIncident, language: Language = 'en'): string {
    const intros = {
      en: `I found a ${incident.severity}-severity CAN anomaly. I can explain what it means, possible causes, what you can check, and how serious it is.`,
      ta: `நான் ${incident.severity}-தீவிர CAN முரண்பாட்டைக் கண்டறிந்தேன். இது எதனால் ஏற்பட்டது, என்ன சரிபார்க்க வேண்டும் என என்னால் விளக்க முடியும்.`,
      te: `నేను ${incident.severity}-తీవ్రత గల CAN అసమానతను కనుగొన్నాను. దీని కారణాలు, మీరు ఏమి తనిఖీ చేయాలో నేను వివరించగలను.`,
      hi: `मुझे ${incident.severity}-गंभीरता वाली CAN विसंगति मिली है। मैं इसके कारण और जांच के तरीके समझा सकता हूँ।`
    };
    return intros[language] || intros['en'];
  }
}
