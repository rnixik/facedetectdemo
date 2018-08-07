function SignalingWebSocket() {
    let webSocket;
    const self = this;
    const currentUserUUID = Math.round(Math.random() * 60535) + 5000;
    this.channel = 'default';

    this.onConnected = () => {};
    this.onDisconnected = () => {};
    this.onDescription = () => {};
    this.onIceCandidate = () => {};
    this.onError = () => {};
    this.onJoined = () => {};
    this.onOtherJoined = () => {};
    this.onOtherLeft = () => {};

    this.sendDescription = (description) => {
        self.send('desc', description);
    };

    this.sendIceCandidate = (candidate) => {
        self.send('iceCandidate', candidate);
    };

    this.send = (action, payload) => {
        try {
            const data = {};
            data.sender = currentUserUUID;
            data.channel = self.channel;
            data.action = action;
            data.payload = payload;
            webSocket.send(JSON.stringify(data));
        } catch (e) {
            self.onError(e);
        }
    };

    this.connect = (address, channel) => {
        try {
            self.channel = channel;
            webSocket = new WebSocket(address);
            webSocket.onopen = () => {
                self.send('join', true);
                self.onConnected();
            };
            webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.sender === currentUserUUID) {
                        if (data.action === 'join') {
                            self.onJoined(data.payload);
                        }
                        return;
                    }
                    if (data.action === 'desc' && data.payload) {
                        self.onDescription(data.payload);
                    } else if (data.action === 'iceCandidate' && data.payload) {
                        self.onIceCandidate(data.payload);
                    } else if (data.action === 'join') {
                        self.onOtherJoined(data.payload);
                    } else if (data.action === 'left') {
                        self.onOtherLeft(data.payload);
                    }
                } catch (err) {
                    self.onError(err);
                }
            };

            webSocket.onclose = (event) => {
                if (!event.wasClean) {
                    self.onDisconnected();
                }
            };
        } catch (e) {
            self.onError(e);
        }
    };

    this.disconnect = () => {
        if (webSocket) {
            webSocket.close();
        }
    };
}
