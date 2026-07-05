/* ================= GLOBAL STATE ================= */

let sortable = null;

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


/* ================= GETTER ================= */

export const getSortable = () => sortable;

export const getReplyData = () => replyData;

export const getCurrentVideo = () => currentVideo;

export const getYTPlayer = () => ytPlayer;

export const getRoomData = () => roomData;

export const getPlayerReady = () => playerReady;

export const getSyncTimer = () => syncTimer;

export const getSelectedMessage = () => selectedMessage;

export const getHold = () => hold;

export const getEditingMessage = () => editingMessage;

export const getSending = () => sending;


/* ================= SETTER ================= */

export const setSortable = value => sortable = value;

export const setReplyData = value => replyData = value;

export const setCurrentVideo = value => currentVideo = value;

export const setYTPlayer = value => ytPlayer = value;

export const setRoomData = value => roomData = value;

export const setPlayerReady = value => playerReady = value;

export const setSyncTimer = value => syncTimer = value;

export const setSelectedMessage = value => selectedMessage = value;

export const setHold = value => hold = value;

export const setEditingMessage = value => editingMessage = value;

export const setSending = value => sending = value;