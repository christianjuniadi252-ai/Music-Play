let badWords = [];
let allowWords = new Set();


/* =========================
   LOAD DATA
========================= */

export async function loadProfanity(){

    // Daftar kata toxic
    const bad = await fetch("./jangan-dibuka.json");

    badWords = await bad.json();

    // Daftar kata yang dianggap kata valid
    const allow = await fetch("./wordlist.txt");

    const text = await allow.text();

    text.split(/\r?\n/).forEach(line => {

        const kata = line
            .trim()
            .toLowerCase();

        if(/^[a-z]+$/.test(kata)){
            allowWords.add(kata);
        }

    });

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

    return allowWords.has(
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
        
        
            // Jika kata ada di daftar toxic,
            // tetap sensor meskipun ada di worldlist.txt
            const isToxic = badWords.some(bad => {
        
                return clean === bad.toLowerCase().trim();
        
            });
        
            if(isToxic){
        
                hasil = hasil.replace(
                    word,
                    "*".repeat(word.length)
                );
        
                return;
        
            }
        
        
            // Jika bukan toxic dan ada di worldlist,
            // jangan sensor
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