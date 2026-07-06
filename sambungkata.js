let kamus = new Set();

let game = {

    aktif: false,

    host: null,

    pemain: [],

    giliran: 0,

    huruf: "",

    waktu: 20,

    ronde: 1,

    kataDipakai: new Set()

};

export async function initSambungKata() {

    const response = await fetch("wordlist.txt");

    const text = await response.text();

    text.split(/\r?\n/).forEach(line => {

        const kata = line.trim().toLowerCase();

        if (/^[a-z]+$/.test(kata)) {
            kamus.add(kata);
        }

    });

    console.log("Kamus berhasil dimuat:", kamus.size);

}

export function cekKata(kata){

    return kamus.has(
        kata.toLowerCase().trim()
    );

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

    game.huruf = randomHuruf();

    game.giliran = 0;

    game.waktu = 20;

    game.ronde = 1;

    game.kataDipakai.clear();

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