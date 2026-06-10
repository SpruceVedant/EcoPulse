import { useState, useRef, useEffect } from 'react';
import { ChatMessage, FootprintData } from '../types';
import { Sparkles, MessageCircle, Send, ArrowDownCircle, Info, HeartHandshake, RefreshCw, Trophy } from 'lucide-react';

interface AiCoachProps {
  footprintData: FootprintData | null;
  onUnlockBadge: (badgeId: string) => void;
}

export default function AiCoach({ footprintData, onUnlockBadge }: AiCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt list requested by user
  const suggestions = [
    { text: 'How can I reduce my footprint this week?', id: 'prompt-1' },
    { text: 'Give me a 7-day green plan', id: 'prompt-2' },
    { text: 'What is my biggest carbon habit?', id: 'prompt-3' },
    { text: 'Suggest easy changes without affecting my lifestyle', id: 'prompt-4' },
  ];

  // Welcome response trigger
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-msg',
          sender: 'coach',
          text: `Hello! I'm your AI Eco-Coach. 🌿\n\nI've analyzed your monthly carbon footprint of **${
            footprintData ? footprintData.totalFootprint : '???'
          } kg CO₂** which rates as a **${
            footprintData ? footprintData.carbonScore : '???'
          }** emission profile.\n\nYour highest driver is **${
            footprintData ? footprintData.inputs.transportMode === 'car' ? 'Transport (due to car commute)' : 'Energy/Lifestyle' : 'uncalculated metrics'
          }**.\n\nHow would you like to start driving down your emissions today? Click one of the suggested prompts below or ask me any question directly!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([welcomeMessage]);
        setIsTyping(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [footprintData]);

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Core messaging dispatcher
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    // Create the User turn
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Call actual server-side endpoint
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          footprintData: footprintData,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned error status');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'coach',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      
      // Trigger Badge Unlock Event!
      onUnlockBadge('b3'); // Eco Conversationalist
    } catch (error) {
      console.error('Gemini call failed, triggering fallback responses:', error);
      
      // Dynamic fallback based on prompts
      let fallbackText = '';
      const lowercaseMsg = textToSend.toLowerCase();

      if (lowercaseMsg.includes('reduce my footprint this week')) {
        fallbackText = `Here's how to make an immediate impact this week based on your profile:\n\n1. **Work Remotely (1 day)**: Saves ~12 kg CO₂.\n2. **Tweak Thermostat**: Raise AC target to 26°C to save ~8 kg CO₂.\n3. **Skip 1 Meat Dinner**: Swap mixed choices with plant meals to save ~5 kg CO₂.\n\nCombined saving potential: **25 kg CO₂** in just 7 days!`;
      } else if (lowercaseMsg.includes('7-day green plan') || lowercaseMsg.includes('green plan')) {
        fallbackText = `### Your Customized 7-Day Action Plan:\n\n*   **Day 1**: Unplug standby vampire loads when leaving desk.\n*   **Day 2**: Swap cow's milk for oat/soymilk alternatives.\n*   **Day 3**: Ride public transit or carpool to office commute.\n*   **Day 4**: Ditch food delivery orders—cook using fresh local items.\n*   **Day 5**: Raise AC temperature limit target to 26°C.\n*   **Day 6**: Sort and clean packaging pieces to maximize recycle bins.\n*   **Day 7**: Commit to a completely car-free Sunday walk!\n\nTry checking standard progress actions inside the **Action Plan** tab to earn badges!`;
      } else if (lowercaseMsg.includes('biggest carbon habit')) {
        if (footprintData) {
          fallbackText = `Your monthly emissions are **${footprintData.totalFootprint} kg CO₂**.\n\nAnalyzing contributors, your highest segment lies in **${
            Object.entries(footprintData.categories).reduce((a, b) => (a[1] > b[1] ? a : b))[0].toUpperCase()
          }**.\n\nFocusing reduction targets on this sector first yields the easiest high-volume savings. Let's work on adjusting items together!`;
        } else {
          fallbackText = `I have not scanned your calculator details yet, but typically, combustion engine transport and heating/cooling appliances represent the strongest household contributors. Complete the calculator to get a exact reading!`;
        }
      } else if (lowercaseMsg.includes('easy changes')) {
        fallbackText = `Sure! Here are three easy, high-impact carbon habits that don't involve radical lifestyle sacrifices:\n\n1. **Tame Vampire Loads**: Shutting power outlets for standby devices (monitors, systems, box setups) can shave up to 10% off of electricity bills, saving ~15 kg CO₂/mo.\n2. **Thermostat Rule**: Running ACs at 26°C instead of 22°C reduces the compressors workload, saving ~18 kg CO₂/mo.\n3. **Durable Carry-bag**: Carrying portable sacs for groceries completely cancels single-use paper/plastic emissions immediately.`;
      } else {
        fallbackText = `That's an excellent question! Small daily adjustments have a compounding positive influence on the climate. \n\nI can suggest analyzing your transit habits or trying custom Meatless Mondays! Would you like me to map out a personalized 7-day green schedule?`;
      }

      // Simulate network delay for realistic visual feedback
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'coach',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        onUnlockBadge('b3'); // Unlock Eco Conversationalist badge
      }, 800);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="ai-coach-module">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[72vh]">
        
        {/* Left Side: Coach Bio */}
        <div className="hidden lg:flex lg:col-span-1 flex-col justify-between p-5 glass-panel rounded-3xl border-t border-white/10 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4edea3]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="p-3.5 bg-gradient-to-br from-[#4edea3] to-[#4cd7f6] text-[#003824] rounded-xl w-fit mb-4 shadow bg-clip-border glow-emerald">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-lg text-white">EcoPulse Guide</h3>
            <p className="text-[11px] font-mono font-semibold tracking-wider text-[#4edea3] uppercase mt-0.5">Sustain AI Model</p>
            
            <p className="text-xs text-white/50 mt-4 leading-relaxed">
              Equipped with deep logic adapters to read carbon variables, interpret transport coefficients, and structure personalized micro-saving tips.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-white/60">
              <Info className="w-4 h-4 text-[#4cd7f6]" />
              <span>Full chat memory adapter</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/60">
              <HeartHandshake className="w-4 h-4 text-[#4edea3]" />
              <span>Climate-positive alignment</span>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Chat Container */}
        <div className="lg:col-span-3 flex flex-col justify-between glass-panel rounded-3xl border-t border-white/10 overflow-hidden relative">
          
          {/* Active Chat Header */}
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4edea3] to-[#4cd7f6] flex items-center justify-center font-bold text-[#003824]">
                  AI
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4edea3] border-2 border-[#111318] rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans">Sustain Eco-Coach</h4>
                <p className="text-[10px] text-[#4edea3] font-mono">Gemini-3.5-flash pilot • Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMessages([]);
                }}
                className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[46vh] min-h-[40vh] text-left">
            {messages.map((msg) => {
              const isCoach = msg.sender === 'coach';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isCoach ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isCoach 
                      ? 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none font-sans' 
                      : 'bg-gradient-to-r from-[#4edea3]/20 to-[#4cd7f6]/20 border border-[#4edea3]/20 text-[#4edea3] rounded-tr-none font-sans font-medium'
                    }`}
                  >
                    {/* Render message with line break formatting */}
                    <p className="whitespace-pre-line prose prose-invert prose-xs">
                      {msg.text}
                    </p>
                    <span className="block text-[9px] font-mono text-white/30 text-right mt-1.5">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 mr-auto max-w-[80%]">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white/60 rounded-tl-none flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4edea3] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#4cd7f6] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="text-xs font-mono text-white/40 ml-1">AI Coach compiling advice...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested prompts carousel & Inputs footer */}
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
            
            {/* Suggested prompts list */}
            {messages.length <= 2 && (
              <div className="mb-4">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2 text-left">Click a suggested question:</p>
                <div className="flex flex-wrap gap-2 text-left">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSendMessage(s.text)}
                      className="px-3.5 py-2 text-left rounded-xl bg-white/5 border border-white/5 hover:border-[#4edea3]/30 hover:bg-[#4edea3]/5 text-xs text-white/80 hover:text-[#4edea3] transition-all cursor-pointer inline-block"
                      id={s.id}
                    >
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2 bg-[#181a1e] border border-white/10 rounded-2xl p-1.5"
            >
              <input
                type="text"
                placeholder="Ask your Coach about eco habits or plans..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-white/90 placeholder-white/40"
                id="chat-input-text"
              />
              <button
                type="submit"
                className="p-3 rounded-xl bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-bold active:scale-95 transition-all cursor-pointer hover:brightness-105"
                id="chat-send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
