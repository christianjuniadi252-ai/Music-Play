/* ================= FIREBASE ================= */

const firebaseConfig = {
    apiKey: "AIzaSyAk5vpEwms61MGUMHf42v-5l5YsCKZxPcU",
    authDomain: "music-e4d6a.firebaseapp.com",
    projectId: "music-e4d6a",
    storageBucket: "music-e4d6a.firebasestorage.app",
    messagingSenderId: "485779946327",
    appId: "1:485779946327:web:3c8ddebb80c8eab59fdc12"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const roomRef = doc(db, "room", "main");

const playlistRef = collection(db, "playlist");

const sambungkataRef =
    doc(db, "games", "sambungkata");

const provider = new GoogleAuthProvider();


/* ================= ELEMENT ================= */

const loginBtn =
    document.getElementById("loginBtn");

const userInfo =
    document.getElementById("userInfo");

const avatar =
    document.getElementById("avatar");

const username =
    document.getElementById("username");


const chat =
    document.getElementById("chat");

const input =
    document.getElementById("commandInput");

const sendBtn =
    document.getElementById("sendBtn");


const player =
    document.getElementById("playerFrame");


const replyPreview =
    document.getElementById("replyPreview");

const replyText =
    document.getElementById("replyText");

const cancelReply =
    document.getElementById("cancelReply");


const menuOverlay =
    document.getElementById("menuOverlay");

const menuPreview =
    document.getElementById("menuPreview");

const copyBtn =
    document.getElementById("copyBtn");

const editBtn =
    document.getElementById("editBtn");

const deleteBtn =
    document.getElementById("deleteBtn");

const replyBtn =
    document.getElementById("replyBtn");


const refreshBtn =
    document.getElementById("refreshBtn");


const musicHeader =
    document.getElementById("musicHeader");

const musicTitle =
    document.getElementById("musicTitle");

const musicTime =
    document.getElementById("musicTime");

const musicBar =
    document.getElementById("musicBar");


const playlistBtn =
    document.getElementById("playlistBtn");

const playlistModal =
    document.getElementById("playlistModal");

const playlistList =
    document.getElementById("playlistList");

const musicListRef =
    collection(db, "musicList");


const scrollBottomBtn =
    document.getElementById("scrollBottomBtn");


const commandMenu =
    document.getElementById("commandMenu");


const onlineBtn =
    document.getElementById("onlineBtn");

const onlineModal =
    document.getElementById("onlineModal");

const onlineList =
    document.getElementById("onlineList");


const gamePanel =
    document.getElementById("gamePanel");

const gamePlayer =
    document.getElementById("gamePlayer");

const gameHeart =
    document.getElementById("gameHeart");

const gameTyping =
    document.getElementById("gameTyping");

const gameHuruf =
    document.getElementById("gameHuruf");

const gameTimer =
    document.getElementById("gameTimer");


const presenceRef =
    collection(db, "presence");

const gameError =
    document.getElementById("gameError");


/* ================= STATE ================= */

let sortable = null;

let replyData = null;

let currentVideo = "";

let ytPlayer = null;

let roomData = null;

let sambungkataData = null;

let onlineUsers = [];

let playerReady = false;

let syncTimer = null;

let selectedMessage = null;

let hold = null;

let editingMessage = null;

let sending = false;

let gameTimerInterval = null;

let gameErrorTimeout = null;


/* ================= COMMANDS ================= */

const commands = [

    {
        cmd: "/play",
        desc: "Memutar musik 822"
    },

    {
        cmd: "/pause",
        desc: "Menjeda musik"
    },

    {
        cmd: "/resume",
        desc: "Melanjutkan musik"
    },

    {
        cmd: "/skip",
        desc: "Lewati lagu"
    },

    {
        cmd: "/stop",
        desc: "Hentikan musik"
    },

    {
        cmd: "/clear",
        desc: "Hapus playlist"
    },

    {
        cmd: "/music list",
        desc: "Daftar musik"
    },

    {
        cmd: "/music add",
        desc: "Tambah list"
    },

    {
        cmd: "/music delete",
        desc: "Hapus list"
    },

    {
        cmd: "/music rename",
        desc: "Ganti nama list"
    },

    {
        cmd: "/sambungkata",
        desc: "Membuat lobby permainan sambung kata"
    },

    {
        cmd: "/sambungkata mulai",
        desc: "Memulai permainan sambung kata"
    },

    {
        cmd: "/sambungkata batal",
        desc: "Membatalkan lobby permainan sambung kata"
    },

    {
        cmd: "/sambungkata waktu",
        desc: "Mengatur waktu permainan sambung kata"
    },

    {
        cmd: "/join",
        desc: "Join ke lobby permainan"
    },

    {
        cmd: "/left",
        desc: "Keluar dari lobby permainan"
    }

];


/* ================= EXPORT ================= */

export {
    app,
    auth,
    db,

    roomRef,
    playlistRef,
    sambungkataRef,
    provider,

    loginBtn,
    userInfo,
    avatar,
    username,

    chat,
    input,
    sendBtn,

    player,

    replyPreview,
    replyText,
    cancelReply,

    menuOverlay,
    menuPreview,

    copyBtn,
    editBtn,
    deleteBtn,
    replyBtn,

    refreshBtn,

    musicHeader,
    musicTitle,
    musicTime,
    musicBar,

    playlistBtn,
    playlistModal,
    playlistList,
    musicListRef,

    scrollBottomBtn,

    commandMenu,

    onlineBtn,
    onlineModal,
    onlineList,

    gamePanel,
    gamePlayer,
    gameHeart,
    gameTyping,
    gameHuruf,
    gameTimer,

    presenceRef,
    gameError,

    sortable,
    replyData,
    currentVideo,
    ytPlayer,
    roomData,
    sambungkataData,
    onlineUsers,
    playerReady,
    syncTimer,
    selectedMessage,
    hold,
    editingMessage,
    sending,
    gameTimerInterval,
    gameErrorTimeout,

    commands
};