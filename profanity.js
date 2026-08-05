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

    a: "[a4@]",

    b: "[b8]",

    c: "[c(<]",

    e: "[e3]",

    g: "[g69]",

    i: "[i1!|]",

    l: "[l1|]",

    o: "[o0]",

    s: "[s5$]",

    t: "[t7+]",

    z: "[z2]"

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

export function censorText(text){

    let hasil = text;

    badWords.forEach(word=>{

        const regex = new RegExp(

            createPattern(word),

            "gi"

        );

        hasil = hasil.replace(

            regex,

            match => "*".repeat(match.length)

        );

    });

    return hasil;

}