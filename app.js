import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* ================= FIREBASE ================= */

const firebaseConfig = {
    apiKey: "AIzaSyAk5vpwEms61MGUMHf42v-5l5YsCKZxPcU",
    authDomain: "music-e4d6a.firebaseapp.com",
    projectId: "music-e4d6a",
    storageBucket: "music-e4d6a.firebasestorage.app",
    messagingSenderId: "485779946327",
    appId: "1:485779946327:web:3c8ddebb80c8eab59fdc12"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ================= ELEMENT ================= */

const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const avatar = document.getElementById("avatar");
const username = document.getElementById("username");

const chat = document.getElementById("chat");
const input = document.getElementById("commandInput");
const sendBtn = document.getElementById("sendBtn");

const player = document.getElementById("playerFrame");

const replyPreview = document.getElementById("replyPreview");
const replyText = document.getElementById("replyText");
const cancelReply = document.getElementById("cancelReply");

const menuOverlay=document.getElementById("menuOverlay");

const menuPreview=document.getElementById("menuPreview");

const copyBtn=document.getElementById("copyBtn");

const editBtn=document.getElementById("editBtn");

const deleteBtn=document.getElementById("deleteBtn");

const replyBtn=document.getElementById("replyBtn");

const refreshBtn = document.getElementById("refreshBtn");

/* ================= STATE ================= */

let replyData = null;
let currentVideo = "";
let ytPlayer = null;
let roomData = null;
let playerReady = false;
let syncTimer = null;
let selectedMessage = null;
let hold = null;
let editingMessage = null;

function createPlayer() {
    if (!window.YT || !YT.Player) {
        setTimeout(createPlayer, 100);
        return;
    }

    ytPlayer = new YT.Player("playerFrame", {
      width: "100%",
      height: "100%",
      playerVars:{
          autoplay:1,
          controls:0,
          disablekb:1,
          rel:0
      },
  
      events:{
          onReady(){
              playerReady = true;
      
              if(roomData){
                  playRoom(roomData);
              }
      
              if (!syncTimer) {
                  syncTimer = setInterval(syncPlayer, 3000);
              }
          }
      }
  });
}

createPlayer();

/* ================= LOGIN ================= */

loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        alert(e.message);
    }
};

onAuthStateChanged(auth, user => {
    if (!user) return;

    loginBtn.style.display = "none";
    userInfo.style.display = "flex";

    avatar.src = user.photoURL;
    username.textContent = user.displayName;
});

/* ================= YOUTUBE ID ================= */

function getYoutubeId(input) {

    input = input.trim();

    // kalau sudah ID langsung
    if (!input.includes("http") && input.length >= 8) {
        return input;
    }

    try {
        const url = new URL(input);

        // youtu.be
        if (url.hostname.includes("youtu.be")) {
            return url.pathname.split("/")[1];
        }

        // youtube.com/watch?v=
        const v = url.searchParams.get("v");
        if (v) return v;

        // shorts
        const short = url.pathname.match(/\/shorts\/([^/?]+)/);
        if (short) return short[1];

        return null;

    } catch {
        return null;
    }
}

async function getVideoTitle(videoId){

    const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );

    const data = await res.json();

    return data.title || "Video YouTube";

}

function getTargetSecond() {

    if (!roomData || !roomData.startedAt) {
        return 0;
    }

    return Math.floor(
        (Date.now() - roomData.startedAt.toMillis()) / 1000
    );

}

function syncPlayer() {

    if (!playerReady) return;
    if (!roomData) return;
    if (!roomData.videoId) return;

    if (ytPlayer.getPlayerState() === YT.PlayerState.UNSTARTED) return;

    const target = getTargetSecond();
    const current = ytPlayer.getCurrentTime();

    const diff = Math.abs(target - current);

    if (diff > 2) {
        ytPlayer.seekTo(target, true);
    }

    if (ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
        ytPlayer.playVideo();
    }
}
/* ================= SEND MESSAGE ================= */
async function sendBotMessage(message, title = null){

    await addDoc(collection(db, "messages"), {
        uid: "music-bot",
        name: "Music Bot",
        photo: "music-bot.png",
        message: message,
        title: title,
        timestamp: serverTimestamp()
    });

}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    if (!auth.currentUser) {
        alert("Login dulu");
        return;
    }
    
    if(editingMessage){
    
        await updateDoc(
            doc(db,"messages",editingMessage.id),
            {
                message: input.value.trim(),
                edited: true
            }
        );
    
        editingMessage = null;
        replyPreview.style.display = "none";
        input.value = "";
    
        return;
    }

    /* PLAY SYSTEM (ROOM SYNC) */
    /* SAY BOT */
    if (text.startsWith("/say")) {
    
        const pesan = text.replace("/say", "").trim();
    
        if (!pesan) {
            alert("Masukkan pesan.");
            return;
        }
    
        await sendBotMessage(pesan);
    
        input.value = "";
    
        return;
    }
    
    if (text.startsWith("/play")) {

        const raw = text.replace("/play", "").trim();
    
        const id = getYoutubeId(raw);
    
        if (!id) {
            alert("Link tidak valid");
            return;
        }
        
        const title = await getVideoTitle(id);
    
        // Update player room
        await setDoc(doc(db, "room", "main"), {
            videoId: id,
            startedAt: serverTimestamp(),
            status: "playing"
        });
    
        // Kirim ke chat juga
        await sendBotMessage(
            `<b>${auth.currentUser.displayName}</b> memutar <i>/play</i>`,
            title
        );
    
        input.value = "";
        return;
    }

    /* STOP */
    if (text === "/stop") {
        await setDoc(doc(db, "room", "main"), {
            videoId: "",
            updatedAt: Date.now()
        });

        input.value = "";
        return;
    }

    /* CHAT MESSAGE */
    await addDoc(collection(db, "messages"), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL,
        message: text,
        timestamp: serverTimestamp(),
        replyTo: replyData
    });

    replyData = null;
    replyPreview.style.display = "none";
    input.value = "";
}

