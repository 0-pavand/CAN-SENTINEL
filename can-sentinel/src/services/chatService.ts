import { ChatMessage, ChatContext } from '../types/chat';
import { DiagnosticEngine, DIAGNOSTIC_QUESTIONS } from '../diagnostics/diagnosticEngine';

export interface ChatService {
  sendMessage(message: string, history: ChatMessage[], context: ChatContext): Promise<ChatMessage>;
  getSuggestedQuestions(context: ChatContext): string[];
}

export class LocalDiagnosticChatService implements ChatService {
  async sendMessage(message: string, history: ChatMessage[], context: ChatContext): Promise<ChatMessage> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Slight artificial delay for UX

    if (!context.summary || context.incidents.length === 0) {
        return {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I don't have any analysis data to refer to. Please run an analysis first.",
            timestamp: Date.now()
        };
    }

    let incident = context.selectedIncidentId ? context.incidents.find(i => i.id === context.selectedIncidentId) : undefined;
    
    let text = "I'm sorry, I don't have enough information to answer that.";
    let incidentId: string | undefined = context.selectedIncidentId;

    if (incident) {
      // Diagnostic Engine mode
      text = DiagnosticEngine.answerQuestion(message, incident, context.language);
    } else {
      // General mode fallback
      const lowerMsg = message.toLowerCase();
      
      const s = {
        en: {
          noData: "I don't have any analysis data to refer to. Please run an analysis first.",
          summarize: (f: number, d: number, i: number) => `The analysis processed ${f} frames and decoded ${d} messages. ${i} incidents were identified.`,
          highestSev: (s: string, t: string) => `The highest severity incident is a ${s} priority ${t}.`,
          howMany: (i: number) => `${i} anomalies were detected in total during the current analysis run.`,
          fallback: "Please select a specific incident from the Results page for detailed diagnostic assistance."
        },
        ta: {
          noData: "பகுப்பாய்வு தரவு எதுவும் என்னிடம் இல்லை. தயவுசெய்து முதலில் பகுப்பாய்வை இயக்கவும்.",
          summarize: (f: number, d: number, i: number) => `இந்த பகுப்பாய்வு ${f} பிரேம்களைச் சரிபார்த்து ${d} செய்திகளை டீகோட் செய்துள்ளது. ${i} முரண்பாடுகள் கண்டறியப்பட்டுள்ளன.`,
          highestSev: (s: string, t: string) => `மிக அதிக தீவிர முரண்பாடு ${s} முன்னுரிமை கொண்ட ${t}.`,
          howMany: (i: number) => `மொத்தம் ${i} முரண்பாடுகள் கண்டறியப்பட்டுள்ளன.`,
          fallback: "விரிவான கண்டறிதலுக்கு முடிவுகள் பக்கத்திலிருந்து ஒரு குறிப்பிட்ட நிகழ்வைத் தேர்ந்தெடுக்கவும்."
        },
        te: {
          noData: "నా వద్ద ఎలాంటి విశ్లేషణ డేటా లేదు. దయచేసి ముందుగా విశ్లేషణను అమలు చేయండి.",
          summarize: (f: number, d: number, i: number) => `ఈ విశ్లేషణ ${f} ఫ్రేమ్‌లను ప్రాసెస్ చేసింది మరియు ${d} సందేశాలను డీకోడ్ చేసింది. ${i} సంఘటనలు గుర్తించబడ్డాయి.`,
          highestSev: (s: string, t: string) => `అత్యధిక తీవ్రత సంఘటన ${s} ప్రాధాన్యత ${t}.`,
          howMany: (i: number) => `మొత్తం ${i} అసమానతలు కనుగొనబడ్డాయి.`,
          fallback: "వివరణాత్మక రోగనిర్ధారణ కోసం దయచేసి ఫలితాల పేజీ నుండి ఒక నిర్దిష్ట సంఘటనను ఎంచుకోండి."
        },
        hi: {
          noData: "मेरे पास कोई विश्लेषण डेटा नहीं है। कृपया पहले विश्लेषण चलाएं।",
          summarize: (f: number, d: number, i: number) => `विश्लेषण ने ${f} फ़्रेमों को संसाधित किया और ${d} संदेशों को डीकोड किया। ${i} घटनाओं की पहचान की गई।`,
          highestSev: (s: string, t: string) => `सबसे गंभीर घटना ${s} प्राथमिकता वाली ${t} है।`,
          howMany: (i: number) => `कुल ${i} विसंगतियां पाई गईं।`,
          fallback: "विस्तृत सहायता के लिए कृपया परिणाम पृष्ठ से किसी विशिष्ट घटना का चयन करें।"
        }
      };

      const langStrings = s[context.language || 'en'] || s.en;

      if (lowerMsg.includes('summarize') || lowerMsg.includes('சுருக்கம்') || lowerMsg.includes('సారాంశం') || lowerMsg.includes('सारांश')) {
        const { framesProcessed, decodedMessages, incidents } = context.summary;
        text = langStrings.summarize(framesProcessed, decodedMessages, incidents);
      } else if (lowerMsg.includes('highest severity') || lowerMsg.includes('தீவிரமான') || lowerMsg.includes('తీవ్రత') || lowerMsg.includes('गंभीर')) {
        const inc = context.incidents.find(i => i.severity === 'Critical') || context.incidents[0];
        if (inc) {
            text = langStrings.highestSev(inc.severity, inc.anomalyType);
            incidentId = inc.id;
        }
      } else if (lowerMsg.includes('how many') || lowerMsg.includes('எத்தனை') || lowerMsg.includes('ఎన్ని') || lowerMsg.includes('कितनी')) {
        text = langStrings.howMany(context.summary.incidents);
      } else {
        text = langStrings.fallback;
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      incidentIdReference: incidentId
    };
  }

