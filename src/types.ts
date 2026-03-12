export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  status?: 'online' | 'offline';
  lastSeen?: any;
}

export interface Message {
  id: string;
  text?: string;
  audio?: string; // base64 string
  senderId: string;
  senderName: string;
  senderPhoto: string;
  createdAt: any;
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  offer?: any;
  answer?: any;
}