sendBtn.onclick = sendMessage;

/* ================= SWIPE REPLY ================= */

function setReply(msg) {
    replyData = {
        name: msg.name,
        message: msg.message
    };

    replyPreview.style.display = "flex";
    replyText.innerHTML = `<b>${msg.name}</b><br>${msg.message}`;
}

cancelReply.onclick = () => {

    replyData = null;
    editingMessage = null;

    replyPreview.style.display = "none";

    input.value = "";

};

function openMenu(msg){

    selectedMessage = msg;
    
    const isOwn =
        auth.currentUser &&
        msg.uid === auth.currentUser.uid;
    
    editBtn.style.display = isOwn ? "flex" : "none";
    deleteBtn.style.display = isOwn ? "flex" : "none";

    menuPreview.innerHTML = `
        <div class="reply-box">
            <b>${msg.name}</b><br>
            ${msg.message}
        </div>
    `;

    menuOverlay.style.display = "flex";
}

menuOverlay.onclick = e => {

    if(e.target === menuOverlay){

        menuOverlay.style.display = "none";

    }

};

/* ================= CHAT REALTIME ================= */

const q = query(collection(db, "messages"), orderBy("timestamp"));

let previousUid = "";
let previousDate = "";

function enableSwipeReply(bubble, msg){

    const icon = bubble.parentElement.querySelector(".reply-icon");

    let startX = 0;
    let startY = 0;
    let diff = 0;
    let swiping = false;

    bubble.addEventListener("touchstart", e => {
    
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    
        swiping = false;
    
        hold = setTimeout(() => {
    
            if(!swiping){
                navigator.vibrate?.(20);
                openMenu(msg);
            }
    
        }, 450);
    
        bubble.style.transition = "none";
    
    });

    bubble.addEventListener("touchmove",e=>{
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        
        if(dx > 12){
            clearTimeout(hold);
        }
        
        if (Math.abs(dy) > Math.abs(dx)) {
            clearTimeout(hold);
            return;
        }

        if(dx < 15){
            return;
        }

        e.preventDefault();

        swiping = true;

        diff = Math.min(dx - 15,30);

        bubble.style.transform = `translateX(${diff}px)`;

        icon.style.opacity = diff / 60;

        icon.style.transform =
            `translateY(-50%) scale(${0.6 + diff / 200})`;

    },{passive:false});

    bubble.addEventListener("touchend",()=>{
        clearTimeout(hold);
        bubble.style.transition = "transform .18s ease";

        bubble.style.transform = "translateX(0)";

        icon.style.opacity = 0;

        icon.style.transform = "scale(.6)";

        if(swiping && diff > 28){

            navigator.vibrate?.(10);

            setReply(msg);

        }

        swiping = false;
        diff = 0;

    });

}

