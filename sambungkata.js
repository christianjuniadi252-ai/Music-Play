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

    double: {
        aktif: false,
        detik: 10
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


/*
========================================
LOAD KAMUS
========================================
*/

export async function initSambungKata() {

    const files = {
        indo: "wordlist.txt",
        jawa: "jawa.txt",
        eng: "english.txt"
    };


    for (const bahasa in files) {

        try {

            const response =
                await fetch(files[bahasa]);


            if (!response.ok) {

                console.error(
                    `Gagal memuat ${files[bahasa]}`
                );

                continue;

            }


            const text =
                await response.text();


            text
                .split(/\r?\n/)
                .forEach(line => {

                    const kata =
                        line
                            .trim()
                            .toLowerCase();


                    /*
                    Hanya menerima
                    huruf a-z
                    */

                    if (
                        /^[a-z]+$/.test(kata)
                    ) {

                        kamus[bahasa].add(kata);

                    }

                });

        } catch(error) {

            console.error(
                `Error memuat ${files[bahasa]}:`,
                error
            );

        }

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


/*
========================================
CEK KATA
========================================
*/

export function cekKata(kata) {

    kata =
        kata
            .toLowerCase()
            .trim();


    return (

        (
            game.bahasa.indo &&
            kamus.indo.has(kata)
        )

        ||

        (
            game.bahasa.jawa &&
            kamus.jawa.has(kata)
        )

        ||

        (
            game.bahasa.eng &&
            kamus.eng.has(kata)
        )

    );

}


/*
========================================
BAHASA
========================================
*/

export function setBahasa(
    bahasa,
    aktif
) {

    if (
        !(bahasa in game.bahasa)
    ) {

        return false;

    }


    game.bahasa[bahasa] =
        aktif;


    return true;

}


export function getBahasa() {

    return {
        ...game.bahasa
    };

}


/*
========================================
DOUBLE
========================================
*/

export function setDouble(
    aktif,
    detik = 10
) {

    game.double.aktif =
        aktif;


    if (aktif) {

        game.double.detik =
            detik;

    }


    return true;

}


/*
========================================
SINKRONISASI DOUBLE
DARI FIRESTORE
========================================
*/

export function setDoubleConfig(
    config
) {

    if (!config) {

        return;

    }


    game.double.aktif =
        config.aktif === true;


    if (
        Number.isInteger(
            config.detik
        )
        &&
        config.detik >= 1
    ) {

        game.double.detik =
            config.detik;

    }

}


/*
========================================
GET DOUBLE
========================================
*/

export function getDouble() {

    return {
        ...game.double
    };

}


/*
========================================
RANDOM HURUF
========================================
*/

export function randomHuruf() {

    const huruf =
        "abcdefghijklmnopqrstuvwxyz";


    return huruf[
        Math.floor(
            Math.random() *
            huruf.length
        )
    ];

}


/*
========================================
ACAK PEMAIN
========================================
*/

export function acakPemain(
    array
) {

    const hasil =
        [...array];


    for (
        let i = hasil.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            hasil[i],
            hasil[j]
        ] = [
            hasil[j],
            hasil[i]
        ];

    }


    return hasil;

}


/*
========================================
MULAI GAME
========================================
*/

export function mulaiGame(
    host
) {

    game.aktif =
        true;


    game.host =
        host;


    game.pemain =
        [];


    game.setuju =
        [];


    game.huruf =
        randomHuruf();


    game.giliran =
        0;


    game.waktu =
        20;


    game.ronde =
        1;


    game.kataDipakai.clear();


    game.pemain.push({

        uid:
            host.uid,

        nama:
            host.nama,

        hati:
            3

    });


    return game;

}


/*
========================================
VALIDASI KATA
========================================
*/

export function validasiKata(
    kata
) {

    kata =
        kata
            .toLowerCase()
            .trim();


    /*
    Cek kamus
    */

    if (
        !cekKata(kata)
    ) {

        return false;

    }


    /*
    Cek kata sudah digunakan
    */

    if (
        game.kataDipakai.has(
            kata
        )
    ) {

        return false;

    }


    /*
    Cek awalan
    */

    const awalan =
        game.huruf;


    if (
        !kata.startsWith(
            awalan
        )
    ) {

        return false;

    }


    /*
    Simpan kata
    */

    game.kataDipakai.add(
        kata
    );


    /*
    Huruf terakhir
    */

    game.huruf =
        kata.at(-1);


    return true;

}


/*
========================================
GET GAME
========================================
*/

export function getGame() {

    return game;

}


/*
========================================
PEMAIN SEKARANG
========================================
*/

export function pemainSekarang() {

    return game.pemain[
        game.giliran
    ];

}


/*
========================================
GANTI GILIRAN
========================================
*/

export function nextTurn() {

    game.giliran++;


    if (
        game.giliran >=
        game.pemain.length
    ) {

        game.giliran =
            0;

    }


    return pemainSekarang();

}


/*
========================================
PEMAIN SETUJU
========================================
*/

export function playerSetuju(
    uid,
    nama
) {

    /*
    Jangan masukkan
    pemain yang sama dua kali
    */

    if (
        game.setuju.includes(
            uid
        )
    ) {

        return false;

    }


    game.setuju.push(
        uid
    );


    game.pemain.push({

        uid,

        nama,

        hati: 3

    });


    return true;

}