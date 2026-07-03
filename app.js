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
    where,
    orderBy,
    limit,
    onSnapshot,
    getDocs,
    serverTimestamp,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc
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
const roomRef = doc(db,"room","main");
const playlistRef = collection(db,"playlist");
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

const musicHeader = document.getElementById("musicHeader");
const musicTitle = document.getElementById("musicTitle");
const musicTime = document.getElementById("musicTime");
const musicBar = document.getElementById("musicBar");

const playlistBtn = document.getElementById("playlistBtn");
const playlistModal = document.getElementById("playlistModal");
const playlistList = document.getElementById("playlistList");
const musicListRef = collection(db,"musicList");

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
let sending = false;

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
  
      events: {
          onReady() {
              playerReady = true;
      
              if (roomData) {
                  playRoom(roomData);
              }
      
              if (!syncTimer) {
                  syncTimer = setInterval(syncPlayer, 3000);
              }
          },
      
          onStateChange: handlePlayerState
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

async function getVideoInfo(videoId){

    const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );

    const data = await res.json();

    return {
        title: data.title || "Video YouTube"
    };

}

async function getVideoDuration(videoId){

    return new Promise(resolve=>{

        const temp=new YT.Player(document.createElement("div"),{

            videoId,

            events:{
                onReady(){

                    resolve(Math.floor(temp.getDuration()));

                    temp.destroy();

                }
            }

        });

    });

}

function getTargetSecond() {

    if (!roomData || !roomData.startedAt) {
        return 0;
    }

    return Math.floor(
        (Date.now() - roomData.startedAt) / 1000
    );

}

function syncPlayer() {

    if (!playerReady) return;
    if (!roomData) return;
    if (!roomData.videoId) return;

    // Tambahkan di sini
    if (!roomData.status) return;
    if (roomData.status !== "playing") return;

    if (ytPlayer.getPlayerState() === YT.PlayerState.ENDED) {
        return;
    }

    if (ytPlayer.getPlayerState() === YT.PlayerState.UNSTARTED) return;

    const target = getTargetSecond();

    if (target < 0) return;

    const current = ytPlayer.getCurrentTime();

    const diff = Math.abs(target - current);

    if (diff > 2) {
        ytPlayer.seekTo(target, true);
    }

    if (ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
        ytPlayer.playVideo();
    }
}

async function handlePlayerState(event){

    if(event.data!==YT.PlayerState.ENDED)return;

    const snap=await getDoc(roomRef);

    if(!snap.exists())return;

    const room=snap.data();

    if(room.endMessageSent)return;

    if(room.videoId!==currentVideo)return;

    const q = query(
        playlistRef,
        orderBy("timestamp"),
        limit(1)
    );
    
    const next = await getDocs(q);
    
    if(next.empty){
    
        await updateDoc(roomRef,{
            videoId:"",
            title:"",
            status:"stopped",
            endMessageSent:true
        });
    
        await sendBotMessage(
            "🎵 Playlist selesai."
        );
    
        return;
    
    }
    
    const song = next.docs[0];
    
    const data = song.data();
    
    await setDoc(roomRef,{
        videoId:data.videoId,
        title:data.title,
        startedAt:Date.now(),
        status:"playing",
        endMessageSent:false
    });
    
    await deleteDoc(song.ref);
    
    await setDoc(roomRef,{
        videoId:data.videoId,
        title:data.title,
        startedAt:Date.now(),
        status:"playing",
        endMessageSent:false
    });

    await deleteDoc(song.ref);

}
/* ================= SEND MESSAGE ================= */
async function sendBotMessage(
    message,
    title = null,
    privateUid = null
){

    await addDoc(collection(db, "messages"), {
        uid: "music-bot",
        name: "Music-Bot",
        photo: "music-bot.png",
        message,
        title,
        privateUid,
        timestamp: serverTimestamp()
    });

}

function resetInput(){

    input.value = "";

    input.style.height = "44px";
    input.style.overflowY = "hidden";

}