onSnapshot(q, snapshot => {

    chat.innerHTML = "";

    previousUid = "";
    previousDate = "";

    snapshot.forEach(docSnap => {

        const msg = {
            id: docSnap.id,
            ...docSnap.data()
        };

        /* ===== TANGGAL ===== */

        const date = msg.timestamp?.toDate?.();

        if (date) {

            const dateKey = date.toDateString();

            if (dateKey !== previousDate) {

                const separator = document.createElement("div");
                separator.className = "date-separator";

                const today = new Date();

                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);

                if (date.toDateString() === today.toDateString()) {

                    separator.textContent = "Hari ini";

                } else if (date.toDateString() === yesterday.toDateString()) {

                    separator.textContent = "Kemarin";

                } else {

                    separator.textContent = date.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    });

                }

                chat.appendChild(separator);

                previousDate = dateKey;
            }

        }

        /* ===== DATA ===== */

        const own = auth.currentUser &&
                    msg.uid === auth.currentUser.uid;

        const isBot = msg.uid === "music-bot";
        
        const sameUser =
            !isBot &&
            previousUid === msg.uid;

        const showHeader = !sameUser || !!msg.replyTo;

        const time = msg.timestamp?.toDate
            ? msg.timestamp.toDate().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit"
              })
            : "";

        /* ===== CHAT ===== */

        const div = document.createElement("div");

        div.className =
            `msg
             ${sameUser ? "msg-group" : ""}
             ${own ? "own" : ""}
             ${isBot ? "bot" : ""}`;

        const messageHtml = `

            ${showHeader ? `
                <div class="msg-header">
                    <span class="msg-name">${msg.name}</span>
                    <span class="msg-time">${time}</span>
                </div>
            ` : ""}

            ${msg.replyTo ? `
                <div class="reply-box">
                    <b>${msg.replyTo.name}</b><br>
                    ${msg.replyTo.message}
                </div>
            ` : ""}

            <div class="msg-text">
            
                ${msg.title ? `
            
                    ${msg.message}
            
                    <div class="reply-box music-box">
                        ${msg.title}
                    </div>
            
                ` : `
            
                    <span class="message-content">${msg.message}</span>
            
                `}
            
                ${msg.edited
                    ? `<span class="edited-label">edited</span>`
                    : ""}
            
            </div>

        `;

        if (own) {
        
            div.innerHTML = `
        
                <div class="msg-content own-content">
                    ${messageHtml}
                </div>
        
                <div class="reply-icon">
                    <i data-lucide="reply"></i>
                </div>
        
                ${
                    showHeader
                    ? `<img class="msg-avatar" src="${msg.photo}" alt="">`
                    : `<div class="msg-avatar-placeholder"></div>`
                }
        
            `;
        
        } else {
        
            div.innerHTML = `
        
                ${
                    showHeader
                    ? `<img class="msg-avatar" src="${msg.photo}" alt="">`
                    : `<div class="msg-avatar-placeholder"></div>`
                }
        
                <div class="reply-icon">
                    <i data-lucide="reply"></i>
                </div>
        
                <div class="msg-content">
                    ${messageHtml}
                </div>
        
            `;
        
        }

        /* ===== SWIPE REPLY ===== */

        chat.appendChild(div);
        lucide.createIcons();
        const bubble = div.querySelector(".msg-content");
        enableSwipeReply(bubble, msg);
        
        previousUid = msg.uid;

    });

    chat.scrollTop = chat.scrollHeight;

});

/* ================= MUSIC ROOM ================= */
function playRoom(data){

    if (!data.videoId) {
    
        currentVideo = "";
    
        ytPlayer.stopVideo();
    
        ytPlayer.clearVideo();
    
        document.getElementById("playerFrame").style.display = "none";
    
        return;
    }

    if(currentVideo === data.videoId){
        return;
    }

    currentVideo = data.videoId;

    const startedAt =
        data.startedAt?.toMillis
        ? data.startedAt.toMillis()
        : Date.now();

    const elapsed =
        Math.floor((Date.now() - startedAt) / 1000);

    document.getElementById("playerFrame").style.display = "block";
    
    requestAnimationFrame(() => {

        input.style.height = "44px";
    
        if (input.scrollHeight <= 120) {
            input.style.height = input.scrollHeight + "px";
        } else {
            input.style.height = "120px";
        }
    
    });

    ytPlayer.loadVideoById({
        videoId: data.videoId,
        startSeconds: elapsed
    });
    
    if (data.videoId) {
        setTimeout(() => {
            if (roomData?.videoId) {
                syncPlayer();
            }
        }, 1500);
    }

}

const roomRef = doc(db, "room", "main");

onSnapshot(roomRef, snap => {

    roomData = snap.data();

    if(!roomData) return;

    if(!playerReady) return;

    playRoom(roomData);

});

refreshBtn.addEventListener("click", () => {
    location.reload();
});

document.addEventListener("visibilitychange", () => {

    if (document.visibilityState === "visible") {

        if (roomData && playerReady) {
            syncPlayer();
        }

    }

});

input.addEventListener("input", () => {

    input.style.height = "44px";

    if (input.scrollHeight <= 120) {

        input.style.height = input.scrollHeight + "px";
        input.style.overflowY = "hidden";

    } else {

        input.style.height = "120px";
        input.style.overflowY = "auto";

    }

});

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

copyBtn.onclick=()=>{

    navigator.clipboard.writeText(selectedMessage.message);

    menuOverlay.style.display="none";

};

editBtn.onclick = () => {

    if(selectedMessage.uid !== auth.currentUser.uid){
        return;
    }

    startEdit(selectedMessage);

};

replyBtn.onclick=()=>{

    setReply(selectedMessage);

    menuOverlay.style.display="none";

};

function startEdit(msg){

    editingMessage = msg;

    replyPreview.style.display = "flex";

    replyText.innerHTML = `
        <b>Mengedit pesan</b><br>
        ${msg.message}
    `;

    input.value = msg.message;
    input.focus();

    menuOverlay.style.display = "none";
}

deleteBtn.onclick = async () => {

    if (!auth.currentUser) return;

    if (selectedMessage.uid !== auth.currentUser.uid) {
        return;
    }

    const yakin = confirm("Hapus pesan ini?");

    if (!yakin) return;

    await deleteDoc(
        doc(db, "messages", selectedMessage.id)
    );

    menuOverlay.style.display = "none";
};