const width = 640; //320
const height = 480; //240
		
function init(){

		var videoDom;

		const updateInterval = 1000/30;

		var canvasInput = document.getElementById('canvas1');
		canvasInput.width = width;
		canvasInput.height = height;
		var canvasInputContext = canvasInput.getContext('2d');
		
		var loadDataResult = cv.loadData();
		if (!loadDataResult) {
		    console.error("Can't load data");
		    return;
		}
		
		cv.setMinSize(200, 200);

		show_image = function(mat, canvas_id) {
			var data = mat.data(); 	// output is a Uint8Array that aliases directly into the Emscripten heap

			channels = mat.channels();
			channelSize = mat.elemSize1();

			var canvas = document.getElementById(canvas_id);

			ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			canvas.width = mat.cols;
			canvas.height = mat.rows;

			imdata = ctx.createImageData(mat.cols, mat.rows);

			for (var i = 0,j=0; i < data.length; i += channels, j+=4) {
				imdata.data[j] = data[i];
				imdata.data[j + 1] = data[i+1%channels];
				imdata.data[j + 2] = data[i+2%channels];
				imdata.data[j + 3] = 255;
			}
			ctx.putImageData(imdata, 0, 0);
		}

		function getInput(){
			var ctx = canvasInputContext;
			var imgData = ctx.getImageData(0, 0, canvasInput.width, canvasInput.height);
			return imgData;
		}

		function detect() {
			var output = new cv.Mat();
			cv.detectFace(getInput(), output);
			show_image(output, "canvas2");
			output.delete();
		}

			var afterCameraInit = function() {
				//document.body.appendChild(videoDom);

				setInterval(function(){
					canvasInputContext.drawImage(videoDom, 0, 0, width, height);
					detect();
			  }, updateInterval);

				document.getElementById('loading').style = "display: none;";
				document.getElementById('text').style = "display: block;";
				document.getElementById('stop').addEventListener('click', function(){
					videoDom.srcObject = null;
				})
			};


			videoDom = initWebCamera(afterCameraInit);


	};

	ON_OPENCV_READY = init;




function initWebCamera (onReady) {
		var domElement = document.createElement('video');
		domElement.setAttribute('autoplay', '');
		domElement.setAttribute('muted', '');
		domElement.setAttribute('playsinline', '');
		domElement.style.width = width+'px';
		domElement.style.height = height+'px';

		if (navigator.mediaDevices === undefined 
				|| navigator.mediaDevices.enumerateDevices === undefined 
				|| navigator.mediaDevices.getUserMedia === undefined  ){
			alert("WebRTC issue! navigator.mediaDevices.enumerateDevices not present in your browser");		
		}

		navigator.mediaDevices.enumerateDevices().then(function(devices) {

			var userMediaConstraints = {
				audio: false,
				video: {
					width: {
						ideal: width
					},
					height: {
						ideal: height
					},
					facingMode: { ideal: "environment" }
				}
			};

			navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
				domElement.srcObject = stream;

				// mobile
				document.body.addEventListener('click', function(){
					domElement.play();
				})

				var interval = setInterval(function() {
					if (!domElement.videoWidth)	return;
					onReady()
					clearInterval(interval)
				}, 1000/50);
			}).catch(function(error) {
				console.log("Can't access user media", error);
				alert("Can't access camera");
			});
		}).catch(function(err) {
			console.log(err.name + ": " + err.message);
		});

	return domElement;
}
