require("dotenv").config();
const express = require("express")
const cors = require("cors")
const app = express();
app.use(cors())
const port = 8081
const qs = require("qs")

const axios = require("axios");

const urls = {spotifyVerify : "https://accounts.spotify.com/api/token",
            spotifyApi : "https://api.spotify.com/v1/"}

app.get("/" , (req,res) => {
    res.send("DDD")
})

const findVideo = async (title,artist) => {
    const word = `${artist} ${title} audio`
    return (await axios.get(`https://www.youtube.com/results?search_query=${word}`)).data.split('{"videoRenderer":{"videoId":"')[1].split('"')[0]
}

const spotifyToken = async  () =>  {

    return (await axios.post(urls.spotifyVerify, 
        qs.stringify({"grant_type":"client_credentials"}), 
        {headers : {
          'Authorization': `Basic ${(Buffer.from(`${process.env.SPOTIFY_CLIENTID}:${process.env.SPOTIFY_CLIENTSECRET}`)).toString('base64')}`
        }})).data.access_token
}

app.get("/search/tracks/:id", async (req,res) => {
    const token = await spotifyToken()
    const {id} = req.params
    let {total} = (await axios.get(`${urls.spotifyApi}playlists/${id}/tracks?limit=100`,{
        headers : {
            Authorization :`Bearer ${token}`
        }
        })).data
    let totalSongs = []
    for(let i = 0 ; i<total/100; i++){
        let getSongs = ((await axios.get(`${urls.spotifyApi}playlists/${id}/tracks?offset=${i*100}`,{
            headers : {
                Authorization :`Bearer ${token}`
            }
            })).data.items)
        let songs = await Promise.all(getSongs.map(async (ele) => {
            const {track} =  ele
             track && track.album.images.length !== 0 ? totalSongs.push({
                title : track.name,
                album : {
                    title : track.album.name,
                    image : track.album.images[0].url
                },
                artists : track.artists[0].name,
                // id : (await findVideo(`${track.artists[0].name} ${track.name}audio`))
            }) : false
        }))
    }
    res.send(totalSongs)
})

app.get("/search/track" , async(req,res) => {
    const {title , artist} = req.query
    console.log(`${title} ${artist}`)
    res.send(await findVideo(title , artist))
})


app.get("/search/playlist/:keyword" , async(req,res) => {
    const token = await spotifyToken()
    const {keyword} = req.params
    let getPlaylist = (await axios.get(`${urls.spotifyApi}search?q=${keyword}&type=playlist&limit=50&offset=${req.query.offset*50}`,{
        headers:{
            Authorization :`Bearer ${token}`
        }
    })).data.playlists.items
    const result = getPlaylist.map(ele => {
        return {
            name : ele.name,
            image : ele.images[0].url,
            id :ele.id,
            owner : ele.owner.display_name,
        }
    })

    res.send(result)
}) 

app.listen(port , () => {
    console.log(`Run on port${port}`)
})