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
    setDoc
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

/* ================= STATE ================= */

let replyData = null;
let currentVideo = "";

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

/* ================= SEND MESSAGE ================= */

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    if (!auth.currentUser) {
        alert("Login dulu");
        return;
    }

    /* PLAY SYSTEM (ROOM SYNC) */
    if (text.startsWith("/play")) {

        const raw = text.replace("/play", "").trim();
    
        const id = getYoutubeId(raw);
    
        if (!id) {
            alert("Link tidak valid");
            return;
        }
    
        // Update player room
        await setDoc(doc(db, "room", "main"), {
            videoId: id,
            startedAt: serverTimestamp(),
            status: "playing"
        });
    
        // Kirim ke chat juga
        await addDoc(
            collection(db, "messages"),
            {
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName,
                photo: auth.currentUser.photoURL,
                message: text,
                timestamp: serverTimestamp(),
                system: true
            }
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

input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});

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
    replyPreview.style.display = "none";
};

/* ================= CHAT REALTIME ================= */

const q = query(collection(db, "messages"), orderBy("timestamp"));

onSnapshot(q, snapshot => {
    chat.innerHTML = "";

    snapshot.forEach(docSnap => {
        const msg = docSnap.data();

        const div = document.createElement("div");

        const own = auth.currentUser && msg.uid === auth.currentUser.uid;

        const time = msg.timestamp?.toDate ?
            msg.timestamp.toDate().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
            }) : "";

        div.className = "msg";

        div.innerHTML = `
            <img class="msg-avatar" src="${msg.photo}">
            
            <div class="msg-content">

                <div class="msg-header">
                    <span class="msg-name">${msg.name}</span>
                    <span class="msg-time">${time}</span>
                </div>

                ${
                    msg.replyTo ? `
                    <div class="reply-box">
                        <b>${msg.replyTo.name}</b><br>
                        ${msg.replyTo.message}
                    </div>
                    ` : ""
                }

                <div class="msg-text">
                    ${msg.message}
                </div>

            </div>
        `;

        /* SWIPE RIGHT REPLY */
        let startX = 0;

        div.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });

        div.addEventListener("touchend", e => {
            const diff = e.changedTouches[0].clientX - startX;

            if (diff > 80) {
                setReply(msg);
            }
        });

        chat.appendChild(div);
    });

    chat.scrollTop = chat.scrollHeight;
});

/* ================= MUSIC ROOM ================= */

const roomRef = doc(db, "room", "main");

onSnapshot(roomRef, snap => {

    const data = snap.data();

    if (!data) return;

    if (!data.videoId) {

        player.src = "";
        player.style.display = "none";

        currentVideo = "";

        return;
    }

    // Jangan reload video yang sama
    if (
        currentVideo === data.videoId &&
        player.src
    ) {
        return;
    }

    currentVideo = data.videoId;

    const startedAt =
        data.startedAt?.toMillis
        ? data.startedAt.toMillis()
        : Date.now();

    const elapsed =
        Math.floor(
            (Date.now() - startedAt) / 1000
        );

    player.style.display = "block";

    player.src =
        `https://www.youtube.com/embed/${data.videoId}` +
        `?autoplay=1` +
        `&start=${elapsed}` +
        `&controls=0` +
        `&disablekb=1`;

});