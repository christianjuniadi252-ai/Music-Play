let kamus = new Set();

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