const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const uploadFile = require("./middleware/upload");
const fs = require("fs");
const path = require("path");
const gTTS = require("gtts");
const { exec } = require("child_process");

// Task 1
router.post("/create_new_storage", async (req, res) => {
    try {
        const token = jwt.sign({ files: [] }, "secret_key", { expiresIn: 86400 });
        res.cookie("file_token", token, { expiresIn: new Date(Date.now() + 24 * 60 * 60 * 1000), httpOnly: true })
            .status(200)
            .json({ status: "ok", message: "Storage created succesfully" });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// Task 2
router.post("/upload", async (req, res) => {
    try {
        await uploadFile(req, res);
        if (!req.file || req.file == undefined) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const token_old = req.cookies.file_token;
        const decoded = jwt.verify(token_old, "secret_key");
        const files = decoded.files;
        files.push(req.file.originalname);
        const token_new = jwt.sign({ files: files }, "secret_key", { expiresIn: 86400 });
        res.cookie("file_token", token_new, { expiresIn: new Date(Date.now() + 24 * 60 * 60 * 1000), httpOnly: true })
            .status(200)
            .json({ status: "ok", file_path: `/public/upload/${req.file.originalname}` });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// Task 3
router.post("/text_file_to_audio", async (req, res) => {
    try {
        const { file_path } = req.body;
        const speech = fs.readFileSync(path.join(__basedir + "/" + file_path), "utf8");
        const gtts = new gTTS(speech, "en");
        gtts.save(path.join(__basedir + "/public/upload/speech.mp3"));
        res.status(200).json({ status: "ok", message: "text to speech converted", file_path: `/public/upload/speech.mp3` });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// Task 4
router.post("/merge_image_and_audio", async (req, res) => {
    const { image_file_path, audio_file_path } = req.body;
    const image_path = path.join(__basedir + "/" + image_file_path);
    const audio_path = path.join(__basedir + "/" + audio_file_path);
    exec(`ffmpeg -framerate 1/5 -i ${image_path} "public/upload/image_to_video.mp4"`, (err) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            const image_video_path = path.join(__basedir + "/", "/public/upload/image_to_video.mp4");
            exec(
                `ffmpeg -i ${image_video_path} -i ${audio_path} -c:v copy -c:a aac "public/upload/image_and_audio.mp4"`,
                (err) => {
                    if (err) {
                        res.status(500).json({ error: err });
                    } else {
                        res.status(200).json({
                            status: "ok",
                            message: "Video Created Successfully",
                            video_file_path: "public/upload/output2.mp4",
                        });
                    }
                }
            );
        }
    });
});

// Task 5
router.post("/merge_video_and_audio", (req, res) => {
    const { video_file_path, audio_file_path } = req.body;
    const base_video_path = path.join(__basedir + "/" + video_file_path);
    const base_audio_path = path.join(__basedir + "/" + audio_file_path);
    const final_path = "video_audio.mp4";
    exec(
        `ffmpeg -i ${base_video_path} -i ${base_audio_path} -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 ${final_path}`,
        (err) => {
            if (err) {
                res.status(500).json({ error: err });
            } else {
                res.status(200).json({
                    status: "ok",
                    message: "Video and Audio Merged Successfully",
                    video_file_path: final_path,
                });
            }
        }
    );
});

// Task 6
router.post("/merge_all_video", (req, res) => {
    const { video_file_path_list } = req.body;
    let content = "";
    video_file_path_list.forEach((video) => {
        ele = `file '${path.join(__basedir + "/" + video)}'`;
        content += ele;
        content += "\n";
    });
    // write all file paths in a txt file
    fs.writeFileSync(path.join(__basedir + "/temp.txt"), content);
    const txt_file_path = path.join(__basedir + "/temp.txt");
    const final_video_path = "merged_video.mp4";
    exec(`ffmpeg -f concat -safe 0 -i ${txt_file_path} -c copy ${final_video_path}`, (err) => {
        // delete txt file
        fs.unlinkSync(path.join(__basedir + "/temp.txt"));
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.status(200).json({
                status: "ok",
                message: "Merged All Video Successfully",
                video_file_path: final_video_path,
            });
        }
    });
});

// Task 7
router.get("/download_file", (req, res) => {
    const file_path = req.query.file_path;
    const base_file_path = path.join(__basedir + "/" + file_path);
    res.download(base_file_path, "me.png", (err) => {
        if (err) {
            res.status(500).json({ error: err });
        }
    });
});

// Task 8
router.get("/my_upload_file", (req, res) => {
    try {
        const token = req.cookies.file_token;
        const decoded = jwt.verify(token, "secret_key");
        res.status(200).json({ status: "ok", data: decoded.files });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

module.exports = router;
