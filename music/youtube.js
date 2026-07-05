export async function getVideoDuration(videoId){

    return new Promise(resolve=>{

        const temp = new YT.Player(
            document.createElement("div"),
            {
                videoId,

                events:{

                    onReady(){

                        resolve(
                            Math.floor(
                                temp.getDuration()
                            )
                        );

                        temp.destroy();

                    }

                }

            }

        );

    });

}