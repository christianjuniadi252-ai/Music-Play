let kamus = {
    indo: new Set(),
    jawa: new Set(),
    eng: new Set()
};

let game = {

    aktif: false,
    
    bahasa: {
        indo: true,
        jawa: true,
        eng: true
    },

    host: null,

    pemain: [],

    setuju: [],
    
    giliran: 0,

    huruf: "",

    waktu: 20,

    ronde: 1,

    kataDipakai: new Set()

};

export async function initSambungKata() {

    const files = {
        indo: "wordlist.txt",
        jawa: "jawa.txt",
        eng: "english.txt"
    };

    for (const bahasa in files) {

        const response =
            await fetch(files[bahasa]);

        const text =
            await response.text();

        text.split(/\r?\n/).forEach(line => {

            const kata =
                line.trim().toLowerCase();

            if (/^[a-z]+$/.test(kata)) {

                kamus[bahasa].add(kata);

            }

        });

    }

    console.log(
        "Kamus Indo:",
        kamus.indo.size
    );

    console.log(
        "Kamus Jawa:",
        kamus.jawa.size
    );

    console.log(
        "Kamus English:",
        kamus.eng.size
    );

}

export function cekKata(kata){

    kata = kata.toLowerCase().trim();

    return (
        (game.bahasa.indo &&
            kamus.indo.has(kata)) ||

        (game.bahasa.jawa &&
            kamus.jawa.has(kata)) ||

        (game.bahasa.eng &&
            kamus.eng.has(kata))
    );

}

export function setBahasa(bahasa, aktif){

    if (!(bahasa in game.bahasa)) {
        return false;
    }

    game.bahasa[bahasa] = aktif;

    return true;

}

export function randomHuruf(){

    const huruf = "abcdefghijklmnopqrstuvwxyz";

    return huruf[
        Math.floor(
            Math.random() * huruf.length
        )
    ];

}

export function mulaiGame(host){

    game.aktif = true;

    game.host = host;

    game.pemain = [];

    game.setuju = [];

    game.huruf = randomHuruf();

    game.giliran = 0;

    game.waktu = 20;

    game.ronde = 1;

    game.kataDipakai.clear();
    
    game.pemain.push({
        uid: host.uid,
        nama: host.nama,
        hati: 3
    });

}

export function validasiKata(kata){

    kata = kata.toLowerCase().trim();

    if(!cekKata(kata)){
        return false;
    }

    if(game.kataDipakai.has(kata)){
        return false;
    }

    if(!kata.startsWith(game.huruf)){
        return false;
    }

    game.kataDipakai.add(kata);

    game.huruf = kata.at(-1);

    return true;

}

export function getGame(){

    return game;

}

export function pemainSekarang(){

    return game.pemain[
        game.giliran
    ];

}

export function nextTurn(){

    game.giliran++;

    if(game.giliran >= game.pemain.length){
        game.giliran = 0;
    }

    return pemainSekarang();

}

export function playerSetuju(uid, nama){

    if(game.setuju.includes(uid)){
        return false;
    }

    game.setuju.push(uid);

    game.pemain.push({
        uid,
        nama,
        hati: 3
    });

    return true;

}