import {
    auth,
    provider,
    db
} from "./firebase.js";

import {
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* ================= ELEMENT ================= */

const loginBtn = document.getElementById("loginBtn");

const userInfo = document.getElementById("userInfo");

const avatar = document.getElementById("avatar");

const username = document.getElementById("username");

/* ================= LOGIN ================= */

let presenceInterval = null;

/* ================= LOGIN BUTTON ================= */

export function initAuth() {

    loginBtn.onclick = async () => {

        try {

            await signInWithPopup(auth, provider);

        } catch (e) {

            alert(e.message);

        }

    };

}

/* ================= AUTH STATE ================= */

export function listenAuth() {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            loginBtn.style.display = "block";

            userInfo.style.display = "none";

            return;

        }

        loginBtn.style.display = "none";

        userInfo.style.display = "flex";

        avatar.src = user.photoURL;

        username.textContent = user.displayName;

        const myPresenceRef = doc(
            db,
            "presence",
            user.uid
        );

        await setDoc(
            myPresenceRef,
            {
                name: user.displayName,
                photo: user.photoURL,
                lastSeen: Date.now()
            }
        );

        if (!presenceInterval) {

            presenceInterval = setInterval(async () => {

                if (!auth.currentUser) return;

                await updateDoc(
                    doc(
                        db,
                        "presence",
                        auth.currentUser.uid
                    ),
                    {
                        lastSeen: Date.now()
                    }
                );

            }, 20000);

        }

    });

}

/* ================= GET USER ================= */

export function getCurrentUser() {

    return auth.currentUser;

}