import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth, signInWithGoogle, logout, onAuthStateChanged } from './firebase';
import { User, Message, CallSession } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Video, 
  Phone, 
  LogOut, 
  Search, 
  MoreVertical, 
  User as UserIcon,
  X,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  ChevronLeft,
  Settings,
  Plus
} from 'lucide-react';
import { WebRTCService } from './webrtc';

// --- Components ---

const Login = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden relative">
    {/* Animated Background Blobs */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]" 
      />
    </div>
    
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 text-center glass-dark p-12 rounded-[48px] max-w-md w-full mx-4 border border-white/10 backdrop-blur-3xl shadow-2xl"
    >
      <div className="w-24 h-24 bg-brand-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/40 transform -rotate-6">
        <MessageSquare className="text-white w-12 h-12" />
      </div>
      <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Nexus</h1>
      <p className="text-slate-400 mb-10 text-lg font-medium leading-relaxed">Experience the next generation of real-time communication.</p>
      
      <button 
        onClick={signInWithGoogle}
        className="w-full bg-white text-slate-900 font-bold py-5 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 shadow-xl group"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 group-hover:rotate-12 transition-transform" alt="Google" />
        <span className="text-lg">Continue with Google</span>
      </button>
    </motion.div>
  </div>
);

const Sidebar = ({ users, onSelectUser, selectedUser, currentUser, isMobile, onOpenProfile }: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u: User) => 
    u.uid !== currentUser.uid && 
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`flex flex-col h-full glass-card border-r border-white/20 ${isMobile ? 'w-full' : 'w-96'} !bg-white/40 backdrop-blur-2xl`}>
      <div className="pt-14 px-4 pb-2 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenProfile}
              className="relative group"
            >
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} 
                className="w-10 h-10 rounded-full object-cover border-2 border-brand-500 shadow-lg group-hover:scale-110 transition-transform"
                alt="Profile"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white p-1 rounded-full shadow-md">
                <Settings size={10} />
              </div>
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{currentUser.displayName}</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="p-2 hover:bg-white/20 rounded-full text-slate-600 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <h2 className="text-[34px] font-bold mb-2 tracking-tight text-slate-900">Chats</h2>
        
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search"
            className="w-full bg-black/5 border-none rounded-xl py-2 pl-10 pr-4 focus:ring-0 transition-all text-[17px] placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user: User, idx: number) => (
          <motion.button
            key={user.uid}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelectUser(user)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
              selectedUser?.uid === user.uid ? 'bg-white/40 shadow-sm' : 'active:bg-white/30'
            }`}
          >
            <div className="relative flex-shrink-0">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                className="w-16 h-16 rounded-full object-cover shadow-md border border-white/30"
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
              />
              {user.status === 'online' && (
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden border-b border-black/5 pb-3 h-full flex flex-col justify-center">
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-[17px] truncate text-slate-900">{user.displayName}</p>
                <span className="text-[14px] text-slate-500">10:42 AM</span>
              </div>
              <p className="text-[15px] text-slate-500 truncate mt-0.5">Tap to start chatting...</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const ChatWindow = ({ user, currentUser, onCall, onBack, isMobile }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendVoiceMessage(base64Audio);
        };
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioData: string) => {
    if (!user) return;
    const chatId = [currentUser.uid, user.uid].sort().join('_');
    const messageData = {
      audio: audioData,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderPhoto: currentUser.photoURL,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
  };

  useEffect(() => {
    if (!user) return;
    
    const chatId = [currentUser.uid, user.uid].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const chatId = [currentUser.uid, user.uid].sort().join('_');
    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderPhoto: currentUser.photoURL,
      createdAt: serverTimestamp()
    };

    setNewMessage('');
    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center glass-card !bg-white/30 backdrop-blur-xl text-slate-400">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-inner"
        >
          <MessageSquare size={40} className="text-slate-400/60" />
        </motion.div>
        <p className="text-lg font-medium text-slate-500/80">Select a chat to start</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative chat-bg !bg-transparent backdrop-blur-[2px]">
      <div className="pt-12 pb-2 px-3 glass-card !bg-white/60 !border-none sticky top-0 z-20 flex items-center justify-between backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          {isMobile && (
            <button onClick={onBack} className="p-1 -ml-1 text-brand-500 flex items-center hover:opacity-70 transition-opacity">
              <ChevronLeft size={32} />
              <span className="text-[17px] -ml-1 font-medium">Chats</span>
            </button>
          )}
          <div className="flex items-center gap-2 ml-1">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-9 h-9 rounded-full object-cover border border-white/40 shadow-sm" 
              alt={user.displayName}
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <p className="font-bold text-[17px] leading-tight text-slate-900">{user.displayName}</p>
              <p className="text-[12px] text-emerald-600 font-semibold">online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 pr-2">
          <button onClick={() => onCall('video')} className="text-brand-500 hover:opacity-70 transition-opacity">
            <Video size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.uid;
          const showTime = idx === 0 || (msg.createdAt && messages[idx-1].createdAt && 
            msg.createdAt.toDate().getTime() - messages[idx-1].createdAt.toDate().getTime() > 300000);
          
          return (
            <React.Fragment key={msg.id}>
              {showTime && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] font-semibold text-slate-500/80 bg-white/30 backdrop-blur-sm px-4 py-1 rounded-full tracking-tight">
                    {msg.createdAt?.toDate().toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl relative backdrop-blur-xl ${
                  isMe ? 'bg-brand-500/30 text-slate-900 rounded-tr-none' : 'bg-white/60 text-slate-900 rounded-tl-none'
                }`}>
                  {msg.text && <p className="text-[15px] leading-snug pr-12">{msg.text}</p>}
                  {msg.audio && (
                    <div className="mt-1 mb-2">
                      <audio controls src={msg.audio} className="h-8 w-48" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-slate-500/80 font-medium">
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 glass-card !bg-white/60 !border-none sticky bottom-0 flex items-center gap-3 backdrop-blur-2xl">
        <button className="text-brand-500 hover:opacity-70 transition-opacity">
          <Plus size={28} />
        </button>
        <form onSubmit={sendMessage} className="flex-1 flex items-center gap-2">
          <div className="flex-1 bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-1.5 flex items-center shadow-inner">
            <input 
              type="text" 
              placeholder="Message"
              className="flex-1 bg-transparent border-none py-1 focus:ring-0 text-[16px] placeholder:text-slate-400"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          {newMessage.trim() ? (
            <button 
              type="submit"
              className="bg-brand-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-90 transition-transform"
            >
              <Send size={18} />
            </button>
          ) : (
            <button 
              type="button" 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse scale-125' : 'text-brand-500 hover:opacity-70'}`}
            >
              <Mic size={24} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const ProfileModal = ({ user, onClose, onUpdateName }: any) => {
  const [newName, setNewName] = useState(user.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === user.displayName) return;
    setIsUpdating(true);
    await onUpdateName(newName);
    setIsUpdating(false);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-brand-500/10" />
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10">
          <X size={24} className="text-slate-400" />
        </button>

        <div className="relative z-10 text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl"
              alt="Profile"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Profile</h2>
          <p className="text-slate-500 mb-8">{user.email}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Display Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 focus:border-brand-500 focus:ring-0 transition-all text-lg font-medium"
                placeholder="Enter your name"
              />
            </div>

            <button 
              type="submit"
              disabled={isUpdating || !newName.trim() || newName === user.displayName}
              className="w-full bg-brand-500 text-white font-bold py-5 rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CallOverlay = ({ call, onHangUp, onAccept, localVideoRef, remoteVideoRef, webrtc }: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDevices, setShowDevices] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls after 5 seconds
  useEffect(() => {
    if (call.status === 'accepted' && showControls) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showControls, call.status]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (call.status === 'accepted') {
      interval = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    } else {
      setCallTime(0);
    }
    return () => clearInterval(interval);
  }, [call.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devList = await navigator.mediaDevices.enumerateDevices();
        setDevices(devList);
      } catch (err) {
        console.error("Error fetching devices:", err);
      }
    };
    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  const switchDevice = async (deviceId: string, kind: string) => {
    try {
      const constraints: any = {
        audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : true,
        video: kind === 'videoinput' ? { deviceId: { exact: deviceId } } : (call.type === 'video')
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Replace tracks in peer connection
      const senders = webrtc.pc.getSenders();
      newStream.getTracks().forEach((newTrack: any) => {
        const sender = senders.find(s => s.track?.kind === newTrack.kind);
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      });

      // Update local stream
      if (webrtc.localStream) {
        webrtc.localStream.getTracks().forEach((t: any) => t.stop());
      }
      webrtc.localStream = newStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
      
      setShowDevices(false);
    } catch (err) {
      console.error("Failed to switch device:", err);
    }
  };

  // Attach streams when component mounts or status changes to accepted
  useEffect(() => {
    if (call.status === 'accepted') {
      const timer = setTimeout(() => {
        if (localVideoRef.current && webrtc.localStream) {
          localVideoRef.current.srcObject = webrtc.localStream;
        }
        if (remoteVideoRef.current && webrtc.remoteStream) {
          remoteVideoRef.current.srcObject = webrtc.remoteStream;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [call.status, localVideoRef, remoteVideoRef, webrtc.localStream, webrtc.remoteStream]);

  // Handle Mute/Video toggle
  useEffect(() => {
    if (webrtc.localStream) {
      webrtc.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, webrtc.localStream]);

  useEffect(() => {
    if (webrtc.localStream) {
      webrtc.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, webrtc.localStream]);

  // Screen Wake Lock Implementation
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err: any) {
        // Only log if it's not a permission issue we expect in some environments
        if (err.name !== 'NotAllowedError') {
          console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        } else {
          console.warn('Wake Lock access denied by permissions policy or user.');
        }
      }
    };

    if (call.status === 'accepted' || (call.isIncoming && call.status === 'pending')) {
      requestWakeLock();
    }

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        }).catch((err: any) => {
          console.error('Error releasing wake lock:', err);
        });
      }
    };
  }, [call.status, call.isIncoming]);

  const renderStatus = () => {
    if (call.status === 'declined') return 'Call Declined';
    if (call.status === 'not-answered') return 'No Answer';
    if (call.status === 'pending') return call.isIncoming ? `Incoming ${call.type} call` : 'Ringing...';
    return 'Connected';
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowControls(!showControls)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden cursor-pointer"
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={call.callerPhoto} className="w-full h-full object-cover blur-3xl opacity-40 scale-110" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950" />
      </div>

      {(call.status === 'pending' || call.status === 'declined' || call.status === 'not-answered') ? (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="z-10 text-center glass-dark p-10 rounded-[48px] border border-white/10 shadow-2xl max-w-sm w-full mx-4"
        >
          <div className="relative mb-8">
            <motion.div 
              animate={call.status === 'pending' ? { scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className={`absolute inset-0 ${call.status === 'declined' ? 'bg-rose-500' : 'bg-brand-500'} rounded-full blur-2xl`}
            />
            <div className="relative w-36 h-36 rounded-full border-4 border-white/20 p-1 mx-auto overflow-hidden shadow-2xl">
              <img src={call.callerPhoto} className="w-full h-full rounded-full object-cover" alt="Caller" />
            </div>
          </div>
          
          <h2 className="text-[32px] font-bold text-white mb-2 tracking-tight">{call.callerName}</h2>
          <p className={`font-semibold mb-12 tracking-[0.2em] uppercase text-[11px] ${call.status === 'pending' ? 'text-brand-400 animate-pulse' : 'text-rose-400'}`}>
            {renderStatus()}
          </p>
          
          <div className="flex justify-center gap-12">
            {call.isIncoming && call.status === 'pending' ? (
              <>
                <div className="flex flex-col items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onHangUp}
                    className="w-18 h-18 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-500/40 transition-all"
                  >
                    <PhoneOff size={32} />
                  </motion.button>
                  <span className="text-white/60 text-xs font-medium">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onAccept}
                    className="w-18 h-18 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-all"
                  >
                    <Phone size={32} />
                  </motion.button>
                  <span className="text-white/60 text-xs font-medium">Accept</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onHangUp}
                  className="w-18 h-18 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-500/40 transition-all"
                >
                  <PhoneOff size={32} />
                </motion.button>
                <span className="text-white/60 text-xs font-medium">{call.status === 'pending' ? 'Cancel' : 'Close'}</span>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0 bg-slate-900">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
          </div>
          
          {/* Local Video (Floating) - Fixed constraints to prevent going to void */}
          <motion.div 
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            className="absolute top-10 right-10 w-40 h-56 glass-card !bg-white/20 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/30 z-20 cursor-move"
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center">
                <VideoOff className="text-white/60" size={32} />
              </div>
            )}
          </motion.div>

          {/* Top Info */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-10 left-10 text-white z-10 pointer-events-none"
              >
                <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 rounded-full border-2 border-brand-500 p-0.5">
                    <img src={call.callerPhoto} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold">{call.callerName || 'In Call'}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-xs text-slate-300 font-mono tracking-tighter">{formatTime(callTime)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-5 glass-dark !bg-black/40 backdrop-blur-2xl rounded-[32px] border border-white/10 z-30"
              >
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={onHangUp}
                  className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/40 active:scale-90"
                >
                  <PhoneOff size={28} />
                </motion.button>
    
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </motion.button>
    
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDevices(!showDevices)}
                  className="p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <Settings size={24} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Device Selector Modal */}
          <AnimatePresence>
            {showDevices && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-32 left-1/2 -translate-x-1/2 w-80 glass-dark p-6 rounded-3xl border border-white/10 z-50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold">Devices</h3>
                  <button onClick={() => setShowDevices(false)} className="text-white/60 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Cameras</p>
                    {devices.filter(d => d.kind === 'videoinput').map(device => (
                      <button 
                        key={device.deviceId}
                        onClick={() => switchDevice(device.deviceId, 'videoinput')}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-white text-sm truncate"
                      >
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Microphones</p>
                    {devices.filter(d => d.kind === 'audioinput').map(device => (
                      <button 
                        key={device.deviceId}
                        onClick={() => switchDevice(device.deviceId, 'audioinput')}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-white text-sm truncate"
                      >
                        {device.label || `Mic ${device.deviceId.slice(0, 5)}`}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

const PermissionTroubleshooter = ({ onClose }: { onClose: () => void }) => {
  const [deviceStatus, setDeviceStatus] = useState({ hasCamera: false, hasMic: false, loading: true });

  useEffect(() => {
    const check = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDeviceStatus({
          hasCamera: devices.some(d => d.kind === 'videoinput'),
          hasMic: devices.some(d => d.kind === 'audioinput'),
          loading: false
        });
      } catch (e) {
        setDeviceStatus(prev => ({ ...prev, loading: false }));
      }
    };
    check();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <VideoOff size={40} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-4">Camera Access Blocked</h2>
        
        {!deviceStatus.loading && !deviceStatus.hasCamera && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-3">
            <X className="flex-shrink-0 mt-0.5" size={16} />
            <p className="text-left"><strong>Hardware Alert:</strong> No camera was detected on this device. You can still use audio calls.</p>
          </div>
        )}

        <p className="text-slate-600 mb-6 leading-relaxed">
          The browser is preventing access to your camera or microphone. This often happens inside preview windows.
        </p>
        
        <div className="space-y-4 mb-8 text-left">
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
            <p className="text-sm text-slate-700">Click the <strong>"Open in new tab"</strong> icon at the top right of this window.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
            <p className="text-sm text-slate-700">In the new tab, click the <strong>Lock Icon</strong> in your address bar and set Camera/Mic to <strong>Allow</strong>.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-sm text-slate-700">Refresh the page and try the call again.</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-brand-500 text-white font-bold py-4 rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25"
        >
          Got it, I'll try that
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  
  const webrtc = useRef(new WebRTCService());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = async () => {
      console.log("Devices changed, updating stream...");
      if (activeCall?.status === 'accepted') {
        try {
          const streams = await webrtc.current.startLocalStream(activeCall.type === 'video');
          if (localVideoRef.current) localVideoRef.current.srcObject = streams.localStream;
        } catch (err) {
          console.error("Failed to update stream on device change:", err);
        }
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  }, [activeCall]);

  useEffect(() => {
    ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    ringtoneRef.current.loop = true;
  }, []);

  useEffect(() => {
    if (activeCall?.isIncoming && activeCall?.status === 'pending') {
      ringtoneRef.current?.play().catch(e => console.log("Audio play blocked"));
    } else {
      ringtoneRef.current?.pause();
      if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
    }
  }, [activeCall]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        const existingData = userDoc.exists() ? userDoc.data() : {};
        
        const userData = {
          uid: u.uid,
          displayName: existingData.displayName || u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          status: 'online',
          lastSeen: serverTimestamp()
        };
        await setDoc(doc(db, 'users', u.uid), userData, { merge: true });
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(allUsers);
    });

    // Listen for incoming calls
    const callsQ = query(
      collection(db, 'calls'), 
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );
    
    const callsUnsubscribe = onSnapshot(callsQ, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const callData = change.doc.data();
          const callerDoc = await getDoc(doc(db, 'users', callData.callerId));
          const caller = callerDoc.data();
          
          setActiveCall({
            ...callData,
            id: change.doc.id,
            isIncoming: true,
            callerName: caller?.displayName,
            callerPhoto: caller?.photoURL
          });
        }
      });
    });

    return () => {
      unsubscribe();
      callsUnsubscribe();
    };
  }, [user]);

  // Check for available devices
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        const hasMic = devices.some(device => device.kind === 'audioinput');
        console.log("Devices found:", { hasCamera, hasMic });
        if (!hasCamera) {
          console.warn("No camera detected on this device.");
        }
      } catch (err) {
        console.error("Error checking devices:", err);
      }
    };
    checkDevices();
  }, []);

  // Listen for active call status changes
  useEffect(() => {
    if (!activeCall?.id) return;

    const unsub = onSnapshot(doc(db, 'calls', activeCall.id), (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.status === 'accepted' && activeCall.status === 'pending') {
        setActiveCall((prev: any) => prev ? { ...prev, status: 'accepted' } : null);
      } else if (data.status === 'ended' || data.status === 'declined' || data.status === 'rejected' || data.status === 'not-answered') {
        if (activeCall.status !== data.status) {
          setActiveCall((prev: any) => prev ? { ...prev, status: data.status } : null);
          webrtc.current.hangUp();
          setTimeout(() => setActiveCall(null), 2000);
        }
      }
    });

    return () => unsub();
  }, [activeCall?.id]);

  const handleUpdateName = async (newName: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
      setUser((prev: any) => ({ ...prev, displayName: newName }));
    } catch (err) {
      console.error("Failed to update name:", err);
    }
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!selectedUser || !user) return;

    try {
      // 1. Check Media Permissions
      let streams;
      try {
        streams = await webrtc.current.startLocalStream(type === 'video');
      } catch (mediaErr: any) {
        console.error("Media Permission Denied:", mediaErr);
        setShowPermissionError(true);
        return;
      }
      
      setActiveCall({
        callerId: user.uid,
        receiverId: selectedUser.uid,
        type,
        status: 'pending',
        isIncoming: false,
        callerName: selectedUser.displayName,
        callerPhoto: selectedUser.photoURL
      });
      setShowProfile(false);

      // 2. Check Database Permissions
      try {
        const callId = await webrtc.current.createCall(user.uid, selectedUser.uid, 'video');
        
        setActiveCall((prev: any) => prev ? { ...prev, id: callId } : null);

        // Set timeout for not answered
        setTimeout(async () => {
          const callDoc = doc(db, 'calls', callId);
          const snap = await getDoc(callDoc);
          if (snap.exists() && snap.data().status === 'pending') {
            await updateDoc(callDoc, { status: 'not-answered' });
          }
        }, 30000); // 30 seconds timeout

        setTimeout(() => {
          if (localVideoRef.current) localVideoRef.current.srcObject = streams.localStream;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams.remoteStream;
        }, 500);
      } catch (dbErr: any) {
        console.error("Database Permission Denied:", dbErr);
        alert("Firebase Permission Denied: Please ensure your Firestore Security Rules allow writing to the 'calls' collection.");
        handleHangUp();
      }

    } catch (err) {
      console.error("Call failed:", err);
    }
  };

  const handleAcceptCall = async () => {
    if (!activeCall) return;
    setShowProfile(false);

    try {
      const streams = await webrtc.current.startLocalStream(true);
      await webrtc.current.answerCall(activeCall.id);
      
      setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null);

      setTimeout(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = streams.localStream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams.remoteStream;
      }, 500);
    } catch (err) {
      console.error("Accept failed:", err);
      setShowPermissionError(true);
    }
  };

  const handleHangUp = async () => {
    if (!activeCall) return;
    
    try {
      if (activeCall.isIncoming && activeCall.status === 'pending') {
        await webrtc.current.declineCall(activeCall.id);
      } else {
        await webrtc.current.hangUp();
      }
    } catch (err) {
      console.error("Hang up failed:", err);
    } finally {
      setActiveCall(null);
      // Ensure tracks are stopped and peer connection is reset for next call
      webrtc.current.initPeerConnection();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden font-sans relative">
      {/* Background for Glassmorphism */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/15 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-500" />
      </div>

      <div className="relative z-10 flex w-full h-full">
        {(!isMobile || !selectedUser) && (
          <Sidebar 
            users={users} 
            onSelectUser={setSelectedUser} 
            selectedUser={selectedUser} 
            currentUser={user} 
            isMobile={isMobile}
            onOpenProfile={() => setShowProfile(true)}
          />
        )}
        
        {(!isMobile || selectedUser) && (
          <ChatWindow 
            user={selectedUser} 
            currentUser={user} 
            onCall={handleStartCall}
            onBack={() => setSelectedUser(null)}
            isMobile={isMobile}
          />
        )}
      </div>

      <AnimatePresence>
        {showProfile && (
          <ProfileModal 
            user={user} 
            onClose={() => setShowProfile(false)} 
            onUpdateName={handleUpdateName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCall && (
          <CallOverlay 
            call={activeCall} 
            onHangUp={handleHangUp}
            onAccept={handleAcceptCall}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            webrtc={webrtc.current}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPermissionError && (
          <PermissionTroubleshooter onClose={() => setShowPermissionError(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
