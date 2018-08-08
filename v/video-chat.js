function VideoChat(config, signaling) {
    let pc;
    const self = this;
    this.turnUsername = config.turnUsername;
    this.turnAddresses = config.turnAddresses;
    this.turnPassword = config.turnPassword;
    this.videoElementLocal = config.videoElementLocal;
    this.videoElementRemote = config.videoElementRemote;

    const mediaConstraints = { audio: true, video: true };
    this.signaling = signaling;

    this.foundLocalIceCandidates = 0;
    this.foundRemoteIceCandidates = 0;
    this.isCaller = false;
    this.offerSent = false;

    this.onError = () => {};
    this.onRemoteTrack = () => {};
    this.onIceConnetionStateChange = () => {};

    this.init = () => {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        const peerConnectionConfig = {
            iceServers: [
                {
                    urls: self.turnAddresses,
                    username: self.turnUsername,
                    credential: self.turnPassword
                }
            ],
            iceTransportPolicy: 'relay',
            iceCandidatePoolSize: '0'
        };

        pc = new RTCPeerConnection(peerConnectionConfig);

        self.signaling.onDescription = async (desc) => {
            try {
                // if we get an offer, we need to reply with an answer
                if (desc.type === 'offer') {
                    await pc.setRemoteDescription(desc);
                    const stream =
                        await navigator.mediaDevices.getUserMedia(mediaConstraints);
                    stream.getTracks().forEach((track) =>
                        pc.addTrack(track, stream));
                    await pc.setLocalDescription(await pc.createAnswer());
                    self.signaling.sendDescription(pc.localDescription);
                    self.videoElementLocal.muted = true;
                    self.videoElementLocal.srcObject = stream;
                    self.videoElementLocal.play();
                } else if (desc.type === 'answer') {
                    await pc.setRemoteDescription(desc);
                }
            } catch (err) {
                self.onError(err);
            }
        };

        self.signaling.onIceCandidate = async (candidate) => {
            try {
                await pc.addIceCandidate(candidate);
                self.foundRemoteIceCandidates += 1;
            } catch (err) {
                self.onError(err);
            }
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                self.signaling.sendIceCandidate(candidate);
                self.foundLocalIceCandidates += 1;
            }
        };

        pc.onnegotiationneeded = async () => {
            if (!self.isCaller) {
                // do not do offer if this side is not caller
                return;
            }

            try {
                await pc.setLocalDescription(await pc.createOffer());
                if (self.offerSent) {
                    // do not send offer twice (Chrome does)
                    return;
                }
                self.signaling.sendDescription(pc.localDescription);
                self.offerSent = true;
            } catch (err) {
                self.onError(err);
            }
        };

        pc.ontrack = (event) => {
            self.onRemoteTrack(event);
            if (self.videoElementRemote.srcObject) {
                // don't set srcObject again if it is already set.
                return;
            }
            self.videoElementRemote.srcObject = event.streams[0];
            self.videoElementRemote.play();
        };

        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
                if (!self.foundLocalIceCandidates || (!self.foundRemoteIceCandidates && !self.isCaller)) {
                    self.onError(new Error('Ice gathering has been completed, but candidates are empty'));
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            self.onIceConnetionStateChange(pc.iceConnectionState);
        };
    };

    this.call = async () => {
        self.isCaller = true;
        try {
            // get local stream, show it in self-view and add it to be sent
            const stream =
                await navigator.mediaDevices.getUserMedia(mediaConstraints);
            stream.getTracks().forEach((track) =>
                pc.addTrack(track, stream));
            self.videoElementLocal.muted = true;
            self.videoElementLocal.srcObject = stream;
            self.videoElementLocal.play();
        } catch (err) {
            self.onError(err);
        }
    };

    this.close = () => {
        if (pc) {
            pc.close();
        }
    };
}
