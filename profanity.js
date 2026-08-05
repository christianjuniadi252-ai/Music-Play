let badWords = [];

/* =========================
   LOAD BAD WORDS
========================= */

export async function loadBadWords() {
    const res = await fetch("./jangan-dibuka.json");
    badWords = await res.json();
}


/* =========================
   HURUF YANG SERING DIGANTI
========================= */

const map = {
    a: "[a4@]",
    b: "[b8]",
    c: "[c(<]",
    d: "[d]",
    e: "[e3]",
    f: "[f]",
    g: "[g69]",
    h: "[h#]",
    i: "[i1!|]",
    j: "[j]",
    k: "[k]",
    l: "[l1|]",
    m: "[m]",
    n: "[n]",
    o: "[o0]",
    p: "[p]",
    q: "[q9]",
    r: "[r]",
    s: "[s5$2]",
    t: "[t7+]",
    u: "[uv]",
    v: "[vu]",
    w: "[w]",
    x: "[x%]",
    y: "[y]",
    z: "[z2]"
};


/* =========================
   ESCAPE REGEX
========================= */

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


/* =========================
   BUAT REGEX
========================= */

function createPattern(word) {

    return word
        .toLowerCase()
        .split("")
        .map(char => {

            const chars = map[char] || escapeRegex(char);

            // huruf boleh berulang
            return `(?:${chars})+`;

        })
        // simbol, angka, spasi di antara huruf
        .join("[^a-zA-Z]*");

}


/* =========================
   SENSOR
========================= */

export function censorText(text) {

    let hasil = text;

    for (const word of badWords) {

        const regex = new RegExp(
            createPattern(word),
            "gi"
        );

        hasil = hasil.replace(regex, match =>
            "*".repeat(match.length)
        );

    }

    return hasil;

}


/* =========================
   CEK ADA KATA KOTOR
========================= */

export function containsBadWord(text) {

    for (const word of badWords) {

        const regex = new RegExp(
            createPattern(word),
            "i"
        );

        if (regex.test(text)) {
            return true;
        }

    }

    return false;

}