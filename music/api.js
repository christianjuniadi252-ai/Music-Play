export async function getVideoInfo(videoId) {

    const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );

    const data = await res.json();

    return {
        title: data.title || "Video YouTube"
    };

}