async function sendMessage() {

    if (sending) return;

    const text = input.value.trim();

    if (!text) return;

    if (!auth.currentUser) {
        alert("Login dulu");
        return;
    }

    sending = true;
    sendBtn.disabled = true;

    try {

        /* ================= EDIT ================= */

        if (editingMessage) {

            await updateDoc(
                doc(db, "messages", editingMessage.id),
                {
                    message: text,
                    edited: true
                }
            );

            editingMessage = null;
            replyPreview.style.display = "none";
            resetInput();

            return;
        }

        /* ================= MUSIC LIST ================= */

        if (text.startsWith("/list add")) {

            const args = text.split(" ");

            if (args.length < 4) {
                alert("Format:\n/list add Nama URL");
                return;
            }

            const listName = args[2];
            const url = args.slice(3).join(" ");

            const check = await getDocs(
                query(
                    musicListRef,
                    where("nameLower", "==", listName.toLowerCase())
                )
            );

            if (!check.empty) {
                alert("Nama tersebut sudah digunakan.");
                return;
            }

            const videoId = getYoutubeId(url);

            if (!videoId) {
                alert("URL YouTube tidak valid.");
                return;
            }

            const info = await getVideoInfo(videoId);

            await addDoc(musicListRef, {
                name: listName,
                nameLower: listName.toLowerCase(),
                videoId,
                title: info.title,
                ownerUid: auth.currentUser.uid,
                ownerName: auth.currentUser.displayName,
                timestamp: serverTimestamp()
            });

            alert("Berhasil menambahkan list.");

            resetInput();

            return;
        }
        
        if (text.startsWith("/list delete")) {
        
            const args = text.split(" ");
        
            if (args.length < 3) {
                alert("Format:\n/list delete Nama");
                return;
            }
        
            const listName = args.slice(2).join(" ");
        
            const snap = await getDocs(
                query(
                    musicListRef,
                    where("nameLower","==",listName.toLowerCase())
                )
            );
        
            if (snap.empty) {
                alert("List tidak ditemukan.");
                return;
            }
        
            const item = snap.docs[0];
            const data = item.data();
        
            // hanya pemilik yang boleh menghapus
            if (data.ownerUid !== auth.currentUser.uid) {
                alert("Hanya pembuat list yang dapat menghapus.");
                return;
            }
        
            await deleteDoc(item.ref);
        
            alert("List berhasil dihapus.");
        
            resetInput();
        
            return;
        }
        
        if (text.startsWith("/list rename")) {
            alert("Test")
        
            const args = text.split(" ");
        
            if (args.length < 4) {
                alert("Format:\n/list rename NamaLama NamaBaru");
                return;
            }
        
            const oldName = args[2];
            const newName = args[3];
        
            // Cari nama lama
            const oldSnap = await getDocs(
                query(
                    musicListRef,
                    where("nameLower","==",oldName.toLowerCase())
                )
            );
        
            if (oldSnap.empty) {
                alert("List tidak ditemukan.");
                return;
            }
        
            const item = oldSnap.docs[0];
            const data = item.data();
        
            // Hanya pemilik
            if (data.ownerUid !== auth.currentUser.uid) {
                alert("Hanya pembuat list yang dapat mengganti nama.");
                return;
            }
        
            // Cek nama baru
            const check = await getDocs(
                query(
                    musicListRef,
                    where("nameLower","==",newName.toLowerCase())
                )
            );
        
            if (!check.empty) {
                alert("Nama tersebut sudah digunakan.");
                return;
            }
        
            await updateDoc(item.ref,{
                name:newName,
                nameLower:newName.toLowerCase()
            });
        
            alert("Nama list berhasil diubah.");
        
            resetInput();
        
            return;
        }
        
        //list
        
        if (text === "/list") {
        
            const snap = await getDocs(
                query(
                    musicListRef,
                    orderBy("nameLower")
                )
            );
        
            if (snap.empty) {
        
                await sendBotMessage(
                    "📁 List Musik masih kosong.",
                    null,
                    auth.currentUser.uid
                );
        
                resetInput();
        
                return;
        
            }
        
            let pesan = "<b>📁 List Musik</b><br><br>";
            
            snap.forEach(doc => {
            
                const data = doc.data();
            
                pesan += `
                    <b>${data.name}</b> - ${data.ownerName}
            
                    <div class="reply-box music-box">
                        ${data.title}
                    </div>
                `;
            
            });
            
            await sendBotMessage(
                pesan,
                null,
                auth.currentUser.uid
            );
        
            resetInput();
        
            return;
        
        }

        /* ================= SAY ================= */

        if (text.startsWith("/say")) {

            const pesan = text.replace("/say", "").trim();

            if (!pesan) {
                alert("Masukkan pesan.");
                return;
            }

            await sendBotMessage(pesan);

            resetInput();

            return;
        }

        /* ================= PLAY ================= */

        if (text.startsWith("/play")) {

            const raw = text.replace("/play", "").trim();
            
            let id = getYoutubeId(raw);
            
            let info;
            
            if (id) {
            
                info = await getVideoInfo(id);
            
            }
            
            else {
            
                const result = await getDocs(
                    query(
                        musicListRef,
                        where("nameLower", "==", raw.toLowerCase())
                    )
                );
            
                if (result.empty) {
            
                    alert("Musik tidak ditemukan.");
            
                    return;
            
                }
            
                const data = result.docs[0].data();
            
                id = data.videoId;
            
                info = {
                    title: data.title
                };
            
            }

            const roomSnap = await getDoc(roomRef);

            if (
                !roomSnap.exists() ||
                !roomSnap.data().videoId ||
                roomSnap.data().status !== "playing"
            ) {

                await setDoc(roomRef, {
                    videoId: id,
                    title: info.title,
                    startedAt: Date.now(),
                    status: "playing",
                    endMessageSent: false
                });

                await sendBotMessage(
                    `<b>${auth.currentUser.displayName}</b> memutar musik <code>/play</code>`,
                    info.title
                );

            } else {

                await addDoc(playlistRef, {
                    videoId: id,
                    title: info.title,
                    addedBy: auth.currentUser.displayName,
                    timestamp: serverTimestamp()
                });

                await sendBotMessage(
                    `<b>${auth.currentUser.displayName}</b> menambahkan ke playlist <code>/play</code>`,
                    info.title
                );
            }

            resetInput();

            return;
        }

        /* ================= STOP ================= */

        if (text === "/stop") {

            const q = query(
                playlistRef,
                orderBy("timestamp"),
                limit(1)
            );

            const next = await getDocs(q);

            if (next.empty) {

                await setDoc(roomRef, {
                    videoId: "",
                    title: "",
                    status: "stopped",
                    endMessageSent: true
                });

                await sendBotMessage(
                    `<b>${auth.currentUser.displayName}</b> menghentikan musik. <code>/stop</code>`
                );

            } else {

                const song = next.docs[0];
                const data = song.data();

                await setDoc(roomRef, {
                    videoId: data.videoId,
                    title: data.title,
                    startedAt: Date.now(),
                    status: "playing",
                    endMessageSent: false
                });

                await deleteDoc(song.ref);

                await sendBotMessage(
                    `<b>${auth.currentUser.displayName}</b> melewati lagu.`
                );
            }

            resetInput();

            return;
        }

        /* ================= CLEAR ================= */

        if (text === "/clear") {

            const snap = await getDocs(playlistRef);

            for (const song of snap.docs) {
                await deleteDoc(song.ref);
            }

            await setDoc(roomRef, {
                videoId: "",
                title: "",
                status: "stopped",
                endMessageSent: true
            });

            await sendBotMessage(
                `<b>${auth.currentUser.displayName}</b> menghapus seluruh playlist.`
            );

            resetInput();

            return;
        }

        /* ================= CHAT ================= */

        const reply = replyData;

    replyData = null;
    replyPreview.style.display = "none";
    
    input.value = "";
    input.blur();
    
    await new Promise(requestAnimationFrame);
    
    resetInput();
    
    await addDoc(collection(db, "messages"), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL,
        message: text,
        timestamp: serverTimestamp(),
        replyTo: reply
    });

    } catch (e) {

        console.error(e);
        alert(e.message);

    } finally {

        sending = false;
        sendBtn.disabled = false;

    }
}

