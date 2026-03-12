import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  getDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export class WebRTCService {
  pc!: RTCPeerConnection;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  callId: string | null = null;

  constructor() {
    this.remoteStream = new MediaStream();
    this.initPeerConnection();
  }

  initPeerConnection() {
    if (this.pc && this.pc.signalingState !== 'closed') {
      this.pc.close();
    }
    this.pc = new RTCPeerConnection(servers);
    
    // Always set ontrack to the same remoteStream object
    this.pc.ontrack = (event) => {
      console.log("Remote track received:", event.track.kind);
      event.streams[0].getTracks().forEach((track) => {
        // Only add if not already present
        if (!this.remoteStream?.getTracks().find(t => t.id === track.id)) {
          this.remoteStream?.addTrack(track);
        }
      });
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log("Connection state:", this.pc.connectionState);
      if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'disconnected') {
        // Handle disconnection if needed
      }
    };
  }

  async startLocalStream(video: boolean = true) {
    // Ensure we have a fresh connection if the previous one was closed
    if (this.pc.signalingState === 'closed') {
      this.initPeerConnection();
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } : false,
        audio: true,
      });

      // Clear existing senders if any (though initPeerConnection should have handled it)
      const senders = this.pc.getSenders();
      senders.forEach(sender => this.pc.removeTrack(sender));

      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream!);
      });

      return { localStream: this.localStream, remoteStream: this.remoteStream };
    } catch (err) {
      console.error("Error accessing media devices:", err);
      throw err;
    }
  }

  async createCall(callerId: string, receiverId: string, type: 'audio' | 'video') {
    // ... existing logic ...
    const callDoc = doc(collection(db, 'calls'));
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    this.callId = callDoc.id;

    this.pc.onicecandidate = (event) => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
    };

    const offerDescription = await this.pc.createOffer();
    await this.pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, { 
      offer, 
      callerId, 
      receiverId, 
      type, 
      status: 'pending',
      createdAt: serverTimestamp() 
    });

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (this.pc.signalingState !== 'closed' && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        if (this.pc.signalingState === 'have-local-offer') {
          this.pc.setRemoteDescription(answerDescription);
        }
      }
    });

    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && this.pc.signalingState !== 'closed') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.pc.addIceCandidate(candidate);
        }
      });
    });

    return this.callId;
  }

  async answerCall(callId: string) {
    if (this.pc.signalingState === 'closed') {
      this.initPeerConnection();
    }
    
    this.callId = callId;
    const callDoc = doc(db, 'calls', callId);
    const answerCandidates = collection(callDoc, 'answerCandidates');
    const offerCandidates = collection(callDoc, 'offerCandidates');

    this.pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const callData = (await getDoc(callDoc)).data();

    const offerDescription = callData?.offer;
    await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer, status: 'accepted' });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && this.pc.signalingState !== 'closed') {
          let data = change.doc.data();
          this.pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  async declineCall(callId: string) {
    const callDoc = doc(db, 'calls', callId);
    await updateDoc(callDoc, { status: 'declined' });
    this.pc.close();
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.remoteStream = null;
  }

  async hangUp() {
    if (this.callId) {
      const callDoc = doc(db, 'calls', this.callId);
      try {
        await updateDoc(callDoc, { status: 'ended' });
      } catch (e) {
        console.log("Call already ended or doc missing");
      }
    }

    if (this.pc) {
      this.pc.close();
    }
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    
    // Clear remote stream tracks instead of setting to null
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        this.remoteStream?.removeTrack(track);
      });
    }
    this.callId = null;
  }
}
