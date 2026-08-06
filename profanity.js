let badWords = [];
let allowWords = [];


/* =========================
   LOAD DATA
========================= */

export async function loadProfanity(){

    const bad = await fetch("./jangan-dibuka.json");
    badWords = await bad.json();


    const allow = await fetch("./aman-aja.json");
    allowWords = await allow.json();

}


/* =========================
   NORMALISASI HURUF
========================= */

const map = {

    a: "[a4@*#_\\-.]",

    b: "[b8*#_\\-.]",

    c: "[c(<*#_\\-.]",

    d: "[d*#_\\-.]",

    e: "[e3€*#_\\-.]",

    g: "[g69*#_\\-.]",

    i: "[i1!l|:*#_\\-.]",

    l: "[l1i|*#_\\-.]",

    o: "[o0∅*#_\\-.]",

    s: "[s5$2*#_\\-.]",

    t: "[t7+*#_\\-.]",

    z: "[z2*#_\\-.]"

};



/* =========================
   CEK ALLOW WORD
========================= */

function isAllowWord(word){

    return allowWords.includes(
        word.toLowerCase()
    );

}



/* =========================
   BUAT POLA REGEX
========================= */

function createPattern(word){

    return word
        .toLowerCase()
        .split("")
        .map(char => {

            return map[char] || char;

        })
        .join("[^a-zA-Z0-9]*");

}



/* =========================
   NORMALISASI HURUF GANDA
========================= */

function removeDuplicateLetters(text){

    return text.replace(
        /([a-z])\1+/gi,
        "$1"
    );

}



/* =========================
   SENSOR
========================= */

export function censorText(text){

    let hasil = text;


    // Pisahkan kata
    const words = text.split(
        /(\s+)/
    );


    words.forEach((word,index)=>{


        const clean = word
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .toLowerCase();



        // Jika allowword, lewati
        if(
            clean &&
            isAllowWord(clean)
        ){
            return;
        }



        badWords.forEach(bad=>{


            const regex = new RegExp(
                createPattern(bad),
                "gi"
            );


            if(
                regex.test(word)
            ){

                hasil = hasil.replace(
                    word,
                    "*".repeat(word.length)
                );

            }



            // Anti huruf ganda
            const duplicateRegex =
                new RegExp(
                    bad
                    .split("")
                    .map(h=>`${h}+`)
                    .join("[^a-zA-Z0-9]*"),
                    "gi"
                );


            hasil = hasil.replace(
                duplicateRegex,
                match =>
                    "*".repeat(
                        match.length
                    )
            );


        });


    });


    return hasil;

}