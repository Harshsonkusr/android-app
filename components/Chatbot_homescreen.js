import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get device dimensions
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

// Updated Language options with Indian languages
const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  hi: { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳', speechCode: 'hi-IN' },
  mr: { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳', speechCode: 'mr-IN' },
  bn: { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩', speechCode: 'bn-IN' },
  pa: { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳', speechCode: 'pa-IN' },
  ta: { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳', speechCode: 'ta-IN' },
};

// Updated Translations for UI elements
const TRANSLATIONS = {
  en: {
    welcome: 'Welcome to the Multi-Language Crop Assistant! Ask your questions about farming and crop insurance.',
    inputPlaceholder: 'Ask me anything about crop insurance...',
    send: 'Send',
    chat: 'Chat',
    history: 'History',
    clear: 'Clear',
    settings: 'Settings',
    typing: 'Bot is typing...',
    languageSettings: 'Language Settings',
    saveSettings: 'Save Settings',
    selectLanguage: 'Select Language',
    voiceAssistant: 'Voice Assistant',
    speechToText: 'Speech to Text',
    suggestions: ['What does insurance cover?', 'How to claim?', 'Required documents'],
    botName: 'CropCare AI',
    listening: 'Listening...',
    tapToSpeak: 'Tap to speak your question',
    processing: 'Processing speech...',
  },
  hi: {
    welcome: 'बहुभाषी फसल सहायक में आपका स्वागत है! कृषि और फसल बीमा के बारे में अपने प्रश्न पूछें।',
    inputPlaceholder: 'फसल बीमा के बारे में कुछ भी पूछें...',
    send: 'भेजें',
    chat: 'चैट',
    history: 'इतिहास',
    clear: 'साफ़ करें',
    settings: 'सेटिंग्स',
    typing: 'बॉट टाइप कर रहा है...',
    languageSettings: 'भाषा सेटिंग्स',
    saveSettings: 'सेटिंग्स सहेजें',
    selectLanguage: 'भाषा चुनें',
    voiceAssistant: 'आवाज सहायक',
    speechToText: 'बोलकर टाइप करें',
    suggestions: ['बीमा क्या कवर करता है?', 'दावा कैसे करें?', 'आवश्यक दस्तावेज'],
    botName: 'फसल केयर AI',
    listening: 'सुन रहा है...',
    tapToSpeak: 'अपना प्रश्न बोलें',
    processing: 'आवाज़ प्रोसेस हो रही है...',
  },
  mr: {
    welcome: 'बहुभाषी फसल सहाय्यकमध्ये तुमचे स्वागत आहे! शेती आणि फसल विम्याविषयी तुमचे प्रश्न विचारा।',
    inputPlaceholder: 'फसल विम्याबद्दल काहीही विचारा...',
    send: 'पाठवा',
    chat: 'चॅट',
    history: 'इतिहास',
    clear: 'साफ करा',
    settings: 'सेटिंग्स',
    typing: 'बॉट टाइप करत आहे...',
    languageSettings: 'भाषा सेटिंग्स',
    saveSettings: 'सेटिंग्स जतन करा',
    selectLanguage: 'भाषा निवडा',
    voiceAssistant: 'आवाज सहाय्यक',
    speechToText: 'बोलून टाईप करा',
    suggestions: ['विमा काय कव्हर करतो?', 'दावा कसा करावा?', 'आवश्यक कागदपत्रे'],
    botName: 'फसल केअर AI',
    listening: 'ऐकत आहे...',
    tapToSpeak: 'तुमचा प्रश्न बोला',
    processing: 'आवाज प्रक्रिया करत आहे...',
  },
  bn: {
    welcome: 'বহুভাষিক ফসল সহায়কে আপনাকে স্বাগতম! কৃষি ও ফসল বীমা সম্পর্কে আপনার প্রশ্ন জিজ্ঞাসা করুন।',
    inputPlaceholder: 'ফসল বীমা সম্পর্কে যেকোনো প্রশ্ন করুন...',
    send: 'পাঠান',
    chat: 'চ্যাট',
    history: 'ইতিহাস',
    clear: 'সাফ করুন',
    settings: 'সেটিংস',
    typing: 'বট টাইপ করছে...',
    languageSettings: 'ভাষা সেটিংস',
    saveSettings: 'সেটিংস সংরক্ষণ করুন',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    voiceAssistant: 'ভয়েস সহায়ক',
    speechToText: 'কথা বলে টাইপ করুন',
    suggestions: ['বীমা কী কভার করে?', 'কিভাবে দাবি করবেন?', 'প্রয়োজনীয় নথি'],
    botName: 'ক্রপ কেয়ার AI',
    listening: 'শুনছি...',
    tapToSpeak: 'আপনার প্রশ্ন বলুন',
    processing: 'কণ্ঠস্বর প্রক্রিয়া করছি...',
  },
  pa: {
    welcome: 'ਬਹੁਭਾਸ਼ਿਕ ਫਸਲ ਸਹਾਇਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਖੇਤੀ ਅਤੇ ਫਸਲ ਬੀਮੇ ਬਾਰੇ ਆਪਣੇ ਸਵਾਲ ਪੁੱਛੋ।',
    inputPlaceholder: 'ਫਸਲ ਬੀਮੇ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ...',
    send: 'ਭੇਜੋ',
    chat: 'ਚੈਟ',
    history: 'ਇਤਿਹਾਸ',
    clear: 'ਸਾਫ਼ ਕਰੋ',
    settings: 'ਸੈਟਿੰਗਜ਼',
    typing: 'ਬੋਟ ਟਾਈਪ ਕਰ ਰਿਹਾ ਹੈ...',
    languageSettings: 'ਭਾਸ਼ਾ ਸੈਟਿੰਗਜ਼',
    saveSettings: 'ਸੈਟਿੰਗਜ਼ ਸੇਵ ਕਰੋ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    voiceAssistant: 'ਆਵਾਜ਼ ਸਹਾਇਕ',
    speechToText: 'ਬੋਲ ਕੇ ਟਾਈਪ ਕਰੋ',
    suggestions: ['ਬੀਮਾ ਕੀ ਕਵਰ ਕਰਦਾ ਹੈ?', 'ਦਾਅਵਾ ਕਿਵੇਂ ਕਰੀਏ?', 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼'],
    botName: 'ਕ੍ਰਾਪ ਕੇਅਰ AI',
    listening: 'ਸੁਣ ਰਿਹਾ ਹੈ...',
    tapToSpeak: 'ਆਪਣਾ ਸਵਾਲ ਬੋਲੋ',
    processing: 'ਆਵਾਜ਼ ਪ੍ਰੋਸੈਸ ਕਰ ਰਿਹਾ ਹੈ...',
  },
  ta: {
    welcome: 'பல்மொழி பயிர் உதவியாளரில் உங்களை வரவேற்கிறோம்! விவசாயம் மற்றும் பயிர் காப்பீடு குறித்து உங்கள் கேள்விகளைக் கேளுங்கள்।',
    inputPlaceholder: 'பயிர் காப்பீட்டைப் பற்றி எதையும் கேளுங்கள்...',
    send: 'அனுப்பு',
    chat: 'அரட்டை',
    history: 'வரலாறு',
    clear: 'அழிக்கவும்',
    settings: 'அமைப்புகள்',
    typing: 'பாட் தட்டச்சு செய்கிறது...',
    languageSettings: 'மொழி அமைப்புகள்',
    saveSettings: 'அமைப்புகளை சேமிக்கவும்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    voiceAssistant: 'குரல் உதவியாளர்',
    speechToText: 'பேசி டைப் செய்யுங்கள்',
    suggestions: ['காப்பீடு எதை உள்ளடக்குகிறது?', 'எப்படி கோரலாம்?', 'தேவையான ஆவணங்கள்'],
    botName: 'க்ராப் கேர் AI',
    listening: 'கேட்டுக் கொண்டிருக்கிறது...',
    tapToSpeak: 'உங்கள் கேள்வியைச் சொல்லுங்கள்',
    processing: 'குரலை செயலாக்குகிறது...',
  },
};

export default function App() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [speechToTextEnabled, setSpeechToTextEnabled] = useState(true);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);

  // Fixed API key (no longer in settings)
  const apiKey = 'AIzaSyBHSVGEDXjC-Geb3fs05AcQK65dUd_ZEyY';

  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const micAnim = useRef(new Animated.Value(1)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  
  const recording = useRef(null);
  const scrollViewRef = useRef(null);
  const flatListRef = useRef(null);
  const textInputRef = useRef(null);

  // Load saved settings (without API key)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@language');
        const savedChatHistory = await AsyncStorage.getItem('@chatHistory');
        const savedVoiceMode = await AsyncStorage.getItem('@voiceMode');
        const savedSpeechToText = await AsyncStorage.getItem('@speechToText');
        
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedChatHistory) setChatHistory(JSON.parse(savedChatHistory));
        if (savedVoiceMode) setIsVoiceMode(JSON.parse(savedVoiceMode));
        if (savedSpeechToText) setSpeechToTextEnabled(JSON.parse(savedSpeechToText));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save chat history
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem('@chatHistory', JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    };
    if (chatHistory.length > 0) {
      saveHistory();
    }
  }, [chatHistory]);

  // Keyboard listeners with improved handling
  useEffect(() => {
    const keyboardWillShow = (event) => {
      const keyboardHeight = event.endCoordinates.height;
      setKeyboardHeight(keyboardHeight);
      setIsKeyboardVisible(true);
      
      // Animate input container up
      Animated.timing(inputContainerAnim, {
        toValue: -keyboardHeight + (Platform.OS === 'ios' ? 34 : 0),
        duration: 250,
        useNativeDriver: false,
      }).start();
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      
      // Animate input container back to original position
      Animated.timing(inputContainerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    };

    const showListener = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideListener = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showListener, keyboardWillShow);
    const keyboardHideListener = Keyboard.addListener(hideListener, keyboardWillHide);

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, []);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto scroll to bottom when new message is added
  useEffect(() => {
    if (flatListRef.current && chatHistory.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }, 100);
    }
  }, [chatHistory]);

  // Get translations for current language
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Save settings (without API key)
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('@language', language);
      await AsyncStorage.setItem('@voiceMode', JSON.stringify(isVoiceMode));
      await AsyncStorage.setItem('@speechToText', JSON.stringify(speechToTextEnabled));
      setSettingsVisible(false);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  // Enhanced voice recording with speech-to-text processing
  const startRecording = async () => {
    if (!speechToTextEnabled) {
      Alert.alert('Speech to Text Disabled', 'Please enable Speech to Text in settings to use voice input.');
      return;
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording.current = newRecording;
      setIsRecording(true);
      
      // Start mic animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(micAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording.current) return;
      
      setIsRecording(false);
      setIsProcessingSpeech(true);
      await recording.current.stopAndUnloadAsync();
      micAnim.setValue(1); // Reset animation
      
      const uri = recording.current.getURI();
      recording.current = null;
      
      // Simulate speech-to-text processing with language-appropriate demo text
      setTimeout(() => {
        const demoQueries = {
          en: "What documents are needed for crop insurance claim?",
          hi: "फसल बीमा क्लेम के लिए कौन से दस्तावेज़ चाहिए?",
          mr: "फसल विमा क्लेमसाठी कोणती कागदपत्रे लागतात?",
          bn: "ফসল বীমা দাবির জন্য কোন কাগজপত্র প্রয়োজন?",
          pa: "ਫਸਲ ਬੀਮਾ ਕਲੇਮ ਲਈ ਕਿਹੜੇ ਦਸਤਾਵੇਜ਼ ਦੀ ਲੋੜ ਹੈ?",
          ta: "பயிர் காப்பீடு கோருவதற்கு என்ன ஆவணங்கள் தேவை?"
        };
        
        setQuery(demoQueries[language] || demoQueries.en);
        setIsProcessingSpeech(false);
        
        // Auto-send after a short delay
        setTimeout(() => {
          if (demoQueries[language] || demoQueries.en) {
            handleSend();
          }
        }, 500);
      }, 2000); // Simulate processing time
      
    } catch (error) {
      console.error('Failed to stop recording', error);
      setIsProcessingSpeech(false);
    }
  };

  // Speech synthesis for bot responses
  const speakResponse = (text) => {
    setIsPlayingResponse(true);
    const speechLanguage = LANGUAGES[language]?.speechCode || 'en-US';
    
    Speech.speak(text, {
      language: speechLanguage,
      onDone: () => setIsPlayingResponse(false),
      onError: (error) => {
        console.log('Speech error:', error);
        setIsPlayingResponse(false);
      }
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsPlayingResponse(false);
  };

  // Enhanced Gemini API function with proper language handling
  const fetchGeminiResponse = async (userQuery, lang) => {
    try {
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });


      const languageData = LANGUAGES[lang] || LANGUAGES.en;
      const languageName = languageData.name;
      
      // Enhanced prompt with specific language instructions
      const prompt = `You are CropCare AI, a helpful agricultural assistant specializing in crop insurance and farming advice. 

IMPORTANT: Respond ONLY in ${languageName}. Do not use English or any other language.

User's query in ${languageName}: "${userQuery}"

Please provide a helpful response about:
- Crop insurance policies and coverage
- Claims process and requirements  
- Farming best practices
- Agricultural schemes and subsidies
- Crop protection methods
- Documentation requirements

Guidelines:
- Respond STRICTLY in ${languageName} language only
- Provide accurate, practical information for farmers
- Keep responses clear and informative (3-4 sentences)
- Use simple language that farmers can easily understand
- If the query is not agriculture-related, politely redirect to farming topics in ${languageName}
- Be supportive and encouraging

Respond in ${languageName} only:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text || generateMockResponse(userQuery, lang);
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Show error alert for API issues
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not found')) {
        Alert.alert('API Error', 'There was an issue with the AI service. Using offline mode.');
      }
      
      // Fallback to mock response
      return generateMockResponse(userQuery, lang);
    }
  };

  // Send message and get response
  const handleSend = async () => {
    if (query.trim() === '') return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg = {
      id: Date.now().toString(),
      user: 'You',
      message: query,
      time: timestamp,
    };

    const currentQuery = query; // Store current query
    setChatHistory((prev) => [userMsg, ...prev]);
    setQuery('');
    setShowWelcome(false);
    setShowSuggestions(false);
    setBotTyping(true);

    // Dismiss keyboard after sending
    Keyboard.dismiss();

    try {
      const botResponse = await fetchGeminiResponse(currentQuery, language);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        user: 'Bot',
        message: botResponse,
        time: timestamp,
      };

      setTimeout(() => {
        setChatHistory((prev) => [botMsg, ...prev]);
        setBotTyping(false);
        
        // Speak response if voice mode is on
        if (isVoiceMode) {
          speakResponse(botResponse);
        }
      }, 900);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        user: 'Bot',
        message: 'Sorry, I encountered an error. Please try again later.',
        time: timestamp,
      };
      
      setTimeout(() => {
        setChatHistory((prev) => [errorMsg, ...prev]);
        setBotTyping(false);
      }, 900);
    }
  };

  // Updated Mock API response with all languages
  const generateMockResponse = (q, lang) => {
    const responses = {
      en: {
        insurance: 'Our crop insurance covers drought, pests, floods, and natural disasters. You can easily file claims with proper documentation and assessment reports.',
        claim: 'To claim insurance: 1) Report damage within 7 days, 2) Submit photographs of damaged crops, 3) Get official assessment done, 4) Contact your local insurance agent with required documents.',
        documents: 'Required documents: Land ownership proof, crop damage assessment report, purchase receipts, Aadhaar card, bank details, and insurance policy documents.',
        default: 'Hello! I am CropCare AI, your agricultural assistant. I can help with crop insurance, farming practices, government schemes, and agricultural guidance. How can I help you today?'
      },
      hi: {
        insurance: 'हमारा फसल बीमा सूखा, कीट, बाढ़ और प्राकृतिक आपदाओं को कवर करता है। उचित दस्तावेजीकरण और मूल्यांकन रिपोर्ट के साथ आसानी से दावा दायर कर सकते हैं।',
        claim: 'बीमा दावा करने के लिए: 1) 7 दिन के भीतर नुकसान की रिपोर्ट करें, 2) क्षतिग्रस्त फसलों की तस्वीरें जमा करें, 3) आधिकारिक मूल्यांकन कराएं, 4) आवश्यक दस्तावेजों के साथ स्थानीय बीमा एजेंट से संपर्क करें।',
        documents: 'आवश्यक दस्तावेज: भूमि स्वामित्व प्रमाण, फसल क्षति मूल्यांकन रिपोर्ट, खरीदारी रसीदें, आधार कार्ड, बैंक विवरण और बीमा पॉलिसी दस्तावेज।',
        default: 'नमस्ते! मैं क्रॉपकेयर AI हूँ, आपका कृषि सहायक। मैं फसल बीमा, कृषि प्रथाओं, सरकारी योजनाओं और कृषि मार्गदर्शन में मदद कर सकता हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?'
      },
      mr: {
        insurance: 'आमचा फसल विमा दुष्काळ, कीड, पूर, आणि नैसर्गिक आपत्तींना कव्हर करतो. योग्य कागदपत्रे आणि मूल्यमापन अहवालासह सहजपणे दावा दाखल करू शकता.',
        claim: 'विमा दावा करण्यासाठी: १) ७ दिवसांत नुकसानाची तक्रार करा, २) खराब झालेल्या पिकांचे फोटो सबमिट करा, ३) अधिकृत मूल्यमापन करवा, ४) आवश्यक कागदपत्रांसह स्थानिक विमा एजंटशी संपर्क साधा.',
        documents: 'आवश्यक कागदपत्रे: जमीन मालकीचा पुरावा, फसल नुकसान मूल्यमापन अहवाल, खरेदी पावत्या, आधार कार्ड, बँक तपशील आणि विमा पॉलिसी कागदपत्रे.',
        default: 'नमस्कार! मी क्रॉपकेअर AI आहे, तुमचा कृषी सहाय्यक. मी फसल विमा, शेतीच्या पद्धती, सरकारी योजना आणि कृषी मार्गदर्शनात मदत करू शकतो. आज मी तुमची कशी मदत करू शकतो?'
      },
      bn: {
        insurance: 'আমাদের ফসল বীমা খরা, পোকামাকড়, বন্যা এবং প্রাকৃতিক দুর্যোগ কভার করে। যথাযথ কাগজপত্র এবং মূল্যায়ন রিপোর্ট সহ সহজেই দাবি দাখিল করতে পারেন।',
        claim: 'বীমা দাবি করার জন্য: ১) ৭ দিনের মধ্যে ক্ষতির রিপোর্ট করুন, ২) ক্ষতিগ্রস্ত ফসলের ছবি জমা দিন, ৩) সরকারি মূল্যায়ন করান, ৪) প্রয়োজনীয় কাগজপত্র নিয়ে স্থানীয় বীমা এজেন্টের সাথে যোগাযোগ করুন।',
        documents: 'প্রয়োজনীয় কাগজপত্র: ভূমি মালিকানার প্রমাণ, ফসল ক্ষতির মূল্যায়ন রিপোর্ট, ক্রয় রসিদ, আধার কার্ড, ব্যাংক বিবরণ এবং বীমা পলিসি নথি।',
        default: 'হ্যালো! আমি ক্রপকেয়ার AI, আপনার কৃষি সহায়ক। আমি ফসল বীমা, চাষাবাদ পদ্ধতি, সরকারি পরিকল্পনা এবং কৃষি নির্দেশনায় সাহায্য করতে পারি। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?'
      },
      pa: {
        insurance: 'ਸਾਡਾ ਫਸਲ ਬੀਮਾ ਸੋਕਾ, ਕੀੜੇ, ਹੜ੍ਹ ਅਤੇ ਕੁਦਰਤੀ ਆਫਤਾਂ ਨੂੰ ਕਵਰ ਕਰਦਾ ਹੈ। ਸਹੀ ਦਸਤਾਵੇਜ਼ਾਂ ਅਤੇ ਮੁਲਾਂਕਣ ਰਿਪੋਰਟ ਦੇ ਨਾਲ ਆਸਾਨੀ ਨਾਲ ਦਾਅਵਾ ਦਾਇਰ ਕਰ ਸਕਦੇ ਹੋ।',
        claim: 'ਬੀਮਾ ਦਾਅਵਾ ਕਰਨ ਲਈ: ੧) ੭ ਦਿਨਾਂ ਵਿੱਚ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਕਰੋ, ੨) ਖਰਾਬ ਫਸਲਾਂ ਦੀਆਂ ਫੋਟੋਆਂ ਜਮ੍ਹਾਂ ਕਰੋ, ੩) ਸਰਕਾਰੀ ਮੁਲਾਂਕਣ ਕਰਵਾਓ, ੪) ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼ਾਂ ਨਾਲ ਸਥਾਨਕ ਬੀਮਾ ਏਜੰਟ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
        documents: 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼: ਜ਼ਮੀਨ ਮਾਲਕੀ ਦਾ ਸਬੂਤ, ਫਸਲ ਨੁਕਸਾਨ ਮੁਲਾਂਕਣ ਰਿਪੋਰਟ, ਖਰੀਦਦਾਰੀ ਰਸੀਦਾਂ, ਆਧਾਰ ਕਾਰਡ, ਬੈਂਕ ਵਿਵਰਣ ਅਤੇ ਬੀਮਾ ਪਾਲਿਸੀ ਦਸਤਾਵੇਜ਼।',
        default: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਾਪਕੇਅਰ AI ਹਾਂ, ਤੁਹਾਡਾ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ। ਮੈਂ ਫਸਲ ਬੀਮਾ, ਖੇਤੀ ਦੇ ਤਰੀਕੇ, ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਅਤੇ ਖੇਤੀਬਾੜੀ ਮਾਰਗਦਰਸ਼ਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?'
      },
      ta: {
        insurance: 'எங்கள் பயிர் காப்பீடு வறட்சி, பூச்சிகள், வெள்ளம் மற்றும் இயற்கை பேரிடர்களை உள்ளடக்குகிறது. சரியான ஆவணங்கள் மற்றும் மதிப்பீட்டு அறிக்கையுடன் எளிதாக உரிமைகோரலாம்.',
        claim: 'காப்பீடு கோர: 1) 7 நாட்களுக்குள் சேதத்தைப் புகாரளிக்கவும், 2) சேதமடைந்த பயிர்களின் புகைப்படங்களைச் சமர்ப்பிக்கவும், 3) அதிகாரப்பூர்வ மதிப்பீட்டைப் பெறவும், 4) தேவையான ஆவணங்களுடன் உள்ளூர் காப்பீட்டு முகவரைத் தொடர்பு கொள்ளவும்.',
        documents: 'தேவையான ஆவணங்கள்: நில உரிமை சான்று, பயிர் சேத மதிப்பீட்டு அறிக்கை, கொள்முதல் ரசீதுகள், ஆதார் அட்டை, வங்கி விவரங்கள் மற்றும் காப்பீட்டு பாலிசி ஆவணங்கள்.',
        default: 'வணக்கம்! நான் க்ராப்கேர் AI, உங்கள் விவசாய உதவியாளர். பயிர் காப்பீடு, விவசாய நடைமுறைகள், அரசாங்க திட்டங்கள் மற்றும் விவசாய வழிகாட்டுதலில் நான் உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?'
      }
    };
    
    const langResponses = responses[lang] || responses.en;
    
    const q_lower = q.toLowerCase();
    if (q_lower.includes('insurance') || q_lower.includes('बीमा') || q_lower.includes('विमा') || q_lower.includes('বীমা') || q_lower.includes('ਬੀਮਾ') || q_lower.includes('காப்பீடு')) {
      return langResponses.insurance;
    } else if (q_lower.includes('claim') || q_lower.includes('दावा') || q_lower.includes('दाबी') || q_lower.includes('দাবি') || q_lower.includes('ਦਾਅਵਾ') || q_lower.includes('கோர')) {
      return langResponses.claim;
    } else if (q_lower.includes('document') || q_lower.includes('दस्तावेज') || q_lower.includes('कागदपत्रे') || q_lower.includes('নথি') || q_lower.includes('ਦਸਤਾਵੇਜ਼') || q_lower.includes('ஆவணங்கள்')) {
      return langResponses.documents;
    }
    return langResponses.default;
  };

  const animateSend = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(handleSend);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowSuggestions(false);
    // Scroll to show input on focus if needed
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 100);
  };

  // Theme colors based on dark mode
  const theme = {
    bg: darkMode ? '#0B0F0C' : '#F5F5F5',
    headerBg: darkMode ? '#121212' : '#4CAF50',
    text: darkMode ? '#FFFFFF' : '#333333',
    accent: darkMode ? '#4CAF50' : '#2E7D32',
    inputBg: darkMode ? '#1e1e1e' : '#FFFFFF',
    inputBorder: darkMode ? '#66BB6A' : '#4CAF50',
    cardBg: darkMode ? '#1C1C1C' : '#FFFFFF',
    userBubble: darkMode ? '#2E7D32' : '#E8F5E9',
    botBubble: darkMode ? '#1C1C1C' : '#F1F1F1',
    secondaryText: darkMode ? '#aaa' : '#757575',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.headerBg}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.title, { color: darkMode ? '#4CAF50' : '#FFFFFF' }]}>
          {t.botName} {LANGUAGES[language].flag}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setDarkMode(!darkMode)}
          >
            <MaterialIcons 
              name={darkMode ? 'wb-sunny' : 'nights-stay'} 
              size={isSmallScreen ? 20 : 24} 
              color={darkMode ? '#FFC107' : '#FFF'} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setSettingsVisible(true)}
          >
            <MaterialIcons 
              name="settings" 
              size={isSmallScreen ? 20 : 24} 
              color={darkMode ? '#FFFFFF' : '#FFFFFF'} 
            />
          </TouchableOpacity>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/2909/2909767.png',
            }}
            style={[styles.logo, { 
              width: isSmallScreen ? 28 : 36, 
              height: isSmallScreen ? 28 : 36 
            }]}
          />
        </View>
      </View>

      {/* Menu Tabs */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={[
            styles.menuButton, 
            !showHistory && styles.menuActive,
            { backgroundColor: !showHistory ? theme.accent : (darkMode ? '#333333' : '#DFDFDF') }
          ]}
          onPress={() => setShowHistory(false)}
        >
          <Text style={[styles.menuText, { color: theme.text }]}>{t.chat}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.menuButton, 
            showHistory && styles.menuActive,
            { backgroundColor: showHistory ? theme.accent : (darkMode ? '#333333' : '#DFDFDF') }
          ]}
          onPress={() => setShowHistory(true)}
        >
          <Text style={[styles.menuText, { color: theme.text }]}>{t.history}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: darkMode ? '#333333' : '#DFDFDF' }]}
          onPress={() => {
            setChatHistory([]);
            setShowWelcome(true);
            setShowSuggestions(true);
          }}
        >
          <Text style={[styles.menuText, { color: theme.text }]}>{t.clear}</Text>
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      <View style={[
        styles.contentContainer, 
        { 
          paddingBottom: isKeyboardVisible ? 80 : (!showHistory ? 100 : 20)
        }
      ]}>
        {/* Welcome Message */}
        {showWelcome && (
          <Animated.View
            style={[
              styles.welcomeBox,
              { 
                opacity: fadeAnim, 
                transform: [{ scale: welcomeAnim }],
                backgroundColor: darkMode ? '#1e1e1e' : '#E8F5E9' 
              },
            ]}
          >
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              {t.welcome}
            </Text>
          </Animated.View>
        )}

        {/* Speech Processing Indicator */}
        {isProcessingSpeech && (
          <View style={[styles.processingContainer, { backgroundColor: theme.cardBg }]}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.processingText, { color: theme.text }]}>
              {t.processing}
            </Text>
          </View>
        )}

        {/* Quick Replies */}
        {!showHistory && showSuggestions && !isKeyboardVisible && (
          <View style={styles.suggestions}>
            {t.suggestions.map((text, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setQuery(text)}
                style={[
                  styles.suggestionButton,
                  { 
                    backgroundColor: darkMode ? '#1e1e1e' : '#E8F5E9',
                    borderColor: theme.accent
                  }
                ]}
              >
                <Text style={[styles.suggestionText, { color: theme.accent }]}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          style={styles.chatList}
          data={chatHistory}
          inverted
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View 
              style={[
                item.user === 'You' ? styles.userBubble : styles.botBubble,
                { 
                  backgroundColor: item.user === 'You' 
                    ? theme.userBubble 
                    : theme.botBubble
                }
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={[styles.sender, { color: item.user === 'You' ? theme.text : theme.accent }]}>
                  {item.user}
                </Text>
                <Text style={[styles.time, { color: theme.secondaryText }]}>{item.time}</Text>
              </View>
              <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>
              
              {/* Voice playback for bot messages */}
              {item.user === 'Bot' && (
                <TouchableOpacity 
                  style={styles.audioButton}
                  onPress={() => {
                    if (isPlayingResponse) {
                      stopSpeaking();
                    } else {
                      speakResponse(item.message);
                    }
                  }}
                >
                  <MaterialIcons 
                    name={isPlayingResponse ? "stop" : "volume-up"} 
                    size={16} 
                    color={theme.accent} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListHeaderComponent={
            botTyping ? (
              <View style={[styles.typingContainer, { backgroundColor: theme.botBubble }]}>
                <Text style={[styles.typingText, { color: theme.secondaryText }]}>
                  {t.typing}
                </Text>
                <ActivityIndicator size="small" color={theme.accent} style={styles.typingIndicator} />
              </View>
            ) : null
          }
          contentContainerStyle={styles.chatListContent}
        />
      </View>

      {/* Chat Input with Enhanced Voice Features */}
      {!showHistory && (
        <Animated.View style={[
          styles.inputWrapper,
          { 
            transform: [{ translateY: inputContainerAnim }],
            backgroundColor: theme.bg 
          }
        ]}>
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: darkMode ? '#121212' : '#F5F5F5', 
              borderColor: darkMode ? '#333333' : '#DFDFDF',
            }
          ]}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }
              ]}
              value={query}
              onChangeText={setQuery}
              placeholder={speechToTextEnabled && !query ? t.tapToSpeak : t.inputPlaceholder}
              placeholderTextColor={darkMode ? '#888' : '#AAA'}
              multiline
              maxLength={500}
              onFocus={handleInputFocus}
              textAlignVertical="center"
              blurOnSubmit={false}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            
            {/* Enhanced Voice Input Button */}
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={[
                styles.voiceButton,
                { 
                  backgroundColor: isRecording ? '#FF5252' : (speechToTextEnabled ? theme.accent : theme.inputBg),
                  borderColor: speechToTextEnabled ? theme.accent : theme.secondaryText
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: micAnim }] }}>
                {isProcessingSpeech ? (
                  <ActivityIndicator size={isSmallScreen ? 16 : 20} color="#FFFFFF" />
                ) : (
                  <FontAwesome5 
                    name={isRecording ? "stop" : "microphone"} 
                    size={isSmallScreen ? 16 : 20} 
                    color={isRecording ? '#FFFFFF' : (speechToTextEnabled ? '#FFFFFF' : theme.secondaryText)} 
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
            
            {/* Send button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                onPress={animateSend} 
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: query.trim() ? theme.accent : (darkMode ? '#444' : '#CCC'),
                    opacity: query.trim() ? 1 : 0.6
                  }
                ]}
                disabled={query.trim() === ''}
              >
                <Text style={styles.sendText}>{t.send}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* Voice Recording Status */}
          {isRecording && (
            <View style={[styles.recordingStatus, { backgroundColor: theme.cardBg }]}>
              <View style={styles.recordingIndicator} />
              <Text style={[styles.recordingText, { color: theme.text }]}>
                {t.listening}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Updated Settings Modal (No API Key Section) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.accent }]}>{t.languageSettings}</Text>
              
              <View style={[
                styles.pickerContainer, 
                { 
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder
                }
              ]}>
                <Picker
                  selectedValue={language}
                  onValueChange={(value) => setLanguage(value)}
                  style={[styles.picker, { color: theme.text }]}
                  dropdownIconColor={theme.text}
                >
                  {Object.values(LANGUAGES).map((lang) => (
                    <Picker.Item 
                      key={lang.code} 
                      label={`${lang.flag} ${lang.name}`} 
                      value={lang.code} 
                    />
                  ))}
                </Picker>
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>{t.voiceAssistant}</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    { backgroundColor: isVoiceMode ? theme.accent : (darkMode ? '#444' : '#DDD') }
                  ]}
                  onPress={() => setIsVoiceMode(!isVoiceMode)}
                >
                  <Animated.View 
                    style={[
                      styles.switchThumb,
                      { 
                        transform: [{ translateX: isVoiceMode ? 20 : 0 }],
                        backgroundColor: theme.text 
                      }
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.switchContainer}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>{t.speechToText}</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    { backgroundColor: speechToTextEnabled ? theme.accent : (darkMode ? '#444' : '#DDD') }
                  ]}
                  onPress={() => setSpeechToTextEnabled(!speechToTextEnabled)}
                >
                  <Animated.View 
                    style={[
                      styles.switchThumb,
                      { 
                        transform: [{ translateX: speechToTextEnabled ? 20 : 0 }],
                        backgroundColor: theme.text 
                      }
                    ]}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: darkMode ? '#444' : '#EEE' }]}
                  onPress={() => setSettingsVisible(false)}
                >
                  <Text style={[styles.buttonText, { color: darkMode ? '#FFF' : '#333' }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.accent }]}
                  onPress={saveSettings}
                >
                  <Text style={styles.buttonText}>{t.saveSettings}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F0C',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    paddingHorizontal: 15,
    paddingVertical: isSmallScreen ? 8 : 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    minHeight: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 60,
  },
  title: {
    fontSize: isSmallScreen ? 18 : 22,
    color: '#4CAF50',
    fontWeight: 'bold',
    flex: 1,
  },
  logo: {
    width: isSmallScreen ? 28 : 36,
    height: isSmallScreen ? 28 : 36,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 15,
    padding: 5,
  },
  menu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: isSmallScreen ? 8 : 10,
    paddingHorizontal: 10,
  },
  menuButton: {
    backgroundColor: '#333333',
    paddingVertical: isSmallScreen ? 6 : 8,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    borderRadius: 20,
  },
  menuActive: {
    backgroundColor: '#4CAF50',
  },
  menuText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  welcomeBox: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 15,
    alignSelf: 'center',
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1C1C1C',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  processingText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 14,
    fontStyle: 'italic',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  chatListContent: {
    paddingBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2E7D32',
    marginVertical: 4,
    padding: 12,
    borderRadius: 15,
    maxWidth: '75%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1C',
    marginVertical: 4,
    padding: 12,
    borderRadius: 15,
    maxWidth: '75%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sender: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  message: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 14 : 15,
    lineHeight: isSmallScreen ? 18 : 20,
  },
  time: {
    color: '#aaa',
    fontSize: 10,
    textAlign: 'right',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1C',
    marginVertical: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginHorizontal: 10,
  },
  typingText: {
    color: '#888',
    fontStyle: 'italic',
    marginRight: 8,
    fontSize: isSmallScreen ? 12 : 14,
  },
  typingIndicator: {
    marginLeft: 5,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#121212',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: isSmallScreen ? 14 : 16,
    borderWidth: 1.5,
    borderColor: '#66BB6A',
    marginRight: 10,
    color: '#ffffff',
    maxHeight: 120,
    minHeight: 44,
  },
  voiceButton: {
    backgroundColor: '#4CAF50',
    padding: isSmallScreen ? 8 : 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#66BB6A',
    justifyContent: 'center',
    alignItems: 'center',
    width: isSmallScreen ? 40 : 44,
    height: isSmallScreen ? 40 : 44,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: isSmallScreen ? 40 : 44,
  },
  sendText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 14 : 16,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginRight: 8,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  suggestionButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  suggestionText: {
    color: '#4CAF50',
    fontSize: isSmallScreen ? 12 : 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#66BB6A',
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: '#121212',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  switchLabel: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#FFFFFF',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 14 : 16,
  },
  audioButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
    padding: 5,
  },
});