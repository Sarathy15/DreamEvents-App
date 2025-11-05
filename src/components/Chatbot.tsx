import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Calendar, CreditCard, Search, Mic, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getChatbotResponse } from '../services/geminiService';
import { speechService } from '../services/speechService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  quickActions?: QuickAction[];
}

interface QuickAction {
  label: string;
  action: string;
  icon?: React.ReactNode;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const suggestQuickActions = (response: string): QuickAction[] => {
    const lowerResponse = response.toLowerCase();
    const actions: QuickAction[] = [];

    if (lowerResponse.includes('book') || lowerResponse.includes('service')) {
      actions.push({ label: 'View Services', action: 'view_services', icon: <Search className="h-4 w-4" /> });
      actions.push({ label: 'Book a Service', action: 'book_service', icon: <Calendar className="h-4 w-4" /> });
    }
    
    if (lowerResponse.includes('booking') || lowerResponse.includes('ticket')) {
      actions.push({ label: 'Check My Bookings', action: 'check_bookings', icon: <CreditCard className="h-4 w-4" /> });
    }

    if (lowerResponse.includes('price') || lowerResponse.includes('cost')) {
      actions.push({ label: 'Pricing Info', action: 'pricing_info' });
    }

    return actions;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your DreamEvents assistant. How can I help you plan your perfect event today?',
      sender: 'bot',
      timestamp: new Date(),
      quickActions: [
        { label: 'View Services', action: 'view_services', icon: <Search className="h-4 w-4" /> },
        { label: 'Book a Service', action: 'book_service', icon: <Calendar className="h-4 w-4" /> },
        { label: 'Check My Bookings', action: 'check_bookings', icon: <CreditCard className="h-4 w-4" /> },
        { label: 'Pricing Info', action: 'pricing_info' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [tempSpeechText, setTempSpeechText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const faqs = [
    {
      keywords: ['book', 'booking', 'reserve', 'how to book'],
      response: 'To book a service: 1) Browse our services 2) Click "Book Now" on your preferred service 3) Fill in event details 4) Choose payment method 5) Confirm booking. You\'ll receive a confirmation email and QR ticket!',
      quickActions: [
        { label: 'Browse Services', action: 'view_services', icon: <Search className="h-4 w-4" /> }
      ]
    },
    {
      keywords: ['payment', 'pay', 'cost', 'price', 'pricing'],
      response: 'We accept Stripe, PayPal, and Razorpay. Prices vary by service and vendor. Most services range from $500-$5000. You can see exact pricing on each service card. Payment is secure and processed instantly.',
      quickActions: [
        { label: 'View Pricing', action: 'view_services' }
      ]
    },
    {
      keywords: ['cancel', 'refund', 'cancellation'],
      response: 'You can cancel bookings up to 48 hours before your event through your dashboard. Refund policies vary by vendor - typically 80-100% refund if cancelled 48+ hours in advance.',
      quickActions: [
        { label: 'Check My Bookings', action: 'check_bookings', icon: <CreditCard className="h-4 w-4" /> }
      ]
    },
    {
      keywords: ['vendor', 'become vendor', 'sell', 'join'],
      response: 'To become a vendor: 1) Register as vendor 2) Verify phone number with OTP 3) Complete business profile 4) Add your services 5) Start receiving bookings! We take a small commission only when you get booked.',
      quickActions: [
        { label: 'Vendor Registration', action: 'vendor_register' }
      ]
    },
    {
      keywords: ['availability', 'available', 'dates'],
      response: 'Vendor availability varies by service and date. You can check real-time availability when booking. Popular dates (weekends, holidays) book faster, so we recommend booking 2-4 weeks in advance.',
      quickActions: [
        { label: 'Check Availability', action: 'view_services' }
      ]
    },
    {
      keywords: ['contact', 'support', 'help', 'phone', 'email'],
      response: 'You can reach our 24/7 support team at support@dreamevents.com or call +1 (555) 123-4567. For urgent issues, use the live chat or call directly.',
      quickActions: [
        { label: 'Contact Support', action: 'contact_support' }
      ]
    },
    {
      keywords: ['wedding', 'birthday', 'corporate', 'event types'],
      response: 'We handle all event types: Weddings, Birthday Parties, Corporate Events, Anniversaries, Baby Showers, and more! Each event type has specialized vendors and packages.',
      quickActions: [
        { label: 'Wedding Services', action: 'wedding_services' },
        { label: 'Corporate Events', action: 'corporate_services' }
      ]
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveChatInteraction = async (userMessage: string, botResponse: string) => {
    if (user) {
      try {
        await addDoc(collection(db, 'chatInteractions'), {
          userId: user.uid,
          userMessage,
          botResponse,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving chat interaction:', error);
      }
    }
  };

  const getBotResponse = (userMessage: string): { text: string; quickActions?: QuickAction[] } => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const faq of faqs) {
      if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          text: faq.response,
          quickActions: faq.quickActions
        };
      }
    }

    return {
      text: 'I\'m here to help with your event planning needs! You can ask me about booking services, payments, vendor registration, or any other questions about DreamEvents.',
      quickActions: [
        { label: 'View Services', action: 'view_services', icon: <Search className="h-4 w-4" /> },
        { label: 'Book a Service', action: 'book_service', icon: <Calendar className="h-4 w-4" /> },
        { label: 'Get Help', action: 'contact_support' }
      ]
    };
  };

  const handleStartListening = async () => {
    try {
      setIsListening(true);
      setTempSpeechText('');
      await speechService.startListening(
        (text, isFinal) => {
          setTempSpeechText(text);
          if (isFinal) {
            setInputText(text);
            setIsListening(false);
            speechService.stopListening();
            // Auto-send final transcript to the chat (speech-to-text -> send to Gemini)
            handleSendMessage(text);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          toast.error('Failed to recognize speech');
          setIsListening(false);
        }
      );
    } catch (error) {
      console.error('Failed to start listening:', error);
      toast.error('Speech recognition not supported');
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const handleToggleSpeech = (text: string) => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      speechService.speak(
        text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build recent history to send to Gemini (provide context)
      // Take only the last 10 messages to keep context manageable
      const history = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      // Get response from Gemini API (pass recent history)
      const responseText = await getChatbotResponse(history, text.trim());
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        quickActions: suggestQuickActions(responseText)
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Save interaction to Firebase
      saveChatInteraction(text, responseText);
    } catch (error: any) {
      // Extract a readable error message
      const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('Failed to get AI response:', error);

      // Show a clearer toast with a short error snippet
      const short = errMsg.length > 200 ? errMsg.slice(0, 200) + '...' : errMsg;
      toast.error(`AI error: ${short}`);

      // Fallback to basic responses
      const fallbackResponse = getBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        quickActions: fallbackResponse.quickActions
      };
      setMessages(prev => [...prev, botMessage]);

      // In development, append a debug message containing the full error so you can copy it
      if (process.env.NODE_ENV === 'development') {
        const debugMsg: Message = {
          id: (Date.now() + 2).toString(),
          text: `Debug: AI error -> ${errMsg}`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, debugMsg]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'view_services':
        navigate('/');
        setIsOpen(false);
        toast.success('Redirecting to services...');
        break;
      case 'book_service':
        if (!user) {
          navigate('/login');
          toast.error('Please login to book services');
        } else if (userData?.role === 'vendor') {
          toast.error('Vendors cannot book services');
        } else {
          navigate('/customer-dashboard');
          setIsOpen(false);
          toast.success('Opening booking dashboard...');
        }
        break;
      case 'check_bookings':
        if (!user) {
          navigate('/login');
          toast.error('Please login to view bookings');
        } else {
          navigate('/customer-dashboard');
          setIsOpen(false);
        }
        break;
      case 'vendor_register':
        navigate('/register?type=vendor');
        setIsOpen(false);
        break;
      case 'contact_support':
        toast.success('Opening support chat...');
        break;
      case 'pricing_info':
        handleSendMessage('Tell me about pricing');
        break;
      case 'wedding_services':
        navigate('/?category=wedding');
        setIsOpen(false);
        break;
      case 'corporate_services':
        navigate('/?category=corporate');
        setIsOpen(false);
        break;
      default:
        handleSendMessage(action);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-50 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 scale-110' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 animate-pulse'
        } text-white flex items-center justify-center group`}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
        ) : (
          <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">DreamEvents Assistant</h3>
                <p className="text-xs text-blue-100">Online • Ready to help</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      {message.sender === 'user' ? 
                        <User className="h-3 w-3 text-white" /> : 
                        <Bot className="h-3 w-3 text-gray-600" />
                      }
                    </div>
                      <div className={`p-3 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{message.text}</p>
                        {message.sender === 'bot' && (
                          <button
                            onClick={() => handleToggleSpeech(message.text)}
                            className={`ml-2 p-1 rounded-full transition-colors ${
                              isSpeaking ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {message.quickActions && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-8">
                    {message.quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.action)}
                        className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex flex-col space-y-2">
              {/* Speech recognition feedback */}
              {isListening && (
                <div className="text-sm text-gray-500 flex items-center space-x-2 animate-pulse">
                  <Mic className="h-4 w-4 text-red-500" />
                  <span>{tempSpeechText || 'Listening...'}</span>
                </div>
              )}
              
              {/* Input controls */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                  placeholder="Ask me anything..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Speech-to-text button */}
                <button
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100 text-gray-600'
                  }`}
                  title={speechService.isRecognitionSupported() ? 'Click to speak' : 'Speech recognition not supported in this browser'}
                  disabled={!speechService.isRecognitionSupported()}
                >
                  <Mic className={`h-4 w-4 ${!speechService.isRecognitionSupported() ? 'opacity-50' : ''}`} />
                </button>
                
                {/* Send button */}
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;