sendBtn.onclick = sendMessage;

onSnapshot(roomRef, (snap) => {

    if (!snap.exists()) return;

    roomData = snap.data();

    if (playerReady) {
        playRoom(roomData);
    }

});

onSnapshot(
    query(
        playlistRef,
        orderBy("timestamp")
    ),
    (snapshot)=>{

        playlistList.innerHTML = "";

        if(snapshot.empty){

            playlistList.innerHTML =
                "<div class='playlist-empty'>Playlist kosong</div>";

            return;

        }

        snapshot.docs.forEach((doc, index)=>{

            const data = doc.data();

            const item = document.createElement("div");

            item.className = "playlist-item";

            item.innerHTML = `
            <div class="playlist-row">
            
                <div class="playlist-left">
                    <span class="playlist-number">${index + 1}.</span>
            
                    <button class="drag-btn">☰</button>
                </div>
            
                <div class="playlist-center">
                    <div class="playlist-title">${data.title}</div>
            
                    <div class="playlist-user">
                        Ditambahkan oleh ${data.addedBy}
                    </div>
                </div>
            
                <button class="delete-song">✕</button>
            
            </div>
            `;
            
            item.querySelector(".delete-song").onclick = async ()=>{

                if(!confirm(
                    `Apakah anda yakin ingin menghapus "${data.title}" dari playlist?`
                )) return;
            
                await deleteDoc(doc.ref);
            
            };

            playlistList.appendChild(item);

        });

    }
);

