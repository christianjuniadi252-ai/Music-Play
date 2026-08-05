let badWords = [];

/* =========================
   LOAD BAD WORDS
========================= */

export async function loadBadWords(){

    const res = await fetch("./jangan-dibuka.json");

    badWords = await res.json();

}


/* =========================
   HURUF YANG SERING DIGANTI
========================= */

const map = {

    a: "[a4@*#_-.]",

    b: "[b8*#_-.]",

    c: "[c(<*#_-.]",

    e: "[e3*#_-.]",

    g: "[g69*#_-.]",

    i: "[i1!|:;*#_-.]",

    l: "[l1|*#_-.]",

    o: "[o0∅*#_-.]",

    s: "[s5$2*#_-.]",

    t: "[t7*#_-.]",

    z: "[z2*#_-.]"

};


/* =========================
   BUAT REGEX
========================= */

function createPattern(word){

    return word
        .toLowerCase()
        .split("")
        .map(char =>

            map[char] || char

        )

        // memperbolehkan simbol/spasi di antara huruf
        .join("[^a-zA-Z0-9]*");

}


/* =========================
   SENSOR
========================= */
function removeDuplicateLetters(text){

    return text.replace(/([a-z])\1+/gi, "$1");

}

export function censorText(text){

    let hasil = text;

    // Untuk pengecekan
    const normal = removeDuplicateLetters(
        text.toLowerCase()
    );

    badWords.forEach(word => {

        const regex = new RegExp(
            createPattern(word),
            "gi"
        );

        hasil = hasil.replace(
            regex,
            match => "*".repeat(match.length)
        );

        // Tambahan untuk huruf ganda
        const duplicateRegex = new RegExp(
            word
                .split("")
                .map(h => `${h}+`)
                .join("[^a-zA-Z0-9]*"),
            "gi"
        );

        hasil = hasil.replace(
            duplicateRegex,
            match => "*".repeat(match.length)
        );

    });

    return hasil;

}