// 聊天室server
// 建立一个Socket服务端
const net = require('net');

// 用于存储所有的客户端连接
// 键值对集合，用用户名去索引客户端socket
let clients = {};

let server = net.createServer((socket) => {

    // 客户端登入
    function signin(clientDataContent) {
        clientDataContent = JSON.parse(clientDataContent);
        let username = clientDataContent.from;

        if (Object.keys(clients).length) {
            // 如果clients（客户端socket 集合）中有1个以上的成员，广播通知所有人谁谁上线了，除了他本身
            let onlineNotice = {  // 组成通知消息数据格式
                protocol: 'online',
                online: username,
                onlineCount: Object.keys(clients).length + 1
            };
            for (let username in clients) {
                if (clients.hasOwnProperty(username)) {
                    let noticeClient = clients[username];
                    noticeClient.write(JSON.stringify(onlineNotice));
                }
            }
        }

        // 将新连接的客户端socket存储于clients
        clients[username] = socket;
        console.log(`欢迎 ${socket.remoteAddress}:${socket.remotePort}【${username}】，加入聊天室，当前在线：${Object.keys(clients).length}`);
    }

    // 广播消息通信
    function broadcast(clientDataContent) {
        // 广播出去消息数据格式 json
        let sendClientData = JSON.parse(clientDataContent);

        // 遍历clients对象（for in），给所有的客户端socket广播消息
        for (let username in clients) {
            if (clients.hasOwnProperty(username)) {
                let client = clients[username];
                client.write(JSON.stringify(sendClientData));
            }
        }
    }

    // p2p 点对点通信
    function p2p(clientDataContent) {
        let p2pClientData = JSON.parse(clientDataContent);
        // 给指定的客户端发送消息
        clients[p2pClientData.to].write(JSON.stringify(p2pClientData));
    }

    // 给每一个连接服务端的客户端socket注册data事件
    socket.on('data', (chunk) => {
        try {
            // 对客户端传过来的数据chunk（json数据）进行序列化
            let clientDataContent = chunk.toString().trim();

            // 获取协议
            let protocol = JSON.parse(clientDataContent).protocol;
            switch (protocol) {
                case 'signin':
                    signin(clientDataContent);
                    break;
                case 'broadcast':
                    broadcast(clientDataContent);
                    break;
                case 'p2p':
                    p2p(clientDataContent);
                    break;
                default:
                    socket.write('错误！未能识别的通信协议！');
                    break;
            }
        } catch (error) {
            socket.write('出现错误了哦~');
            throw error;
        }
    });

    // 给每一个连接服务端的客户端socket注册error事件，如果连接中断，则触发此事件
    socket.on('error', (error) => {
        // 在客户端对象中，将连接中断的那个客户端删除
        let deletekey = null;

        // 遍历clients对象，找到下线的socket，并将其删除
        for (let username in clients) {
            if (clients.hasOwnProperty(username)) {
                let client = clients[username];
                if (socket === client) deletekey = username;
            }
        }
        delete clients[deletekey];

        // 广播通知所有人，谁谁下线了
        let offlineNotice = {  // 组成下线通知消息数据格式
            protocol: 'offline',
            offline: deletekey,
            onlineCount: Object.keys(clients).length
        };
        for (let username in clients) {
            if (clients.hasOwnProperty(username)) {
                let noticeClient = clients[username];
                noticeClient.write(JSON.stringify(offlineNotice));
            }
        }

        // server 消息
        console.log(`${deletekey} 下线了，当前在线：${Object.keys(clients).length}`);
    });
});


// 监听指定端口
let port = 2018;
server.listen(port, (error) => {
    if (error) {
        console.log(`${port}端口被占用！`);
    } else {
        console.log(`服务器端正常启动，正在监听${port}端口`);
    }
});