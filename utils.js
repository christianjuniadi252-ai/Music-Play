/* ================= YOUTUBE ================= */

export function getYoutubeId(input) {

    input = input.trim();

    // jika langsung berupa video ID
    if (!input.includes("http") && input.length >= 8) {
        return input;
    }

    try {

        const url = new URL(input);

        // youtu.be
        if (url.hostname.includes("youtu.be")) {
            return url.pathname.split("/")[1];
        }

        // youtube.com/watch?v=
        const v = url.searchParams.get("v");
        if (v) return v;

        // youtube shorts
        const short = url.pathname.match(/\/shorts\/([^/?]+)/);

        if (short) {
            return short[1];
        }

        return null;

    } catch {

        return null;

    }

}

/* ================= TIME ================= */

export function formatTime(sec) {

    sec = Math.floor(sec);

    const m = Math.floor(sec / 60);

    const s = sec % 60;

    return (
        String(m).padStart(2, "0") +
        ":" +
        String(s).padStart(2, "0")
    );

}