/* ================= SWIPE REPLY ================= */

function setReply(msg) {
    replyData = {
        id: msg.id,
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

    resetInput();

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
  
    let ignoreSwipe = false;

    const icon = bubble.parentElement.querySelector(".reply-icon");

    let startX = 0;
    let startY = 0;
    let diff = 0;
    let swiping = false;

    bubble.addEventListener("touchstart", e => {
    
        if (e.target.closest(".message-reply")) return;
    
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    
        swiping = false;
    
        hold = setTimeout(() => {
    
            if(!swiping){
                navigator.vibrate?.(20);
                openMenu(msg);
            }
    
        },450);
    
        bubble.style.transition = "none";
    
    });

    bubble.addEventListener("touchmove",e=>{
        if (e.target.closest(".message-reply")) return;
        
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
    
    bubble.addEventListener("touchcancel", () => {
    
        clearTimeout(hold);
    
        bubble.style.transition = "transform .18s ease";
        bubble.style.transform = "translateX(0)";
    
        icon.style.opacity = 0;
        icon.style.transform = "scale(.6)";
    
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
        
        if (
            msg.privateUid &&
            msg.privateUid !== auth.currentUser?.uid
        ){
            return;
        }

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
        
        div.id = "msg-" + msg.id;

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
                <div class="reply-box message-reply" data-reply="${msg.replyTo.id}">
                    <b>${msg.replyTo.name}</b><br>
                    ${msg.replyTo.message}
                </div>
            ` : ""}

            <div class="msg-text
                ${msg.edited ? 'edited-message' : ''}
                ${!showHeader ? 'same-user-message' : ''}">
            
                ${msg.title ? `
            
                    ${msg.message}
            
                    <div class="reply-box music-box">
                        ${msg.title}
                    </div>
            
                ` : `
            
                    <span class="message-content ${msg.edited ? 'edited-content' : ''}">
                        ${msg.message}
                    </span>
            
                `}
            
                ${showHeader
                    ? `${msg.edited ? `<span class="edited-label">edited</span>` : ""}`
                    : `
                        <span class="message-meta">
                            ${msg.edited ? "edited • " : ""}
                            ${time}
                        </span>
                    `
                }
            
            </div>
          
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
        
        const replyBox = div.querySelector(".message-reply");
        
        replyBox?.addEventListener("touchstart", e => {
            e.stopPropagation();
        });
        
        replyBox?.addEventListener("touchend", e => {
            e.stopPropagation();
        });
        
        replyBox?.addEventListener("click", e => {
            e.stopPropagation();
        
            const target = document.getElementById(
                "msg-" + replyBox.dataset.reply
            );
        
            if (!target) return;
        
            target.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        
            target.classList.add("jump-highlight");
        
            setTimeout(() => {
                target.classList.remove("jump-highlight");
            }, 1500);
        });
        
        if (replyBox && msg.replyTo?.id) {

            replyBox.style.cursor = "pointer";
        
            replyBox.onclick = () => {
                const target = document.getElementById(
                    "msg-" + msg.replyTo.id
                );
        
                if (!target) return;
        
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
        
                target.classList.add("jump-highlight");
        
                setTimeout(() => {
                    target.classList.remove("jump-highlight");
                }, 1500);
        
            };
        
        }
        
        const bubble = div.querySelector(".msg-content");
        
        if (!div.querySelector(".message-reply")?.contains(document.activeElement)) {
            enableSwipeReply(bubble, msg);
        }
        
        previousUid = msg.uid;

    });
    
    lucide.createIcons();

    chat.scrollTop = chat.scrollHeight;

});

/* ================= MUSIC ROOM ================= */
function playRoom(data){

    if (!data.videoId) {
    
        musicHeader.style.display = "none";
    
        document.querySelector(".player").style.display = "none";
    
        currentVideo = "";
    
        ytPlayer.stopVideo();
    
        ytPlayer.clearVideo();
    
        return;
    }

    const startedAt =
        data.startedAt?.toMillis
            ? data.startedAt.toMillis()
            : data.startedAt || Date.now();
    
    let elapsed = Math.floor(
        (Date.now() - startedAt) / 1000
    );
    
    if (elapsed < 0) {
    
        setTimeout(() => {
    
            if (roomData && roomData.videoId === data.videoId) {
                playRoom(roomData);
            }
    
        }, Math.abs(elapsed) * 1000);
    
        return;
    }

    document.querySelector(".player").style.display = "block";
    
    musicHeader.style.display = "block";
    musicTitle.textContent = data.title || "Unknown";
    
    requestAnimationFrame(() => {

        input.style.height = "44px";
    
        if (input.scrollHeight <= 120) {
            input.style.height = input.scrollHeight + "px";
        } else {
            input.style.height = "120px";
        }
    
    });

    if (currentVideo !== data.videoId) {
    
        currentVideo = data.videoId;
    
        ytPlayer.loadVideoById({
            videoId: data.videoId,
            startSeconds: elapsed
        });
        
        setTimeout(async ()=>{

            const duration = Math.floor(ytPlayer.getDuration());
        
            if(duration>0){
        
                await updateDoc(roomRef,{
                    duration
                });
        
            }
        
        },2000);
    
    } else {
    
        syncPlayer();
    
    }
    
    if (data.videoId) {
        setTimeout(() => {
            if (roomData?.videoId) {
                syncPlayer();
            }
        }, 1500);
    }

}

refreshBtn.addEventListener("click", () => {
    location.reload();
});

playlistBtn.addEventListener("click", () => {

    if (playlistModal.style.display === "block") {

        playlistModal.style.display = "none";

    } else {

        playlistModal.style.display = "block";

    }

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

function formatTime(sec){

    sec=Math.floor(sec);

    const m=Math.floor(sec/60);

    const s=sec%60;

    return String(m).padStart(2,"0")+":"+
           String(s).padStart(2,"0");

}

setInterval(() => {

    if (!ytPlayer || !playerReady) return;

    if (!currentVideo) return;

    const current = ytPlayer.getCurrentTime() || 0;
    const duration = ytPlayer.getDuration() || 0;

    musicTime.textContent =
        formatTime(current) + "/" + formatTime(duration);

    if (duration > 0) {
        musicBar.style.width = (current / duration * 100) + "%";
    }

}, 500);