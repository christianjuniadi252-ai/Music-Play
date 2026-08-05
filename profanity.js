let badWords = [];


export async function loadBadWords(){

    const res =
        await fetch(".dilarangdibuka.json");

    badWords =
        await res.json();

}


// Menghilangkan variasi penulisan
function normalizeText(text){

    return text
        .toLowerCase()

        // angka pengganti huruf
        .replace(/0/g,"o")
        .replace(/1/g,"i")
        .replace(/3/g,"e")
        .replace(/4/g,"a")
        .replace(/5/g,"s")
        .replace(/7/g,"t")

        // hapus simbol
        .replace(/[^a-z]/g,"");

}


// Cek apakah ada kata kasar
function findBadWord(text){

    const normal =
        normalizeText(text);


    return badWords.find(word =>
        normal.includes(word)
    );

}


// Sensor kata
export function censorText(text){

    let hasil = text;


    badWords.forEach(word=>{

        const regex =
            new RegExp(
                word,
                "gi"
            );

        hasil =
            hasil.replace(
                regex,
                "*".repeat(word.length)
            );

    });


    return hasil;

}