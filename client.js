// 聊天室 客户端 client
const net = require('net');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

rl.question('请输入聊天昵称：', (nickname) => {
    nickname = nickname.trim();
    if (!nickname) {
        throw new Error('昵称不能为空！');
    }

    // 创建与服务端的连接
    let server = net.connect({port: 2018, host: '127.0.0.1'}, () => {

        // 登入操作
        let user = {
            protocol: 'signin',
            from: nickname
        };

        // 往服务端传送数据
        server.write(JSON.stringify(user));
        console.log(`【系统通知】已成功加入聊天室，尽情畅聊吧~`);

        // 监听服务端发送过来的数据
        server.on('data', (chunk) => {
            try {
                let serverDataContent = JSON.parse(chunk.toString().trim());
                let protocol = serverDataContent.protocol;
                switch (protocol) {
                    case 'online':
                        console.log(`\n【系统通知】欢迎：${serverDataContent.online}，加入聊天室，当前在线人数：${serverDataContent.onlineCount}\n`);
                        rl.prompt();
                        break;
                    case 'offline':
                        console.log(`\n【系统通知】${serverDataContent.offline}下线了，当前在线人数：${serverDataContent.onlineCount}\n`);
                        rl.prompt();
                        break;
                    case 'broadcast':
                        console.log(`\n[@所有人] ${serverDataContent.from}> ${serverDataContent.message}\n`);
                        rl.prompt();
                        break;
                    case 'p2p':
                        console.log(`\n[@${serverDataContent.to}] ${serverDataContent.from}> ${serverDataContent.message}\n`);
                        rl.prompt();
                        break;
                    default:
                        server.write('错误！未能识别的通信协议！');
                        break;
                }
            } catch (error) {
                server.write('出现错误了哦~');
                throw error;
            }

        });

        rl.setPrompt(nickname + '> ');  // 此时没有写入控制台
        rl.prompt(); // 写入控制台

        // 输入一行内容敲回车
        rl.on('line', (line) => {
            line = line.toString().trim();

            let arrString = line.split(':');
            let sendServerData = null;

            // 组成往服务端发送的数据格式
            if (arrString.length === 2) {
                // 点对点
                sendServerData = {
                    protocol: 'p2p',
                    from: nickname,
                    to: arrString[0],
                    message: arrString[1]
                };
            } else {
                // 广播消息
                sendServerData = {
                    protocol: 'broadcast',
                    from: nickname,
                    message: line
                };
            }

            // 往服务端发送数据
            server.write(JSON.stringify(sendServerData));
            rl.prompt(); // 写入控制台
        });

        rl.on('close', () => {

        });
    });
});