  getSuggestedQuestions(context: ChatContext): string[] {
    if (!context.summary) return [];
    
    // We can localize suggested questions as well
    const suggested = {
      en: {
        diag: [...DIAGNOSTIC_QUESTIONS],
        gen: ["Summarize this analysis", "What is the most severe anomaly?", "How many anomalies were detected?"]
      },
      ta: {
        diag: ['இதன் அர்த்தம் என்ன?', 'சாத்தியமான காரணங்கள்', 'நான் என்ன சரிபார்க்க வேண்டும்?', 'இது எவ்வளவு ஆபத்தானது?', 'தொழில்நுட்ப விவரங்கள்'],
        gen: ["இந்த பகுப்பாய்வை சுருக்கமாக கூறுக", "மிகவும் தீவிரமான முரண்பாடு எது?", "எத்தனை முரண்பாடுகள் கண்டறியப்பட்டன?"]
      },
      te: {
        diag: ['దీని అర్థం ఏమిటి?', 'సాధ్యమైన కారణాలు', 'నేను ఏమి తనిఖీ చేయాలి?', 'ఇది ఎంత తీవ్రమైనది?', 'సాంకేతిక వివరాలు'],
        gen: ["ఈ విశ్లేషణ సారాంశం ఏమిటి", "అత్యంత తీవ్రమైన అసమానత ఏది?", "ఎన్ని అసమానతలు కనుగొనబడ్డాయి?"]
      },
      hi: {
        diag: ['इसका क्या मतलब है?', 'संभावित कारण', 'मुझे क्या जाँचना चाहिए?', 'यह कितना गंभीर है?', 'तकनीकी विवरण'],
        gen: ["इस विश्लेषण का सारांश दें", "सबसे गंभीर विसंगति क्या है?", "कितनी विसंगतियां पाई गईं?"]
      }
    };

    const s = suggested[context.language || 'en'] || suggested.en;

    if (context.selectedIncidentId) {
      return s.diag;
    }

    return s.gen;
  }
}

export const chatService = new LocalDiagnosticChatService();
