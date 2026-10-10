import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { CropHealth, CropDoctorDiagnosis, CropInvestigatorQuestion, CropInvestigationTurn, Language } from '../../types';
import { translations } from '../../i18n/translations';
import { CropHealthService, type CropDiagnosisHistoryItem } from '../../services/crop/cropHealthService';
import { SpeechService } from '../../services/voice/speechService';
import { localizeCropName, localizeDiagnosisTitle, formatRelativeDateLocalized } from '../../i18n/agriLocalization';
import { 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  X, 
  Mic, 
  Square, 
  Plus, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  Maximize2,
  History,
  RefreshCw,
  Clock,
  ShieldCheck,
  Send,
  Check,
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';

interface CropHealthCardProps {
  crops: CropHealth[];
  currentLang: Language;
  onCropUpdate?: (updated: CropHealth) => void;
  style?: React.CSSProperties;
  isHomeWidget?: boolean;
  onNavigateToDoctor?: () => void;
}

interface MismatchErrorData {
  notice: string;
  selectedCrop: string;
  visualCrop: string;
  voiceCrop?: string | null;
}

type ConsultationStep = 'idle' | 'investigating' | 'consulting' | 'analyzing_answer' | 'final_analyzing' | 'result' | 'mismatch';

export const CropHealthCard: React.FC<CropHealthCardProps> = ({
  crops,
  currentLang,
  style,
  isHomeWidget = false,
  onNavigateToDoctor,
}) => {
  const t = translations[currentLang];
  
  // History list from Supabase
  const [historyList, setHistoryList] = useState<CropDiagnosisHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isHistoricalView, setIsHistoricalView] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'failed' | null>('saved');
  
  // Multimodal Inputs
  const [selectedImages, setSelectedImages] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [analyzedImagesList, setAnalyzedImagesList] = useState<Array<{ previewUrl: string; name: string }>>([]);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; index: number } | null>(null);

  // Voice Recording & Live Speech Recognition (Entry Form)
  const [isRecording, setIsRecording] = useState(false);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>('');
  const [liveFinalTranscript, setLiveFinalTranscript] = useState<string>('');
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [voiceTranscriptText, setVoiceTranscriptText] = useState<string>('');
  const [selectedCropName, setSelectedCropName] = useState<string>(crops[0]?.cropName || 'Paddy');

  // Text to Speech (Read Aloud)
  const [speakingSection, setSpeakingSection] = useState<string | null>(null);

  // 2-Stage Guided Consultation State
  const [consultationStep, setConsultationStep] = useState<ConsultationStep>('idle');
  const [questionsQueue, setQuestionsQueue] = useState<CropInvestigatorQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<(CropInvestigatorQuestion & { questionIndex: number; totalQuestions?: number }) | null>(null);
  const [consultationQnA, setConsultationQnA] = useState<CropInvestigationTurn[]>([]);
  
  // Question Voice Recording & Transcription State
  const [isRecordingQuestion, setIsRecordingQuestion] = useState<boolean>(false);
  const [isTranscribingQuestion, setIsTranscribingQuestion] = useState<boolean>(false);
  const [questionTranscript, setQuestionTranscript] = useState<string>('');
  const [isTypingQuestion, setIsTypingQuestion] = useState<boolean>(false);
  const [typedQuestionAnswer, setTypedQuestionAnswer] = useState<string>('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);

  // Loading & Diagnostics
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<CropDoctorDiagnosis | null>(null);
  const [mismatchError, setMismatchError] = useState<MismatchErrorData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const questionMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const questionAudioChunksRef = useRef<Blob[]>([]);
  const questionSpeechRecRef = useRef<any>(null);

  // Track all active object URLs in a ref so they are never prematurely revoked on re-renders
  const activeObjectUrlsRef = useRef<Set<string>>(new Set());

  const createTrackedObjectURL = useCallback((blobOrFile: Blob | File): string => {
    const url = URL.createObjectURL(blobOrFile);
    activeObjectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedObjectURL = useCallback((url: string | null | undefined) => {
    if (url && activeObjectUrlsRef.current.has(url)) {
      activeObjectUrlsRef.current.delete(url);
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Clean up object URLs and speech ONLY when component unmounts
  useEffect(() => {
    return () => {
      activeObjectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      });
      activeObjectUrlsRef.current.clear();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync selectedCropName when crops list updates
  useEffect(() => {
    if (crops.length > 0 && !crops.some(c => c.cropName.toLowerCase() === selectedCropName.toLowerCase())) {
      setSelectedCropName(crops[0].cropName);
    }
  }, [crops, selectedCropName]);

  const stopAllSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingSection(null);
    }
  }, []);

  // Load history from Supabase
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const items = await CropHealthService.getDiagnosisHistory();
      setHistoryList(items || []);
    } catch (err) {
      console.warn('[CropDoctor] History fetch error:', err);
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!isHomeWidget) {
      loadHistory();
    }
  }, [isHomeWidget, loadHistory]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - selectedImages.length;
    const newFiles = Array.from(files).slice(0, remainingSlots);

    const newItems = newFiles.map(file => ({
      file,
      previewUrl: createTrackedObjectURL(file),
    }));

    setSelectedImages(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => {
      const target = prev[index];
      if (target?.previewUrl) {
        revokeTrackedObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Live Speech Recognition + MediaRecorder Voice Handlers
  const startVoiceRecording = async () => {
    if (isRecording) return;
    setLiveInterimTranscript('');
    setLiveFinalTranscript('');
    stopAllSpeech();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const aUrl = createTrackedObjectURL(audioBlob);
        setRecordedAudioUrl(aUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLang === 'te' ? 'te-IN' : (currentLang === 'hi' ? 'hi-IN' : 'en-IN');

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setLiveFinalTranscript(prev => (prev + final).trim());
          }
          setLiveInterimTranscript(interim);
          const fullText = (liveFinalTranscript + ' ' + final + ' ' + interim).trim();
          setVoiceTranscriptText(fullText);
        };

        recognition.onerror = (event: any) => {
          console.warn('[CropDoctor] Live speech recognition notice:', event.error);
        };

        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (rErr) {
          console.warn('[CropDoctor] Recognition start fallback:', rErr);
        }
      }
    } catch (err) {
      console.warn('[CropDoctor] Mic access notice:', err);
      alert('Microphone access is needed to record your voice description.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore already stopped
      }
      speechRecognitionRef.current = null;
    }
  };

  const clearVoiceRecording = () => {
    if (recordedAudioUrl) revokeTrackedObjectURL(recordedAudioUrl);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setVoiceTranscriptText('');
    setLiveInterimTranscript('');
    setLiveFinalTranscript('');
  };

  const playRecordedAudio = () => {
    if (recordedAudioUrl && audioPlayerRef.current) {
      audioPlayerRef.current.play();
    }
  };

  // Text to Speech handler
  const handleSpeakText = (sectionKey: string, textToSpeak: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingSection === sectionKey) {
      stopAllSpeech();
      return;
    }

    stopAllSpeech();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = currentLang === 'te' ? 'te-IN' : (currentLang === 'hi' ? 'hi-IN' : 'en-IN');
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const targetLangPrefix = currentLang === 'te' ? 'te' : (currentLang === 'hi' ? 'hi' : 'en');
    const matchedVoice = voices.find(v => v.lang.startsWith(targetLangPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setSpeakingSection(null);
    utterance.onerror = () => setSpeakingSection(null);

    setSpeakingSection(sectionKey);
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenHistoricalItem = async (item: CropDiagnosisHistoryItem) => {
    stopAllSpeech();
    setIsAnalyzing(true);
    try {
      const full = await CropHealthService.getDiagnosisById(item.id);
      if (full && full.diagnosis) {
        setDiagnosisResult(full.diagnosis);
        setIsHistoricalView(true);
        setSaveStatus('saved');
        setMismatchError(null);
        const imagesToLoad = (full.images && full.images.length > 0)
          ? full.images
          : (item.signedImages && item.signedImages.length > 0)
            ? item.signedImages
            : (item.thumbnailSignedUrl ? [{ previewUrl: item.thumbnailSignedUrl, name: 'Photo #1' }] : []);

        if (imagesToLoad.length > 0) {
          setAnalyzedImagesList(imagesToLoad.map((img: any, idx: number) => ({
            previewUrl: img.previewUrl || img.signedUrl || img.url || '',
            name: img.name || `Photo #${idx + 1}`
          })));
          setActiveImageIdx(0);
        } else {
          setAnalyzedImagesList([]);
        }

        // Scroll up smoothly to view the diagnosis result
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(t.dataUnavailable || 'Data unavailable');
      }
    } catch (err) {
      console.error('[CropDoctor] Failed to open historical record:', err);
      alert(t.dataUnavailable || 'Data unavailable');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Question Voice Recording Handlers
  const startQuestionVoiceRecording = async () => {
    if (isRecordingQuestion) return;
    setQuestionTranscript('');
    stopAllSpeech();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      questionAudioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          questionAudioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(questionAudioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribingQuestion(true);
        try {
          const res = await SpeechService.transcribeAudioBlob(audioBlob, currentLang);
          if (res.text && res.text.trim().length > 0) {
            setQuestionTranscript(res.text.trim());
          }
        } catch (tErr) {
          console.warn('[CropDoctor] Question Whisper error:', tErr);
        } finally {
          setIsTranscribingQuestion(false);
        }
      };

      recorder.start();
      questionMediaRecorderRef.current = recorder;
      setIsRecordingQuestion(true);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLang === 'te' ? 'te-IN' : (currentLang === 'hi' ? 'hi-IN' : 'en-IN');

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; ++i) {
            text += event.results[i][0].transcript + ' ';
          }
          if (text.trim().length > 0) {
            setQuestionTranscript(text.trim());
          }
        };

        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (rErr) {
          console.warn('[CropDoctor] Web speech start fallback:', rErr);
        }
      }
    } catch (err) {
      console.warn('[CropDoctor] Question mic access error:', err);
      setIsTypingQuestion(true);
    }
  };

  const stopQuestionVoiceRecording = () => {
    if (!isRecordingQuestion) return;
    setIsRecordingQuestion(false);

    if (questionSpeechRecRef.current) {
      try {
        questionSpeechRecRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (questionMediaRecorderRef.current && questionMediaRecorderRef.current.state !== 'inactive') {
      try {
        questionMediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('[CropDoctor] Stop question recorder error:', e);
      }
    }
  };

  // Run Stage 1 AI Investigation
  const handleRunAnalysis = async () => {
    if (selectedImages.length === 0) {
      setErrorMessage(currentLang === 'te' ? 'దయచేసి కనీసం ఒక పంట ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి.' : (currentLang === 'hi' ? 'कृपया कम से कम एक फसल की तस्वीर लें या अपलोड करें।' : 'Please take or upload at least one photo of the affected plant or leaf.'));
      return;
    }

    stopAllSpeech();
    setIsAnalyzing(true);
    setConsultationStep('investigating');
    setErrorMessage(null);
    setMismatchError(null);
    setDiagnosisResult(null);
    setIsHistoricalView(false);
    setConsultationQnA([]);
    setCurrentQuestion(null);
    setQuestionTranscript('');
    setIsTypingQuestion(false);
    setTypedQuestionAnswer('');

    setAnalyzedImagesList(selectedImages.map(img => ({ previewUrl: img.previewUrl, name: img.file.name })));
    setActiveImageIdx(0);

    const result = await CropHealthService.investigateCrop({
      images: selectedImages.map(item => item.file),
      audioBlob: recordedAudioBlob,
      voiceText: voiceTranscriptText,
      cropName: selectedCropName,
      language: currentLang,
      conversationHistory: [],
    });

    const isMismatchDetected = 
      result.status === 'mismatch' ||
      result.state === 'mismatch' ||
      Boolean(result.cropMismatchDetected) ||
      Boolean(result.mismatchNotice);

    if (isMismatchDetected) {
      setIsAnalyzing(false);
      setConsultationStep('mismatch');
      setDiagnosisResult(null);
      setSaveStatus(null);
      setMismatchError({
        notice: result.mismatchNotice || result.explanation || result.message || (
          currentLang === 'te'
            ? `పంట వివరాలలో తేడా గుర్తించబడింది: మీరు ఎంచుకున్న పంట '${result.selectedCrop || selectedCropName}', కానీ ఫోటోలలో ఇతర వివరాలు ఉన్నాయి. దయచేసి సరిచూసి మళ్లీ విశ్లేషించండి.`
            : 'Crop mismatch detected between selected crop, photos, and voice description. Please recheck and analyze again.'
        ),
        selectedCrop: result.selectedCrop || selectedCropName,
        visualCrop: result.visualCropIdentified || (currentLang === 'te' ? 'వేరే చిత్రం' : 'Unrelated photo'),
        voiceCrop: result.voiceCropMentioned || null,
      });
      return;
    }

    if (result.state === 'insufficient_image') {
      setIsAnalyzing(false);
      setConsultationStep('idle');
      setErrorMessage(result.explanation || (currentLang === 'te' ? 'ఫోటో నాణ్యత తగినంతగా లేదు. దయచేసి స్పష్టమైన పంట ఫోటో తీయండి.' : 'Photo is unclear or not a plant photo. Please take a clearer crop photo.'));
      return;
    }

    const qList = (result.questions && result.questions.length > 0)
      ? result.questions
      : (result.question && result.question.text ? [result.question] : []);

    if (result.state === 'needs_farmer_input' && qList.length > 0) {
      setIsAnalyzing(false);
      setConsultationStep('consulting');
      setQuestionsQueue(qList);
      setCurrentQuestionIndex(0);
      setCurrentQuestion({
        ...qList[0],
        questionIndex: 1,
        totalQuestions: qList.length,
      });
      return;
    }

    await runFinalDiagnosis([]);
  };

  const handleSubmitQuestionAnswer = async (
    answerText: string,
    answerType: 'voice' | 'text' | 'unknown' = 'voice'
  ) => {
    if (isSubmittingAnswer || !currentQuestion) return;
    setIsSubmittingAnswer(true);
    stopAllSpeech();

    const cleanAnswer = answerText?.trim() || (answerType === 'unknown' ? (t.dontKnowBtn || "I don't know") : '');
    if (!cleanAnswer) {
      setIsSubmittingAnswer(false);
      return;
    }

    const newTurn: CropInvestigationTurn = {
      questionText: currentQuestion.text,
      questionReason: currentQuestion.reason,
      answerText: cleanAnswer,
      answerType,
      language: currentLang,
    };

    const updatedQnA = [...consultationQnA, newTurn];
    setConsultationQnA(updatedQnA);
    
    setQuestionTranscript('');
    setIsTypingQuestion(false);
    setTypedQuestionAnswer('');
    setIsSubmittingAnswer(false);

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < questionsQueue.length && updatedQnA.length < 3) {
      setCurrentQuestionIndex(nextIdx);
      setCurrentQuestion({
        ...questionsQueue[nextIdx],
        questionIndex: nextIdx + 1,
        totalQuestions: questionsQueue.length,
      });
      return;
    }

    await runFinalDiagnosis(updatedQnA);
  };

  const runFinalDiagnosis = async (finalQnA: CropInvestigationTurn[]) => {
    setIsAnalyzing(true);
    setConsultationStep('final_analyzing');
    setCurrentQuestion(null);

    const result = await CropHealthService.diagnoseCropMultimodal({
      images: selectedImages.map(item => item.file),
      audioBlob: recordedAudioBlob,
      voiceText: voiceTranscriptText,
      cropName: selectedCropName,
      language: currentLang,
      consultationQnA: finalQnA,
    });

    setIsAnalyzing(false);

    if (result.status === 'mismatch' || Boolean(result.cropMismatchDetected)) {
      setConsultationStep('mismatch');
      setDiagnosisResult(null);
      setSaveStatus(null);
      setMismatchError({
        notice: result.mismatchNotice || result.diagnosis?.mismatchNotice || (
          currentLang === 'te'
            ? `పంట వివరాలలో తేడా గుర్తించబడింది. దయచేసి వివరాలను సరిచూసి మళ్లీ విశ్లేషించండి.`
            : 'Crop mismatch detected between selected crop, photos, and voice description.'
        ),
        selectedCrop: result.selectedCrop || selectedCropName,
        visualCrop: result.visualCropIdentified || (currentLang === 'te' ? 'వేరే చిత్రం' : 'Unrelated photo'),
        voiceCrop: result.voiceCropMentioned || null,
      });
      return;
    }

    if (result.status === 'success' && result.diagnosis) {
      setMismatchError(null);
      setDiagnosisResult({
        ...result.diagnosis,
        consultationQnA: result.diagnosis.consultationQnA || finalQnA,
      });
      setConsultationStep('result');
      setSaveStatus('saved');
      loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSaveStatus('failed');
      setConsultationStep('idle');
      setErrorMessage(result.message || (currentLang === 'te' ? 'పంట విశ్లేషణ తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Crop Doctor analysis is temporarily unavailable. Please try again.'));
    }
  };

  const handleResetToNewUpload = () => {
    stopAllSpeech();
    selectedImages.forEach(img => revokeTrackedObjectURL(img.previewUrl));
    setSelectedImages([]);
    setAnalyzedImagesList([]);
    clearVoiceRecording();
    setDiagnosisResult(null);
    setMismatchError(null);
    setErrorMessage(null);
    setLightboxImage(null);
    setIsHistoricalView(false);
    setConsultationStep('idle');
    setCurrentQuestion(null);
    setConsultationQnA([]);
    setQuestionTranscript('');
    setIsTypingQuestion(false);
    setTypedQuestionAnswer('');
    setIsSubmittingAnswer(false);
  };

  const handleSpeakFullAssessment = () => {
    if (!diagnosisResult) return;

    const sections = [
      diagnosisResult.diagnosisTitle,
      diagnosisResult.summary,
      diagnosisResult.visualFindings.length > 0 ? `${t.whatISawInPhotos}: ${diagnosisResult.visualFindings.join('. ')}` : '',
      diagnosisResult.combinedAssessment ? `${t.togetherCombined}: ${diagnosisResult.combinedAssessment}` : '',
      diagnosisResult.recommendation.length > 0 ? `${t.whatYouShouldDo}: ${diagnosisResult.recommendation.join('. ')}` : '',
      diagnosisResult.whatToAvoid.length > 0 ? `${t.thingsToAvoid}: ${diagnosisResult.whatToAvoid.join('. ')}` : '',
      diagnosisResult.monitoringAdvice ? `${t.checkAgain}: ${diagnosisResult.monitoringAdvice}` : '',
    ].filter(Boolean).join('. ');

    handleSpeakText('global', sections);
  };

  const renderListenButton = (sectionKey: string, textToSpeak: string, variant: 'primary' | 'subtle' = 'subtle', customLabel?: string) => {
    if (!textToSpeak || !textToSpeak.trim()) return null;
    const isSpeaking = speakingSection === sectionKey;
    const isPrimary = variant === 'primary';
    
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSpeakText(sectionKey, textToSpeak);
        }}
        aria-label={isSpeaking ? (currentLang === 'te' ? 'ఆపండి' : 'Stop') : (currentLang === 'te' ? 'వినండి' : 'Listen')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: isSpeaking 
            ? 'var(--ag-color-primary-base)' 
            : (isPrimary ? '#FFFFFF' : 'var(--ag-color-primary-light)'),
          color: isSpeaking 
            ? '#FFFFFF' 
            : 'var(--ag-color-primary-dark)',
          border: isSpeaking 
            ? '1px solid var(--ag-color-primary-base)' 
            : '1px solid #86EFAC',
          borderRadius: 'var(--ag-radius-full)',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isSpeaking ? '0 2px 6px rgba(47, 125, 50, 0.2)' : 'none',
          flexShrink: 0,
        }}
      >
        {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
        <span>
          {isSpeaking 
            ? (currentLang === 'te' ? 'ఆపండి' : (currentLang === 'hi' ? 'रोकें' : 'Stop')) 
            : (customLabel || (currentLang === 'te' ? 'వినండి' : (currentLang === 'hi' ? 'सुनें' : 'Listen')))}
        </span>
      </button>
    );
  };

  const getEvidenceStrengthBadge = () => {
    if (!diagnosisResult) return null;
    const confidence = (diagnosisResult as any).evidenceAssessment?.photoCropAssessment?.identityConfidence ||
                       (diagnosisResult as any).evidenceQuality ||
                       (diagnosisResult.status === 'problem_detected' ? 'high' : 'medium');
    
    if (confidence === 'high' || confidence === 'strong') {
      return { label: t.evidenceStrong, color: '#166534', bg: '#DCFCE7', border: '#86EFAC' };
    } else if (confidence === 'medium' || confidence === 'moderate') {
      return { label: t.evidenceModerate, color: '#854D0E', bg: '#FEF9C3', border: '#FDE047' };
    } else {
      return { label: t.evidenceLimited, color: '#9A3412', bg: '#FFEDD5', border: '#FDBA74' };
    }
  };

  const getCropEmoji = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('chilli') || n.includes('మిరప') || n.includes('मिर्च')) return '🌶️';
    if (n.includes('cotton') || n.includes('పత్తి') || n.includes('कपास')) return '🌾';
    if (n.includes('maize') || n.includes('మొక్కజొన్న') || n.includes('मक्का')) return '🌽';
    if (n.includes('paddy') || n.includes('వరి') || n.includes('धान') || n.includes('rice')) return '🌾';
    if (n.includes('groundnut') || n.includes('వేరుశనగ') || n.includes('मूंगफली')) return '🥜';
    if (n.includes('red gram') || n.includes('కందులు') || n.includes('अरहर') || n.includes('tur')) return '🌱';
    if (n.includes('tomato') || n.includes('టమాట') || n.includes('टमाटर')) return '🍅';
    return '🌱';
  };

  const getLiveVoiceLabel = () => {
    switch (currentLang) {
      case 'te': return 'మీరు చెప్పింది';
      case 'hi': return 'आपने बताया';
      default: return 'You said';
    }
  };

  const getStatusBadge = (status: CropHealth['status']) => {
    switch (status) {
      case 'healthy':
        return {
          label: t.statusHealthy,
          icon: <CheckCircle size={14} />,
          bg: 'var(--ag-color-primary-light)',
          color: 'var(--ag-color-primary-dark)',
          border: '1px solid #A3D9A5',
        };
      case 'under_watch':
        return {
          label: t.statusUnderWatch,
          icon: <AlertTriangle size={14} />,
          bg: 'var(--ag-color-harvest-light)',
          color: 'var(--ag-color-warning-base)',
          border: '1px solid #FAD48C',
        };
      case 'attention':
      default:
        return {
          label: t.statusAttention,
          icon: <AlertOctagon size={14} />,
          bg: '#FDF0F0',
          color: 'var(--ag-color-danger-base)',
          border: '1px solid #F7B5B3',
        };
    }
  };

  // Annotations for active image in result
  const currentImageAnnotations = diagnosisResult?.visualAnnotations?.filter(
    (ann) => ann.imageIndex === activeImageIdx
  ) || [];

  // Farmer's active crops list + standard fallback crops
  const availableCropsList = [
    ...crops.map(c => c.cropName),
    'Paddy',
    'Cotton',
    'Red Gram',
    'Groundnut',
    'Maize',
    'Chilli'
  ].filter((val, idx, arr) => arr.indexOf(val) === idx);

  // =========================================================================
  // HOME SCREEN COMPACT WIDGET MODE
  // =========================================================================
  if (isHomeWidget) {
    return (
      <section 
        aria-labelledby="crop-health-heading" 
        style={{
          margin: '0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        <div style={{
          backgroundColor: 'var(--ag-color-surface-base)',
          borderRadius: 'var(--ag-radius-card)',
          border: '1px solid var(--ag-border-default)',
          padding: '20px',
          boxShadow: 'var(--ag-shadow-card)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Header & Diagnose CTA */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}>
              <h3 
                id="crop-health-heading"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--ag-color-text-secondary)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {t.cropHealthTitle}
              </h3>

              <button
                onClick={onNavigateToDoctor}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--ag-color-primary-light)',
                  color: 'var(--ag-color-primary-dark)',
                  border: '1px solid #A3D9A5',
                  padding: '8px 16px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                <Camera size={16} color="var(--ag-color-primary-base)" />
                <span>{t.diagnoseCta}</span>
              </button>
            </div>

            {/* Crops List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {crops.map((crop) => {
                const badge = getStatusBadge(crop.status);
                return (
                  <div 
                    key={crop.id}
                    style={{
                      backgroundColor: 'var(--ag-color-bg-base)',
                      borderRadius: 'var(--ag-radius-md)',
                      padding: '12px 14px',
                      border: '1px solid var(--ag-border-default)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}>
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                          {localizeCropName(crop.cropName, currentLang)}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', marginLeft: '6px' }}>
                          ({crop.acres} Acres · {crop.variety})
                        </span>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: badge.bg,
                        border: badge.border,
                        color: badge.color,
                        padding: '3px 8px',
                        borderRadius: 'var(--ag-radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {crop.diseaseIdentified && (
                      <p style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--ag-color-danger-base)',
                        marginBottom: '4px',
                      }}>
                        ⚠ {crop.diseaseIdentified}
                      </p>
                    )}

                    <p style={{
                      fontSize: '13px',
                      color: 'var(--ag-color-text-primary)',
                      lineHeight: 1.4,
                      marginBottom: '6px',
                    }}>
                      {crop.recommendedAction}
                    </p>

                    <div style={{
                      fontSize: '11px',
                      color: 'var(--ag-color-text-secondary)',
                    }}>
                      {t.lastChecked}: {crop.lastInspectionDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // DEDICATED FULL-PAGE CROP DOCTOR EXPERIENCE (Upload Top + Past History Below)
  // =========================================================================
  return (
    <section 
      aria-labelledby="crop-doctor-heading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        ...style,
      }}
    >
      {/* 1. Page Title & Guidance Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: 'var(--ag-color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #86EFAC',
            flexShrink: 0,
          }}>
            <Camera size={24} color="var(--ag-color-primary-base)" />
          </div>
          <div>
            <h2 
              id="crop-doctor-heading"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--ag-color-text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {currentLang === 'te' ? 'అగ్రిగైడ్ క్రాప్ డాక్టర్' : (currentLang === 'hi' ? 'एग्रीगाइड क्रॉप डॉक्टर' : 'AgriGuide Crop Doctor')}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', margin: '2px 0 0 0' }}>
              {currentLang === 'te' 
                ? 'పంట ఫోటోలు తీసి లేదా వాయిస్‌లో సమస్యను వివరించండి — తక్షణ విశ్లేషణ మరియు నివారణ సూచనలు పొందండి.' 
                : (currentLang === 'hi' 
                    ? 'फसल की तस्वीरें अपलोड करें या आवाज में बताएं — तुरंत बीमारी पहचान और उपचार सलाह पाएं।' 
                    : 'Upload crop photos or describe symptoms by voice for instant pest/disease diagnosis and treatment advice.')}
            </p>
          </div>
        </div>

        {diagnosisResult && (
          <button
            onClick={handleResetToNewUpload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--ag-radius-full)',
              backgroundColor: 'var(--ag-color-surface-base)',
              border: '1px solid var(--ag-border-default)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--ag-color-primary-base)',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <Plus size={16} />
            <span>{currentLang === 'te' ? 'కొత్త సమస్యను అప్‌లోడ్ చేయండి' : (currentLang === 'hi' ? 'नई समस्या अपलोड करें' : 'Upload New Problem')}</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP SECTION: DIRECT UPLOAD & DIAGNOSIS WORKSPACE                       */}
      {/* ========================================================================= */}
      <div 
        id="crop-doctor-workspace"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid var(--ag-border-default)',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* VIEW A: DIAGNOSIS RESULT (EITHER FRESHLY GENERATED OR OPENED FROM HISTORY) */}
        {diagnosisResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Top Bar: Save status & Voice read-aloud */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--ag-border-default)',
            }}>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: saveStatus === 'failed' ? '#FEF2F2' : '#DCFCE7',
                  color: saveStatus === 'failed' ? '#991B1B' : '#166534',
                  border: `1px solid ${saveStatus === 'failed' ? '#FCA5A5' : '#86EFAC'}`,
                  padding: '4px 12px',
                  borderRadius: 'var(--ag-radius-full)',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  <ShieldCheck size={14} />
                  {isHistoricalView 
                    ? (currentLang === 'te' ? 'గత విశ్లేషణ నివేదిక' : 'Historical Diagnosis Record') 
                    : (saveStatus === 'failed' ? t.assessmentSaveFailed : t.assessmentSaved)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleSpeakFullAssessment}
                  aria-label="Listen to full assessment"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: speakingSection === 'global' ? 'var(--ag-color-primary-base)' : 'var(--ag-color-primary-light)',
                    color: speakingSection === 'global' ? '#FFFFFF' : 'var(--ag-color-primary-dark)',
                    border: '1.5px solid #86EFAC',
                    padding: '8px 16px',
                    borderRadius: 'var(--ag-radius-full)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '40px',
                    boxShadow: '0 2px 6px rgba(47, 125, 50, 0.12)',
                  }}
                >
                  {speakingSection === 'global' ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{speakingSection === 'global' ? t.stopListening : t.listenAssessment}</span>
                </button>

                <button
                  onClick={handleResetToNewUpload}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--ag-color-surface-base)',
                    color: 'var(--ag-color-text-primary)',
                    border: '1px solid var(--ag-border-default)',
                    padding: '8px 14px',
                    borderRadius: 'var(--ag-radius-full)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '40px',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{currentLang === 'te' ? 'వేరే సమస్యను పరిశీలించండి' : (currentLang === 'hi' ? 'दूसरी समस्या जांचें' : 'Check Another Problem')}</span>
                </button>
              </div>
            </div>

            {/* Status Hero Card */}
            {(() => {
              const strength = getEvidenceStrengthBadge();
              const isProblem = diagnosisResult.status === 'problem_detected';
              const isHealthy = diagnosisResult.status === 'no_issue';
              const isUncertain = diagnosisResult.status === 'uncertain';
              const summaryText = `${diagnosisResult.diagnosisTitle}. ${isHealthy ? t.noObviousProblem : (isUncertain ? t.uncertainEvidenceMsg : diagnosisResult.summary)}`;

              return (
                <div style={{
                  backgroundColor: isProblem ? '#FEF2F2' : (isHealthy ? 'var(--ag-color-primary-light)' : '#FFFBEB'),
                  border: `1.5px solid ${isProblem ? '#FCA5A5' : (isHealthy ? '#86EFAC' : '#FDE68A')}`,
                  borderRadius: '16px',
                  padding: '18px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isProblem && <AlertOctagon size={20} color="#991B1B" />}
                      {isHealthy && <CheckCircle size={20} color="#166534" />}
                      {isUncertain && <HelpCircle size={20} color="#92400E" />}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isProblem ? '#991B1B' : (isHealthy ? '#166534' : '#92400E'),
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {isProblem ? t.possibleProblem : (isHealthy ? t.cropLooksHealthy : t.needClearerLook)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {strength && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 'var(--ag-radius-full)',
                          backgroundColor: strength.bg,
                          color: strength.color,
                          border: `1px solid ${strength.border}`,
                        }}>
                          {strength.label}
                        </span>
                      )}
                      {renderListenButton('summary', summaryText, 'primary')}
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: isProblem ? '#7F1D1D' : (isHealthy ? 'var(--ag-color-primary-dark)' : '#78350F'),
                    margin: '0 0 8px 0',
                    lineHeight: 1.3,
                  }}>
                    {getCropEmoji(diagnosisResult.selectedCrop)} {diagnosisResult.diagnosisTitle}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: isProblem ? '#991B1B' : (isHealthy ? '#14532D' : '#92400E'),
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {isHealthy ? t.noObviousProblem : (isUncertain ? t.uncertainEvidenceMsg : diagnosisResult.summary)}
                  </p>
                </div>
              );
            })()}

            {/* Findings & Photos Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: analyzedImagesList.length > 0 ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
              gap: '16px',
            }}>
              {/* Photo Evidence View */}
              {analyzedImagesList.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--ag-color-bg-base)',
                  borderRadius: '16px',
                  border: '1px solid var(--ag-border-default)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                        🌿 {t.whatISawInPhotos}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                        ({analyzedImagesList.length} {t.photosAnalyzed.toLowerCase()})
                      </span>
                    </div>

                    {diagnosisResult.visualFindings && diagnosisResult.visualFindings.length > 0 && (
                      renderListenButton('photos', `${t.whatISawInPhotos}: ${diagnosisResult.visualFindings.join('. ')}`)
                    )}
                  </div>

                  {analyzedImagesList.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {analyzedImagesList.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIdx(idx)}
                          aria-label={`View photo ${idx + 1}`}
                          style={{
                            position: 'relative',
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: activeImageIdx === idx ? '2.5px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                            padding: 0,
                            cursor: 'pointer',
                            flexShrink: 0,
                            backgroundColor: '#000',
                          }}
                        >
                          <img src={img.previewUrl} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '2px',
                            backgroundColor: 'rgba(0,0,0,0.65)',
                            color: '#FFF',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}>
                            #{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {analyzedImagesList[activeImageIdx] && (
                    <div 
                      onClick={() => setLightboxImage({ url: analyzedImagesList[activeImageIdx].previewUrl, index: activeImageIdx })}
                      style={{
                        position: 'relative',
                        width: '100%',
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: '4px 0',
                      }}
                    >
                      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', lineHeight: 0 }}>
                        <img 
                          src={analyzedImagesList[activeImageIdx].previewUrl} 
                          alt={`Crop View ${activeImageIdx + 1}`}
                          style={{ 
                            display: 'block',
                            maxWidth: '100%', 
                            maxHeight: '260px', 
                            width: 'auto', 
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '6px',
                          }}
                        />

                        {currentImageAnnotations.map((ann, aIdx) => (
                          <div
                            key={aIdx}
                            style={{
                              position: 'absolute',
                              left: `${ann.x}%`,
                              top: `${ann.y}%`,
                              width: `${ann.width}%`,
                              height: `${ann.height}%`,
                              border: '2.5px solid #EF4444',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              borderRadius: '4px',
                              pointerEvents: 'none',
                              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)',
                              boxSizing: 'border-box',
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: ann.y < 16 ? '100%' : '-22px',
                              left: '0',
                              backgroundColor: '#DC2626',
                              color: '#FFFFFF',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.2',
                              zIndex: 2,
                            }}>
                              {ann.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 600,
                        zIndex: 3,
                      }}>
                        <Maximize2 size={11} />
                        <span>{t.tapToEnlarge}</span>
                      </div>
                    </div>
                  )}

                  {diagnosisResult.visualFindings && diagnosisResult.visualFindings.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.45 }}>
                      {diagnosisResult.visualFindings.map((vf, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{vf}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Actionable Remedies Column */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                {/* Farmer description quote if present */}
                {(voiceTranscriptText || diagnosisResult.farmerReportedSymptoms.length > 0) && (
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1',
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mic size={14} color="var(--ag-color-primary-base)" />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                          {t.whatYouToldAgriGuide}
                        </span>
                      </div>
                      {renderListenButton('farmerQuote', `${t.whatYouToldAgriGuide}: ${voiceTranscriptText || diagnosisResult.farmerReportedSymptoms.join(' ')}`)}
                    </div>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                      "{voiceTranscriptText || diagnosisResult.farmerReportedSymptoms.join(' ')}"
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {diagnosisResult.recommendation && diagnosisResult.recommendation.length > 0 && (
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid var(--ag-border-default)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--ag-color-primary-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        margin: 0,
                      }}>
                        🎯 {t.whatYouShouldDo}
                      </h4>
                      {renderListenButton('remedies', `${t.whatYouShouldDo}: ${diagnosisResult.recommendation.join('. ')}`)}
                    </div>
                    <ol style={{
                      margin: 0,
                      paddingLeft: '18px',
                      fontSize: '13.5px',
                      color: 'var(--ag-color-text-primary)',
                      lineHeight: 1.5,
                    }}>
                      {diagnosisResult.recommendation.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Things to Avoid */}
                {diagnosisResult.whatToAvoid && diagnosisResult.whatToAvoid.length > 0 && (
                  <div style={{
                    backgroundColor: '#FFFBEB',
                    borderRadius: '12px',
                    border: '1px solid #FDE68A',
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                        🚫 {t.thingsToAvoid}
                      </div>
                      {renderListenButton('avoid', `${t.thingsToAvoid}: ${diagnosisResult.whatToAvoid.join('. ')}`)}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#B45309', lineHeight: 1.4 }}>
                      {diagnosisResult.whatToAvoid.map((avoid, idx) => (
                        <li key={idx} style={{ marginBottom: '3px' }}>{avoid}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monitoring Advice */}
                {diagnosisResult.monitoringAdvice && (
                  <div style={{
                    backgroundColor: 'var(--ag-color-bg-base)',
                    borderRadius: '12px',
                    border: '1px solid var(--ag-border-default)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ag-color-text-secondary)', textTransform: 'uppercase' }}>
                        🔍 {t.checkAgain}
                      </div>
                      {renderListenButton('monitoring', `${t.checkAgain}: ${diagnosisResult.monitoringAdvice}`)}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ag-color-text-primary)', lineHeight: 1.4 }}>
                      {diagnosisResult.monitoringAdvice}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isAnalyzing ? (
          /* VIEW B: PROGRESSIVE LOADING STATE */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 16px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              border: '4px solid var(--ag-color-primary-light)',
              borderTopColor: 'var(--ag-color-primary-base)',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px',
            }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ag-color-text-primary)', marginBottom: '8px' }}>
              {consultationStep === 'investigating' 
                ? t.investigatingPhotos 
                : (consultationStep === 'analyzing_answer' 
                    ? t.understandingAnswer 
                    : (consultationStep === 'final_analyzing' ? t.synthesizingDiagnosis : t.checkingCropAgain))}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ag-color-text-secondary)', maxWidth: '380px', lineHeight: 1.45 }}>
              {consultationStep === 'final_analyzing'
                ? (currentLang === 'te' ? 'ఫోటోలు మరియు మీరు చెప్పిన వివరాలను పరిశీలించి తుది విశ్లేషణను సిద్ధం చేస్తున్నాము...' : 'Reviewing photo evidence and consultation details...')
                : (currentLang === 'te' ? 'పంట చిత్రాలు మరియు సమాచారాన్ని పరిశీలిస్తున్నాము...' : (currentLang === 'hi' ? 'फसल की तस्वीरों और विवरणों का विश्लेषण किया जा रहा है...' : `Analyzing ${selectedImages.length} crop photo(s)...`))}
            </p>
          </div>
        ) : consultationStep === 'consulting' && currentQuestion ? (
          /* VIEW C: GUIDED CONSULTATION QUESTION INTERACTION */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--ag-color-bg-base)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--ag-border-default)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                }}>
                  {currentQuestion.questionIndex}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ag-color-text-primary)' }}>
                  {t.questionProgress.replace('{current}', String(currentQuestion.questionIndex))}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: step <= currentQuestion.questionIndex ? 'var(--ag-color-primary-base)' : '#CBD5E1',
                      transition: 'background-color 0.2s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid var(--ag-color-primary-base)',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 2px 10px rgba(47, 125, 50, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--ag-color-primary-base)" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.aiNoticedHeader}
                  </span>
                </div>
                {renderListenButton(
                  'crop_doctor_question',
                  currentQuestion.text,
                  'subtle',
                  currentLang === 'te' ? 'ప్రశ్న వినండి' : (currentLang === 'hi' ? 'सवाल सुनें' : 'Listen to question')
                )}
              </div>

              {currentQuestion.reason && (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ag-color-text-secondary)', lineHeight: 1.4 }}>
                  {currentQuestion.reason}
                </p>
              )}

              <h3 style={{
                margin: '4px 0 0 0',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--ag-color-text-primary)',
                lineHeight: 1.4,
              }}>
                "{currentQuestion.text}"
              </h3>
            </div>

            {/* Answer Input Section */}
            <div style={{
              backgroundColor: 'var(--ag-color-bg-base)',
              border: '1px solid var(--ag-border-default)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              {isTypingQuestion ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={typedQuestionAnswer}
                    onChange={(e) => setTypedQuestionAnswer(e.target.value)}
                    placeholder={t.typePlaceholder}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ag-border-default)',
                      fontSize: '14px',
                      color: 'var(--ag-color-text-primary)',
                      fontFamily: 'inherit',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleSubmitQuestionAnswer(typedQuestionAnswer, 'text')}
                      disabled={!typedQuestionAnswer.trim() || isSubmittingAnswer}
                      style={{
                        flex: 1,
                        minHeight: '46px',
                        backgroundColor: typedQuestionAnswer.trim() ? 'var(--ag-color-primary-base)' : '#94A3B8',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--ag-radius-md)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: typedQuestionAnswer.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Send size={16} />
                      <span>{t.submitAnswer}</span>
                    </button>
                    <button
                      onClick={() => setIsTypingQuestion(false)}
                      style={{
                        minHeight: '46px',
                        padding: '0 14px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--ag-border-default)',
                        borderRadius: 'var(--ag-radius-md)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ag-color-text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {t.voiceInsteadBtn}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  {!questionTranscript && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <button
                        onClick={isRecordingQuestion ? stopQuestionVoiceRecording : startQuestionVoiceRecording}
                        disabled={isTranscribingQuestion}
                        aria-label={isRecordingQuestion ? t.stopRecording : t.tapToAnswer}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          backgroundColor: isRecordingQuestion ? 'var(--ag-color-danger-base)' : 'var(--ag-color-primary-base)',
                          color: '#FFFFFF',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isTranscribingQuestion ? 'wait' : 'pointer',
                          boxShadow: isRecordingQuestion ? '0 0 0 8px rgba(217, 74, 69, 0.25)' : '0 4px 14px rgba(47, 125, 50, 0.28)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isRecordingQuestion ? <Square size={28} /> : <Mic size={32} />}
                      </button>
                      
                      <div style={{ fontSize: '13px', fontWeight: 800, color: isRecordingQuestion ? 'var(--ag-color-danger-base)' : 'var(--ag-color-text-primary)', textAlign: 'center' }}>
                        {isRecordingQuestion ? `🔴 ${t.listeningVoice}` : (isTranscribingQuestion ? `⏳ ${t.understandingAnswer}` : `🎙 ${t.tapToAnswer}`)}
                      </div>
                    </div>
                  )}

                  {questionTranscript && !isTranscribingQuestion && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid var(--ag-border-default)',
                        padding: '14px',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ag-color-primary-base)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          {t.youSaid}
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--ag-color-text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                          "{questionTranscript}"
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <button
                          onClick={() => handleSubmitQuestionAnswer(questionTranscript, 'voice')}
                          disabled={isSubmittingAnswer}
                          style={{
                            flex: 1,
                            minHeight: '46px',
                            backgroundColor: 'var(--ag-color-primary-base)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 'var(--ag-radius-md)',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <Check size={18} />
                          <span>{t.continueBtn}</span>
                        </button>

                        <button
                          onClick={() => {
                            setQuestionTranscript('');
                            startQuestionVoiceRecording();
                          }}
                          disabled={isSubmittingAnswer}
                          style={{
                            minHeight: '46px',
                            padding: '0 16px',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--ag-color-danger-base)',
                            border: '1px solid #FECDCA',
                            borderRadius: 'var(--ag-radius-md)',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <RotateCcw size={16} />
                          <span>{t.recordAgainBtn}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid var(--ag-border-default)', paddingTop: '10px' }}>
                    <button
                      onClick={() => handleSubmitQuestionAnswer(t.dontKnowBtn, 'unknown')}
                      disabled={isSubmittingAnswer}
                      style={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        borderRadius: 'var(--ag-radius-full)',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {t.dontKnowBtn}
                    </button>

                    <button
                      onClick={() => setIsTypingQuestion(true)}
                      disabled={isSubmittingAnswer}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--ag-color-text-secondary)',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {t.typeInsteadBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW D: DIRECT UPLOAD & SYMPT WORKSPACE (PRIMARY TOP SECTION) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1 Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  backgroundColor: 'var(--ag-color-primary-base)',
                  color: '#FFFFFF',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                }}>
                  1
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                  {currentLang === 'te' ? 'పంట సమస్యను అప్‌లోడ్ చేయండి' : (currentLang === 'hi' ? 'फसल समस्या अपलोड करें' : 'Upload a Crop Problem')}
                </h3>
              </div>

              <span style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', fontWeight: 600 }}>
                {selectedImages.length} / 5 {t.photosAnalyzed.toLowerCase()}
              </span>
            </div>

            {/* Crop Selector (Pills for fast 1-tap choice + select dropdown) */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                {currentLang === 'te' ? 'పంటను ఎంచుకోండి:' : (currentLang === 'hi' ? 'फसल चुनें:' : 'Select Crop:')}
              </label>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {availableCropsList.map((cropName) => {
                  const isSelected = selectedCropName.toLowerCase() === cropName.toLowerCase();
                  return (
                    <button
                      key={cropName}
                      type="button"
                      onClick={() => setSelectedCropName(cropName)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--ag-radius-full)',
                        border: isSelected ? '2px solid var(--ag-color-primary-base)' : '1px solid var(--ag-border-default)',
                        backgroundColor: isSelected ? 'var(--ag-color-primary-light)' : 'var(--ag-color-bg-base)',
                        color: isSelected ? 'var(--ag-color-primary-dark)' : 'var(--ag-color-text-primary)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{getCropEmoji(cropName)}</span>
                      <span>{localizeCropName(cropName, currentLang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                {currentLang === 'te' ? 'పంట లేదా ఆకు ఫోటోలు (కనీసం 1, గరిష్టంగా 5):' : (currentLang === 'hi' ? 'फसल या पत्ती की तस्वीरें (न्यूनतम 1, अधिकतम 5):' : 'Crop or Leaf Photos (Min 1, Max 5):')}
              </label>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Photo Previews */}
                {selectedImages.map((img, idx) => (
                  <div 
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '90px',
                      height: '90px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid var(--ag-color-primary-base)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                  >
                    <img 
                      src={img.previewUrl} 
                      alt={`Uploaded view ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      aria-label={`Remove photo ${idx + 1}`}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                    <span style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '4px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#FFF',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: '3px',
                    }}>
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {/* Add Photo Button / Dropzone */}
                {selectedImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload crop photo"
                    style={{
                      width: selectedImages.length === 0 ? '100%' : '90px',
                      minHeight: selectedImages.length === 0 ? '110px' : '90px',
                      borderRadius: '14px',
                      border: '2px dashed var(--ag-color-primary-base)',
                      backgroundColor: 'var(--ag-color-primary-light)',
                      display: 'flex',
                      flexDirection: selectedImages.length === 0 ? 'row' : 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: selectedImages.length === 0 ? '14px' : '4px',
                      padding: '12px',
                      cursor: 'pointer',
                      color: 'var(--ag-color-primary-dark)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #86EFAC',
                      flexShrink: 0,
                    }}>
                      <Camera size={22} color="var(--ag-color-primary-base)" />
                    </div>
                    <div style={{ textAlign: selectedImages.length === 0 ? 'left' : 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>
                        {selectedImages.length === 0 
                          ? (currentLang === 'te' ? 'ఫోటో తీయండి లేదా గ్యాలరీ నుండి అప్‌లోడ్ చేయండి' : (currentLang === 'hi' ? 'फोटो लें या गैलरी से चुनें' : 'Take Photo / Upload Leaf Images'))
                          : (currentLang === 'te' ? '+ ఇంకోటి' : '+ Add')}
                      </div>
                      {selectedImages.length === 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)', marginTop: '2px' }}>
                          {currentLang === 'te' ? 'ఆకులు, కాండం లేదా మొత్తం మొక్క స్పష్టమైన చిత్రం' : 'Clear photos of leaves, stems, or affected spots'}
                        </div>
                      )}
                    </div>
                  </button>
                )}
              </div>

              <input 
                type="file" 
                accept="image/*" 
                multiple 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImageSelect}
              />
            </div>

            {/* Voice Recording / Symptoms Box */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ag-color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                {currentLang === 'te' ? 'లక్షణాలు లేదా సమస్య వివరాలు (వాయిస్ లేదా రాయండి):' : (currentLang === 'hi' ? 'लक्षण या समस्या का विवरण (बोलें या लिखें):' : 'Describe Symptoms (Voice or Spoken Notes):')}
              </label>

              <div style={{
                border: isRecording ? '1.5px solid var(--ag-color-danger-base)' : '1px solid var(--ag-border-default)',
                borderRadius: '14px',
                padding: '14px',
                backgroundColor: isRecording ? '#FEF3F2' : 'var(--ag-color-bg-base)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      aria-label={isRecording ? 'Stop recording voice' : 'Start recording voice'}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: isRecording ? 'var(--ag-color-danger-base)' : 'var(--ag-color-primary-base)',
                        color: '#FFFFFF',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: isRecording ? '0 0 0 6px rgba(239, 68, 68, 0.2)' : 'none',
                      }}
                    >
                      {isRecording ? <Square size={18} /> : <Mic size={22} />}
                    </button>

                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: isRecording ? 'var(--ag-color-danger-base)' : 'var(--ag-color-text-primary)' }}>
                        {isRecording 
                          ? (currentLang === 'te' ? '🔴 వింటున్నాము... ఆపడానికి నొక్కండి' : '🔴 Listening... Tap to stop')
                          : (recordedAudioBlob 
                              ? (currentLang === 'te' ? 'వాయిస్ రికార్డింగ్ సిద్ధంగా ఉంది' : 'Voice description recorded')
                              : (currentLang === 'te' ? '🎙 మాట్లాడటానికి నొక్కండి (తెలుగు / హిందీ / English)' : '🎙 Tap to speak in Telugu, Hindi, or English'))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ag-color-text-secondary)' }}>
                        {currentLang === 'te' ? 'మచ్చలు, పసుపు రంగు, పురుగులు లేదా వాతావరణాన్ని వివరించండి' : 'Describe yellowing, spots, insect activity, or duration'}
                      </div>
                    </div>
                  </div>

                  {recordedAudioBlob && !isRecording && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={playRecordedAudio}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid var(--ag-border-default)',
                          borderRadius: '6px',
                          color: 'var(--ag-color-primary-base)',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        <Play size={14} />
                        <span>{currentLang === 'te' ? 'వినండి' : 'Play'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={clearVoiceRecording}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #FECDCA',
                          borderRadius: '6px',
                          color: 'var(--ag-color-danger-base)',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>{currentLang === 'te' ? 'మళ్లీ' : 'Reset'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Spoken Text / Live Transcript */}
                {(isRecording || voiceTranscriptText) && (
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--ag-border-default)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ag-color-primary-base)', marginBottom: '2px', textTransform: 'uppercase' }}>
                      {getLiveVoiceLabel()}:
                    </div>
                    <div style={{ color: 'var(--ag-color-text-primary)' }}>
                      {voiceTranscriptText || liveFinalTranscript || liveInterimTranscript || (currentLang === 'te' ? 'మాట్లాడండి...' : 'Speak now...')}
                    </div>
                  </div>
                )}

                {recordedAudioUrl && (
                  <audio ref={audioPlayerRef} src={recordedAudioUrl} style={{ display: 'none' }} />
                )}
              </div>
            </div>

            {/* Mismatch Error if triggered */}
            {mismatchError && (
              <div style={{
                backgroundColor: '#FEF3F2',
                border: '1.5px solid #FECDCA',
                borderRadius: '12px',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertOctagon size={18} color="var(--ag-color-danger-base)" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ag-color-danger-base)' }}>
                    ⚠️ {currentLang === 'te' ? 'పంట వివరాలలో తేడా ఉంది' : 'Crop Input Mismatch'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#991B1B', lineHeight: 1.4 }}>
                  {mismatchError.notice}
                </p>
              </div>
            )}

            {/* General error if any */}
            {errorMessage && (
              <div style={{
                backgroundColor: '#FEF3F2',
                border: '1px solid #FECDCA',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#B42318',
              }}>
                {errorMessage}
              </div>
            )}

            {/* Big Action Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={selectedImages.length === 0}
              style={{
                width: '100%',
                minHeight: '50px',
                backgroundColor: selectedImages.length > 0 ? 'var(--ag-color-primary-base)' : '#94A3B8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--ag-radius-md)',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: selectedImages.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedImages.length > 0 ? 'var(--ag-shadow-button)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={18} />
              <span>
                {selectedImages.length === 0
                  ? (currentLang === 'te' ? 'విశ్లేషించడానికి కనీసం ఒక ఫోటో తీయండి' : 'Add at least 1 photo to diagnose')
                  : (currentLang === 'te' 
                      ? `పంటను విశ్లేషించండి (${selectedImages.length} ఫోటోలు ${recordedAudioBlob ? '+ వాయిస్' : ''})` 
                      : (currentLang === 'hi'
                          ? `फसल का विश्लेषण करें (${selectedImages.length} तस्वीरें ${recordedAudioBlob ? '+ आवाज' : ''})`
                          : `Analyze Crop (${selectedImages.length} Photos ${recordedAudioBlob ? '+ Voice' : ''})`))}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: PAST DIAGNOSES & HISTORY DIRECTLY ON THIS PAGE         */}
      {/* ========================================================================= */}
      <div 
        id="crop-doctor-history-section"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid var(--ag-border-default)',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Section Header with count and refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: 'var(--ag-color-primary-base)',
              color: '#FFFFFF',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
            }}>
              2
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
                {currentLang === 'te' ? 'గత నిర్ధారణలు మరియు ఆరోగ్య చరిత్ర' : (currentLang === 'hi' ? 'पिछला निदान और इतिहास' : 'Past Crop Diagnoses & Health Records')}
              </h3>
              {historyList.length > 0 && (
                <span style={{
                  backgroundColor: 'var(--ag-color-primary-light)',
                  color: 'var(--ag-color-primary-dark)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}>
                  {historyList.length}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={loadHistory}
            disabled={isLoadingHistory}
            aria-label="Refresh history records"
            style={{
              background: 'none',
              border: '1px solid var(--ag-border-default)',
              borderRadius: 'var(--ag-radius-sm)',
              color: 'var(--ag-color-primary-base)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 12px',
            }}
          >
            <RefreshCw size={13} className={isLoadingHistory ? 'animate-spin' : ''} />
            <span>{isLoadingHistory ? '...' : (currentLang === 'te' ? 'తాజాకరించండి' : (currentLang === 'hi' ? 'ताज़ा करें' : 'Refresh'))}</span>
          </button>
        </div>

        {/* History List or Empty State */}
        {isLoadingHistory ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ag-color-text-secondary)', fontSize: '13px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '3px solid var(--ag-color-primary-light)',
              borderTopColor: 'var(--ag-color-primary-base)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px auto',
            }} />
            <span>{t.loadingHistory}</span>
          </div>
        ) : historyList.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--ag-color-bg-base)',
            borderRadius: '14px',
            border: '1.5px dashed var(--ag-border-default)',
            padding: '30px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--ag-border-default)',
            }}>
              <History size={20} color="var(--ag-color-text-secondary)" />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ag-color-text-primary)', margin: 0 }}>
              {t.noAssessmentsYet}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ag-color-text-secondary)', maxWidth: '340px', margin: 0, lineHeight: 1.4 }}>
              {currentLang === 'te' 
                ? 'ఇప్పటివరకు పంట నిర్ధారణలు లేవు. మీ పంట ఫోటోను పైన అప్‌లోడ్ చేసి మొదటి విశ్లేషణను పొందండి!' 
                : 'No past diagnoses recorded yet. Take or upload a photo above to start your first assessment!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {historyList.map((item) => {
              const isProblem = item.status === 'problem_detected';
              const isHealthy = item.status === 'no_issue';

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenHistoricalItem(item)}
                  style={{
                    backgroundColor: 'var(--ag-color-bg-base)',
                    borderRadius: '12px',
                    border: '1px solid var(--ag-border-default)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--ag-color-primary-base)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(47, 125, 50, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--ag-color-bg-base)';
                    e.currentTarget.style.borderColor = 'var(--ag-border-default)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Thumbnail or Fallback Emoji */}
                    {item.thumbnailSignedUrl ? (
                      <img 
                        src={item.thumbnailSignedUrl} 
                        alt={item.cropName} 
                        style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--ag-border-default)' }}
                      />
                    ) : (
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        backgroundColor: isProblem ? '#FEE2E2' : (isHealthy ? 'var(--ag-color-primary-light)' : '#FEF3C7'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}>
                        {getCropEmoji(item.cropName)}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ag-color-text-primary)' }}>
                          {getCropEmoji(item.cropName)} {localizeCropName(item.cropName, currentLang)}
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 8px',
                          borderRadius: 'var(--ag-radius-full)',
                          backgroundColor: isProblem ? '#FEE2E2' : (isHealthy ? '#DCFCE7' : '#FEF3C7'),
                          color: isProblem ? '#991B1B' : (isHealthy ? '#166534' : '#92400E'),
                          border: `1px solid ${isProblem ? '#FCA5A5' : (isHealthy ? '#86EFAC' : '#FDE047')}`,
                        }}>
                          {isProblem ? t.possibleProblem : (isHealthy ? t.cropLooksHealthy : t.needClearerLook)}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isProblem ? '#991B1B' : 'var(--ag-color-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '3px',
                      }}>
                        {localizeDiagnosisTitle(item.diagnosisTitle, currentLang)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ag-color-text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Camera size={12} />
                          {item.imageCount} {t.photosAnalyzed.toLowerCase()}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Mic size={12} />
                          {item.voiceContextUsed ? t.voiceIncluded : t.noVoice}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} />
                          {formatRelativeDateLocalized(item.createdAt, currentLang)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ag-color-primary-base)', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    <span>{currentLang === 'te' ? 'చూడండి' : (currentLang === 'hi' ? 'देखें' : 'View')}</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. FULLSCREEN LIGHTBOX FOR ENLARGED PHOTO WITH ANNOTATIONS                */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              aria-label="Close enlarged view"
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '90vw',
              maxHeight: '82vh',
              lineHeight: 0,
            }}>
              <img 
                src={lightboxImage.url} 
                alt={`Crop Photo Full View ${lightboxImage.index + 1}`}
                style={{ 
                  display: 'block',
                  maxWidth: '90vw', 
                  maxHeight: '82vh', 
                  width: 'auto', 
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />

              {diagnosisResult?.visualAnnotations?.filter(a => a.imageIndex === lightboxImage.index).map((ann, aIdx) => (
                <div
                  key={aIdx}
                  style={{
                    position: 'absolute',
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    width: `${ann.width}%`,
                    height: `${ann.height}%`,
                    border: '3px solid #EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '6px',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.95), 0 4px 12px rgba(0,0,0,0.5)',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: ann.y < 15 ? '100%' : '-28px',
                    left: '0',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    lineHeight: '1.2',
                    zIndex: 2,
                  }}>
                    {ann.label}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ color: '#FFFFFF', fontSize: '13px', marginTop: '8px', fontWeight: 600 }}>
              Photo #{lightboxImage.index + 1} of {analyzedImagesList.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
