import {
    getRoomData,
    getSyncTimer,
    setSyncTimer,
    setPlayerReady,
    setYTPlayer
} from "../state.js";

import {
    playRoom,
    syncPlayer
} from "./room.js";

import {
    handlePlayerState
} from "./playlist.js";

export function createPlayer() {

    if (!window.YT || !YT.Player) {

        setTimeout(createPlayer, 100);

        return;

    }

    const player = new YT.Player("playerFrame", {

        width: "100%",
        height: "100%",

        playerVars: {

            autoplay: 1,
            controls: 0,
            disablekb: 1,
            rel: 0

        },

        events: {

            onReady() {

                setPlayerReady(true);

                setYTPlayer(player);

                if (getRoomData()) {

                    playRoom(getRoomData());

                }

                if (!getSyncTimer()) {

                    setSyncTimer(
                        setInterval(syncPlayer, 3000)
                    );

                }

            },

            onStateChange: handlePlayerState

        }

    });

}