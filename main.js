const {app, BrowserWindow, ipcMain, session} = require('electron');
const express = require('express');
const server = express();
const port = 8000;
const initialWebWhatsAppPath = 'https://web.whatsapp.com/';
const WhatsAppResponse = {
    "status": "",
    "message": "",
    "attempts": ""
};

app.on('ready', function () {
    server.listen(port);
    console.log('WhatsappApi listening on port ' + port);

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.116';
        callback({cancel: false, requestHeaders: details.requestHeaders});
    });

    const mainWindow = new BrowserWindow();
    mainWindow.loadURL(initialWebWhatsAppPath);
    server.get('/whatsapp/:number/:message', async (req, res) => {
        try {
            sendMessage(req.params.number, req.params.message);
            ipcMain.on("send", (event, arg) => {
                WhatsAppResponse.status = arg.status;
                WhatsAppResponse.message = arg.message;
                WhatsAppResponse.attempts = arg.attempts;
                console.log(WhatsAppResponse);
                res.json(WhatsAppResponse);
            });
        } catch (e) {
            console.log(e);
            res.json(e);

        }
    });

function sendMessage(number, message) {
    {
        console.log('Send message to ' + number);
        console.log('Message ' + message);
        mainWindow.loadURL(initialWebWhatsAppPath + 'send?phone=' + number + '&text=' + message);
        mainWindow.webContents.executeJavaScript(`
               let{ipcRenderer,remote} = require("electron");
                let sendOK = false;
                let attempts = 1;
                function sendWhatsApp() {
                    if (attempts < 3) {
                        let sendButton = document.getElementsByClassName("_35EW6")[0];
                        let inputSend = document.getElementsByClassName("_2S1VP")[0];
                        if (typeof inputSend !== 'undefined' && inputSend.textContent && !sendOK) {
                            sendButton.click();
                            sendOK = true;
                            ipcRenderer.send("send", {"status": true, "message": "Message Send", "attempts": attempts});
                        } else {                  
                            attempts++;                                
                        }
                    }else{
                        let error = document.getElementsByClassName("_3lLzD")[0];
                        ipcRenderer.send("send", {"status": false, "message": error.textContent, "attempts": attempts});
                        sendOK = false;                        
                    }
                }
                let loop = setInterval(sendWhatsApp,3000);
    `);

        // mainWindow.hide();
    }

}});

